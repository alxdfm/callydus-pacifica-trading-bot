# Sprint 5: Designer Tasks

## Sprint Objective
Close the visual and interaction consistency of the full MVP, covering cross-screen states, final refinements, and consolidated demo handoff.

## Scope
- visual consistency across all screens
- empty states
- loading states
- error states
- critical micro-interactions
- full-flow responsiveness
- final handoff review
- English-first copy base and i18n-ready labels

## Definition of Ready
- MVP scope lock is approved
- MVP handoff pack is available
- the main screens are already defined and implemented at a planning level
- the base language is English and labels must remain translation-friendly
- no task should expose technical JSON or strategy logic

## Final Sprint Deliverables
- consolidated visual review of the MVP
- minimum empty-state library
- minimum loading-state library
- minimum error-state library
- responsive review of the full flow
- final design handoff package for demo

## Task D5.1: Review visual consistency across all screens

### Objective
Ensure that onboarding, presets, dashboard, current trades, and history share the same visual language and product hierarchy.

### Priority
P0

### Scope
- typography
- spacing
- repeated components
- status language
- primary and secondary CTAs

### Activities
- review component consistency across screens
- adjust unnecessary layout and style variations
- validate title, subtitle, and main block patterns
- review visual consistency of tags, badges, and status markers
- align the visual weight of the most important CTAs
- keep the screens compatible with English-first and localized copy

### Deliverables
- consolidated visual consistency review

### Dependencies
- outputs from Sprints 1, 2, 3, and 4

### Done Criteria
- the product feels like a single experience rather than a set of isolated screens
- the layout system tolerates longer translated strings

## Task D5.2: Define and review MVP empty states

### Objective
Ensure that the product remains clear and usable when there is no operational data yet.

### Priority
P0

### Scope
- no current trades
- no history
- no active preset, when applicable
- temporary absence of account data

### Activities
- define messaging and composition for empty states
- define whether each empty state needs a guiding CTA
- validate a simple and direct communication tone
- review consistency across empty states in different screens
- align the states with product and QA rules

### Deliverables
- minimum empty-state library

### Dependencies
- D5.1

### Done Criteria
- empty states guide the user without looking like system errors
- empty-state messages can be translated without redesign

## Task D5.3: Define and review loading states

### Objective
Standardize how the interface communicates loading and processing across the main flow.

### Priority
P0

### Scope
- onboarding loading
- dashboard loading
- trade list loading
- action processing such as preset activation and manual close

### Activities
- define the pattern for skeleton, spinner, or inline loading by context
- review loading consistency across components and pages
- differentiate page loading, block loading, and action loading
- validate perceived progress in the most critical actions
- align the behavior with MVP constraints

### Deliverables
- minimum loading-state library

### Dependencies
- D5.1

### Done Criteria
- the user understands when the system is loading or processing something
- loading copy remains compatible with i18n

## Task D5.4: Define and review error states

### Objective
Standardize the visual communication of operational and loading failures.

### Priority
P0

### Scope
- credential error
- data loading error
- preset activation error
- manual trade close error
- temporary Pacifica unavailability

### Activities
- define severity and visual treatment for the main errors
- review when an error should be inline, banner, or modal
- define clear messages and suggested action when recovery is possible
- validate consistency with alerts already defined in the dashboard
- align critical errors with acceptance criteria

### Deliverables
- minimum error-state library

### Dependencies
- D5.1

### Done Criteria
- errors are understandable and actionable without excessive drama
- error copy supports English-first and localized versions

## Task D5.5: Review critical MVP micro-interactions

### Objective
Refine interactions that directly affect user trust in the product.

### Priority
P0

### Scope
- connect wallet
- validate credentials
- activate preset
- pause or resume bot
- manually close trade

### Activities
- review hover, pressed, and disabled feedback
- review the clarity of confirmation steps
- review whether destructive or sensitive actions feel safe
- validate consistency across success, error, and processing
- adjust timing and transition details, if needed

### Deliverables
- final review of critical micro-interactions

### Dependencies
- D5.2
- D5.3
- D5.4

### Done Criteria
- the main interactions feel reliable and intentional
- microinteraction copy and confirmations remain translation-friendly

## Task D5.6: Validate responsiveness of the full flow

### Objective
Ensure that the MVP can be demonstrated end-to-end on desktop and mobile.

### Priority
P1

### Scope
- onboarding
- presets
- dashboard
- current trades
- history

### Activities
- review the full flow on desktop
- review the full flow on mobile
- validate block order and visual priority on each screen
- validate minimum touch and reading accessibility
- adjust breakpoints that hurt the demo flow

### Deliverables
- consolidated responsive review of the MVP

### Dependencies
- D5.5

### Done Criteria
- the main flow remains usable and coherent on desktop and mobile
- the full flow tolerates longer translated strings on mobile

## Task D5.7: Prepare the final design handoff for demo

### Objective
Consolidate the final material Dev needs to close the MVP without remaining ambiguity.

### Priority
P1

### Scope
- final components
- cross-screen states
- interaction rules
- responsive adjustments
- final design notes
- i18n key guidance for all demo-facing copy

### Activities
- organize the final MVP artifacts
- consolidate approved variables, components, and states
- document MVP design exceptions and limitations
- register polishing priorities if any adjustments remain
- review handoff consistency with product and QA

### Deliverables
- final Sprint 5 design handoff

### Dependencies
- D5.1
- D5.2
- D5.3
- D5.4
- D5.5
- D5.6

### Done Criteria
- Dev can close the MVP for demo without significant design doubts
- Dev can close the MVP with English-first and translated copy intact
