# Final MVP Presets

## Objective
Turn the presets into final JSON contracts ready for the bot to consume, and define which fields remain editable in the MVP without breaking product simplicity.

## Product Direction
- the user chooses a preset
- the preset already contains the logic
- the user adjusts only the minimum necessary
- the frontend abstracts complexity, not the contract itself

## General Rules
- `stop loss` and `take profit` are mandatory in every preset
- all three presets use the same contract vocabulary
- indicators and triggers are fixed per preset
- the final indicator catalog is the only one allowed in the MVP

## Preset 1: Safer

### Purpose
More selective entries, lower frequency, and stronger protection.

### Final JSON
```json
{
  "name": "Safer",
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
      "value": 3
    },
    "onePositionPerSymbol": true,
    "manualCloseAllowed": true,
    "closeOppositePositionOnSignal": false
  }
}
```

## Preset 2: Balanced

### Purpose
Balance trade frequency and signal filtering.

### Final JSON
```json
{
  "name": "Balanced",
  "version": 1,
  "timeframe": "15m",
  "symbol": "BTC/USDC",
  "indicators": {
    "emaFast": { "type": "ema", "period": 8 },
    "emaSlow": { "type": "ema", "period": 21 },
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
            "operator": "atOrAbove",
            "value": 50
          },
          {
            "scope": "currentCandle",
            "type": "cross",
            "indicator": "volume",
            "operator": "crossesAbove",
            "ref": "volumeSma"
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
            "operator": "atOrBelow",
            "value": 50
          },
          {
            "scope": "currentCandle",
            "type": "cross",
            "indicator": "volume",
            "operator": "crossesAbove",
            "ref": "volumeSma"
          }
        ]
      }
    }
  },
  "risk": {
    "stopLoss": {
      "mode": "static",
      "value": 1.2,
      "unit": "percent"
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

## Preset 3: More active

### Purpose
Increase opportunity frequency with looser rules, without becoming confusing.

### Final JSON
```json
{
  "name": "More active",
  "version": 1,
  "timeframe": "5m",
  "symbol": "BTC/USDC",
  "indicators": {
    "emaFast": { "type": "ema", "period": 9 },
    "emaSlow": { "type": "ema", "period": 18 },
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
            "indicator": "volume",
            "operator": "crossesAbove",
            "ref": "volumeSma"
          },
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
            "operator": "atOrAbove",
            "value": 45
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
            "indicator": "volume",
            "operator": "crossesAbove",
            "ref": "volumeSma"
          },
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
            "operator": "atOrBelow",
            "value": 55
          }
        ]
      }
    }
  },
  "risk": {
    "stopLoss": {
      "mode": "static",
      "value": 1.0,
      "unit": "percent"
    },
    "takeProfit": {
      "mode": "rr",
      "multiple": 1.6
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

## Editable Fields in the MVP

### Editable
- `symbol`
- `execution.positionSize.value`
- `entry.long.enabled`
- `entry.short.enabled`

### Not Editable in the MVP
- `timeframe`
- base indicators
- indicator periods
- trigger logic
- `stopLoss` mode
- `takeProfit` mode

## Product Rule for Editing
The MVP should give enough control for the user to feel ownership, but not so much that they need technical knowledge to operate.

## Final Recommendation
Keep editing narrow in the MVP and use presets as the primary parametrization mechanism.
