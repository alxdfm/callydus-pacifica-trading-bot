# Detailed Presets Screen Layout

## Objective
Define the detailed visual organization of the Presets screen for the MVP, focused on fast comparison, risk understanding, minimal editing, and clear strategy activation.

## Screen Function
The Presets screen should answer three questions:
- which preset makes the most sense for me?
- what does this preset do in simple terms?
- what can I adjust before activating it?

## Layout Principle
The Presets screen should not feel like a technical form.

It should function as:
- comparison
- choice
- review
- activation

## Desktop Structure

### Section 1: Screen Header
Content:
- title: `Presets`
- short subtitle explaining that presets come with ready-made logic
- brief note: `stop loss` and `take profit` are mandatory in all presets

Objective:
- reduce configuration anxiety
- explain that the user does not need to build the strategy from scratch

### Section 2: Preset Cards
The central and most important block of the screen.

Cards:
- Safer
- Balanced
- More active

Each card should show:
- preset name
- risk level
- expected frequency
- default timeframe
- short behavior description
- short list of what it prioritizes
- `Select` button

Objective:
- enable immediate comparison
- turn selection into a simple decision

### Section 3: Short Comparison Panel
Block below or beside the cards.

Content:
- simple table comparing:
  - risk
  - frequency
  - entry style
  - stop type
  - take profit type

Objective:
- avoid forcing the user to open each card to understand the difference

### Section 4: Selected Preset Review Panel
Appears when the user selects a preset.

Content:
- selected preset name
- text summary of the logic in simple language
- MVP editable fields
- note that the strategy is a suggestion, not a return guarantee

Editable fields:
- symbol
- position size
- enable `long`
- enable `short`

Objective:
- provide review without overload
- reinforce that editing is minimal and safe

### Section 5: Activation Block
Final block with the main CTA.

Content:
- final summary of what will be activated
- primary button: `Activate preset`
- secondary action: `Cancel`

Objective:
- close the decision clearly
- avoid ambiguity about which preset will be activated

## Recommended Visual Structure

### Desktop Grid
- 12 columns
- header uses full width
- cards use full width in 3 equal columns
- short comparison uses full width
- preset review uses 8 columns
- activation block uses 4 columns or full width below, depending on implementation

### Emphasis Hierarchy
- cards are the main focus of the page
- selected preset gets border, color, and visual badge
- review sits below comparison
- activation stays visually isolated to avoid accidental clicks

## Mobile Behavior

### Block order
1. Header
2. Preset cards
3. Short comparison in stacked form
4. Selected preset review
5. Activation

### Rules
- one card per row
- selected preset can expand
- comparison should be shown as a list, not a table
- fixed bottom CTA when a preset is selected

## Main Components

### 1. Preset Card
Use:
- quick comparison
- main decision entry point

### 2. Summary Comparator
Use:
- show differences without technical language

### 3. Review Panel
Use:
- hold the editable fields
- show what will be activated

### 4. Activation Block
Use:
- final confirmation

## Visual Priority Rules
- preset selection comes before editing
- editing comes before activation
- risk must be visible before the final click
- the user should not see JSON, indicators, or raw logic on this screen

## What Not to Include in the MVP Presets Screen
- indicator editing
- timeframe editing
- visual condition builder
- multiple configuration levels
- technical details of the JSON contract

## Suggested Content per Card

### Safer
- risk: low
- frequency: lower
- focus: protection and selectivity

### Balanced
- risk: medium
- frequency: balanced
- focus: balance between opportunity and protection

### More active
- risk: medium
- frequency: higher
- focus: more opportunities with looser rules

## Acceptance Criteria
- a user understands the difference between the 3 presets without external documentation
- a user can select a preset in a few seconds
- a user can review the editable fields without confusion
- a user understands which preset will be activated before confirming
- the screen works well on desktop and mobile

## Final Recommendation
The Presets screen should feel like an assisted strategy choice, not a technical parameterization screen.

The focus must remain on:
- simple comparison
- confidence in selection
- minimal review
- clear activation
