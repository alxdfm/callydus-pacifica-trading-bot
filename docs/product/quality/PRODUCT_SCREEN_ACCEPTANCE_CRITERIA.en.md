# Acceptance Criteria by Screen

## Objective
Consolidate objective acceptance criteria for the main web MVP screens, aligning product, engineering, and QA around the expected behavior.

## Scope
Covered screens:
- Dashboard
- Presets
- Current Trades
- History

## 1. Dashboard

### Functional Criteria
- the Dashboard must display the current account balance
- the Dashboard must display aggregated PnL
- the Dashboard must display the number of active trades
- the Dashboard must display the active preset
- the Dashboard must display the overall bot status
- the Dashboard must list current trades
- the Dashboard must list recent trades
- the Dashboard must allow closing a specific trade

### UX Criteria
- the user must understand whether the bot is active or stopped in under 3 seconds
- current trades must appear before recent history
- the active preset must be visible without additional navigation
- the pause or resume bot action must be accessible at the top of the screen

### Content Criteria
- labels and names must stay simple
- JSON or technical logic must not be exposed
- operational alerts must be visible without dominating the interface

### Mobile Criteria
- the Dashboard must remain legible in a single-column layout
- the close trade button must remain accessible
- bot state and active preset must appear above the fold

## 2. Presets

### Functional Criteria
- the screen must display the 3 MVP presets
- each preset must show name, risk, frequency, and short description
- the user must be able to select a preset
- when a preset is selected, the review panel must appear
- the review panel must display the MVP editable fields
- the user must be able to activate the selected preset

### UX Criteria
- the difference between the 3 presets must be understandable without external documentation
- preset risk must be visible before activation
- editing must happen only after preset selection
- activation must make it clear which preset will start

### Content Criteria
- there must be a note that the strategy is a suggestion, not a return guarantee
- the screen must not display raw indicators, JSON, or technical logic
- preset comparison must use simple language

### Mobile Criteria
- presets must appear as stacked cards
- the selected preset must be reviewable without opening another screen
- the activation CTA must remain visible and clear

## 3. Current Trades

### Functional Criteria
- the screen must list all open platform trades
- each trade must display direction, symbol, entry, current price, PnL, and status
- each trade must allow manual closing through `market order`
- the screen must highlight the selected trade when a detail panel exists

### UX Criteria
- the trade close action must be unambiguous
- trades must be visually easy to differentiate by direction and status
- the list must not be confused with history

### Content Criteria
- platform-created trades must be identifiable
- the reason for the trade's current state must be legible
- the screen must not display irrelevant information for immediate monitoring

### Mobile Criteria
- the list must work in a compact format
- the user must be able to access the close action without difficulty
- trade detail can open in a dedicated screen

## 4. History

### Functional Criteria
- the screen must list closed trades
- each item must show entry and exit time
- each item must show trade result
- each item must show closing reason
- the screen must allow simple chronological reading

### UX Criteria
- history must not visually compete with current trades
- result reading must be fast
- simple filters, if present, must be easy to understand

### Content Criteria
- history must indicate whether closure happened by target, stop, or manual action
- platform trades must be identifiable
- the screen must avoid excessive analytical detail in the MVP

### Mobile Criteria
- the list must remain readable
- each item must have enough summary information without relying on hover

## Cross-Screen Criteria

### Navigation
- the user must be able to navigate between the 4 screens without ambiguity
- the current screen must be clearly highlighted in the menu

### System State
- Pacifica connection must be visible on the main screens
- overall bot status must remain consistent between Dashboard and other screens

### Consistency
- status labels must be the same across all screens
- symbols and directions must follow the same visual pattern
- critical actions must use consistent naming

## Final Web MVP Acceptance Criterion
The web MVP is accepted when:
- the user can choose and activate a preset
- the user can understand the bot state
- the user can monitor open trades
- the user can close a trade without stopping the bot
- the user can consult history in a simple way
