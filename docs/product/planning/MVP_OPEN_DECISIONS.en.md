# MVP Open Decisions Checklist

## Purpose
Capture the few decisions that should be explicitly closed before the team opens all design and development tasks, reducing avoidable rework and requirement drift.

## Status Summary
- product scope is sufficiently defined to start Sprint 1
- onboarding and presets can start immediately
- dashboard can start with low risk
- current trades and history should have a short design consolidation before full implementation

## 1. Decisions To Close Now

### 1.1 Global bot action
Decision:
- `Pause bot` / `Resume bot` is part of the MVP

Why it matters:
- this action appears as required in dashboard planning and acceptance criteria
- the documentation still needs to reflect that consistently

Impact:
- affects topbar
- affects dashboard header
- affects bot status model
- affects acceptance criteria

Recommended direction:
- keep `Pause bot` / `Resume bot` as a fixed global dashboard action in the MVP
- align handoff, planning, quality, and wireframes with that decision

### 1.2 History filters
Decision:
- History has no filters in the MVP

Why it matters:
- some docs still mention simple filters as optional and that needs to be removed

Impact:
- affects history layout
- affects mobile density
- affects implementation scope

Recommended direction:
- remove History filter references from MVP docs

### 1.3 Current Trades and History layouts
Decision:
- define detailed layouts for `Current Trades` and `History`

Why it matters:
- experience docs have detailed layouts for onboarding, presets, and dashboard
- the same level of detail is missing for these two screens

Impact:
- affects UI hierarchy
- affects responsive behavior
- affects detail panel behavior
- affects destructive action treatment

Recommended direction:
- create two short experience docs with:
  - desktop structure
  - mobile structure
  - required states
  - item density
  - empty state
  - close action behavior

### 1.4 Copy and naming consistency
Decision:
- normalize the final labels and example names across all PT-BR and EN docs

Why it matters:
- there are still inconsistent examples in wireframes, especially preset naming

Impact:
- affects design handoff
- affects i18n keys
- affects QA validation

Recommended direction:
- treat these names as final:
  - `Safer`
  - `Balanced`
  - `More active`

## 2. Technical Decisions To Close Early

### 2.1 Solana wallet integration
Decision:
- choose the wallet provider or adapter for Sprint 1

Why it matters:
- onboarding implementation depends on the connection model

Impact:
- affects connection states
- affects session persistence
- affects error handling

Recommended direction:
- choose one wallet path for the MVP and avoid multi-wallet complexity unless already available

### 2.2 Pacifica credentials contract
Decision:
- confirm the exact credential fields and validation flow

Why it matters:
- docs still allow `secret or equivalent credential`
- dev needs the exact form shape and validation response model

Impact:
- affects onboarding form
- affects validation states
- affects backend/API integration
- affects localized error messages

Recommended direction:
- freeze:
  - required fields
  - validation trigger
  - success payload
  - error payload
  - blocked vs retryable failures

### 2.3 Operational data contract
Decision:
- confirm the data shape for dashboard, open trades, and history

Why it matters:
- product requirements are clear, but data mapping is still implicit

Impact:
- affects frontend state model
- affects mock data
- affects loading and error states
- affects sync between dashboard and trade screens

Recommended direction:
- define a lightweight contract for:
  - account summary
  - bot status
  - active preset
  - open trades
  - closed trades
  - alerts

### 2.4 Update behavior
Decision:
- confirm how data refresh works in the MVP

Why it matters:
- docs define what must be shown, but not how often it should update

Impact:
- affects perceived reliability
- affects dashboard freshness
- affects post-close synchronization

Recommended direction:
- choose one simple approach for MVP:
  - polling
  - manual refresh
  - event-driven updates if already available

## 3. What Can Start Right Now

### Design
- mini visual system
- onboarding desktop and mobile
- onboarding states
- presets screen
- preset cards
- preset review and activation states
- dashboard hierarchy

### Development
- app shell
- routing
- i18n foundation
- shared layout
- onboarding state model
- route guards
- onboarding screen structure
- preset contract consumption
- mock or adapter layer for dashboard data

## 4. Recommended Working Model

### Recommended sequence
1. close the open decisions above in a short product pass
2. start design and development in parallel
3. keep design about one sprint ahead of development
4. avoid opening Sprint 4 implementation before the missing experience docs are consolidated

### Practical rule
- dev should not wait for polished visual design to start Sprint 1
- dev should wait for clear flow, states, and interaction rules before implementing sensitive UI behavior

## 5. Definition Of Ready To Open All Tasks
- bot global action is either confirmed or removed
- history filters are either confirmed or removed
- current trades layout is documented
- history layout is documented
- wallet integration path is chosen
- Pacifica credential form and validation contract are frozen
- operational data contract is defined at least at frontend integration level
- wireframe naming and copy are consistent across docs
