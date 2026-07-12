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

## Decisões Técnicas

- **WS protocol (probed live)**: subscribe
  `{method:"subscribe",params:{source:"candle",symbol,interval}}`; messages
  `{channel:"candle",data:{t,T,s,i,o,c,h,l,v}}`. There is NO `isClosed` flag —
  closure is detected by openTime rollover (`pendingByKey`). Warm-up via kline REST.
- The WS intervals list must cover every timeframe the builder offers. A missing
  interval (3m, 2026-07-10) means strategies on it silently never evaluate.
- CandleBuffer capacity is 300 and dedupes/replaces by openTime. The backtest
  simulation window mirrors it (`max(requiredPeriod+5, 300)`) — both for parity
  with live evaluation and because the unbounded window was O(n²) and timed out
  the Lambda.
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

## Problemas Conhecidos

- DT-001 (LISTEN/NOTIFY instead of polling), DT-003 (formal circuit breaker) and
  DT-004 (integration tests for bot.ts) remain open — see CLAUDE.md.
