# MVP Development Tasks and Deliverables

## Objective
Detail the MVP Development scope into concrete deliverables, actionable tasks, and a definition of done for functional validation.

## Development Scope
Development work covers:
- onboarding
- main navigation
- presets
- dashboard
- current trades
- history
- loading, empty, and error states
- integration between screens and flows

## Recommended Order
1. Frontend technical foundations
2. Onboarding
3. Presets
4. Dashboard
5. Current Trades
6. History
7. MVP integration and readiness

## Block 1: Frontend Technical Foundations

### Deliverables
- base web app structure
- main routing
- shared layout shell
- initial state and service layer

### Tasks
- define base page and layout structure
- implement application shell with main navigation
- implement shared topbar
- implement desktop sidebar and mobile navigation
- define Pacifica data consumption pattern
- define global bot state handling pattern
- prepare reusable base components

### Done criteria
- the application navigates between main screens
- there is one shared layout structure
- base components can be reused across pages

## Block 2: Onboarding

### Deliverables
- functional onboarding flow
- Solana wallet connection
- Pacifica credential capture
- credential validation
- blocked access to the main app

### Tasks
- implement onboarding screen
- integrate Solana wallet connection
- implement Pacifica credentials form
- validate credentials with success and error feedback
- implement onboarding progress state
- block navigation to the Dashboard until onboarding is complete
- persist minimum session state

### Done criteria
- the user reaches the main app only after valid onboarding
- wallet and credential states behave correctly
- errors block progress and are shown properly

## Block 3: Presets

### Deliverables
- functional presets screen
- rendered catalog with 3 presets
- preset selection
- editable field review
- preset activation

### Tasks
- implement rendering of the 3 presets
- implement preset selection state
- implement short comparison panel
- implement selected preset review panel
- implement editing of allowed fields:
  - `symbol`
  - `position size`
  - `long`
  - `short`
- assemble final activation payload
- persist active preset and edited parameters

### Done criteria
- the user can select a preset
- the user can review editable fields
- the user can activate a preset without touching technical logic

## Block 4: Dashboard

### Deliverables
- functional dashboard with account data
- summary cards
- active preset block
- current trades block
- recent trades block
- alerts block

### Tasks
- implement dashboard operational header
- integrate account balance
- integrate aggregated PnL
- integrate active trade count
- display active preset
- display bot status
- render current trades on the dashboard
- render recent trades
- render operational alerts
- implement pause or resume bot action

### Done criteria
- the dashboard reflects current account and bot state
- the main blocks load correctly
- global actions stay accessible and consistent

## Block 5: Current Trades

### Deliverables
- functional current trades screen
- open trade list
- trade detail or selection
- manual close action

### Tasks
- implement dedicated current trades screen
- integrate open trade list
- display direction, symbol, entry, current price, PnL, and status
- implement selected trade highlight
- implement `Close` action through `market order`
- update local state after close
- reflect updates in the dashboard

### Done criteria
- the trade list reflects current product state
- manual close works without stopping the bot
- changes appear on related screens

## Block 6: History

### Deliverables
- functional history screen
- closed trade list
- closing reason
- platform trade identification

### Tasks
- implement history screen
- integrate closed trade data
- display entry, exit, result, and closing reason
- display platform-generated trade identification
- implement simple chronological reading
- implement simple filters if included in scope

### Done criteria
- history shows enough data for simple review
- closing reasons appear correctly
- the screen remains functional on desktop and mobile

## Block 7: MVP Integration and Readiness

### Deliverables
- complete flow between onboarding, presets, dashboard, trades, and history
- navigation guards
- empty, loading, and error states
- cross-screen synchronization
- MVP ready for demo

### Tasks
- integrate navigation across all screens
- implement onboarding guards
- implement main empty states
- implement main loading states
- implement main error states
- ensure consistency between active preset, bot state, and displayed data
- review full preset activation flow
- review full manual trade close flow
- fix friction points for demo readiness

### Done criteria
- the main flow works without improper blocking
- error and loading states are handled
- the application is ready for controlled demo use

## Expected Final Dev Deliverables
- 1 navigable web app
- 1 complete onboarding flow
- 1 complete preset selection and activation flow
- 1 operational dashboard
- 1 current trades screen with manual close
- 1 history screen
- 1 minimum empty/loading/error state package
- 1 integrated MVP ready for demo

## Definition of Done for Validation
Development work is ready for validation when:
- onboarding blocks improper access
- presets can be selected and activated
- dashboard reflects account and bot state
- current trades can be monitored and closed
- history shows operation results
- screen-to-screen navigation is consistent
