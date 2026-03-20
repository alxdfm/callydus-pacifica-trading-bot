# Detailed Dashboard Layout

## Objective
Define the detailed visual structure of the account Dashboard for the MVP, prioritizing fast state reading, operational control, and visibility into ongoing trades.

## Dashboard Function
The Dashboard should answer four questions within a few seconds:
- is the account connected?
- is the bot active or stopped?
- is there an open trade right now?
- what should I do next?

## Layout Principle
The Dashboard is not a deep analytics screen.

It is a screen for:
- state
- control
- monitoring
- fast action

## Desktop Structure

### Section 1: Operational Header
At the top of the main content area.

Content:
- screen title: `Dashboard`
- short subtitle: summary of current state
- Pacifica connection badge
- bot status badge
- primary button: `Pause bot` or `Resume bot`

Objective:
- quickly confirm whether the system is operational
- highlight the most important global action

### Section 2: Summary Cards
First row of cards.

Cards:
- current balance
- aggregated PnL
- active trades
- trades closed today

Visual rules:
- large numbers
- small, clear labels
- positive or negative PnL variation with color
- active trades highlighted above the others

Objective:
- deliver immediate financial reading
- support fast scanning

### Section 3: Active Preset and Strategy State
Horizontal block below the summary cards.

Content:
- active preset name
- risk level
- configured symbol
- timeframe
- whether `long` is enabled
- whether `short` is enabled
- position size
- secondary button: `Review preset`
- secondary button: `Change preset`

Objective:
- keep the active automation visible
- reduce doubt about the current configuration

### Section 4: Current Trades
Main block of the screen.

Content:
- title: `Current trades`
- open trade counter
- trade list with high visual priority

Each item should show:
- direction
- symbol
- entry price
- current price
- trade PnL
- status
- `Close` button

Objective:
- focus attention on what is at risk now
- allow fast manual action

### Section 5: Recent Trades
Secondary block below or beside Current Trades, depending on width.

Content:
- latest closed trades
- result
- closing reason
- time

Objective:
- provide quick context without competing with active trades

### Section 6: State and Alerts
Smaller support block.

Content:
- error or warning messages
- reconciliation status
- simple operational notifications

Objective:
- make problems visible without polluting the main screen

## Recommended Visual Structure

### Desktop Grid
- 12 columns
- section 1 uses full width
- section 2 uses full width with 4 cards
- section 3 uses full width
- section 4 uses 8 columns
- section 5 uses 4 columns
- section 6 can use full width below or the side of the secondary block

### Size Hierarchy
- balance and PnL numbers are large
- active preset has medium emphasis
- current trades have the highest density
- recent history is more compact
- alerts use color and icon, but should not dominate the UI

## Mobile Behavior

### Block order
1. Operational header
2. Balance and PnL
3. Active preset
4. Current trades
5. Recent trades
6. Alerts

### Rules
- single-column cards
- numbers remain large
- trade list with swipe or expandable detail
- trade close button always visible
- global actions remain at the top

## Main Components

### 1. Summary Card
Use:
- balance
- PnL
- counters

### 2. Active Preset Card
Use:
- explain current automation state
- provide fast access to review

### 3. Current Trades List
Use:
- action and monitoring

### 4. Recent Trades List
Use:
- result context

### 5. Alert Strip
Use:
- error
- reconciliation
- execution warning

## Visual Priority Rules
- open trades matter more than closed trades
- a stopped bot with an error matters more than PnL
- the active preset matters more than history
- connection and account health must appear before secondary details

## What Not to Include in the MVP Dashboard
- candle charts as the main focus
- technical indicator configuration
- full dense history table
- multiple analytics panels
- advanced preset comparison

## Acceptance Criteria
- a user understands whether the bot is active or stopped in less than 3 seconds
- a user finds the active preset without going to another screen
- a user sees current trades before history
- a user can close a trade directly from the Dashboard
- the Dashboard remains legible on mobile

## Final Recommendation
The Dashboard should feel like a simple command center, not an advanced trading terminal.

The screen must prioritize:
- global state
- active preset
- current trades
- fast action
