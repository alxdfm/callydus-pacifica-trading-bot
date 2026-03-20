# Sprint 4: Dev Tasks

## Sprint Objective
Deliver functional Current Trades and History screens, with per-trade manual intervention, dashboard synchronization, and clear reading of closed results.

## Scope
- current trades route
- open trades list
- manual close action via `market order`
- state update after close
- history route
- closed trades list
- close reason
- platform trade identification
- loading, empty, and error states

## Final Sprint Deliverables
- functional Current Trades screen
- functional open trades list
- functional manual close action
- dashboard update after close
- functional History screen
- functional closed trades list
- close reason display
- trade origin display
- minimum operational state handling for both screens

## Task V4.1: Implement the base structure of the Current Trades screen

### Objective
Build the route and main structure of the Current Trades screen using the shared application layout.

### Scope
- screen route
- header
- short summary, if planned
- main list
- base screen states

### Activities
- create the Current Trades route
- implement the main visual structure of the screen
- align the blocks with the hierarchy defined by product and design
- ensure base page responsiveness
- prepare integration points for the list and per-trade action

### Deliverables
- functional structure of the Current Trades screen

### Dependencies
- outputs from Sprints 1, 2, and 3

### Done Criteria
- the screen exists as a functional and responsive route
- the trade list can be integrated without structural rework

## Task V4.2: Integrate the open trades list

### Objective
Display the currently open trades with the fields required for monitoring and intervention.

### Scope
- symbol
- direction
- entry price
- current price
- PnL
- open time
- trade origin

### Activities
- consume the open trades source
- map the required fields to the interface
- render the list with an ordering coherent for operations
- highlight direction, PnL, and trade origin
- handle missing data, loading, and error states

### Deliverables
- functional open trades list

### Dependencies
- V4.1

### Done Criteria
- the user can understand which trades are open and their basic state

## Task V4.3: Implement per-trade manual close action

### Objective
Allow the user to close a specific trade without pausing the entire bot.

### Scope
- `Close` CTA
- action confirmation
- market order submission
- success and error handling

### Activities
- add the `Close` action to each eligible trade
- implement a confirmation step before submission
- integrate the close call via `market order`
- reflect processing state during the request
- handle operational failure and display minimum user feedback

### Deliverables
- functional per-trade manual close flow

### Dependencies
- V4.2

### Done Criteria
- the user can close an individual trade
- the action does not interfere with the global bot state beyond the selected trade

## Task V4.4: Synchronize updates after manual close

### Objective
Ensure consistency across Current Trades, Dashboard, and History after closing a trade.

### Scope
- removal from open trades list
- counter updates
- dashboard current trades block update
- history entry

### Activities
- remove or update the trade in the list after successful close
- update dependent counters and summaries
- propagate the new state to the dashboard
- ensure the trade appears in history with the correct reason
- validate synchronization without requiring manual refresh

### Deliverables
- functional post-close synchronization

### Dependencies
- V4.3
- outputs from Sprint 3

### Done Criteria
- the application state remains consistent after the manual action

## Task V4.5: Implement the base structure of the History screen

### Objective
Build the route and main structure of the History screen.

### Scope
- screen route
- header
- closed trades list
- base screen states

### Activities
- create the History route
- implement the main screen structure
- align blocks with product and design
- ensure base page responsiveness
- prepare integration points for the list and minimal filters, if any

### Deliverables
- functional structure of the History screen

### Dependencies
- outputs from Sprints 1 and 3

### Done Criteria
- the screen exists as a functional and responsive route

## Task V4.6: Integrate the closed trades list

### Objective
Display closed trades with the fields required for operational review.

### Scope
- symbol
- direction
- result
- close reason
- open time
- close time
- trade origin

### Activities
- consume the closed trades source
- map and render the required fields
- highlight positive and negative result
- display the close reason with consistent terminology
- handle empty, loading, and error states

### Deliverables
- functional closed trades list

### Dependencies
- V4.5

### Done Criteria
- the user can quickly review what happened in closed trades

## Task V4.7: Display trade origin and close reason

### Objective
Provide enough context for the user to distinguish platform trades and understand why each trade was closed.

### Scope
- trade created by the platform
- trade not created by the platform
- closed by target
- closed by stop
- closed manually
- execution error, when applicable

### Activities
- implement a visual or textual trade-origin marker
- implement standardized display of the close reason
- align labels with product and QA contract
- validate display of these fields in dashboard and history when needed
- ensure consistency across both reading contexts

### Deliverables
- trade origin and close reason displayed consistently

### Dependencies
- V4.2
- V4.6

### Done Criteria
- the user understands whether the trade came from the platform and how it ended

## Task V4.8: Implement loading, empty, and error states for Sprint 4 screens

### Objective
Avoid ambiguity when the screens do not yet have data or face failures.

### Scope
- current trades
- history
- manual close action

### Activities
- implement loading for the open trades list
- implement loading for the history list
- implement empty state for no open trades
- implement empty state for history with no records
- implement load error and manual action error states

### Deliverables
- minimum state handling for Sprint 4 screens

### Dependencies
- V4.2
- V4.3
- V4.6
- V4.7

### Done Criteria
- no screen looks broken during loading, no data, or failure

## Task V4.9: Validate the full Sprint 4 flow

### Objective
Ensure that the user can track open trades, close them manually when needed, and review the result in history.

### Scope
- current trades loading
- manual close
- dashboard synchronization
- history visualization
- cross-screen navigation

### Activities
- validate the Current Trades opening flow
- validate the close flow with confirmation
- validate reflection of the change in the dashboard
- validate the trade appearance in history
- validate navigation between Dashboard, Current Trades, and History

### Deliverables
- validated end-to-end Sprint 4 flow

### Dependencies
- V4.4
- V4.8

### Done Criteria
- the main sprint flow works without significant inconsistencies
- the sprint can be demonstrated as real monitoring and intervention capability
