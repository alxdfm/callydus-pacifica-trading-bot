# Sprint 1: Dev Tasks

## Sprint Objective
Deliver the technical foundation of the application and the functional onboarding flow, blocking product access until wallet and Pacifica credentials are valid.

## Scope
- initial app shell
- main navigation
- shared topbar
- functional onboarding
- Solana wallet integration
- Pacifica credential capture and validation
- dashboard access guard
- i18n foundation with English default locale

## Definition of Ready
- MVP scope lock is approved
- MVP handoff pack is available
- onboarding behavior is clear on wallet, credentials, and guards
- the first locale is English and translation keys are expected from day one
- no task should introduce editable strategy logic outside the locked scope

## Final Sprint Deliverables
- navigable web app with base layout
- functional onboarding flow
- Solana wallet integration
- Pacifica credentials form with validation
- blocked product access until valid setup

## Task V1.1: Structure the base application shell

### Objective
Create the technical foundation that will support MVP screens.

### Priority
P0

### Scope
- page structure
- shared layout
- main routing
- main route placeholders
- i18n provider and message loading skeleton

### Activities
- define frontend directory structure
- define shared app layout
- implement shared topbar
- implement desktop side navigation
- implement mobile navigation
- create routes for:
  - onboarding
  - dashboard
  - presets
  - current trades
  - history
- ensure the app starts in a coherent flow
- set English as the default UI locale
- wire the translation mechanism so labels are not hard-coded in screen components

### Deliverables
- functional app shell
- main routes created
- reusable base layout
- i18n-ready application shell

### Dependencies
- none

### Done criteria
- user can navigate through the basic structure
- main screens exist at least as placeholders
- shared layout works on desktop and mobile
- the shell can render English-first labels and support localized strings

## Task V1.2: Implement minimum global application state

### Objective
Create the minimum state layer needed for Sprint 1.

### Priority
P0

### Scope
- onboarding state
- wallet state
- credentials state
- product lock/unlock state
- active locale state

### Activities
- define onboarding state model
- define wallet state model
- define credentials state model
- define general app status model
- define locale model with English as the default
- implement minimum session persistence
- expose state readers for route guards

### Deliverables
- minimum global state layer
- basic session persistence
- locale-aware app state

### Dependencies
- V1.1

### Done criteria
- the state can be consumed between onboarding and the main app
- reload does not improperly destroy Sprint 1 flow
- the current locale can be read by every screen without special casing

## Task V1.3: Implement onboarding screen

### Objective
Build the main onboarding screen according to the defined product flow.

### Priority
P0

### Scope
- header
- progress
- wallet card
- credentials card
- account status panel
- final CTA
- copy driven by translation keys

### Activities
- implement screen visual structure
- implement 2-step progress
- implement wallet card
- implement credentials card
- implement account status panel
- implement `Continue to Dashboard` button
- implement responsive version
- consume localized labels and messages from the i18n layer

### Deliverables
- onboarding screen rendered
- functional responsive layout

### Dependencies
- V1.1
- V1.2

### Done criteria
- all main onboarding blocks exist
- screen works on desktop and mobile
- final CTA reacts to flow state
- the screen does not depend on hard-coded copy

## Task V1.4: Integrate Solana wallet connection

### Objective
Allow the user to connect their Solana wallet inside onboarding.

### Priority
P0

### Scope
- connection action
- visual and functional states
- connected state persistence

### Activities
- integrate the chosen wallet provider or adapter
- implement `Connect wallet` action
- update state to:
  - not connected
  - connecting
  - connected
  - error
- reflect changes in the account status panel
- persist minimum connected session state when applicable

### Deliverables
- Solana wallet connectable through onboarding
- functional connection states

### Dependencies
- V1.2
- V1.3

### Done criteria
- user connects wallet successfully
- connection error is handled
- connected state unlocks the next step
- the wallet flow does not break locale handling or translated labels

## Task V1.5: Implement Pacifica credentials form

### Objective
Allow the user to provide the credentials required to operate the bot.

### Priority
P0

### Scope
- fields
- basic fill validation
- credential submission

### Activities
- implement API key field
- implement secret or equivalent credential field
- implement fill validation
- implement form states:
  - empty
  - filled
  - validating
  - valid
  - invalid
- connect the form to global onboarding state

### Deliverables
- functional credentials form
- main form states

### Dependencies
- V1.2
- V1.3

### Done criteria
- user can fill and submit credentials
- form states display correctly
- field labels and helper messages come from the i18n layer

## Task V1.6: Validate Pacifica credentials

### Objective
Ensure only valid credentials unlock product access.

### Priority
P0

### Scope
- validation request
- success and error states
- account state update

### Activities
- implement `Validate credentials` action
- integrate the technical validation layer
- capture success response
- capture error response
- update onboarding state
- reflect status in the account status panel
- block continuation when validation fails

### Deliverables
- functional credential validation
- minimum success and error handling

### Dependencies
- V1.5

### Done criteria
- valid credentials unlock progression
- invalid credentials block progression
- feedback messages appear correctly
- validation feedback is sourced from localized messages

## Task V1.7: Implement product access guards

### Objective
Block dashboard and the rest of the app when onboarding is incomplete.

### Priority
P0

### Scope
- route guards
- redirects
- final CTA block

### Activities
- implement route guards for main screens
- redirect to onboarding when necessary
- block `Continue to Dashboard` until valid states are reached
- prevent manual access to protected routes
- ensure release after completed onboarding

### Deliverables
- protected access flow
- navigation conditioned on onboarding

### Dependencies
- V1.2
- V1.3
- V1.4
- V1.6

### Done criteria
- user cannot enter the product without valid onboarding
- manual access to protected routes is intercepted
- guarded routes still resolve the active locale correctly

## Task V1.8: Adjust Sprint 1 loading, empty, and error states

### Objective
Prevent onboarding from feeling broken during transitions and failures.

### Priority
P1

### Scope
- wallet loading
- validation loading
- connection errors
- credential errors

### Activities
- implement wallet connection loading
- implement credential validation loading
- implement wallet error messages
- implement credential error messages
- validate disabled states of the final CTA

### Deliverables
- minimum critical state handling for Sprint 1

### Dependencies
- V1.4
- V1.5
- V1.6
- V1.7

### Done criteria
- the user understands when the system is processing
- errors do not leave the screen ambiguous
- final CTA reacts correctly to state
- loading and error copy is localized through the same i18n mechanism

## Task V1.9: Validate the complete Sprint 1 flow

### Objective
Ensure the Sprint 1 deliverable works end to end.

### Priority
P1

### Scope
- full flow
- navigation
- basic persistence
- behavior after success and failure

### Activities
- validate flow:
  - open app
  - connect wallet
  - provide credentials
  - validate credentials
  - access dashboard
- validate wallet error flow
- validate credential error flow
- validate basic session reload
- fix obvious inconsistencies

### Deliverables
- stable Sprint 1 build for internal review

### Dependencies
- V1.1
- V1.2
- V1.3
- V1.4
- V1.5
- V1.6
- V1.7
- V1.8

### Done criteria
- the main Sprint 1 flow works end to end
- the main failures are covered
- the product can move into Sprint 2 without structural blockers
- English-first copy is visible end to end and the i18n fallback works

## Definition of done for the Dev sprint
- base application is navigable
- onboarding is functional
- Solana wallet connects
- Pacifica credentials are validated
- product access is blocked until valid completion
- main flow is reviewed end to end
