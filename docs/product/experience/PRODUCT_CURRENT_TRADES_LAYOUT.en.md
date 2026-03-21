# Detailed Current Trades Screen Layout

## Purpose
Define the detailed visual structure of the MVP Current Trades screen, focused on operational monitoring, fast reading, and unambiguous manual close actions.

## Screen Role
The Current Trades screen should answer four questions:
- which trades are open right now?
- which one needs my attention?
- what is the current state of each trade?
- how do I close a specific trade safely?

## Layout Principle
Current Trades must not look like History.

It should function as:
- immediate monitoring
- a current attention list
- controlled manual intervention
- objective operational reading

## Desktop Structure

### Section 1: Operational Header
Content:
- title: `Current Trades`
- short subtitle explaining that only open positions appear here
- open trades counter
- optional current exposure summary, only if it already exists without adding complexity

Goal:
- make it obvious that this screen only shows what is currently at risk
- reinforce operational priority

### Section 2: Main Trades List
Main screen block.

Content:
- open trades list or table
- simple and predictable ordering
- visual highlight for the selected item

Each item must show:
- direction
- symbol
- entry price
- current price
- PnL
- status
- platform-trade identification
- `Close` action

Goal:
- support fast scanning
- show the essentials without analytical clutter
- provide immediate access to the main screen action

### Section 3: Trade Detail Panel
Side or contextual block on desktop.

Content:
- symbol and direction of the selected trade
- current status
- entry time, if available
- summary of the risk applied at entry, if that is already available in displayable form
- destructive-action confirmation
- final `Close` CTA

Goal:
- avoid accidental closes
- provide minimal context before the manual action
- keep the main list lightweight

### Section 4: Empty State or Support Message
When there are no open trades.

Content:
- message: `No open trades`
- short text explaining that new trades will appear here when the bot is operating
- optional CTA back to `Dashboard` if it helps navigation without competing with the screen

Goal:
- avoid a dead screen
- preserve state clarity

## Recommended Visual Structure

### Desktop Grid
- 12 columns
- header uses full width
- main list uses 8 columns
- detail panel uses 4 columns
- empty state uses full width

### Highlight Hierarchy
- the trades list is the main focus
- PnL must be readable, but not more important than status and direction
- the `Close` button must be visible and unambiguous
- the destructive confirmation should live in the detail panel or an equivalent confirmation step

## Mobile Behavior

### Block Order
1. Header
2. Compact trades list
3. Trade detail in a dedicated screen, drawer, or row expansion
4. Close confirmation

### Rules
- one compact item per block
- the `Close` action remains accessible without hover
- trade detail can open in a dedicated screen or sheet
- avoid wide tables on mobile

## Screen States

### Global states
- loading
- no open trades
- list with trades
- loading error

### Per-trade states
- waiting entry, only if that state is truly visible in the MVP UI layer
- open
- closing trade
- close error

### Manual action states
- action available
- confirmation pending
- close in progress
- closed successfully
- close failed

## Product Rules
- the screen must not mix open and closed trades
- the close action must target one specific trade without stopping the whole bot
- platform-generated trades must be identifiable
- displayed information should prioritize immediate monitoring, not deep analysis

## What Not To Include In The MVP
- complex filters
- history mixed into the same list
- per-trade charts
- editing parameters of an open trade
- multiple manual actions beyond `Close`

## Acceptance Criteria
- a user quickly identifies which trades are open
- a user can differentiate `long` and `short` without effort
- a user can find the current status of each trade without opening another screen
- a user can close a specific trade with clear visual safety
- the screen remains readable on desktop and mobile

## Final Recommendation
The Current Trades screen should feel like a lean operational queue. The focus should stay on:
- what is open
- what is happening now
- which manual action is possible
