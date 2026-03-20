# Preset Validation Against the Contract

## Objective
Verify whether the initial preset proposal fits the trigger, risk, and execution contract defined for the MVP.

## Executive Summary
The initial preset proposal **fits the contract**.

The volume concern is resolved by adopting `volumeSma` as a derived indicator in the final catalog. This keeps the main contract intact and makes the Balanced and More active presets explicit.

## Conclusion by Preset

### 1. Safer
**Status:** directly fits.

**Why it fits**
- uses `cross` for the main trigger
- uses `threshold` for RSI confirmation
- uses `atr` for stop loss
- uses `rr` for take profit
- is simple to explain and execute

**Contract reading**
- `long`: fast EMA crosses above slow EMA + RSI below 30
- `short`: fast EMA crosses below slow EMA + RSI above 70

**Required adjustment**
- none

### 2. Balanced
**Status:** directly fits.

**Why it fits**
- uses `cross` for direction
- uses `threshold` for RSI
- keeps the logic simple and readable

**Attention point**
- volume confirmation uses `volume` against `volumeSma`

**Contract reading**
- `long`: fast EMA crosses above slow EMA + RSI timing + volume confirmation
- `short`: mirror of the long side

**Required adjustment**
- none

### 3. More active
**Status:** directly fits.

**Why it fits**
- uses only operators already defined in the contract
- prioritizes opportunity frequency
- can keep RSI and crossover as simple filters

**Attention point**
- volume must be used as an explicit trigger, not a vague notion

**Contract reading**
- more signals than Safer
- less filtering than Safer
- more visible activity in the interface

**Required adjustment**
- none

## Product Verdict
- **Safer:** ready
- **Balanced:** ready
- **More active:** ready

## Recommendation
Keep the contract as it is and finalize `volumeSma` in the indicator catalog.

### Practical Suggestion
Add a derived indicator:
- `volumeSma`: simple moving average of volume

This enables:
- volume confirmation
- clearer reading
- compatibility with the current contract

## Product Risk
- if volume becomes too generic, the user will not understand what is being measured
- if the preset requires too much interpretation, the product loses simplicity

## Next Decision
Final catalog to be published in a dedicated document.
