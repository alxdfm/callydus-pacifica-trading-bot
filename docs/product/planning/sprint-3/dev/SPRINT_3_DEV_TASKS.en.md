# Sprint 3: Dev Tasks

## Sprint Objective
Deliver the functional Dashboard as the operational center of the MVP, reflecting account state, bot state, active preset, and main operational context.

## Scope
- dashboard route
- summary cards
- active preset
- current trades in dashboard
- recent trades in dashboard
- main alerts
- global pause/resume bot action

## Final Sprint Deliverables
- functional dashboard
- balance, PnL, and counter cards
- active preset block
- current trades block
- recent trades block
- alerts block
- global bot action

## Task V3.1: Implement the base Dashboard structure

### Objective
Build the main dashboard page using the shared app layout.

### Scope
- header
- summary cards
- active preset
- current trades
- recent trades
- alerts

### Activities
- create dashboard route
- implement the main visual structure of the screen
- organize blocks according to product hierarchy
- ensure basic dashboard responsiveness

### Deliverables
- functional dashboard structure

### Dependencies
- Sprint 1 and Sprint 2 outputs

### Done criteria
- the dashboard exists as a functional responsive screen

## Task V3.2: Integrate balance and aggregated PnL

### Objective
Display basic account financial reading in the dashboard.

### Scope
- current balance
- aggregated PnL

### Activities
- integrate account balance source
- integrate aggregated PnL source
- render values in the correct cards
- handle no-data, loading, and error states

### Deliverables
- functional balance card
- functional PnL card

### Dependencies
- V3.1

### Done criteria
- balance and PnL are displayed consistently with minimum state handling

## Task V3.3: Integrate operational counters

### Objective
Display quick operational indicators in the dashboard.

### Scope
- active trades
- trades closed today

### Activities
- integrate active trade count
- integrate trades closed today count
- render counters in the cards
- handle empty states and missing data

### Deliverables
- operational counter cards

### Dependencies
- V3.1

### Done criteria
- counters respond to current operation state

## Task V3.4: Display active preset and overall bot status

### Objective
Make visible in the dashboard which preset is running and what the bot state is.

### Scope
- active preset
- risk
- symbol
- timeframe
- long/short
- position size
- bot status

### Activities
- consume active preset persisted in Sprint 2
- render active preset information
- render overall bot status
- wire:
  - `Review preset`
  - `Change preset`
  if they are within sprint navigation scope

### Deliverables
- functional active preset block
- visible overall bot status

### Dependencies
- V3.1
- Sprint 2 outputs

### Done criteria
- the user quickly understands which automation is active

## Task V3.5: Render current trades in the dashboard

### Objective
Show open trades directly in the dashboard with operational priority.

### Scope
- summarized list
- direction
- entry
- current price
- PnL
- status
- close action

### Activities
- integrate summarized open trade list
- render main fields of each item
- visually highlight direction and status
- implement `Close` button in the dashboard context, if already supported
- handle empty and loading states

### Deliverables
- functional current trades block in the dashboard

### Dependencies
- V3.1

### Done criteria
- current trades are visible and prioritized
- the main per-trade action is accessible when available

## Task V3.6: Render recent trades in the dashboard

### Objective
Show quick recent operation context without turning the dashboard into a history screen.

### Scope
- result
- closing reason
- time

### Activities
- integrate short recent trades list
- render summarized result
- render closing reason
- render time
- handle empty and loading states

### Deliverables
- functional recent trades block

### Dependencies
- V3.1

### Done criteria
- recent history appears as support, not as the main focus

## Task V3.7: Implement main alerts and global bot action

### Objective
Provide global control and visibility for main issues directly in the dashboard.

### Scope
- alerts
- reconciliation
- pause/resume action

### Activities
- render main operational alerts
- render reconciliation state when present
- implement global pause or resume bot action
- reflect bot state changes in the dashboard

### Deliverables
- functional alerts block
- functional global bot action

### Dependencies
- V3.1
- V3.4

### Done criteria
- the user sees main alerts
- the user can pause or resume the bot from the dashboard

## Task V3.8: Implement Dashboard loading, empty, and error states

### Objective
Avoid ambiguity when dashboard blocks do not yet have data or are failing.

### Scope
- summary
- active preset
- current trades
- recent trades
- alerts

### Activities
- implement block loading states
- implement empty states for no trades
- implement error state for account data
- implement error state for operational data

### Deliverables
- minimum dashboard state handling

### Dependencies
- V3.2
- V3.3
- V3.4
- V3.5
- V3.6
- V3.7

### Done criteria
- the dashboard does not feel broken during loading or failure

## Task V3.9: Validate the complete Sprint 3 flow

### Objective
Ensure the dashboard works end to end as the operational center.

### Scope
- loading
- data display
- main interaction
- consistency with active preset

### Activities
- validate access to dashboard after onboarding
- validate display of balance and PnL
- validate active preset
- validate current and recent trades
- validate alerts
- validate bot pause/resume
- fix obvious inconsistencies

### Deliverables
- stable Sprint 3 build for internal review

### Dependencies
- V3.1
- V3.2
- V3.3
- V3.4
- V3.5
- V3.6
- V3.7
- V3.8

### Done criteria
- the dashboard is demonstrable as the operational center of the MVP
- the main blocks work consistently

## Definition of done for the Dev sprint
- dashboard is functional on desktop and mobile
- balance, PnL, and counters appear correctly
- active preset and bot status are displayed
- current and recent trades appear consistently
- alerts and global bot action are operational
