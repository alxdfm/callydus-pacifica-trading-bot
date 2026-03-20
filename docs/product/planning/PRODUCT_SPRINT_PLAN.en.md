# MVP Sprint Plan

## Objective
Organize Designer and Dev work by sprint, focused on concrete deliverables that can be demonstrated at the end of each cycle.

## Assumptions
- each sprint must end with a verifiable deliverable
- the plan prioritizes what improves demo capability earlier
- Design works slightly ahead of Dev, but without excessive lead time

## Sprint Structure
- Sprint 1: Foundations + Onboarding
- Sprint 2: Presets + Activation
- Sprint 3: Dashboard
- Sprint 4: Current Trades + History
- Sprint 5: Integration + Polish

## Sprint 1: Foundations + Onboarding

### Objective
Create the visual and technical base of the MVP and deliver a functional onboarding flow.

### Sprint Deliverables
- initial application shell
- main navigation
- onboarding desktop and mobile
- Solana wallet connection
- Pacifica credential capture and validation
- blocked product access without onboarding

### Designer Tasks
- define MVP mini visual system
- finalize onboarding desktop and mobile layout
- define wallet states
- define Pacifica credential states
- define onboarding error and success messages

### Dev Tasks
- implement base application structure
- implement shared layout with topbar and navigation
- implement onboarding screen
- integrate Solana wallet
- implement Pacifica credentials form
- validate credentials
- block dashboard access until onboarding completion

### Done definition
- user completes onboarding and only then accesses the product
- flow works on desktop and mobile
- main errors are shown correctly

## Sprint 2: Presets + Activation

### Objective
Allow preset selection, review, and activation.

### Sprint Deliverables
- functional presets screen
- final `Conservative`, `Medium`, and `Neutral` cards
- short preset comparison
- selected preset review panel
- preset activation

### Designer Tasks
- finalize the 3 preset cards
- finalize the comparison panel
- finalize the preset review panel
- define activation CTA and states
- validate mobile presets screen

### Dev Tasks
- implement presets screen
- render the 3 final presets
- implement preset selection
- implement editing only for allowed fields
- assemble and persist final activation payload
- reflect active preset in application state

### Done definition
- user selects and activates a preset without touching technical details
- active preset is persisted
- the flow is demonstrable end to end

## Sprint 3: Dashboard

### Objective
Deliver the operational center of the MVP with key account and bot data.

### Sprint Deliverables
- functional dashboard
- balance, PnL, and counters cards
- active preset block
- current trades on dashboard
- recent trades on dashboard
- main alerts

### Designer Tasks
- finalize dashboard desktop layout
- finalize dashboard mobile layout
- define summary card hierarchy
- define active preset block visuals
- define alerts strip visuals

### Dev Tasks
- implement dashboard structure
- integrate account balance
- integrate aggregated PnL
- display active preset
- display overall bot status
- list current and recent trades on dashboard
- implement global pause/resume bot action

### Done definition
- dashboard responds to current account and bot state
- user understands system state within a few seconds
- screen is demonstrable as the operational center

## Sprint 4: Current Trades + History

### Objective
Deliver operational monitoring and simple historical review.

### Sprint Deliverables
- current trades screen
- manual trade close through `market order`
- history screen
- closing reason identification

### Designer Tasks
- finalize current trades desktop and mobile screens
- define visual states by direction and status
- define safe close action
- finalize history desktop and mobile screens
- define positive and negative result visuals

### Dev Tasks
- implement current trades screen
- integrate open trades list
- implement manual close action
- propagate update to dashboard
- implement history screen
- integrate closed trades
- display closing reason and platform-trade identification

### Done definition
- user can monitor open trades
- user can manually close a trade
- history records the close and shows the result

## Sprint 5: Integration + Polish

### Objective
Close the full MVP flow and remove demo friction.

### Sprint Deliverables
- full flow from onboarding to history
- empty, loading, and error states
- visual and functional consistency across screens
- MVP ready for demo

### Designer Tasks
- review visual consistency across all screens
- define and review empty states
- define and review loading states
- define and review error states
- review minimum responsiveness of the full flow

### Dev Tasks
- integrate navigation across all screens
- implement empty, loading, and error states
- review guards and improper blocks
- validate consistency between active preset, bot state, and screens
- fix bugs and friction points in the main flow

### Done definition
- main flow works without improper interruptions
- MVP is ready for controlled demo
- critical states are covered

## Summary by Role

### Designer
- Sprint 1: foundations + onboarding
- Sprint 2: presets
- Sprint 3: dashboard
- Sprint 4: current trades + history
- Sprint 5: system-wide review and final handoff

### Dev
- Sprint 1: technical base + onboarding
- Sprint 2: presets + activation
- Sprint 3: dashboard
- Sprint 4: current trades + history
- Sprint 5: integration and fixes

## Final Plan Criterion
The plan is well structured when every sprint ends with something that can be:
- reviewed by product
- validated by QA
- demonstrated to stakeholders
