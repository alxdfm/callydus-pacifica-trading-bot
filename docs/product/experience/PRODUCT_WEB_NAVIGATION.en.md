# MVP Navigation and Visual Organization

## Objective
Define the main navigation and screen organization for the web MVP, focused on operational clarity, fast preset activation, and simple trade monitoring.

## Product Principle
The user should understand where they are, what is active, and what the next action is within a few seconds.

The navigation must:
- reduce ambiguity
- prioritize state and action
- avoid feeling like an overly complex trading platform

## Main Navigation Structure

### Fixed side navigation
Main items:
- Dashboard
- Presets
- Current Trades
- History

### Entry gate
Before the main navigation, the user goes through onboarding:
- connect Solana wallet
- provide Pacifica API keys
- validate credentials

### Top bar
Fixed elements:
- Pacifica connection status
- overall bot status
- account balance
- quick pause/resume action

## Screen Hierarchy

### 1. Dashboard
This is the landing screen and operational center of the product.

#### Visual organization
- top: global status strip
- block 1: balance and PnL
- block 2: active preset and bot status
- block 3: current trades
- block 4: recent trades
- block 5: call to configure or switch preset

#### Visual objective
- show account situation immediately
- show whether automation is running
- provide fast access to the most important action

### 2. Presets
Dedicated screen for preset selection and activation.

#### Visual organization
- top: short explanation of what a preset is
- center: grid with 3 main cards
- bottom of main area: editable field review

#### Visual objective
- make preset comparison easy
- keep risk and frequency legible
- turn selection into a simple decision

### 3. Current Trades
Screen focused on operational intervention.

#### Visual organization
- top: summary of open trade count
- center: list or table of active trades
- side panel or contextual panel: detail of selected trade

#### Visual objective
- highlight what needs attention now
- allow manual close with low friction
- avoid mixing with history

### 4. History
Screen focused on later review.

#### Visual organization
- top: simple filters
- center: chronological list of closed trades
- optional detail when selecting an item

#### Visual objective
- make it easy to review what happened
- clearly separate current operation from past operation

## Recommended Navigation Flow
1. The user completes onboarding.
2. They enter the Dashboard.
3. If no preset is active, they go to Presets.
4. They choose the preset and review the editable fields.
5. They activate the bot.
6. They return to the Dashboard for monitoring.
7. They use Current Trades when they want to intervene.
8. They use History to review results.

## Visual Hierarchy Rules
- bot state must always be visible
- current trades have higher priority than history
- the active preset must appear on the Dashboard
- balance and PnL must appear above the fold on desktop
- critical actions must be few and explicit

## Mobile Navigation
- bottom navigation with 4 items:
  - Dashboard
  - Presets
  - Current
  - History
- compact cards in the dashboard
- trade detail in a dedicated screen

## Primary Action by Screen

### Dashboard
Primary action:
- configure or review the active preset

### Presets
Primary action:
- select and activate preset

### Current Trades
Primary action:
- close a specific trade

### History
Primary action:
- review previous results

## What to Avoid
- deep menus
- hidden navigation
- multiple competing CTAs on the same screen
- too many modules in the dashboard
- complex charts as the main element

## Suggested Visual Direction
- clean layout with strong separation between global state and trade-level operation
- large cards for presets
- dense lists only in current trades and history
- use color for risk, state, and trade direction
- optimize for fast reading, not decoration

## Acceptance Criteria
- a user understands the navigation without a tutorial
- the Dashboard answers “what is happening now?”
- the Presets screen answers “which strategy should I activate?”
- the Current Trades screen answers “where do I intervene?”
- the History screen answers “what happened?”

## Next Decision
Define the detailed account dashboard layout.
