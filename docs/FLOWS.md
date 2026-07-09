# Action Flows — Current State (pre-rewrite reference)

Mapped 2026-07-09 against the live codebase. This is the authoritative reference for the
contract-v2 rewrite (tasks #2–#8): every user-facing action, its full path through the stack,
and the dead surface scheduled for removal.

Legend: **UI** trigger → **FE** frontend function → **API** endpoint/handler → **DB/side effects** → **state** writes.

---

## 1. Session & auth

### 1.1 Connect wallet + SIWS sign-in
- **UI**: wallet adapter modal (provider picked in `OnboardingPage`, default phantom)
- **FE**: `SolanaWalletStateBridge` reacts to adapter `connected` → sets `wallet.sessionStatus`;
  `authenticate()` in `features/auth/AuthContext.tsx:65`
- **API**: `GET /api/auth/nonce?wallet=` (`auth.ts:46`, nonce TTL 5 min) → wallet signs message →
  `POST /api/auth/verify` (`auth.ts:76`, ed25519 check → JWT)
- **Side effects**: JWT persisted in localStorage `callydus.auth` (`AuthContext.tsx:26`), discarded when expired
- **State**: `useAuth().token/walletAddress/expiresAt`

### 1.2 Account discovery (on connect)
- **FE**: bridge effect → `lookupOperationalAccountViaBackend` (`SolanaWalletStateBridge.tsx:299`)
- **API**: `POST /api/onboarding/account/lookup`
- **State**: found → seeds `builderApproval=approved`, `credentials=valid`, `operational=verified`,
  `onboarding=ready` (`bridge:306-355`); not found → user stays in onboarding

### 1.3 Session hydration (existing account + token)
- **FE**: bridge effect (`SolanaWalletStateBridge.tsx:391-449`), guarded by refs against re-entry
- **API**: `POST /api/account/session` (`account.ts`) — since 2026-07-08 returns real `activePreset`
  (derived from strategy row) instead of hardcoded null
- **State**: `applyAccountSessionSnapshot` seeds every slice: credentials, operational, presets
  (`activePreset`), runtime (botStatus, trades, balance…), onboarding

### 1.4 Logout
- **UI**: Profile → logout button → `ConfirmationModal`
- **FE**: `ProfilePage.handleLogout` (`:154`) → `resetOnboardingState()` (global state → initial) →
  `disconnectWallet()` → bridge detects disconnect → `clearAuth()` (`bridge:58-60`) + slice resets
- **Side effects**: `callydus.auth` removed; `pacifica.app-state.v2` rewritten with initial state

---

## 2. Onboarding (3 steps, `OnboardingPage` stepper)

### 2.1 Validate agent wallet credential
- **UI**: step form — public key + private key (private key is component-local state since 2026-07-09) + alias
- **FE**: `handleValidateCredentials` (`OnboardingPage.tsx:751`) → `validateAgentWalletViaBackend`
- **API**: `POST /api/onboarding/credentials/validate` — derives pubkey from privkey (ed25519),
  mismatch check, AES-256-GCM encrypt (`crypto/credential-encryption.ts`, key derived per keyId),
  `upsertAccount` + `upsertCredential` (previous active credential → `replaced`)
- **DB**: `accounts`, `credentials`
- **State**: `credentials.validationStatus=valid`, `credentialId`, `keyFingerprint`

### 2.2 Builder approval
- **FE**: onboarding step → signed payload (timestamp + expiryWindow, replay protection)
- **API**: `POST /api/onboarding/builder/approve` (`onboarding.ts:511`)
- **DB**: `builder_approvals`
- **State**: `builderApproval.approvalStatus=approved`

### 2.3 Operational verification (probe order)
- **FE**: `handleRunOperationalCheck` (`OnboardingPage.tsx:824`)
- **API**: `POST /api/onboarding/credentials/verify-operational` — decrypts credential
  (`onboarding.ts:377`; failure = key mismatch as in the 2026-07-08 incident; the catch logs
  credentialId + error message since 2026-07-09, never key material), builds
  `PacificaClient`, places+cancels probe order (env `PACIFICA_OPERATIONAL_PROBE_*`)
- **DB**: `credentials.operationallyVerified=true`
- **State**: `operational.status=verified`, `onboarding.status=ready` → `canAccessProduct=true`

---

## 3. Strategy lifecycle

### 3.1 Save draft
- **UI**: Builder → Save (also implicit before Backtest and Activate)
- **FE**: `handleSave` (`StrategyBuilderPage.tsx:352`) → `saveYourStrategyViaBackend`
- **API**: `POST /api/strategies/your/save` (`strategies.ts:81`) — update existing non-stopped
  strategy or insert new one with `status: "paused"` (since 2026-07-08; saving never starts the bot)
- **DB**: `strategies.config` (draft JSON), `symbol`
- **State**: builder `record/draft/savedFingerprint` (local)

### 3.2 Backtest preview
- **FE**: `handleBacktest` (`StrategyBuilderPage.tsx:374`) — saves first, then
  `previewYourStrategyBacktestViaBackend`
- **API**: `POST /api/strategies/your/backtest-preview` (`strategies.ts:180`) — materializes
  technical contract, fetches Pacifica candles, `simulatePresetBacktest`
- **State**: local `preview` + fingerprint (drives the "stale" tag when config drifts)
- **Known gap**: leverage falls back to 1 and capital to $1000 because `marketInfo`,
  `symbolOperationalConfigs` and `balance` are stub `[]`/null in `/api/account/presets` —
  must be fixed in contract v2 (see task #2)

### 3.3 Activate
- **UI**: Builder header or Strategies list card
- **FE**: `handleActivate` (`StrategyBuilderPage.tsx:408` / `StrategiesListPage.tsx:41`) — save → activate
- **API**: `POST /api/strategies/your/activate` (`strategies.ts:132`) → `strategies.status=active`;
  response built by `mapStrategyToPresetActivation` (editableConfig derived from the real draft)
- **Worker**: DbWatcher polls `strategies where status='active'` (`worker/db/queries.ts:24`) →
  engine starts evaluating signals → orders (always with SL/TP + builderCode)
- **State**: `presets.activePreset`, `runtime.botStatus=active`, toast

### 3.4 Pause — 4 entry points
- Dashboard toggle (`DashboardPage.tsx:83`), Strategies card (`StrategiesListPage.tsx:64`),
  Builder lock banner (`StrategyBuilderPage.tsx:437`), Profile replacement flow
  (`use-agent-wallet-replacement-flow.ts:167`)
- **API**: `POST /api/runtime/pause` (`runtime.ts:18`) → `strategies.status=paused`
- **Worker**: strategy drops out of the active poll → no new entries (open trades keep being managed)
- **State**: `runtime.botStatus=paused` (patch or session reload)
- Pause visibility follows `runtime.botStatus` (not `activePreset`) since 2026-07-08

### 3.5 Resume
- **UI**: Dashboard toggle only
- **API**: `POST /api/runtime/resume` → `strategies.status=active`

---

## 4. Trades

### 4.1 Close trade (two-click confirm)
- **UI**: Trades page → Close → same button confirms (`confirmingId` arm/disarm)
- **FE**: `handleClose` (`TradesPage.tsx:152`) → `closeTradeViaBackend`
- **API**: `POST /api/trades/:id/close` (`trades.ts:10`) — ownership check, then
  `trades.status=close_requested` (no exchange call from the API)
- **Worker**: `bot.ts` picks up `close_requested` (`bot.ts:362,507`) and executes the close on Pacifica
- **State**: `session.reload()` refreshes trades

---

## 5. Profile

### 5.1 Replace agent wallet
- **FE**: `use-agent-wallet-replacement-flow.ts` — modal flow entirely on local state
  (draft keys never touch global state)
- Steps: pause bot (`/api/runtime/pause`) → validate new credential
  (`/api/onboarding/credentials/validate`, old credential → `replaced`) → operational check
  (`/api/onboarding/credentials/verify-operational`) → profile snapshot reapplied

---

## 6. Page data loading (read-only snapshots)

All via `useOperationalPageSession` (dedupe + reload) with per-page appliers —
**this whole layer is replaced by the single session loader in task #4.**

| Page | Hook | Endpoint |
|---|---|---|
| Dashboard, Strategies, Trades | `useDashboardSession` | `POST /api/account/dashboard` |
| Builder | `useOperationalPageSession("presets")` | `POST /api/account/presets` |
| Profile | `useOperationalPageSession("profile")` | `POST /api/account/profile` |
| (sign-in, bridge) | — | `POST /api/onboarding/account/lookup`, `POST /api/account/session` |

`yourStrategy` is real in dashboard/presets since 2026-07-08; `marketInfo`,
`symbolOperationalConfigs`, `balance`, `syncStatus`, `exchangeSnapshotStatus` are still stubs.

---

## 7. Dead surface inventory (2026-07-09 scan — REMOVED same day)

Everything below was deleted on 2026-07-09 (except `contracts.ts` schemas and legacy CSS,
which die with tasks #8/light-theme). Kept here as the record of what existed and why it was dead.

### Frontend — zero production consumers
| Item | Notes |
|---|---|
| `ui/components/PaginationControls.tsx` | whole component |
| `readOperationalTradesViaBackend` + `applyOperationalTradesSessionSnapshot` | Trades page uses the dashboard snapshot |
| `readOperationalHistoryViaBackend` + `applyOperationalHistorySessionSnapshot` | History page deleted in redesign phase 5 |
| `features/onboarding/agent-wallet-validation.ts` (whole module) + its test | superseded by backend validation |
| `features/runtime/runtime-sync-presentation.ts` (whole module) + its test | no consumers |
| `features/runtime/bot-status-presentation.ts` (whole module) + its test | no consumers |
| ~475 of ~900 i18n keys in `shared/i18n/messages.ts` | wizard/history/operations leftovers (list: scan of 2026-07-09; no dynamic `t()` keys exist) |
| CSS `shell-skeleton`/`sk-*` classes | markup removed 2026-07-09; broader CSS audit pending (light-theme purge) |
| `types/contracts.ts` unused schemas | not audited individually — whole file dies in task #8 |

### API — routes with no caller (frontend is the only client; worker never calls the API)
| Route | Notes |
|---|---|
| `POST /api/auth/nonce` | only `GET /nonce` is used |
| `POST /api/auth/credentials` | pre-refactor duplicate of onboarding validate |
| `POST /api/auth/verify-operational` | pre-refactor duplicate of onboarding verify (contains credential decrypt) |
| `POST /api/backtest/preview` | superseded by `/api/strategies/your/backtest-preview` |
| `POST /api/builder/approve` | superseded by `/api/onboarding/builder/approve` |
| `GET /api/events` | no caller |
| `GET /api/positions` | no caller — contains credential decrypt; unnecessary attack surface |
| `GET /api/strategies`, `POST /api/strategies/:id/activate`, `:id/pause`, `:id/resume`, `PUT /api/strategies/:id` | `/your/*` variants are the live ones |
| `GET /api/trades` | no caller |
| `POST /api/account/trades`, `POST /api/account/history` | their pages/appliers are dead |
