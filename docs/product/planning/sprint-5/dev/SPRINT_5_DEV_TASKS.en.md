# Sprint 5: Dev Tasks

## Sprint Objective
Close the full MVP flow with cross-screen integration, cross-cutting state coverage, friction fixes, and controlled-demo readiness.

## Scope
- navigation across screens
- guards and flow gating
- empty, loading, and error states
- synchronization between active preset, bot, and operational data
- bug and friction fixes in the main flow
- final MVP validation
- English default locale and i18n-ready demo copy

## Definition of Ready
- MVP scope lock is approved
- MVP handoff pack is available
- the earlier sprints have defined the main screens and flows
- the base language is English and translation keys are expected
- no task should introduce strategy logic outside the locked scope

## Final Sprint Deliverables
- functional flow from onboarding to history
- integrated navigation across all screens
- minimum coverage for empty, loading, and error states
- consistency between bot state, preset, and operation
- final MVP package ready for demonstration

## Task V5.1: Integrate navigation across all MVP screens

### Objective
Ensure the user can move through the main flow without dead ends or broken paths.

### Priority
P0

### Scope
- onboarding
- dashboard
- presets
- current trades
- history
- topbar and main navigation

### Activities
- review and connect the main routes
- validate CTA navigation and structural navigation
- ensure links and actions lead to the correct screen
- review active navigation states
- adjust relevant return paths and secondary paths
- keep navigation labels locale-aware

### Deliverables
- integrated MVP navigation

### Dependencies
- outputs from Sprints 1, 2, 3, and 4

### Done Criteria
- the user can navigate through the MVP without broken links or incoherent detours
- navigation copy remains localized through the same i18n flow

## Task V5.2: Review guards and gating in the main flow

### Objective
Ensure the product blocks only what should be blocked, at the right time.

### Priority
P0

### Scope
- incomplete onboarding blocking
- dashboard access
- operational screen access
- bot state versus action permissions

### Activities
- review authentication and operational-readiness guards
- validate behavior without a connected wallet
- validate behavior without valid credentials
- review whether there are improper blocks after onboarding completion
- adjust redirect and fallback states

### Deliverables
- reviewed and implemented gating rules

### Dependencies
- V5.1

### Done Criteria
- the user is blocked only when necessary and with predictable behavior
- guard messages remain locale-aware

## Task V5.3: Implement and consolidate MVP empty states

### Objective
Cover the main no-data scenarios so the flow does not look incomplete or broken.

### Priority
P0

### Scope
- no current trades
- no history
- no active preset, when applicable
- temporary absence of account data

### Activities
- implement empty-state components and messaging
- connect guiding CTAs where appropriate
- validate visual and functional consistency across screens
- ensure empty states follow product and design definitions
- review navigation starting from these states

### Deliverables
- empty states implemented in MVP screens

### Dependencies
- V5.1
- Sprint 5 design outputs

### Done Criteria
- lack of data does not look like a system failure
- empty-state copy is sourced from i18n

## Task V5.4: Implement and consolidate loading states

### Objective
Cover the main loading and processing scenarios of the core flow.

### Priority
P0

### Scope
- page loading
- block loading
- list loading
- critical action processing

### Activities
- implement loading for onboarding, dashboard, and lists
- implement loading for preset activation and manual close
- differentiate screen loading from action loading
- review consistency with design components
- validate that the user gets feedback in async actions

### Deliverables
- loading states implemented in key screens and actions

### Dependencies
- V5.1
- Sprint 5 design outputs

### Done Criteria
- the system always communicates when it is loading or processing something relevant
- loading copy comes from the i18n layer

## Task V5.5: Implement and consolidate error states

### Objective
Cover the main failure cases with clear messaging and consistent handling.

### Priority
P0

### Scope
- credential error
- loading error
- preset activation error
- manual close error
- temporary integration unavailability

### Activities
- implement error treatment as inline, banner, or modal according to definition
- standardize messages and recovery actions
- review consistency between dashboard errors and operational screen errors
- validate that errors do not leave the interface in an ambiguous state
- ensure the user can retry when applicable

### Deliverables
- implemented and consistent error states

### Dependencies
- V5.1
- Sprint 5 design outputs

### Done Criteria
- main failures are understandable and handled without breaking the flow
- error copy remains translation-friendly

## Task V5.6: Validate consistency between active preset, bot, and operational screens

### Objective
Ensure that the state reflected on screen matches the real operational state.

### Priority
P0

### Scope
- active preset
- bot status
- dashboard
- current trades
- history

### Activities
- validate propagation of the active preset across screens
- validate propagation of bot pause and resume
- validate synchronization after activation and manual close
- review dependent counters and summaries
- fix divergences between perceived state and real state

### Deliverables
- reviewed functional consistency between bot state and screens

### Dependencies
- V5.2
- V5.3
- V5.4
- V5.5

### Done Criteria
- the user does not encounter relevant contradictions across screens
- state labels remain locale-agnostic while the UI stays localized

## Task V5.7: Fix bugs and friction in the main flow

### Objective
Reduce friction that would hurt the MVP demonstration.

### Priority
P1

### Scope
- functional bugs
- navigation bugs
- interaction friction
- visual inconsistencies with functional impact

### Activities
- review the full flow for breakages
- fix navigation and integration bugs
- fix CTA, form, and state friction
- align with feedback from product, design, and QA when available
- prioritize fixes that affect the demo

### Deliverables
- main batch of Sprint 5 fixes

### Dependencies
- V5.6

### Done Criteria
- the main flow can be demonstrated without breakages or major friction
- fixes preserve the English-first and translated UI behavior

## Task V5.8: Validate the full MVP flow for demo

### Objective
Confirm that the product is ready for a controlled demonstration from onboarding to history.

### Priority
P1

### Scope
- full onboarding
- preset activation
- operational dashboard
- current trades
- manual close
- history
- cross-screen navigation

### Activities
- run a full walkthrough of the main flow
- validate transitions between all key screens
- validate critical loading, empty, and error states
- review fallback and recovery points
- register only the final adjustments strictly necessary for demo

### Deliverables
- final validated flow for MVP demonstration

### Dependencies
- V5.7

### Done Criteria
- the MVP is ready for a controlled demo with reduced risk of failure in the main flow
- the demo flow behaves the same in English-first and translated copy
