# contracts (`@pacifica/shared/contracts`)

Single source of truth for the front↔API wire contract (zod). Both sides import
the same schemas; the API validates its own responses against them before sending.

## Padrões

- Exported via the `./contracts` subpath of `@pacifica/shared` so the worker can
  keep importing `@pacifica/shared` without pulling zod into its bundle.
- Every response schema is a union with `apiErrorSchema`. The frontend client
  (`src/v2/client.ts`) relies on this invariant to synthesize error envelopes for
  network/parse failures — removing the union from a schema breaks that path at runtime.
- Adding a field = edit the schema here only; API and frontend pick it up at
  typecheck. Never redeclare wire types in either package.

## Regras de Negócio

- `strategy.status` (`active | paused | stopped`) is the ONLY bot-state truth.
  v1 had parallel derivations (`botStatus`, `activePreset`) that drifted; do not
  reintroduce them.
- `access` (`ready | onboarding_required`) is derived server-side from
  `credential.operationallyVerified` — the client never computes it.
- Trade statuses `open → close_requested → closing → closed` mirror the worker's
  real close pipeline; there are no other states.
- `timeframeSchema` (`1h | 4h` desde 2026-07-14 — o worker agendado avalia de hora em hora, então timeframe sub-horário avaliaria atrasado) is what gates the tradable
  timeframes — the engine and `CandleInterval` already span `1m…1d`. Widening it
  also requires the builder's `TIMEFRAMES` and a duration in
  `TIMEFRAME_DURATION_MS` (an exhaustive `Record` — a missing entry is a
  typecheck error, not a silent prod bug). The worker derives its WS intervals
  from the active strategies, so it needs no edit. `1d` is deliberately out: the
  ws-feed's `intervalToMs` only parses `m`/`h`, and a daily EMA cross fires 1–3
  times a year, which is no sample to judge a strategy on (2026-07-14).
- `MAX_BACKTEST_CANDLES` / `maxBacktestDays(timeframe)` is the shared budget for
  the 29s backtest Lambda: the builder only offers periods that fit and the route
  rejects the rest (`period_too_long`). 3m × 360d is ~172k candles and does not
  fit — measured at ~10s of simulation alone, before the 44-chunk candle fetch.
- Adding an indicator to `indicatorConfigSchema` is only half the job: both
  engines (`api/` and `worker/`) switch exhaustively on `type`, so a missing case
  is a typecheck error — but `shared/src/types/signal.ts` carries a SECOND,
  hand-written `IndicatorConfig` (the worker imports that one, not the zod
  inference). Both must gain the member. The builder's `INDICATOR_TYPES`,
  `describeIndicator`, `suggestIndicatorKey` and `draft-validation.ts`
  (`resolveIndicatorContext`) also switch on it.
- `stopLoss` has three modes and the take profit has ONE (`rr`, derived from the
  stop distance). So the stop mode picks both ends of the trade — there is no
  independent target. `volumeProfile` (stop on the value-area edge) broke two
  assumptions the other modes hid: the risk distance is now ASYMMETRIC per side,
  and a side can have NO valid stop, in which case the trade is skipped rather
  than protected by an invented level. It is measured WORSE than the ATR stop —
  see `docs/TYPES.md`; the mode exists but is not the recommendation.
- An indicator the backtest cannot see must not reach the builder. The product's
  whole promise is "test before you activate"; a configurable-but-unvalidatable
  indicator is worse than none. This is the rule that admitted `volumeProfile`
  (klines carry `v` with 360d of history) and rejected liquidation heatmaps and
  order-book depth — see `docs/modules/worker.md` for the data probe.

## Decisões Técnicas

- Error codes are free strings (not an enum): codes exist for logging/branching,
  `message` is what users see. This kills the v1 failure class where a server
  enum value missing from the client enum made successful operations render as errors.
- Commands (`activate`/`pause`/save) return the full updated strategy record —
  no synthetic "command"/"activation" DTOs; the client re-renders from the real row.
- Only real-backed fields exist (`balanceUsd` = Pacifica `available_to_spend`).
  v1 carried fictional fields (`syncStatus`, snapshot statuses) backed by stubs.

## Problemas Conhecidos

- Onboarding/auth/wallet vocabulary still lives in the frontend-local
  `src/types/contracts.ts` (v1 style, ~305 lines). Migrating it here is pending.
