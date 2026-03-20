# Presets Finais do MVP

## Objetivo
Transformar os presets em contratos JSON finais, já prontos para o bot consumir, e definir quais campos ficam editáveis no MVP sem quebrar a simplicidade do produto.

## Direção de Produto
- o usuário escolhe um preset
- o preset já traz a lógica pronta
- o usuário ajusta apenas o mínimo necessário
- o frontend abstrai complexidade, não a lógica do contrato

## Regras Gerais
- `stop loss` e `take profit` são obrigatórios em todos os presets
- os três presets usam o mesmo vocabulário de contrato
- os indicadores e gatilhos ficam fechados por preset
- o catálogo final de indicadores é o único permitido no MVP

## Preset 1: Conservador

### Propósito
Entradas mais seletivas, menor frequência e maior proteção.

### JSON Final
```json
{
  "name": "Conservador",
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

## Preset 2: Médio

### Propósito
Equilibrar frequência de operações e filtragem de sinais.

### JSON Final
```json
{
  "name": "Médio",
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

## Preset 3: Neutro

### Propósito
Aumentar a frequência de oportunidades com regras mais abertas, sem virar uma configuração confusa.

### JSON Final
```json
{
  "name": "Neutro",
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

## Campos Editáveis no MVP

### Editáveis
- `symbol`
- `execution.positionSize.value`
- `entry.long.enabled`
- `entry.short.enabled`

### Não editáveis no MVP
- `timeframe`
- indicadores base
- períodos dos indicadores
- lógica dos gatilhos
- modo de `stopLoss`
- modo de `takeProfit`

## Regra de Produto para Edição
O MVP deve permitir ajuste suficiente para o usuário sentir controle, mas não tanto a ponto de exigir conhecimento técnico para operar.

## Recomendação Final
Manter a edição enxuta no MVP e usar os presets como o principal mecanismo de parametrização.
