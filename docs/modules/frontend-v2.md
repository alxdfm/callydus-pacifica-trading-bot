# frontend-v2 (`packages/frontend/src/v2/`)

Typed client + single session snapshot. Pages own their page-local data
(trades/events) and read shared state from `useSession()`.

## Padrões

- Every request goes through `requestV2`: parses with the SAME shared schema the
  server validated against; 401 triggers `redirectToProfileOnUnauthorized`;
  network/parse failures become contract error envelopes. Callers never need
  try/catch — they branch on `result.status`.
- Server data never touches localStorage or global app-state. The v1 lesson:
  persisted snapshots resurrected as truth after relogin.

## Regras de Negócio

- Builder draft initializes ONCE per mount from the session snapshot
  (`initializedRef`); the `reloadSession()` after save must not clobber edits.
- Draft fingerprints MUST come from the server echo (`result.strategy.draft`) —
  jsonb reorders keys, so serializing the local object yields a different string
  and produces false "stale" flags.
- Backtest runs with leverage 1 and the real available balance as capital
  (live-execution parity). Falls back to $1000 when balance ≤ 0: the contract
  requires positive capital and the balance is ~0 whenever the bot holds a position.
- Backtest periods go up to 360d. The short ones are useless on the higher
  timeframes — a 4h EMA cross fires ~1 trade/month, so 7d/30d return a sample of
  zero to three trades. Any new timeframe needs a period long enough to judge it.

## Decisões Técnicas

- `SessionProvider.reload()` keeps status `"ready"` only when the token is the
  SAME one that produced the current session (background refresh). Pages
  early-return skeletons on `"loading"`; regressing this makes every
  pause/resume/save flash the whole page — including unmounting the agent-wallet
  modal mid-flow. A DIFFERENT token (login or wallet switch) drops the session
  immediately: another account's balance/strategy must never linger on screen.
  Both halves matter — the second was a regression introduced by the first
  (fixed 2026-07-12).
- `requestSeqRef` guards concurrent reloads and token switches: only the latest
  request's response is applied.

## Problemas Conhecidos

- Onboarding pages/guards still read v1 app-state slices; the wallet bridge
  seeds them from `GET /api/v2/session`. Full onboarding migration pending.
- Task #13 (leverage-aware position sizing) will add a `leverage` draft field —
  the builder must then pass it to the backtest instead of the hardcoded 1.
