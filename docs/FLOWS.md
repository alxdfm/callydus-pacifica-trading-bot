# Action Flows — Current State

Every user-facing action and its full path through the stack. Rewritten
2026-07-12 against the post-contract-v2 codebase (the pre-rewrite version of
this file described the v1 surface, which no longer exists — the dead surface
inventory is kept in §7 as a historical record).

Legend: **UI** trigger → **FE** frontend function → **API** endpoint/handler → **DB/side effects** → **state** writes.

Data layer in one line: `SessionProvider` (`src/v2/session.tsx`) holds the single
server snapshot from `GET /api/v2/session`; every mutation goes through the typed
client (`src/v2/client.ts`) and ends with `reload()`. See
`docs/modules/frontend-v2.md` and `docs/modules/api-v2.md`.

---

## 1. Session & auth

### 1.1 Connect wallet + SIWS sign-in
- **UI**: wallet-standard modal (`SolanaWalletEnvironment`); the click only
  `select()`s the adapter — `WalletProvider` performs the connect (see
  `docs/modules/wallet-solana.md`, rule 1)
- **FE**: `SolanaWalletStateBridge` reacts to `connected` → `authenticate()`
  (`features/auth/AuthContext.tsx:72`), once per wallet per mount
- **API**: `GET /api/auth/nonce?wallet=` (TTL 5 min) → wallet signs →
  `POST /api/auth/verify` (ed25519 → session token, TTL 24h)
- **Side effects**: token persisted in localStorage `callydus.auth`
- **State**: `useAuth().token/walletAddress/expiresAt`; the new token makes
  `SessionProvider` drop any previous session and load a fresh one

### 1.2 Account discovery (on connect)
- **FE**: bridge effect → `lookupOperationalAccountViaBackend`
- **API**: `POST /api/onboarding/account/lookup`
- **State**: found → seeds `builderApproval=approved`, `credentials=valid`,
  `operational=verified`, `onboarding=ready`, and redirects `/onboarding` → `/dashboard`;
  not found → the user stays in onboarding

### 1.3 Session hydration (existing account + token)
- **FE**: bridge effect (guarded by per-wallet hydrated/in-flight refs) →
  `getSession(token)`
- **API**: `GET /api/v2/session` → `{walletAddress, access, credential, strategy, balanceUsd}`
- **State**: seeds the onboarding slices from `credential` + `access==="ready"`;
  the same endpoint feeds `SessionProvider`, which is what the pages read

### 1.4 Logout
- **UI**: Profile → logout → `ConfirmationModal`
- **FE**: `ProfilePage.handleLogout` (`:111`) → `resetOnboardingState()` →
  `disconnectWallet()` → bridge detects disconnect → `clearAuth()`
- **Side effects**: `callydus.auth`, `pacifica.app-state.v2` and `walletName`
  removed; token cleared → `SessionProvider` returns to `idle` with no session

---

## 2. Onboarding (3 steps, `OnboardingPage` stepper)

Untouched by the v2 rewrite — still on the v1 app-state slices (intentional).

### 2.1 Validate agent wallet credential
- **UI**: step form — public key + private key (component-local state, never global) + alias
- **FE**: `handleValidateCredentials` (`OnboardingPage.tsx:759`)
- **API**: `POST /api/onboarding/credentials/validate` — derives the pubkey from
  the privkey (ed25519), mismatch check, AES-256-GCM encrypt, `upsertAccount` +
  `upsertCredential` (previous active credential → `replaced`)
- **DB**: `accounts`, `credentials`
- **State**: `credentials.validationStatus=valid`

### 2.2 Builder approval
- **FE**: signed payload (timestamp + expiry window, replay protection)
- **API**: `POST /api/onboarding/builder/approve`
- **DB**: `builder_approvals`
- **State**: `builderApproval.approvalStatus=approved`

### 2.3 Operational verification (probe order)
- **FE**: `handleRunOperationalCheck` (`OnboardingPage.tsx:832`)
- **API**: `POST /api/onboarding/credentials/verify-operational` — decrypts the
  credential (failure = key mismatch, as in the 2026-07-08 incident; the catch
  logs credentialId + message, never key material), builds a `PacificaClient`,
  places and cancels a probe order
- **DB**: `credentials.operationallyVerified=true` → drives `access="ready"` in §1.3
- **State**: `operational.status=verified`, `onboarding.status=ready`

---

## 3. Strategy lifecycle

One strategy per user (`getActiveStrategyByUserId`); `strategy.status` is the
only bot-state truth.

### 3.1 Save draft
- **UI**: Builder → Save (also implicit before Backtest/Activate when the draft is dirty)
- **FE**: `handleSave` (`StrategyBuilderPage.tsx:321`) → `saveStrategy(token, draft)`
- **API**: `POST /api/v2/strategy` — upsert; **409 `strategy_running`** if the
  strategy is active (config never changes under a running bot)
- **DB**: `strategies.config` (draft JSON) + `symbol`, `status="paused"` on insert
- **State**: local `record/draft/savedFingerprint` — the fingerprint comes from
  the SERVER echo (jsonb reorders keys) — then `reloadSession()`

### 3.2 Backtest
- **FE**: `handleBacktest` (`:346`) — saves first only when the draft is dirty,
  so an active strategy can still be backtested
- **API**: `POST /api/v2/strategy/backtest` — materializes the technical contract,
  fetches Pacifica candles in parallel chunks, `simulatePresetBacktest`
- **Parity with live execution**: leverage 1 and the real `balanceUsd` as initial
  capital (falls back to $1000 when the balance is ≤ 0 — a position consumes it)
- **State**: local `preview` + `previewFingerprint` (drives the "stale" tag)

### 3.3 Activate
- **UI**: Builder header or Strategies card
- **FE**: `handleActivate` (`StrategyBuilderPage.tsx:384` / `StrategiesListPage.tsx:40`)
- **API**: `POST /api/v2/strategy/activate` → `status="active"`; refuses with
  `strategy_not_executable` when `activationBlockers` is non-empty
- **Worker**: DbWatcher (30s poll, signature `id:updatedAt`) picks it up → the
  engine evaluates once per closed candle → orders (always SL/TP + builderCode)
- **State**: toast + `reloadSession()`

### 3.4 Pause — 4 entry points
- Dashboard toggle (`DashboardPage.tsx:96`), Strategies card
  (`StrategiesListPage.tsx:54`), Builder lock banner (`:409`), Profile
  replacement flow (`use-agent-wallet-replacement-flow.ts:157`)
- **API**: `POST /api/v2/strategy/pause` → `status="paused"`
- **Worker**: the strategy drops out of the active poll → no new entries (open
  trades keep being managed)
- **State**: `session.strategy.status` after `reloadSession()`

### 3.5 Resume
- **UI**: Dashboard toggle — resume IS activate (`POST /api/v2/strategy/activate`);
  there is no separate resume endpoint

---

## 4. Trades

### 4.1 Close trade (two-click confirm)
- **UI**: Trades page → Close → same button confirms (`confirmingId` arm/disarm, 4s)
- **FE**: `handleClose` (`TradesPage.tsx:166`) → `closeTrade(token, id)`
- **API**: `POST /api/v2/trades/:id/close` — ownership check, refuses when the
  status is not `open`, then `status="close_requested"` (the API never calls the exchange)
- **Worker**: reconcile submits a reduce-only market order signed with the owner's
  credential (`bot.ts:521`), marks the trade `closing`; the next tick detects the
  vanished position and finalizes it as `closed` with `closeReason="manual"`,
  taking the exit price from the real fill (`/api/v1/positions/history`)
- **State**: local reload of `getTrades`

---

## 5. Profile

### 5.1 Replace agent wallet
- **FE**: `use-agent-wallet-replacement-flow.ts` — the whole modal runs on local
  state (draft keys never touch global state)
- Steps: pause bot (`POST /api/v2/strategy/pause`) → validate the new credential
  (`POST /api/onboarding/credentials/validate`, old credential → `replaced`) →
  operational check (`POST /api/onboarding/credentials/verify-operational`) →
  `reloadSession()`

---

## 6. Page data loading

| Data | Source |
|---|---|
| wallet/access/credential/strategy/balance | `GET /api/v2/session` (SessionProvider, root) |
| open/closed trades | `GET /api/v2/trades` (page-local) |
| worker events | `GET /api/v2/events` (page-local) |
| market metadata | `GET /api/v2/markets` |
| save/activate/pause/backtest | `POST /api/v2/strategy[...]` |
| close trade | `POST /api/v2/trades/:id/close` |
| (sign-in, bridge) | `POST /api/onboarding/account/lookup` + `GET /api/v2/session` |

The API surface is `auth + onboarding + v2` only. Frontend `contracts.ts` keeps
just the onboarding/auth/wallet vocabulary (1443 → 305 lines); global app-state
keeps only the onboarding slices and the toast. Server data is never persisted.

---

## 7. Dead surface inventory (2026-07-09 scan — REMOVED)

Historical record of what existed and why it was dead. Everything below was
deleted on 2026-07-09 (frontend modules, unused API routes) and 2026-07-10
(the whole v1 contract layer: `/api/account/*`, `/api/runtime/*`,
`/api/strategies/*`, `/api/trades/*` + their consumers).

### Frontend — zero production consumers
| Item | Notes |
|---|---|
| `ui/components/PaginationControls.tsx` | whole component |
| `readOperationalTradesViaBackend` + `applyOperationalTradesSessionSnapshot` | Trades page used the dashboard snapshot |
| `readOperationalHistoryViaBackend` + `applyOperationalHistorySessionSnapshot` | History page deleted in redesign phase 5 |
| `features/onboarding/agent-wallet-validation.ts` + test | superseded by backend validation |
| `features/runtime/runtime-sync-presentation.ts` + test | no consumers |
| `features/runtime/bot-status-presentation.ts` + test | no consumers |
| ~475 of ~900 i18n keys | wizard/history/operations leftovers |
| CSS `shell-skeleton`/`sk-*` classes | markup removed; broader CSS audit pending (light-theme purge) |

### API — routes with no caller (the worker never calls the API)
| Route | Notes |
|---|---|
| `POST /api/auth/nonce` | only `GET /nonce` was used |
| `POST /api/auth/credentials` | pre-refactor duplicate of onboarding validate |
| `POST /api/auth/verify-operational` | pre-refactor duplicate of onboarding verify (contained credential decrypt) |
| `POST /api/backtest/preview` | superseded |
| `POST /api/builder/approve` | superseded by `/api/onboarding/builder/approve` |
| `GET /api/events`, `GET /api/positions` | no caller — positions contained credential decrypt (attack surface) |
| `GET /api/strategies`, `POST /api/strategies/:id/{activate,pause,resume}`, `PUT /api/strategies/:id` | the `/your/*` variants were the live ones (also dead now) |
| `GET /api/trades`, `POST /api/account/{trades,history}` | their pages/appliers were dead |
