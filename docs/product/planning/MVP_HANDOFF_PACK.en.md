# MVP Handoff Pack for Design and Dev

## Context and Goal
This document translates the `MVP Scope Lock` into executable instructions for Design and Dev.

Goal:
- remove open interpretation
- lock the expected behavior per screen
- standardize states, copy, and UX rules
- keep the MVP simple for non-technical users

## General Guidelines
- the user must not see JSON, technical contracts, or raw logic
- presets are the primary decision unit
- the UI must prioritize state, action, and fast reading
- any critical action must be unambiguous
- mobile is not a secondary adaptation; it is part of the MVP
- empty, loading, error, and success states must exist wherever there is async dependency or missing data
- the interface must be English by default and i18n-ready from day one

## Product Base Copy
Use the following language as the standard MVP reference.

### Preset terminology
- `Safer`
- `Balanced`
- `More active`

### Core labels
- `Dashboard`
- `Presets`
- `Current trades`
- `History`
- `Connect wallet`
- `Validate credentials`
- `Continue to Dashboard`
- `Pause bot`
- `Resume bot`
- `Review preset`
- `Change preset`
- `Activate preset`
- `Close`

### Product messages
- `Preset is a strategy suggestion, not a return guarantee.`
- `Stop loss and take profit are mandatory in every preset.`
- `The account must be ready to operate.`
- `Without validation, access to the product remains blocked.`

## Cross-Cutting UX Rules
- always highlight the current state before secondary actions
- keep destructive actions separate from the main content
- avoid multiple CTAs with equal weight on the same screen
- show errors close to the source of the problem
- avoid overly technical language in labels and microcopy
- use one consistent visual pattern for status across all screens
- current trades must always have higher visual priority than history

## 1. Onboarding

### Screen Goal
Ensure the user connects a Solana wallet and validates Pacifica credentials before entering the product.

### Design Must Deliver
- short header explaining the 2-step flow
- wallet card with clear status
- Pacifica credentials card with clear fields
- account readiness panel
- final CTA disabled until valid completion
- desktop and mobile versions

### Dev Must Implement
- access blocking until onboarding is complete
- wallet connection validation
- Pacifica credentials validation
- minimal onboarding state persistence
- visual states for progress and failure

### Required States
- empty
- connecting wallet
- wallet connected
- wallet error
- empty credentials
- validating credentials
- valid credentials
- invalid credentials
- account ready
- general error

### Final Copy
- title: `Set up your account`
- wallet: `Connect Solana wallet`
- credentials: `Connect Pacifica account`
- CTA: `Continue to Dashboard`

### UX Rules
- the user must understand there are two main steps
- the next action must always be obvious
- errors must appear close to the failing field or action
- the final CTA can only become active when wallet and credentials are valid

## 2. Presets

### Screen Goal
Allow simple comparison, minimal review, and explicit preset activation.

### Design Must Deliver
- 3 preset cards with semantic labels
- short preset comparison
- selected preset review panel
- activation block with a summary of what will be applied
- single-column mobile with a clear CTA

### Dev Must Implement
- render the 3 fixed presets
- preset selection
- review panel shown only after selection
- editable fields only for allowed values
- final activation payload assembly
- active preset persistence

### Required States
- no preset selected
- preset selected
- review available
- review blocked while nothing is selected
- activation in progress
- activated successfully
- activation error

### Editable MVP Fields
- `symbol`
- `position size`
- `long`
- `short`

### Non-Editable Fields
- indicators
- entry logic
- timeframe
- `stop loss` structure
- `take profit` structure

### Final Copy
- screen title: `Presets`
- card 1: `Safer`
- card 2: `Balanced`
- card 3: `More active`
- primary CTA: `Activate preset`
- secondary CTA: `Cancel`
- notice: `Preset is a strategy suggestion, not a return guarantee.`

### UX Rules
- decision comes before editing
- editing comes before activation
- risk must be visible before the final click
- the user must not see raw indicators or JSON
- the selected preset must be obvious without opening another screen

## 3. Dashboard

### Screen Goal
Show the account state, bot state, and active trades quickly.

### Design Must Deliver
- operational header with global status
- balance, PnL, and counter cards
- active preset block
- current trades block
- recent trades block
- alerts block
- layout readable on desktop and mobile

### Dev Must Implement
- balance and PnL consumption
- active preset display
- bot status display
- current and recent trade lists
- global pause/resume action, if retained in the product
- status consistency with the other screens

### Required States
- loading
- no data
- bot active
- bot paused
- bot error
- reconciliation needed
- empty alerts
- alerts with occurrences

### Final Copy
- title: `Dashboard`
- summary state: `Account connected. Bot active.` or `Account connected. Bot paused.`
- global action: `Pause bot` / `Resume bot`
- preset block: `Active preset`
- trade block: `Current trades`
- short history block: `Recent trades`

### UX Rules
- balance and PnL must appear above the fold on desktop
- current trades must appear before recent trades
- the active preset must be visible without additional navigation
- alerts must not dominate the screen
- the user must understand bot status within a few seconds

## 4. Current Trades

### Screen Goal
Allow monitoring and manual closing of open trades.

### Design Must Deliver
- clear list of open trades
- visual differentiation by direction and status
- destructive `Close` button
- selected trade detail, when applicable
- compact and readable mobile view

### Dev Must Implement
- open trade listing
- direction, symbol, entry, current price, PnL, and status display
- manual closing via `market order`
- selected trade highlight
- dashboard update after closing

### Required States
- no open trades
- list with trades
- selected trade
- closing trade
- trade closed successfully
- trade close error

### Final Copy
- title: `Current trades`
- action button: `Close`
- empty state: `No open trades` or the local equivalent defined in the final layout

### UX Rules
- closing action must be unambiguous
- visual confirmation must prevent accidental clicks
- platform-created trades must be identifiable
- the list must not feel like history

## 5. History

### Screen Goal
Allow simple review of closed trades.

### Design Must Deliver
- chronological list of closed trades
- positive and negative result emphasis
- readable closing reason
- compact mobile reading

### Dev Must Implement
- closed trade listing
- entry, exit, result, and reason display
- platform trade identification
- simple chronological reading

### Required States
- empty history
- loading history
- history available
- history load error

### Final Copy
- title: `History`
- main labels: `Entry`, `Exit`, `Result`, `Reason`

### UX Rules
- history must be more discreet than current trades
- result reading must be fast
- complex filters are not part of the MVP

## 6. Integration and Navigation

### Layer Goal
Ensure flow between screens is predictable.

### Design Must Deliver
- consistent side or bottom navigation
- active state for the current menu item
- coherent visual order across desktop and mobile
- clear highlight of the current screen

### Dev Must Implement
- navigation between Dashboard, Presets, Current trades, and History
- blocking of the main app while onboarding is not valid
- synchronization between active preset, bot, and screens

### Required States
- menu with active item
- blocking onboarding
- navigation available
- navigation blocked by missing prerequisite

### UX Rules
- do not hide the main navigation
- do not create deep menus
- do not duplicate global actions excessively

## Responsibility Map

### Design
- design the final layout of each screen
- define visual hierarchy
- define empty, loading, error, and success states
- ensure desktop and mobile responsiveness
- validate visual copy and action clarity

### Dev
- implement layout and states
- connect the flow between screens
- keep data, status, and navigation consistent
- enforce onboarding guards correctly
- preserve the simplicity defined by product

## Handoff Acceptance Criteria
- Designer can produce the screens without inferring open rules
- Dev can implement without asking for the basic flow of each screen
- required states are declared per screen
- base copy is fixed
- any new change goes through product review

## Risks If This Handoff Does Not Exist
- rework between Design and Dev
- inconsistent labels and statuses
- screens with too much technical information
- flow blocked by unexplained dependencies
- loss of focus on the non-technical user
