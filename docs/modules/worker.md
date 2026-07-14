# worker (`packages/worker/`)

WS-first bot: CandleBuffer in-memory → engine → executor. Never calls the API
(Drizzle only); CandleBuffer never touches the DB (see CLAUDE.md invariants).

## Regras de Negócio

- Evaluation happens once per CLOSED candle. `lastEvaluatedCandleOpenTime` is
  marked BEFORE order execution so a slow order can't double-fire on the same candle.
- Sizing is `available_balance × positionSizeValue / 100`, leverage-less (task
  #13 will change this). Orders below the exchange minimum ($10 notional) get
  pinned to the minimum — with tiny balances the configured % is effectively ignored.
- Close pipeline: `close_requested` → reduce-only market order → `closing` →
  position gone → `closed` with `closeReason` from the REAL fill
  (`/api/v1/positions/history`). Classification tolerance = 25% of the |TP−SL|
  gap (a price-relative tolerance was wider than the actual level distances and
  misclassified everything as "system").
- Reconcile waits a 120s grace period before treating a missing position as
  closed (order propagation on the exchange is not instant).
- **A signal is not enough to trade: the side also needs a valid stop.**
  `buildRiskPlans` returns `{ long, short }` computed INDEPENDENTLY (the risk
  distance used to be one mirrored scalar) and either side can be `null`. With a
  value-area stop that happens whenever price sits on the wrong side of the level
  — normal market, not an error. The bot logs and skips the entry; the backtest
  skips it too, so both agree. An order without a stop is never submitted
  (invariante 3), and the take profit is derived from the stop distance, so a
  missing stop means no target either.

## Decisões Técnicas

- **WS protocol (probed live)**: subscribe
  `{method:"subscribe",params:{source:"candle",symbol,interval}}`; messages
  `{channel:"candle",data:{t,T,s,i,o,c,h,l,v}}`. There is NO `isClosed` flag —
  closure is detected by openTime rollover (`pendingByKey`). Warm-up via kline REST.
- The WS feed subscribes the **cross-product symbol × interval**, and both sides
  are derived from the active strategies (`resolveSymbols`/`resolveIntervals`) —
  the interval list used to be hardcoded, which subscribed every builder
  timeframe for every symbol. A pair that is never subscribed means a strategy
  that silently never evaluates (it happened with 3m, 2026-07-10), so
  `setSubscriptions` subscribes any missing pair when a strategy appears, and a
  reconnect re-subscribes everything (a new socket inherits nothing). Covered by
  `src/__tests__/unit.test.ts`. 1h/4h were probed live on the WS before being
  offered (2026-07-14).
- `intervalToMs` (warm-up range) only parses `m`/`h` and falls back to 5min for
  anything else. Offering `1d` without fixing it would fetch 25h of daily candles,
  never warm the buffer past `isWarm`'s 50, and the strategy would never fire —
  silently. Same failure class as the missing-interval one above.
- The `prices` WS channel is **global**: one subscribe with NO symbol returns all
  69 exchange symbols (funding, next_funding, open_interest, oracle, mark, mid,
  volume_24h, timestamp). Subscribing per symbol would just multiply the same
  message. `market-recorder.ts` persists it — one row per symbol per minute,
  bucketed and `onConflictDoNothing` against the unique `(symbol, recorded_at)`
  index, so a restart mid-minute cannot duplicate. The feed itself never touches
  the DB; it hands snapshots to the recorder through `onPrices`.
- The recorder writes `RECORDED_SYMBOLS` (BTC/ETH/SOL — the tradable universe)
  regardless of which strategies are active. Deriving it from active strategies
  would punch holes in the series exactly during the periods with no bot running,
  and a series with holes is worthless for the backtest it exists to enable.
  Writes are fire-and-forget: a DB failure is logged and dropped, never allowed
  to reach the order path.
- CandleBuffer capacity is 300 and dedupes/replaces by openTime. The backtest
  simulation window mirrors it (`max(requiredPeriod+5, EVALUATION_WINDOW_CANDLES)`)
  — both for parity with live evaluation and because the unbounded window was
  O(n²) and timed out the Lambda. At 4h those 300 candles are 50 days of history,
  which caps how long an indicator's lookback can be.
- Per-strategy signed `PacificaClient` built from the decrypted credential;
  cache invalidated when the credential row changes. Pacifica `account` param =
  `strategy.userId` (main wallet); the agent wallet only signs.
- Entry orders carry inline TP/SL and are re-anchored post-fill via
  `setPositionTpsl` (fill price ≠ reference price).
- `materializeYourStrategyTechnicalContract` is a byte-for-byte port of the API's
  (`engine/evaluator.ts`); parity was verified on real drafts (2026-07-10). Any
  change must land in BOTH copies.
- db-watcher's change signature includes `updatedAt`, so config edits hot-reload
  running strategies. `bot.onStrategiesChanged` must be attached to the object
  RETURNED by `createBot` — attaching to the input was a silent no-op (the
  "bot never executed" incident).

## O que a Pacifica expõe de dado de mercado (probado ao vivo, 2026-07-14)

Isto decide quais indicadores o produto PODE ter. A regra é única: **um indicador
que o backtest não enxerga não pode chegar ao builder** — e o que separa o
possível do impossível não é a lógica, é a existência de **histórico**.

| Fonte | Histórico? |
|---|---|
| `/api/v1/kline` — OHLCV + `v` (volume) + `n` (nº de trades) | **Sim**, 360d+ |
| `/api/v1/trades` — tape com campo `cause` | **Não** — devolve ~2 min e IGNORA `limit`, `start_time` e `offset` (os três testados) |
| `/api/v1/book` — profundidade | **Não** — snapshot do instante |
| `/api/v1/info` e WS `prices` — funding, open interest | **Não** — só o valor corrente |
| WS `liquidations` / `funding_rate` | Não existem (400 "Invalid subscription parameters") |

Consequências, para não serem re-litigadas:

- **Volume profile é viável** e foi implementado: o kline tem volume com 360 dias,
  então o perfil é aproximável e, principalmente, **backtestável**.
- **Heatmap de liquidação não é viável.** Não há stream de liquidação; o único
  rastro seria o `cause` do tape, que tem dois minutos de memória. Não há histórico
  para construir o heatmap nem para testá-lo. Além disso um heatmap não é dado
  observado — é dado MODELADO a partir de OI + suposição de alavancagem — e os
  níveis que realmente movem o BTC estão na Binance/Bybit, não aqui.
- **Nível de demanda via book não é viável.** Sem histórico → não backtestável. E
  num perp DEX fino a profundidade é majoritariamente cotação de market maker que
  evapora na aproximação. O `donchian` já é uma versão crua e testável de "onde o
  preço achou suporte".
- **Funding e open interest são a única fonte de sinal ortogonal ao OHLCV** que
  existe aqui — tudo o mais (EMA, RSI, ADX, Donchian, volume profile) é
  transformação do mesmo preço. Não têm histórico, e a única cura para falta de
  histórico é começar a gravar: é exatamente isso que o `market-recorder` faz.
  Em alguns meses há série própria contra a qual testar funding extremo e
  divergência de OI. Até lá, funding continua sendo um **custo não modelado** no
  backtest (BTC ~0,017%/dia se o funding for horário — não é fatal perto dos
  0,18% de round-trip, mas a estratégia de 4h segura posição por dias).

## Problemas Conhecidos

- DT-001 (LISTEN/NOTIFY instead of polling), DT-003 (formal circuit breaker) and
  DT-004 (integration tests for bot.ts) remain open — see CLAUDE.md.
- `market_snapshots` cresce ~1.6M linhas/ano e ninguém a poda nem a lê ainda —
  ela existe só para ter passado quando o sinal de funding/OI for construído.
