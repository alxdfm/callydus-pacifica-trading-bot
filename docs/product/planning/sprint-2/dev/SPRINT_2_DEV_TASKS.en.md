# Sprint 2: Dev Tasks

## Sprint Objective
Deliver the functional presets screen, including selection, editable field review, and preset activation, persisting the active preset in application state.

## Scope
- presets screen
- rendering of the 3 presets
- preset selection
- short comparison
- selected preset review
- editing of allowed fields
- preset activation
- active preset persistence
- English default locale and i18n-ready preset copy

## Definition of Ready
- MVP scope lock is approved
- MVP handoff pack is available
- the preset names and base labels are frozen in English-first form
- no task should introduce technical configuration outside the allowed fields
- translation keys are expected from day one

## Final Sprint Deliverables
- functional presets screen
- 3 rendered presets
- selection and review flow
- editing of allowed fields
- functional preset activation
- persisted active preset state

## Task V2.1: Implement base structure of the Presets screen

### Objective
Build the main presets page inside the shared application layout.

### Priority
P0

### Scope
- header
- presets grid
- comparator
- review
- activation
- i18n-ready content regions

### Activities
- create functional route for the presets screen
- implement page header
- implement main page area
- reserve blocks for:
  - cards
  - comparator
  - review
  - final CTA
- guarantee responsive version of the base structure
- wire the screen to the active locale so copy can be translated

### Deliverables
- rendered presets screen structure
- i18n-aware presets screen structure

### Dependencies
- Sprint 1 outputs

### Done criteria
- the page exists and supports the main blocks defined in product
- the page can render English-first copy and translated labels

## Task V2.2: Render the 3-preset catalog

### Objective
Display the three official MVP presets with their main contents.

### Priority
P0

### Scope
- `Safer`
- `Balanced`
- `More active`

### Activities
- map final preset catalog
- render name, risk, frequency, and short description
- render selection CTA on each card
- apply default visual state and selected state
- guarantee desktop and mobile consistency

### Deliverables
- rendered cards for the 3 presets

### Dependencies
- V2.1

### Done criteria
- all 3 presets appear correctly
- content is consistent with product documentation
- preset content is compatible with English-first and translated copy

## Task V2.3: Implement preset selection

### Objective
Allow the user to select a preset and change the page state accordingly.

### Priority
P0

### Scope
- selection state
- visual highlight
- review unlock

### Activities
- implement selected preset state
- apply visual highlight to the selected card
- hide or block review when nothing is selected
- reflect selection in the activation block

### Deliverables
- functional preset selection behavior

### Dependencies
- V2.2

### Done criteria
- the user can select a preset
- the screen reacts consistently to selection
- selection state does not depend on hard-coded labels

## Task V2.4: Implement summary comparator between presets

### Objective
Display a fast comparison between the three presets without exposing technical details.

### Priority
P0

### Scope
- risk
- frequency
- entry style
- stop
- take profit

### Activities
- render comparator with summarized data
- adjust desktop format
- adjust stacked mobile format
- validate label consistency

### Deliverables
- functional desktop and mobile comparator

### Dependencies
- V2.2

### Done criteria
- the comparator is readable and coherent with the rendered presets
- labels remain readable in translated layouts

## Task V2.5: Implement selected preset review panel

### Objective
Allow the user to review the preset and change only the fields allowed in the MVP.

### Priority
P0

### Scope
- preset summary
- editable fields
- suggestion-without-guarantee message

### Activities
- render selected preset name
- render text summary of behavior
- implement fields:
  - `symbol`
  - `position size`
  - `long`
  - `short`
- reflect changes in local preset state
- render suggestion-without-return-guarantee note

### Deliverables
- functional review panel

### Dependencies
- V2.3

### Done criteria
- the user can review and edit only what is allowed
- review labels and helper messages are sourced from i18n

## Task V2.6: Build final activation payload

### Objective
Convert preset selection and allowed edits into the payload the bot will consume.

### Priority
P0

### Scope
- base preset
- `symbol`
- `position size`
- `long`
- `short`

### Activities
- map selected preset into final contract
- apply editable field overrides
- validate final payload before activation
- ensure nothing outside editable scope is changed

### Deliverables
- activation payload consistent with the contract

### Dependencies
- V2.5

### Done criteria
- final payload correctly represents the selected preset with user adjustments
- payload assembly remains independent from localized display text

## Task V2.7: Implement preset activation

### Objective
Allow the user to activate the preset from the presets screen.

### Priority
P0

### Scope
- primary CTA
- loading state
- success
- error

### Activities
- implement `Activate preset` action
- trigger creation or update of the active preset
- implement CTA loading state
- implement success handling
- implement error handling
- prevent activation without a selected preset

### Deliverables
- functional preset activation
- minimum success and error states

### Dependencies
- V2.6

### Done criteria
- the user can activate a valid preset
- activation failures are handled
- activation copy comes from localized messages

## Task V2.8: Persist active preset and reflect it in application state

### Objective
Ensure the activated preset remains available to the rest of the product.

### Priority
P1

### Scope
- persistence
- reuse in dashboard
- reuse in app navigation

### Activities
- persist active preset in state layer
- persist edited parameters
- expose active preset to other screens
- ensure restoration on basic reload when applicable

### Deliverables
- persisted active preset
- functional shared state

### Dependencies
- V2.7

### Done criteria
- the active preset is available outside the presets screen
- active preset state remains locale-agnostic and reusable

## Task V2.9: Validate the complete Sprint 2 flow

### Objective
Ensure the selection and activation flow works end to end.

### Priority
P1

### Scope
- screen load
- selection
- editing
- activation
- persistence

### Activities
- validate presets screen loading
- validate selection of all 3 presets
- validate editing of allowed fields
- validate payload assembly
- validate successful activation
- validate error behavior
- validate active preset persistence

### Deliverables
- stable Sprint 2 build for internal review

### Dependencies
- V2.1
- V2.2
- V2.3
- V2.4
- V2.5
- V2.6
- V2.7
- V2.8

### Done criteria
- the user chooses, reviews, and activates a preset without breaking flow
- the active preset remains consistent in the application
- the English-first and translated flows behave the same way

## Definition of done for the Dev sprint
- the presets screen is functional
- the 3 presets are rendered correctly
- review and editing of allowed fields work
- preset activation works
- active preset is persisted and reusable in the app
