# MVP Scope Lock

## Context and Goal
This document freezes the Pacifica MVP scope to guide Design and Development at the start of execution.

The goal is to validate real value with non-technical users, with focus on:
- simple setup
- operational clarity
- few editable parameters
- basic safety for demo and early use

## Mandatory Principles
- the product must feel simple for non-technical users
- presets are the primary configuration unit
- the user should not build strategy logic from scratch
- `stop loss` and `take profit` are mandatory in all presets
- the interface must not expose JSON, technical contracts, or raw logic
- the interface must be English-first and i18n-ready from day one
- any change outside this scope must be reviewed before implementation

## Frozen MVP Scope

### 1. Onboarding
Mandatory flow before main usage.

Includes:
- Solana wallet connection
- Pacifica credentials submission
- credentials validation
- access blocked until valid completion

### 2. Presets
Strategy selection and activation through presets.

Includes:
- 3 fixed presets: `Safer`, `Balanced`, `More active`
- simple preset comparison
- review of the selected preset
- explicit preset activation

Editable fields allowed in the MVP:
- `symbol`
- `position size`
- enable `long`
- enable `short`

Non-editable fields in the MVP:
- indicators
- entry logic
- timeframe
- `stop loss` structure
- `take profit` structure

### 3. Dashboard
Core screen after onboarding.

Includes:
- current balance
- aggregated PnL
- active preset
- overall bot status
- active trades
- recent trades
- minimal operational alerts

### 4. Current Trades
Monitoring of open positions.

Includes:
- list of open trades
- direction, symbol, entry, current price, PnL, and status
- manual close per trade via `market order`
- identification of platform-created trades

### 5. History
Simple review of closed trades.

Includes:
- chronological list of closed trades
- entry and exit time
- trade result
- closing reason
- identification of platform trade

### 6. Integration and Basic States
Includes:
- navigation between MVP screens
- loading states
- empty states
- error states
- minimum responsive behavior for desktop and mobile

## Out of Scope
The following do not belong in the MVP:
- visual strategy builder
- indicator editing
- free-form entry rule editing
- multiple technical configuration layers
- more than 3 initial presets
- advanced history filters
- advanced analytics
- highly analytical dashboards
- manual actions beyond per-trade close
- exposing JSON to the end user

## Mandatory Business Rules
- without valid onboarding, the user cannot access the main product
- without a connected wallet, the flow cannot continue
- without valid Pacifica credentials, the bot cannot be activated
- a preset can only be activated after reviewing the allowed fields
- the user can close a specific trade without stopping the whole bot
- bot status must be clear on all main screens
- copy must stay simple and consistent

## Acceptance Criteria for Scope Lock
The scope is considered locked when:
- the team can explain the MVP in under 1 minute
- Design knows exactly which screens to create and which states to cover
- Development knows exactly what to build and what not to build
- QA can validate the main flow without interpreting open requirements
- any new request outside this document becomes a scope change

## Hypotheses
- 3 presets are enough to demonstrate value in the Hackathon
- non-technical users prefer choosing over configuring
- the biggest value comes from operational clarity, not flexibility
- manual close per trade is more valuable than advanced controls in the MVP

## Risks
- scope expansion into a generic trading platform
- UX becoming too technical for non-technical users
- onboarding creating excessive friction
- missing loading/error states breaking the demo
- misalignment between docs, design, and implementation

## Success Metrics
- onboarding completion rate
- time to choose and activate a preset
- time to understand bot status on the dashboard
- use of manual close per trade
- ability to demo end to end without exceptional intervention

## Handoff for Dev and Design

### Context and goal
Deliver a simple, clear, and demoable web MVP for Pacifica.
See the executable breakdown in [MVP_HANDOFF_PACK.en.md](./MVP_HANDOFF_PACK.en.md).

### Scope of this task
Implement only what is listed in the frozen scope above.

### Out of scope
Any functionality not listed here must be treated as a scope change.

### Mandatory business rules
Use blocking onboarding, 3 fixed presets, minimal editing, and manual trade close.

### Acceptance criteria
The user completes onboarding, activates a preset, monitors trades, and reviews history clearly.

### Known risks
Excessive complexity, onboarding friction, inconsistent states, and scope expansion.

### Success metrics
Main flow completion, fast understanding of bot status, and a stable demo.
