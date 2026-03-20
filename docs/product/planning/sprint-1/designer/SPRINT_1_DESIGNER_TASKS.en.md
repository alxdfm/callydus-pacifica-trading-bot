# Sprint 1: Designer Tasks

## Sprint Objective
Deliver the visual foundation of the MVP and the complete onboarding flow at design level, ready for development handoff.

## Scope
- MVP mini visual system
- onboarding desktop
- onboarding mobile
- wallet states
- Pacifica credential states
- error and success messages

## Final Sprint Deliverables
- base MVP visual kit
- onboarding desktop screen
- onboarding mobile screen
- wallet states
- credential states
- short support and error copy
- Sprint 1 minimum handoff

## Task D1.1: Define the MVP mini visual system

### Objective
Create the minimum visual foundation so onboarding and later screens are not designed inconsistently.

### Scope
- colors
- typography
- spacing
- buttons
- inputs
- cards
- status badges

### Activities
- define the main interface palette
- define semantic palette:
  - success
  - error
  - warning
  - active
  - paused
- define typography scale:
  - page title
  - section title
  - subtitle
  - body text
  - helper text
- define base spacing scale
- define button patterns:
  - primary
  - secondary
  - destructive
  - disabled
- define input field pattern:
  - normal
  - focus
  - error
  - disabled
- define card pattern
- define status badge pattern

### Deliverables
- color table
- typography scale
- spacing scale
- minimum base component library

### Dependencies
- none

### Done criteria
- one visual base exists
- defined components are enough to build onboarding
- critical and destructive states are clearly distinguishable

## Task D1.2: Design onboarding desktop structure

### Objective
Define the main onboarding experience for desktop.

### Scope
- screen header
- 2-step progress
- wallet card
- Pacifica credentials card
- account status panel
- final CTA

### Activities
- design header with:
  - title
  - subtitle
  - progress indicator
- design wallet card with:
  - title
  - short description
  - status
  - connect button
- design credentials card with:
  - API key field
  - secret/credential field
  - validation state
  - validate button
- design account status panel
- design final CTA area
- define visual hierarchy between cards and status panel

### Deliverables
- complete onboarding desktop layout
- visual ordering specification of the blocks

### Dependencies
- D1.1

### Done criteria
- the screen can be understood visually without external explanation
- the left-to-right or top-to-bottom flow is clear
- the final action only gains emphasis when appropriate

## Task D1.3: Design onboarding mobile structure

### Objective
Ensure onboarding stays short and clear on small screens.

### Scope
- complete mobile onboarding version
- block order
- final CTA
- readability of states

### Activities
- adapt header for mobile
- stack wallet and credentials cards
- adapt account status panel to vertical reading
- define fixed or persistently visible final CTA
- validate touch target area for main actions

### Deliverables
- complete onboarding mobile layout
- desktop-to-mobile adaptation rules

### Dependencies
- D1.1
- D1.2

### Done criteria
- the screen works in a single column
- progress remains clear
- CTA and messages remain readable without friction

## Task D1.4: Define wallet visual states

### Objective
Specify all Solana wallet connection states in an unambiguous way.

### Scope
- not connected
- connecting
- connected
- error

### Activities
- design initial disconnected state
- design connecting/loading state
- design success state
- design error state
- define short text for each state
- define icon, badge, or visual marker for each state

### Deliverables
- wallet state visual matrix
- short copy per state

### Dependencies
- D1.1
- D1.2

### Done criteria
- states are distinguishable within a few seconds
- success and error cannot be confused
- loading does not look like a frozen state

## Task D1.5: Define Pacifica credential visual states

### Objective
Specify the visual behavior of fields and credential validation.

### Scope
- empty
- filled
- validating
- valid
- invalid

### Activities
- design initial field state
- design filled state before validation
- design validation in progress state
- design valid state
- design invalid state
- define short error and success messages
- define visual position of messages

### Deliverables
- credential state visual matrix
- validation message set

### Dependencies
- D1.1
- D1.2

### Done criteria
- the user understands when action is needed
- error stays close to the problem
- successful validation is unambiguous

## Task D1.6: Define onboarding error and success messages

### Objective
Standardize the main Sprint 1 microcopy to reduce ambiguity.

### Scope
- wallet
- credentials
- final ready state
- blocked continuation

### Activities
- define message for disconnected wallet
- define message for wallet connection failure
- define message for invalid credentials
- define message for validation in progress
- define message for ready account
- define message for inability to continue

### Deliverables
- onboarding microcopy table

### Dependencies
- D1.4
- D1.5

### Done criteria
- all messages are short, actionable, and consistent
- there is no excessively technical language

## Task D1.7: Prepare Sprint 1 handoff for Dev

### Objective
Ensure the development team can implement Sprint 1 without visual guesswork.

### Scope
- artifact organization
- component naming
- states
- responsive notes

### Activities
- name main components
- organize screens in flow order
- attach wallet and credential states
- attach validated microcopy
- record desktop and mobile behavior
- record disabled button and blocked state behavior

### Deliverables
- Sprint 1 handoff package

### Dependencies
- D1.1
- D1.2
- D1.3
- D1.4
- D1.5
- D1.6

### Done criteria
- dev can implement onboarding and the visual base without needing to infer design intent

## Definition of done for the Designer sprint
- base visual kit exists
- onboarding desktop and mobile are complete
- wallet and credential states are covered
- main microcopy is defined
- handoff is ready for development
