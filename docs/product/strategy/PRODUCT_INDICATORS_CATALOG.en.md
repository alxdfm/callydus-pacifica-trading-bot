# Final Indicator Catalog

## Objective
Freeze the set of indicators allowed in the MVP so presets remain simple, the contract stays consistent, and translation into the bot engine stays direct.

## Final Catalog

### 1. `emaFast`
- type: exponential moving average
- use: detect short-term acceleration and crossovers
- suggested default: smaller period

### 2. `emaSlow`
- type: exponential moving average
- use: detect broader direction and trend crossover
- suggested default: larger period

### 3. `rsi`
- type: strength oscillator
- use: confirm overbought/oversold conditions and entry timing
- suggested default: 14

### 4. `atr`
- type: volatility
- use: calculate dynamic stop loss distance
- suggested default: 14

### 5. `volume`
- type: raw candle volume
- use: measure market activity
- note: can be used as a trigger or confirmation

### 6. `volumeSma`
- type: simple moving average of volume
- use: create an objective reference to confirm increased activity
- note: resolves the vague reading of volume in the preset

## Product Rules
- the catalog must stay small in the MVP
- every indicator needs a clear role
- presets should use only this set
- the future interface can hide details, but should not change the base vocabulary

## Relationship to Presets
- Conservative: `emaFast`, `emaSlow`, `rsi`, `atr`
- Medium: `emaFast`, `emaSlow`, `rsi`, `volume`, `volumeSma`, `atr`
- Neutral: `volume`, `volumeSma`, `rsi`, `emaFast`, `emaSlow`, `atr`

## Out of MVP
- MACD
- Bollinger Bands
- ADX
- Ichimoku
- any additional indicator without a clear product need

## Outcome
The final catalog closes the MVP configuration vocabulary and prevents premature complexity growth.
