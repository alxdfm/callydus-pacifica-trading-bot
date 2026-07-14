# api-v2 (`packages/api/src/routes/v2.ts` + `exchange/pacifica/`)

The only data surface the frontend consumes (besides auth/onboarding).

## Padrões

- `respondWithContract(c, schema, payload)` wraps EVERY success response:
  validates against the shared schema before sending. Violation → 500 +
  CloudWatch log `[v2] response contract violation` (grep for it when the UI
  shows a generic error). zod strips unknown keys, so internal simulator fields
  never leak to the wire.
- Errors always go through `errorJson` → `{status:"error", code, message, retryable}`.

## Regras de Negócio

- One non-stopped strategy per user (`getActiveStrategyByUserId` invariant);
  save is an upsert against it.
- `POST /strategy` refuses saves while the strategy is `active`
  (409 `strategy_running`) — config must never change under a running bot.
  The builder skips the save when the draft is clean, so backtesting an
  active strategy still works.
- Closed trades are sorted by `closedAt` desc **before** the limit
  (default 50, max 200). The underlying query orders by `openedAt` desc —
  Postgres heap order is arbitrary and shifts when rows are updated.

## Decisões Técnicas

- Postgres `jsonb` does NOT preserve draft key order: the draft echoed by
  save differs byte-wise from the submitted one. Clients must fingerprint
  the echo, never the local object.
- `GET /session` fetches the Pacifica balance with a 3s abort timeout and
  returns `balanceUsd: null` on failure — the session must never fail because
  the exchange is slow.
- Backtest warm-up prepends `max(requiredPeriod+5, EVALUATION_WINDOW_CANDLES)`
  candles before `startTime` and passes `tradingStartTime: startTime` to the
  simulator. Those candles are history only: they feed the indicators but open
  no trades and do not anchor the hold benchmark. The warm-up must cover the
  simulator's evaluation window (300 candles, mirroring the worker's
  CandleBuffer) — with a shorter one the first candles of the period are
  evaluated on less history than the live bot has, which moved a 4h EMA
  strategy by 18 points on BTC (2026-07-14).
- The backtest is O(candles × window) inside a 29s Lambda, so the route rejects
  ranges over `MAX_BACKTEST_CANDLES` (`period_too_long`) before fetching. The
  builder never sends one, but the route is public.

## Pacifica REST (facts probed live, 2026-07-09/10)

- Klines: `/api/v1/kline` (singular), snake_case `start_time`/`end_time`,
  hard cap **4000 candles per request** → `fetchCandlesInChunks` (concurrency 3,
  dedupe by openTime, `null` on any provider failure → 503 `provider_unavailable`).
- `/api/v1/account?account=<main wallet>` is public; `available_to_spend` is the
  margin balance (drops to ~0 while a position is open).
- `/api/v1/info` returns BASE symbols (`BTC`) — always map base→pair (`BTC/USDC`).
- `/api/v1/positions/history?account=` is public and has real fills (side
  `close_long`, price, pnl) — used by the worker to classify closes.

## Problemas Conhecidos

- Strategies-list "Realized PnL" is a client-side sum over the last 200 closed
  trades; replace with a SQL aggregate when volume grows.
