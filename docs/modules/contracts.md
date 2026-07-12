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
