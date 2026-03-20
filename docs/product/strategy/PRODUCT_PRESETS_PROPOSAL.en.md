# Initial Preset Proposal

## Objective
Define an initial family of simple presets with clear names and predictable behavior so the user can start a strategy without building the logic from scratch.

## Product Direction
Presets should hide indicator complexity and expose only the essentials:
- risk profile
- base indicators
- editable parameters
- short explanation of expected behavior

The user selects a preset based on trading style and adjusts only what is necessary.

## Assumptions
- `stop loss` and `take profit` are mandatory in every preset
- presets are strategy suggestions, not guarantees of returns
- prior manual validation can be used as a design reference
- the first version must prioritize simplicity and clarity

## Standard Structure for Each Preset
- name
- risk level
- intended use
- base logic
- editable parameters
- validation note

## Preset 1: Conservative
### Objective
Seek more selective entries, with lower frequency and stronger protection.

### Profile
- risk: low
- focus: protection and strong confirmation

### Suggested Base Logic
- trend filter with moving average
- confirmation with RSI
- volatility filter with ATR

### Entry Idea
- trade only when trend is favorable
- require strength confirmation before entering
- avoid sideways or highly unstable markets

### Editable Parameters
- moving average period
- RSI window
- RSI threshold
- ATR stop multiplier
- risk/reward ratio

### When It Makes Sense
- when the user wants fewer trades
- when protection is the main priority
- when the product needs a safer narrative

## Preset 2: Medium
### Objective
Balance trade frequency and signal filtering.

### Profile
- risk: medium
- focus: balance between opportunity and protection

### Suggested Base Logic
- moving averages for direction
- RSI for timing
- volume and `volumeSma` for movement confirmation

### Entry Idea
- enter when trend and momentum align
- accept more signals than the conservative preset
- keep enough filtering to reduce excessive noise

### Editable Parameters
- moving average periods
- RSI window
- volume moving average period
- volume multiplier
- ATR-based or percentage stop
- risk/reward ratio

### When It Makes Sense
- when the user wants a middle ground
- when the demo needs more visible activity
- when we want a good narrative balance

## Preset 3: Neutral
### Objective
Increase opportunity frequency with looser rules, without claiming aggressiveness.

### Profile
- risk: medium-high in frequency
- focus: more trade volume

### Suggested Base Logic
- volume as the main trigger
- confirmation through RSI or moving average crossover
- ATR to adapt the stop to volatility

### Entry Idea
- allow more entries when movement is clear
- use fewer filters than the other presets
- prioritize opportunity over maximum selectivity

### Editable Parameters
- RSI or moving average window
- volume moving average period
- volume multiplier
- ATR multiplier
- risk/reward ratio
- trigger sensitivity level

### When It Makes Sense
- when the user wants more trades
- when the strategy needs higher recurrence
- when the product narrative benefits from more visible activity

## Differentiation Criterion
The three presets must differ in:
- entry frequency
- filtering strength
- market sensitivity
- perceived risk profile

They should not be cosmetic variations of the same parameters.

## Manual Validation
If prior manual validation exists, it should only guide preset design.

Example:
- recreate the logic in Pine Script on TradingView
- observe historical behavior
- refine preset parameters

This is:
- product support
- behavior reference
- not a guarantee of future performance

## Next Decisions
- which parameters users can edit in the MVP
- how presets will be explained in the web interface
