# worker (`packages/worker/`)

Scheduled bot (since 2026-07-14; formerly WS-first on ECS): an hourly
`sst.aws.Cron` Lambda rebuilds the CandleBuffer from REST and runs ONE tick →
engine → executor. Never calls the API (Drizzle only); CandleBuffer never
touches the DB (see CLAUDE.md invariants). Mutual exclusion comes from
`concurrency: { reserved: 1 }` + `retries: 0` on the function — there is no
lease in the code, and an async retry after "order placed, crash before insert"
would double the position.

## Regras de Negócio

- Evaluation happens once per CLOSED candle, but ENTRY dedupe is persisted in
  the DB (`getTradesForStrategySince`): a candle's entry always happens AFTER
  its closeTime, so any trade (even one already stopped out) with
  `openedAt >= latestCandle.closeTime` belongs to this candle and blocks a new
  entry. Without this, an intra-candle stop-out would re-open the same position
  on the same signal on the next hourly invocation (the old in-memory map dies
  with the Lambda) — the backtest never re-enters a candle. A FAILED order
  inserts no trade row, so it may still retry on the next invocation of the
  same candle (accepted).
- Before entering, the bot checks the EXCHANGE for a position on the symbol
  (not just the DB): reconcile only walks DB→exchange, so an orphan position
  (crash between order and insert, or a manual user trade) is invisible to it.
  If positions can't be verified, the entry is skipped — order safety beats a
  missed candle.
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

- Candles come from `GET /api/v1/kline` (`candle-fetch.ts`), one request per
  `(symbol, interval)` pair derived EXACTLY from the active strategies
  (`resolveCandlePairs`, no cross-product). A pair that is never fetched means a
  strategy that silently never evaluates (it happened with 3m on the WS era,
  2026-07-10) — covered by `src/__tests__/unit.test.ts`. The fetch may include
  the in-progress candle; the bot filters to closed candles
  (`closeTime <= alignToLastClosedCandleEndTime(now)`), so it is harmless.
- Interval durations come from `getIntervalDurationMs` (engine), which is fed by
  the exhaustive `TIMEFRAME_DURATION_MS` record in the shared contract. Offering
  a new timeframe (e.g. `1d`) without adding it there is a typecheck error, not
  a silent never-warms-up bug — but the Pacifica kline endpoint must ALSO be
  probed for the new interval string before offering it.
- `market-snapshot.ts` records funding/OI/mark **hourly via REST `/api/v1/info`**
  (the WS `prices` channel died with the resident worker; 1-min resolution was
  traded away on 2026-07-14 — funding changes hourly, so only intra-hour OI
  dynamics were lost). Rows are bucketed to the hour and `onConflictDoNothing`
  against the unique `(symbol, recorded_at)` index, so a re-run inside the same
  hour cannot duplicate. The insert is AWAITED (a floating promise freezes with
  the Lambda container and the write is lost), but failures are logged and
  swallowed — never allowed to reach the order path.
- The snapshot writes `RECORDED_SYMBOLS` (BTC/ETH/SOL — the tradable universe)
  regardless of which strategies are active. Deriving it from active strategies
  would punch holes in the series exactly during the periods with no bot running,
  and a series with holes is worthless for the backtest it exists to enable.
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
- There is no db-watcher/hot-reload anymore: every invocation loads the fresh
  strategy list and hands it to `bot.onStrategiesChanged()` BEFORE `runOnce()`.
  `onStrategiesChanged` must be called on the object RETURNED by `createBot` —
  calling it on the input was a silent no-op (the "bot never executed" incident).

## O que a Pacifica expõe de dado de mercado (probado ao vivo, 2026-07-14)

Isto decide quais indicadores o produto PODE ter. A regra é única: **um indicador
que o backtest não enxerga não pode chegar ao builder** — e o que separa o
possível do impossível não é a lógica, é a existência de **histórico**.

| Fonte | Histórico? |
|---|---|
| `/api/v1/kline` — OHLCV + `v` (volume) + `n` (nº de trades) | **Sim**, 360d+ |
| `/api/v1/trades` — tape com campo `cause` | **Não** — devolve ~2 min e IGNORA `limit`, `start_time` e `offset` (os três testados) |
| `/api/v1/book` — profundidade | **Não** — snapshot do instante |
| `/api/v1/info` — funding, open interest | **Não** — só o valor corrente (era também o WS `prices`, morto com o worker residente) |
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
  histórico é começar a gravar: é exatamente isso que o `market-snapshot` faz
  (1 linha/símbolo/hora — resolução plena para funding, que muda de hora em
  hora). Em alguns meses há série própria contra a qual testar funding extremo e
  divergência de OI. Até lá, funding continua sendo um **custo não modelado** no
  backtest (BTC ~0,017%/dia se o funding for horário — não é fatal perto dos
  0,18% de round-trip, mas a estratégia de 4h segura posição por dias).

## Problemas Conhecidos

- DT-003 (formal circuit breaker) and DT-004 (integration tests for bot.ts)
  remain open — see CLAUDE.md. DT-001 died with the db-watcher.
- `market_snapshots` cresce ~26k linhas/ano no snapshot horário (era ~1.6M no
  recorder por minuto) e ninguém a poda nem a lê ainda — ela existe só para ter
  passado quando o sinal de funding/OI for construído. As linhas por minuto de
  antes de 2026-07-14 continuam na tabela.
- A UI mostra trade fechado por SL/TP com até 1h de atraso (o reconcile roda no
  tick horário). O dinheiro está protegido pela exchange o tempo todo — é só
  atraso de exibição, trade-off aceito em 2026-07-14.
