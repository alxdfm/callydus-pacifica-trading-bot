# MVP Epics and Tasks

## Objective
Turn the current product documentation into an execution plan oriented around deliverables, split between Designer work and Development work.

## Assumption
The scope below covers only the MVP already defined in product:
- mandatory onboarding
- operational dashboard
- presets screen
- current trades
- history
- bot activation with fixed presets

## Recommended Execution Order
1. Onboarding
2. Presets
3. Dashboard
4. Current Trades
5. History
6. MVP integration and polish

## Epic 1: Onboarding

### Objective
Allow the user to connect a Solana wallet and Pacifica credentials before using the product.

### Deliverables
- functional onboarding screen
- Solana wallet connection
- Pacifica credentials form
- credential validation
- blocked Dashboard access until valid onboarding

### Designer Tasks
- define final onboarding screen layout
- define wallet visual states: disconnected, connecting, connected, error
- define credential visual states: empty, validating, valid, invalid
- define short error and success messages
- define mobile behavior for the screen

### Dev Tasks
- implement onboarding screen
- integrate Solana wallet connection
- implement Pacifica credentials form
- validate credentials in the backend or appropriate layer
- block navigation to the main app while onboarding is incomplete
- persist minimum onboarding session state

## Epic 2: Preset Selection and Activation

### Objective
Allow the user to choose a preset, review editable fields, and activate the bot.

### Deliverables
- functional presets screen
- 3 preset cards
- short comparison panel
- selected preset review panel
- preset activation

### Designer Tasks
- design final `Conservative`, `Medium`, and `Neutral` cards
- define risk and frequency visual treatment
- define short comparison panel
- define review panel with editable fields
- define CTA and activation states

### Dev Tasks
- implement presets screen
- render the 3 presets from the final catalog
- implement preset selection
- implement editing only for allowed fields
- implement final bot activation payload
- persist active preset

## Epic 3: Operational Dashboard

### Objective
Provide immediate visibility into account state, bot state, and ongoing trades.

### Deliverables
- functional dashboard
- balance and PnL cards
- active preset block
- current trades list
- recent trades list
- alerts strip

### Designer Tasks
- design final desktop dashboard layout
- design mobile version
- define summary card hierarchy
- define active preset visual component
- define visual treatment for alerts and critical states

### Dev Tasks
- implement dashboard structure
- integrate account balance
- integrate aggregated PnL
- display active preset
- list current trades
- list recent trades
- implement global pause/resume bot action

## Epic 4: Current Trades

### Objective
Allow monitoring and manual closing of open trades without stopping the bot.

### Deliverables
- current trades screen
- open trade list
- trade detail or selection
- close action through `market order`

### Designer Tasks
- design current trades list
- define visual states by direction and status
- define close button with low accidental-click risk
- define trade detail panel or expansion

### Dev Tasks
- implement current trades screen
- integrate open trade list
- implement trade status updates
- implement manual close through `market order`
- update dashboard after close

## Epic 5: History

### Objective
Allow simple review of closed trade results.

### Deliverables
- history screen
- chronological closed trades list
- closing reason
- platform-trade identification

### Designer Tasks
- design history list
- define compact item format
- define positive and negative result visual treatment
- define simple filters if included

### Dev Tasks
- implement history screen
- integrate closed trade data
- display closing reason
- display platform trade identification

## Epic 6: MVP Integration and Readiness

### Objective
Tie together the main flows and guarantee minimum consistency for demo and early usage.

### Deliverables
- complete flow from onboarding to dashboard
- complete flow from preset selection to activation
- synchronization between dashboard, current trades, and history
- handling of main error states

### Designer Tasks
- review visual consistency across screens
- review empty, loading, and error states
- review minimum MVP responsiveness

### Dev Tasks
- integrate navigation between screens
- implement onboarding guards
- implement loading, error, and empty states
- validate consistency between active preset, bot state, and displayed data
- fix broken flows for demo readiness

## Recommended Delivery Slices

### Delivery 1
- onboarding
- navigation structure
- static presets screen

### Delivery 2
- preset activation
- dashboard with connected data
- active preset in dashboard

### Delivery 3
- current trades with manual close
- history
- polish of the full flow

## Demo-Ready Criterion
- user completes onboarding
- user selects and activates a preset
- dashboard shows account and bot state
- user sees open trades
- user closes a trade manually
- history records the close
