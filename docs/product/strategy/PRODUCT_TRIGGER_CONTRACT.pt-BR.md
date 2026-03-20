# Contrato de Triggers e Operadores

## Objetivo
Definir um formato simples e previsível para expressar regras de entrada do bot, com vocabulário curto, fácil de entender e fácil de traduzir para execução.

## Princípio de Produto
O usuário não deve escrever lógica complexa diretamente.

A interface web vai abstrair isso no futuro, mas o contrato precisa ser simples o suficiente para:
- validar regras antes da execução
- gerar presets automaticamente
- permitir tradução direta para o motor do bot
- evitar ambiguidades na leitura da estratégia

## Tipos de Trigger

### 1. `threshold`
Usado quando um indicador precisa ficar acima, abaixo ou dentro de um valor fixo.

Exemplos:
- RSI abaixo de 30
- RSI acima de 70
- volume acima de 1.5x da média

### 2. `cross`
Usado quando um indicador cruza outro indicador ou cruza um nível fixo.

Exemplos:
- EMA rápida cruza acima da EMA lenta
- EMA rápida cruza abaixo da EMA lenta
- RSI cruza acima de 30

## Operadores Permitidos

### Comparação
- `above`
- `below`
- `atOrAbove`
- `atOrBelow`
- `equal`

### Cruzamento
- `crossesAbove`
- `crossesBelow`

### Lógica
- `all`
- `any`
- `not`

## Escopo de Candle
Para manter o contrato simples, o motor trabalha com dois momentos:
- `previousCandle`
- `currentCandle`

Isso é suficiente para detectar:
- cruzamentos
- confirmações
- reversões simples

## Regras de Montagem
- uma entrada deve ter pelo menos um gatilho principal
- confirmações adicionais podem ser combinadas com `all`
- `long` e `short` são definidos separadamente
- o preset deve declarar claramente o que é gatilho principal e o que é confirmação

## Estrutura Recomendada
### Exemplo de intenção de regra
- o gatilho principal define o momento de entrada
- as confirmações reduzem ruído
- os indicadores são calculados antes da avaliação das regras

### Exemplo conceitual
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

## Regras de Leitura
- `threshold` compara um indicador com um número
- `cross` compara um indicador com outro indicador ou com um nível
- `all` exige que todas as condições sejam verdadeiras
- `any` exige que pelo menos uma condição seja verdadeira
- `not` inverte uma condição

## Regras de Simplicidade
- evitar operadores duplicados com o mesmo significado
- evitar nomes técnicos demais no contrato
- evitar expressões livres demais na primeira versão
- manter o número de combinações pequeno no MVP

## Sugestão de Escopo para o MVP
Para a primeira versão, usar apenas:
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

## O que fica fora do MVP
- expressões matemáticas livres
- condições aninhadas demais
- operadores avançados sem necessidade clara
- lógica customizada por usuário final

## Contrato de Risco: Stop Loss e Take Profit
Como TP e SL são obrigatórios em toda estratégia, eles devem aparecer sempre como parte do contrato do preset.

### Recomendação de Produto
- `stopLoss` define o ponto de invalidação da operação
- `takeProfit` define o ponto de saída por alvo
- os dois sempre existem
- o preset pode escolher como calcular cada um

### Estrutura Sugerida
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

### Modos Permitidos
#### `stopLoss`
- `static`
- `atr`
- `trailing`

#### `takeProfit`
- `static`
- `rr`
- `trailing`

### Leitura dos Modos
- `static`: o valor é definido no momento da entrada e não muda
- `atr`: o stop usa volatilidade para calcular a distância
- `trailing`: o nível acompanha o movimento favorável do preço
- `rr`: take profit baseado em relação risco/retorno

### Recomendação para o MVP
- usar `static` como padrão
- permitir `atr` para stop loss nos presets mais dinâmicos
- deixar `trailing` como opção futura ou de preset específico
- usar `rr` como forma simples de parametrizar take profit

### Regras de Simplicidade
- sempre exigir os dois campos
- evitar permitir muitos modos ao mesmo tempo
- o preset deve escolher a combinação padrão
- a interface futura pode abstrair isso em campos simples

## JSON Final do Preset
Este é o formato base recomendado para o MVP.

### Estrutura Geral
```json
{
  "name": "Mais seguro",
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

### Como `long` e `short` entram no contrato
- `entry.long` define a lógica de compra
- `entry.short` define a lógica de venda
- ambos vivem no mesmo preset
- cada lado pode ser habilitado ou desabilitado
- cada lado usa a mesma linguagem de trigger, com parâmetros espelhados

### Regras de Produto para `long` e `short`
- `long` e `short` devem ser simétricos em leitura
- o usuário deve entender rapidamente qual lado está ativo
- o preset pode habilitar os dois por padrão
- o motor deve validar se os gatilhos de um lado não entram em conflito com o outro

### O que esse JSON resolve
- estrutura única para o preset
- leitura simples para o usuário
- tradução direta para execução
- base clara para os presets conservador, médio e neutro
- base para a interface web abstrair sem mudar o contrato
