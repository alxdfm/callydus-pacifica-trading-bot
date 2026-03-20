# MVP Design Tasks and Deliverables

## Objective
Detail the MVP Design scope into concrete deliverables, actionable tasks, and a definition of done for development handoff.

## Design Scope
Design work covers:
- onboarding
- dashboard
- presets
- current trades
- history
- cross-screen visual consistency
- empty, loading, and error states
- mobile behavior

## Recommended Order
1. Visual foundations
2. Onboarding
3. Presets
4. Dashboard
5. Current Trades
6. History
7. Consolidation and handoff

## Block 1: Visual Foundations

### Deliverables
- MVP visual direction
- basic UI tokens
- base component definitions

### Tasks
- define main interface palette
- define typography scale
- define base spacing
- define primary, secondary, and destructive button patterns
- define card pattern
- define status badge pattern
- define color patterns for risk, error, success, active, and paused

### Done criteria
- a reusable mini visual kit exists
- color and typography decisions support desktop and mobile
- destructive actions and critical states are clearly distinguishable

## Block 2: Onboarding

### Deliverables
- final onboarding desktop layout
- final onboarding mobile layout
- wallet states
- Pacifica credential states
- error and success messages

### Tasks
- design onboarding header with 2-step progress
- design wallet connection card
- design Pacifica API keys card
- design account status panel
- design final continue button
- design empty, connecting, validating, success, and error states
- define short copy for common failure cases

### Done criteria
- the onboarding flow can be understood just by looking at the screen
- wallet and credential states are complete
- desktop and mobile versions exist

## Block 3: Presets

### Deliverables
- final presets desktop screen
- final presets mobile screen
- final 3 preset cards
- short comparison panel
- selected preset review panel

### Tasks
- design final `Safer` preset card
- design final `Balanced` preset card
- design final `More active` preset card
- define risk and frequency visuals
- define summary comparison between presets
- design panel with MVP editable fields
- define preset activation block
- define selected preset visual state

### Done criteria
- differences between presets are visible without external text
- the user understands risk before activation
- editable fields are clear and minimal

## Block 4: Dashboard

### Deliverables
- final desktop dashboard layout
- final mobile dashboard layout
- summary cards
- active preset card
- current trades block
- recent trades block
- alerts block

### Tasks
- design operational header
- design balance, PnL, and counters cards
- design active preset card
- design current trades list inside dashboard
- design recent trades list
- design alerts strip
- define visual hierarchy for the screen

### Done criteria
- the dashboard visually reflects system state
- current trades have clear priority over history
- bot state and active preset appear above the fold

## Block 5: Current Trades

### Deliverables
- final current trades desktop screen
- final current trades mobile screen
- trade list with detail
- manual close visual action

### Tasks
- design current trades list/table
- define visual differentiation between `long` and `short`
- define trade status badges
- design destructive `Close` action
- design selected or expanded trade detail
- define empty state

### Done criteria
- the close action is visible and safe
- trade direction and status are quickly recognizable
- the screen is not confused with history

## Block 6: History

### Deliverables
- final history desktop screen
- final history mobile screen
- standard closed trade item
- result visual treatment

### Tasks
- design chronological history list
- define closed trade item
- define positive and negative result treatment
- define closing reason presentation
- define simple filters if applicable
- define empty state

### Done criteria
- result and closing reason are readable quickly
- the screen is visually more discreet than current trades
- history is easy to scan

## Block 7: Consolidation and Handoff

### Deliverables
- final screen package
- reusable component package
- empty, loading, and error states
- responsive behavior specification
- development handoff

### Tasks
- review cross-screen visual consistency
- review consistency of labels and CTAs
- define main empty states
- define main loading states
- define main error states
- review full flow from onboarding to dashboard
- organize handoff with component naming and usage notes

### Done criteria
- dev can implement without guessing visual behavior
- main MVP states are covered
- minimum responsiveness is documented

## Expected Final Designer Deliverables
- 1 base visual kit
- 1 complete onboarding flow
- 1 complete presets screen
- 1 complete dashboard
- 1 current trades screen
- 1 history screen
- 1 empty/loading/error state package
- 1 final development handoff

## Definition of Done for Handoff
Design work is ready for development when:
- desktop and mobile versions of the main screens exist
- repeated components are standardized
- critical states are designed
- main actions are unambiguous
- visual hierarchy is consistent across the MVP
