# Detailed History Screen Layout

## Purpose
Define the detailed visual structure of the MVP History screen, focused on simple reading of closed trades, outcome, and close reason.

## Screen Role
The History screen should answer three questions:
- what happened in the closed operations?
- was the result positive or negative?
- did the trade close by target, stop, or manual action?

## Layout Principle
History must not compete with Current Trades.

It should function as:
- quick review
- chronological reading
- later consultation
- result context without analytical excess

## Desktop Structure

### Section 1: Screen Header
Content:
- title: `History`
- short subtitle explaining that this screen shows only closed trades
- compact summary of the number of displayed trades, if that helps without adding noise

Goal:
- make the difference between current operation and past operation obvious
- contextualize the list below

### Section 2: Main Chronological List
Main screen block.

Each item must show:
- symbol
- direction
- entry time
- exit time
- trade result
- close reason
- platform-trade identification

Goal:
- allow fast result reading
- keep a repeatable and scannable structure
- support quick visual comparison between profit and loss

### Section 3: Optional Selected-Item Detail
If desktop includes a detail area.

Content:
- expanded summary of the closed trade
- full timestamps
- basic close sequence
- reason displayed in simple language

Goal:
- add context without making the main list too dense
- keep the screen useful on desktop without raising MVP complexity

### Section 4: Empty State
When there are no closed trades.

Content:
- message: `No trade history yet`
- short text explaining that closed trades will appear here

Goal:
- make the product state clear
- avoid mistaken error interpretation when history is still empty

## Recommended Visual Structure

### Desktop Grid
- 12 columns
- header uses full width
- main list uses 8 or 12 columns, depending on whether detail exists
- optional detail panel uses 4 columns
- empty state uses full width

### Highlight Hierarchy
- the trade result should be the easiest element to scan in each item
- the close reason must be readable without opening another screen
- the list should be visually quieter than Current Trades
- gain and loss should use consistent color treatment without exaggeration

## Mobile Behavior

### Block Order
1. Header
2. Compact history list
3. Optional detail in a dedicated screen or row expansion

### Rules
- each item must summarize result and reason without hover
- avoid wide tables on mobile
- reading should remain chronological and compact
- do not introduce filters in the MVP

## Screen States

### Global states
- loading
- no history
- list with closed trades
- loading error

### Content states
- positive result
- negative result
- closed by target
- closed by stop
- closed manually
- closed with error, if that reason is part of the visible MVP layer

## Product Rules
- the screen must show only closed trades
- close reason must be displayed in simple language
- platform-trade identification must remain visible
- history should help review what happened, not operate the next trade

## What Not To Include In The MVP
- advanced filters
- deep analytics
- performance charts
- extensive period comparisons
- mixing with current trades

## Acceptance Criteria
- a user quickly understands whether the result was positive or negative
- a user identifies the close reason without technical interpretation
- a user can differentiate History from Current Trades within a few seconds
- each item works well on desktop and mobile
- the screen remains simple and scannable

## Final Recommendation
The History screen should feel like a lean result log. The focus should stay on:
- what closed
- how it closed
- what the result was
