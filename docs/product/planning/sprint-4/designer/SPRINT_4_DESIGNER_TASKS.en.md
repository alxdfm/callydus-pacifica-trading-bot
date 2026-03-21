# Sprint 4: Designer Tasks

## Sprint Objective
Deliver the Current Trades and History screens at design level, with focus on safe manual intervention, fast state scanning, and clear review of operational results.

## Scope
- current trades desktop screen
- current trades mobile screen
- visual states by direction and status
- manual close action
- history desktop screen
- history mobile screen
- result and close reason readability
- platform trade identification
- English-first copy base and i18n-ready labels

## Definition of Ready
- MVP scope lock is approved
- MVP handoff pack is available
- dashboard and presets are already in place
- the base language is English and labels must be translation-friendly
- no task should expose technical JSON or strategy logic

## Final Sprint Deliverables
- final Current Trades desktop screen
- final Current Trades mobile screen
- open trade row/card component
- manual close visual flow
- final History desktop screen
- final History mobile screen
- closed trade row/card component
- visual rules for state and variation
- minimum Sprint 4 handoff

## Task D4.1: Lock the visual architecture of the Current Trades screen

### Objective
Define the macro organization of the Current Trades screen for desktop and mobile, prioritizing per-trade intervention without cluttering the reading flow.

### Priority
P0

### Scope
- screen header
- operational summary
- main open trades list
- minimal filters or segmentations, if needed
- per-trade action area
- translation-friendly content areas

### Activities
- define the order of the screen blocks
- define the relationship between header, summary, and list
- validate whether the screen answers "which trade should I act on now?"
- adjust information density so it does not compete with the dashboard
- define how the structure adapts to mobile
- confirm the layout tolerates English-first and localized copy

### Deliverables
- final visual structure of the Current Trades screen

### Dependencies
- outputs from Sprints 1, 2, and 3

### Done Criteria
- the screen has clear operational focus
- the per-trade action is visible as the main priority
- the layout supports longer translated strings

## Task D4.2: Design the base open trade item

### Objective
Define the main component that represents an open trade in the list.

### Priority
P0

### Scope
- symbol
- `long` or `short` direction
- entry price
- current price
- PnL
- open time
- platform trade identification
- close action

### Activities
- define the internal hierarchy of the item
- visually highlight trade direction
- define visual treatment for positive, negative, and neutral PnL
- define the priority of required fields
- validate readability in dense lists and mobile cards

### Deliverables
- final open trade component

### Dependencies
- D4.1

### Done Criteria
- each item can be scanned quickly
- the user understands the trade state without opening details
- the item works with translated labels and helper text

## Task D4.3: Define the visual system for status and direction in open trades

### Objective
Create a consistent visual language to differentiate direction, operational state, and trade origin.

### Priority
P0

### Scope
- `long`
- `short`
- trade created by the platform
- trade not created by the platform
- execution or alert states visible in the list

### Activities
- define direction markers
- define trade origin markers
- define visual treatment for normal and warning states
- validate minimum contrast accessibility and visual distinction
- align the system with dashboard components

### Deliverables
- visual rules for status and direction in open trades

### Dependencies
- D4.2

### Done Criteria
- the user distinguishes direction and origin in a few seconds
- the screen does not rely only on text to communicate state
- the state labels are compatible with i18n

## Task D4.4: Design the manual close visual flow

### Objective
Define a clear and safe manual close action, avoiding accidental clicks.

### Priority
P0

### Scope
- `Close` button
- confirmation
- processing state
- success state
- error state

### Activities
- define the visual of the close CTA
- define the confirmation step before the market order
- define risk messaging and the expected effect of the action
- define visual treatment for loading, success, and failure
- validate the action on desktop and mobile

### Deliverables
- final manual close visual flow

### Dependencies
- D4.2

### Done Criteria
- the manual close action feels safe and intentional
- the user understands that the action does not pause the whole bot
- the confirmation and risk copy can be translated without redesign

## Task D4.5: Lock the visual architecture of the History screen

### Objective
Define the macro organization of the History screen for quick result reading and review of closures.

### Priority
P0

### Scope
- screen header
- optional short summary
- closed trades list
- minimal filters, if planned
- empty and error states

### Activities
- define the main screen composition
- validate visual separation between history and current trades
- define information depth per item
- adjust the screen so it does not look like a complex analytics report
- adapt the structure for mobile

### Deliverables
- final visual structure of the History screen

### Dependencies
- outputs from Sprint 3

### Done Criteria
- the screen quickly answers "what happened?"
- the history has clear reading without excessive detail
- the structure tolerates localized copy and longer labels

## Task D4.6: Design the base closed trade item

### Objective
Define the main component that represents a closed trade in history.

### Priority
P0

### Scope
- symbol
- direction
- final result
- close reason
- open and close time
- platform trade identification

### Activities
- define the internal hierarchy of the history item
- highlight positive and negative result
- define how the close reason is displayed
- validate readability of timestamps
- adjust component density for long lists

### Deliverables
- final closed trade component

### Dependencies
- D4.5

### Done Criteria
- the item shows result and reason with immediate clarity
- the history remains compact to read
- the item works with translated labels and reason text

## Task D4.7: Define the visual system for results and close reasons

### Objective
Standardize how history communicates profit/loss and exit reason.

### Priority
P0

### Scope
- positive
- negative
- closed by target
- closed by stop
- closed manually
- execution error or failure, when applicable

### Activities
- define visual markers for result
- define the visual language for close reasons
- align terminology with product acceptance criteria
- validate contrast and quick comprehension of states
- ensure consistency with dashboard and current trades

### Deliverables
- visual rules for result and close reason

### Dependencies
- D4.6

### Done Criteria
- close reasons are distinguishable from each other
- profit and loss are perceived immediately
- the reason labels are compatible with English-first and translated copy

## Task D4.8: Validate mobile behavior for Sprint 4 screens

### Objective
Ensure that Current Trades and History remain operationally useful on small screens.

### Priority
P1

### Scope
- block order
- item readability
- close CTA
- empty states
- manual action confirmation

### Activities
- review current trades adaptation into cards or compact rows
- review history adaptation into vertical reading
- validate visibility of the main CTA on mobile
- validate close confirmation without excessive friction
- validate data density on narrow screens

### Deliverables
- validated mobile versions of the Current Trades and History screens

### Dependencies
- D4.3
- D4.4
- D4.7

### Done Criteria
- both screens remain usable and scannable on mobile
- mobile layout tolerates longer translated strings

## Task D4.9: Prepare the Sprint 4 handoff for Dev

### Objective
Deliver the design package required for faithful implementation of the sprint screens and interactions.

### Priority
P1

### Scope
- components
- states
- visual rules
- close interactions
- responsive behavior
- i18n key guidance for trade and history copy

### Activities
- organize the final sprint components
- document states for each item and screen
- document action and confirmation rules for manual close
- document responsiveness and mobile adaptations
- validate consistency across screens, dashboard, and navigation

### Deliverables
- consolidated Sprint 4 handoff

### Dependencies
- D4.1
- D4.2
- D4.3
- D4.4
- D4.5
- D4.6
- D4.7
- D4.8

### Done Criteria
- Dev can implement the screens without significant ambiguity
- the key states and the critical close interaction are documented
- the handoff supports English-first and localized labels
