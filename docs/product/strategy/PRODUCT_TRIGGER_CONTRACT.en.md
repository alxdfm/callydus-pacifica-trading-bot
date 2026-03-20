# Trigger and Operator Contract

## Objective
Define a simple and predictable format to express bot entry rules, with a short vocabulary that is easy to understand and easy to translate into execution.

## Product Principle
The user should not write complex logic directly.

The future web interface will abstract this, but the contract must be simple enough to:
- validate rules before execution
- generate presets automatically
- translate directly into the bot engine
- avoid ambiguity when reading a strategy

## Trigger Types

### 1. `threshold`
Used when an indicator must be above, below, or within a fixed value.

Examples:
- RSI below 30
- RSI above 70
- volume above 1.5x average

### 2. `cross`
Used when one indicator crosses another indicator or crosses a fixed level.

Examples:
- fast EMA crosses above slow EMA
- fast EMA crosses below slow EMA
- RSI crosses above 30

## Allowed Operators

### Comparison
- `above`
- `below`
- `atOrAbove`
- `atOrBelow`
- `equal`

### Crossing
- `crossesAbove`
- `crossesBelow`

### Logic
- `all`
- `any`
- `not`

## Candle Scope
To keep the contract simple, the engine works with two moments:
- `previousCandle`
- `currentCandle`

This is enough to detect:
- crossovers
- confirmations
- simple reversals

## Composition Rules
- an entry must have at least one main trigger
- extra confirmations can be combined with `all`
- `long` and `short` are defined separately
- the preset should clearly declare which condition is the main trigger and which ones are confirmations

## Recommended Structure
### Rule intent
- the main trigger defines the entry moment
- confirmations reduce noise
- indicators are calculated before rule evaluation

### Conceptual example
```json
{
  "type": "all",
  "rules": [
    {
      "type": "cross",
      "indicator": "emaFast",
      "operator": "crossesAbove",
      "ref": "emaSlow"
    },
    {
      "type": "threshold",
      "indicator": "rsi",
      "operator": "below",
      "value": 30
    }
  ]
}
```

## Reading Rules
- `threshold` compares an indicator to a number
- `cross` compares one indicator to another indicator or to a level
- `all` requires every condition to be true
- `any` requires at least one condition to be true
- `not` inverts a condition

## Simplicity Rules
- avoid duplicate operators with the same meaning
- avoid overly technical names in the contract
- avoid free-form expressions in the first version
- keep the number of combinations small in the MVP

## Suggested MVP Scope
For the first version, use only:
- `threshold`
- `cross`
- `all`
- `any`
- `above`
- `below`
- `atOrAbove`
- `atOrBelow`
- `crossesAbove`
- `crossesBelow`

## Out of MVP
- free-form mathematical expressions
- deeply nested conditions
- advanced operators without clear need
- custom logic written by the end user

## Risk Contract: Stop Loss and Take Profit
Because TP and SL are mandatory in every strategy, they must always be part of the preset contract.

### Product Recommendation
- `stopLoss` defines the invalidation point for the trade
- `takeProfit` defines the target exit point
- both always exist
- the preset can choose how each one is calculated

### Suggested Structure
```json
{
  "risk": {
    "stopLoss": {
      "mode": "static",
      "value": 1.0,
      "unit": "percent"
    },
    "takeProfit": {
      "mode": "static",
      "value": 2.0,
      "unit": "rr"
    }
  }
}
```

### Allowed Modes
#### `stopLoss`
- `static`
- `atr`
- `trailing`

#### `takeProfit`
- `static`
- `rr`
- `trailing`

### Mode Meaning
- `static`: the value is set at entry time and does not change
- `atr`: the stop uses volatility to calculate the distance
- `trailing`: the level follows the favorable move in price
- `rr`: take profit based on risk/reward ratio

### MVP Recommendation
- use `static` as the default
- allow `atr` for stop loss in more dynamic presets
- keep `trailing` as a future option or a dedicated preset
- use `rr` as the simplest way to parametrize take profit

### Simplicity Rules
- always require both fields
- avoid allowing too many modes at once
- the preset should choose the default combination
- the future interface can abstract this into simple fields

## Final Preset JSON
This is the recommended base format for the MVP.

### Overall Structure
```json
{
  "name": "Conservative",
  "version": 1,
  "timeframe": "15m",
  "symbol": "BTC/USDC",
  "indicators": {
    "emaFast": { "type": "ema", "period": 12 },
    "emaSlow": { "type": "ema", "period": 24 },
    "rsi": { "type": "rsi", "period": 14 },
    "atr": { "type": "atr", "period": 14 },
    "volume": { "type": "volume" },
    "volumeSma": { "type": "sma", "source": "volume", "period": 20 }
  },
  "entry": {
    "long": {
      "enabled": true,
      "trigger": {
        "type": "all",
        "rules": [
          {
            "scope": "currentCandle",
            "type": "cross",
            "indicator": "emaFast",
            "operator": "crossesAbove",
            "ref": "emaSlow"
          },
          {
            "scope": "currentCandle",
            "type": "threshold",
            "indicator": "rsi",
            "operator": "below",
            "value": 30
          }
        ]
      }
    },
    "short": {
      "enabled": true,
      "trigger": {
        "type": "all",
        "rules": [
          {
            "scope": "currentCandle",
            "type": "cross",
            "indicator": "emaFast",
            "operator": "crossesBelow",
            "ref": "emaSlow"
          },
          {
            "scope": "currentCandle",
            "type": "threshold",
            "indicator": "rsi",
            "operator": "above",
            "value": 70
          }
        ]
      }
    }
  },
  "risk": {
    "stopLoss": {
      "mode": "atr",
      "period": 14,
      "multiplier": 1.5
    },
    "takeProfit": {
      "mode": "rr",
      "multiple": 2
    }
  },
  "execution": {
    "positionSize": {
      "type": "fixedPercent",
      "value": 5
    },
    "onePositionPerSymbol": true,
    "manualCloseAllowed": true,
    "closeOppositePositionOnSignal": false
  }
}
```

### How `long` and `short` fit into the contract
- `entry.long` defines the buy logic
- `entry.short` defines the sell logic
- both live in the same preset
- each side can be enabled or disabled
- each side uses the same trigger language, with mirrored parameters

### Product Rules for `long` and `short`
- `long` and `short` must be symmetric in readability
- the user should quickly understand which side is active
- the preset can enable both by default
- the engine must validate that one side does not conflict with the other

### What This JSON Solves
- one clear preset structure
- simple user-facing reading
- direct translation into execution
- a clean base for Conservative, Medium, and Neutral presets
- a stable contract for the future web interface to abstract without changing the model
