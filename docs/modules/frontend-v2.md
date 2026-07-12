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

## Decisões Técnicas

- `SessionProvider.reload()` keeps status `"ready"` when a session already
  exists (background refresh). Pages early-return skeletons on `"loading"`;
  regressing this makes every pause/resume/save flash the whole page —
  including unmounting the agent-wallet modal mid-flow (fixed 2026-07-12).
- `requestSeqRef` guards concurrent reloads and token switches: only the latest
  request's response is applied.

## Problemas Conhecidos

- Onboarding pages/guards still read v1 app-state slices; the wallet bridge
  seeds them from `GET /api/v2/session`. Full onboarding migration pending.
- Task #13 (leverage-aware position sizing) will add a `leverage` draft field —
  the builder must then pass it to the backtest instead of the hardcoded 1.
