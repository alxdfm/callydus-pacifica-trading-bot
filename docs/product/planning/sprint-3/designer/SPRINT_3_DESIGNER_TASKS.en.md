# Sprint 3: Designer Tasks

## Sprint Objective
Deliver the complete Dashboard at design level, with clear visual hierarchy, fast state reading, and operational focus.

## Scope
- dashboard desktop layout
- dashboard mobile layout
- summary cards
- active preset block
- current trades block
- recent trades block
- alerts strip
- English-first copy base and i18n-ready labels

## Definition of Ready
- MVP scope lock is approved
- MVP handoff pack is available
- dashboard content is fixed as the operational center
- the base language is English and labels must be translation-friendly
- the screen must not expose technical JSON or strategy logic

## Final Sprint Deliverables
- complete desktop dashboard
- complete mobile dashboard
- summary card components
- active preset component
- current trades dashboard block
- recent trades block
- alerts strip
- Sprint 3 minimum handoff

## Task D3.1: Finalize Dashboard visual architecture

### Objective
Define the macro organization of the Dashboard screen for desktop and mobile.

### Priority
P0

### Scope
- operational header
- summary cards
- active preset
- current trades
- recent trades
- alerts
- translation-friendly content areas

### Activities
- validate block order on desktop
- validate block order on mobile
- define main grid of the screen
- ensure the dashboard answers the product's key questions
- adjust balance between main and secondary blocks
- confirm the layout can hold English-first and localized copy

### Deliverables
- final visual structure of the Dashboard

### Dependencies
- Sprint 1 and Sprint 2 outputs

### Done criteria
- the screen has clear hierarchy
- the dashboard feels like an operational center, not an analytics terminal
- the structure tolerates longer translated strings

## Task D3.2: Design Dashboard operational header

### Objective
Define the top block that summarizes global account and bot state.

### Priority
P0

### Scope
- title
- subtitle
- Pacifica status
- bot status
- pause/resume CTA

### Activities
- define header composition
- define visual status badges
- define the main CTA of the screen
- define active and paused visual behavior

### Deliverables
- final operational header

### Dependencies
- D3.1

### Done criteria
- the user quickly understands whether the system is ready and operating
- the header works with English-first and localized labels

## Task D3.3: Design summary cards

### Objective
Define the immediate account-reading cards.

### Priority
P0

### Scope
- current balance
- aggregated PnL
- active trades
- trades closed today

### Activities
- define hierarchy of the 4 cards
- define visual weight for balance and PnL
- define positive and negative variation treatment
- define number formatting and labels
- validate readability on desktop and mobile

### Deliverables
- final summary card set

### Dependencies
- D3.1

### Done criteria
- the cards can be scanned quickly
- PnL is clear without dominating the whole interface
- the cards remain legible with translated labels

## Task D3.4: Design active preset block

### Objective
Define the component that shows which automation is running now.

### Priority
P0

### Scope
- preset name
- risk
- symbol
- timeframe
- long/short
- position size
- secondary actions

### Activities
- organize active preset data
- define risk emphasis
- define enabled/disabled visual state for long and short
- define visuals for `Review preset` and `Change preset`

### Deliverables
- final active preset component

### Dependencies
- D3.1

### Done criteria
- the user quickly understands which strategy is active
- the block supports translated preset labels and helper text

## Task D3.5: Design current trades block in the Dashboard

### Objective
Define the summarized presentation of open trades inside the Dashboard.

### Priority
P0

### Scope
- summarized list
- counter
- close action

### Activities
- design current trades list
- define information density per item
- define trade direction visuals
- define status visuals
- define `Close` button inside the dashboard

### Deliverables
- current trades dashboard block

### Dependencies
- D3.1

### Done criteria
- current trades have visual priority over history
- the main per-trade action is visible
- the block tolerates translated trade labels without density issues

## Task D3.6: Design recent trades block

### Objective
Define the quick recent-history context inside the Dashboard.

### Priority
P1

### Scope
- result
- closing reason
- time

### Activities
- design compact recent trades list
- define positive and negative result visuals
- define compact presentation of closing reason
- validate clear separation between current and recent blocks

### Deliverables
- recent trades block in the dashboard

### Dependencies
- D3.1

### Done criteria
- recent history appears as context, not as the main focus
- the block remains readable in English-first and translated copy

## Task D3.7: Design alerts strip and critical states

### Objective
Define how errors, alerts, and reconciliation appear in the Dashboard.

### Priority
P0

### Scope
- error
- warning
- reconciliation
- operational notice

### Activities
- define alerts strip visuals
- define icons or severity markers
- define visual treatment for critical state
- define visual treatment for informative state

### Deliverables
- final alerts component

### Dependencies
- D3.1

### Done criteria
- problems are visible without polluting the screen
- alert text remains compatible with i18n

## Task D3.8: Validate Dashboard mobile behavior

### Objective
Ensure the dashboard remains useful and legible on small screens.

### Priority
P1

### Scope
- block order
- stacked cards
- current trades
- alerts

### Activities
- review block order on mobile
- adapt cards to a single column
- validate visibility of active preset above the fold
- validate trade close action on mobile
- validate alert readability

### Deliverables
- validated mobile version of the dashboard

### Dependencies
- D3.2
- D3.3
- D3.4
- D3.5
- D3.6
- D3.7

### Done criteria
- the screen remains scannable and operational on mobile
- the mobile layout tolerates longer translated strings

## Task D3.9: Prepare Sprint 3 handoff for Dev

### Objective
Deliver the package needed for faithful Dashboard implementation.

### Priority
P1

### Scope
- components
- states
- hierarchy rules
- responsive behavior
- i18n key guidance for dashboard copy

### Activities
- name dashboard components
- organize critical states
- attach labels and short text
- attach visual priority rules
- document desktop and mobile behavior

### Deliverables
- Sprint 3 handoff package

### Dependencies
- D3.1
- D3.2
- D3.3
- D3.4
- D3.5
- D3.6
- D3.7
- D3.8

### Done criteria
- the development team can implement the dashboard without guessing visual intent
- the development team can implement the dashboard with English-first and translated copy

## Definition of done for the Designer sprint
- desktop and mobile dashboard are finalized
- cards, active preset, trades, and alerts are defined
- visual hierarchy is consistent
- Sprint 3 handoff is ready
