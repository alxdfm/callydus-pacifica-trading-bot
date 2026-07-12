# wallet-solana (`packages/frontend/src/features/wallet/solana/`)

Wallet adapter environment + state bridge + SIWS. Every rule below was learned
from a production incident on 2026-07-09 (nonce loops, stacked signature popups,
dead connect button); reverting any of them reintroduces the bug.

## Regras de Negócio

- Auto-SIWS fires ONCE per wallet per mount. Failure recovery is the explicit
  "Sign message to continue" button — never an automatic retry.
- A valid persisted token for the connected wallet short-circuits SIWS entirely.

## Decisões Técnicas

1. **Never call `adapter.connect()` in the click handler after `select()`.**
   With cached accounts (trusted domain) `StandardWalletAdapter` emits `connect`
   SYNCHRONOUSLY — before `WalletProvider`'s listeners exist (they attach in
   passive effects) — and the state sticks `disconnected` until a full reload.
   The click only `select()`s; `WalletProvider` itself connects post-commit
   (`hasUserSelectedAWallet`). `connect()` is awaited only when the adapter was
   already selected.
2. **wallet-standard only** (`wallets: never[] = []` in the provider). Legacy
   Phantom/Backpack adapters conflict with their standard-wallet counterparts
   (duplicate entries, broken event wiring).
3. **Adapters flap `connected` transiently** (Backpack while locked). Never
   re-arm automatic effects on a flap: the SIWS ref is NOT reset on
   disconnect-branches, only on real wallet switches.
4. **Shell/route gates must require `token`.** `AppLayout` switching wrapper
   TYPE (onboarding-shell ↔ shell) remounts the subtree — WalletEnvironment and
   bridge included — mid-SIWS, producing the nonce loop.
5. `authenticate()` is idempotent: concurrent calls reuse the in-flight promise.

## Bridge (SolanaWalletStateBridge)

- Hydrates v1 onboarding slices from `GET /api/v2/session` (credential + access),
  guarded by per-wallet hydrated/in-flight refs; responses for a different
  `walletAddress` are discarded.
- app-state persists onboarding slices only: transient statuses are sanitized on
  rehydrate and the runtime toast is never persisted.

## Problemas Conhecidos

- The environment is still mounted per-route (Onboarding/Product/Profile). Safe
  only because of the token gates above; mounting once at the app root is the
  structural fix.
