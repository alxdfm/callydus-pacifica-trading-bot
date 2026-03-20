# MVP Web Experience

## Objective
Define the first web interface in a simple and usable way for non-technical users, focused on the account dashboard, preset activation, and trade monitoring.

## Product Principle
The web UI should not expose the technical contract complexity directly to the user.

It should:
- guide preset selection
- show the real bot state
- allow manual action on individual trades
- make it clear what is active, what is stopped, and what needs attention

## Interface Structure

### 0. Onboarding
Mandatory flow before main usage.

It must allow:
- connect Solana wallet
- provide Pacifica API keys
- validate credentials
- unlock product access only after success

### 1. Initial Dashboard
Main landing screen.

It should show:
- current account balance
- aggregated PnL
- active trades
- recent trades
- overall bot status
- connection/health indicator

### 2. Presets
Preset selection area.

Each preset card should show:
- name
- risk level
- short description
- expected frequency
- default timeframe
- note that `stop loss` and `take profit` are mandatory

### 3. Minimum Configuration
Review panel or screen with the MVP editable fields.

Allowed fields:
- `symbol`
- `position size`
- enable or disable `long`
- enable or disable `short`

Not editable:
- indicators
- preset logic
- `timeframe`
- `stop loss` structure
- `take profit` structure

### 4. Activation
Confirmation flow before starting the bot.

It should display:
- selected preset
- final parameters
- preset risk
- explicit activation confirmation

### 5. Current Trades
List of open trades.

Each item should show:
- direction
- symbol
- entry
- current price
- trade PnL
- status
- close by `market order` button

### 6. History
List of closed trades.

It should show:
- entry and exit time
- result
- closing reason
- whether it was platform-created

## Main User Flow
1. Connect Solana wallet.
2. Provide Pacifica API keys.
3. Complete account validation.
4. Open the dashboard.
5. See balance, PnL, and bot status.
6. Pick a preset.
7. Adjust only the allowed fields.
8. Confirm and activate the bot.
9. Monitor running trades.
10. Close a specific trade if needed.
11. Review history and results.

## Interface States

### Global States
- disconnected
- loading
- ready
- active
- paused
- error
- reconciliation required

### Trade States
- waiting for entry
- open
- closed by target
- closed by stop
- closed manually
- execution error

## UX Suggestions
- use preset cards with simple language
- avoid long forms
- show risk visually and textually
- use buttons with clear single actions
- keep active trades above history
- allow manual close without leaving the main screen

## What Not To Do in MVP
- full visual strategy builder
- free-form entry logic editing
- too many technical configuration screens
- heavy analytics dashboard before the core works
- too many charts without a product need

## Product Rules
- the web UI should simplify decision-making
- the preset should be the main unit of use
- the individual trade should be the main unit of manual intervention
- the dashboard should prioritize state and control, not decoration

## Acceptance Criteria
- a user understands bot status in a few seconds
- a user can activate a preset in a few clicks
- a user can close a specific trade without stopping the bot
- the editable fields are few and clear
- the dashboard consistently shows balance, PnL, and trades

## Risks
- trying to build a full trading interface too early
- overwhelming the user with financial data without hierarchy
- confusing presets with technical configuration
- exposing too much complexity on first contact

## Next Decision
Define the visual organization of the screens and the main navigation between:
- dashboard
- presets
- current trades
- history
