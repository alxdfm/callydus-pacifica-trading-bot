# Tipos Compartilhados (`@pacifica/shared`)

Primitivos usados por `api`, `worker` e `frontend`.

## Candle

```typescript
type CandleInterval = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d"

interface Candle {
  symbol:    string
  interval:  CandleInterval
  openTime:  number   // ms epoch
  closeTime: number   // ms epoch
  open:      number
  high:      number
  low:       number
  close:     number
  volume:    number
}
```

## Signal

```typescript
type Signal = "none" | "long" | "short"
```

## StrategyConfig

Configuração completa de uma estratégia. Persistida como JSONB na tabela `strategies.config`.

```typescript
interface StrategyConfig {
  name:      string
  version:   number
  timeframe: string    // ex: "1h"
  symbol:    string    // ex: "BTC/USDC"

  indicators: Record<string, IndicatorConfig>

  entry: {
    long:  { enabled: boolean; trigger: TriggerGroup }
    short: { enabled: boolean; trigger: TriggerGroup }
  }

  risk: {
    stopLoss:   StopLossConfig
    takeProfit: TakeProfitConfig
  }

  execution: {
    positionSize:                  { type: "fixedPercent"; value: number }
    onePositionPerSymbol:          boolean
    manualCloseAllowed:            boolean
    closeOppositePositionOnSignal: boolean
  }
}
```

### IndicatorConfig

```typescript
type IndicatorConfig =
  | { type: "ema";    period: number; source?: string }
  | { type: "rsi";    period: number }
  | { type: "atr";    period: number }
  | { type: "volume" }
  | { type: "sma";    source: string; period: number }
```

### TriggerGroup e TriggerRule

```typescript
type TriggerGroupType = "all" | "any"  // AND | OR

interface TriggerGroup {
  type:  TriggerGroupType
  rules: TriggerRule[]
}

type TriggerScope    = "previousCandle" | "currentCandle"
type ThresholdOperator = "above" | "below" | "atOrAbove" | "atOrBelow" | "equal"
type CrossOperator   = "crossesAbove" | "crossesBelow"

// Threshold contra valor fixo
type TriggerRule =
  | { scope: TriggerScope; type: "threshold"; indicator: string; operator: ThresholdOperator; value: number }
  | { scope: TriggerScope; type: "threshold"; indicator: string; operator: ThresholdOperator; ref: string }
  // Cross entre indicador e valor fixo ou outro indicador
  | { scope: TriggerScope; type: "cross";     indicator: string; operator: CrossOperator;     value: number }
  | { scope: TriggerScope; type: "cross";     indicator: string; operator: CrossOperator;     ref: string }
```

### StopLossConfig / TakeProfitConfig

```typescript
type StopLossConfig =
  | { mode: "static"; value: number; unit: "percent" }
  | { mode: "atr";    period: number; multiplier: number }

type TakeProfitConfig =
  | { mode: "rr"; multiple: number }    // risk:reward
```

## Trade (tipos runtime)

```typescript
type TradeSide   = "long" | "short"
type TradeStatus = "open" | "close_requested" | "closing" | "sync_error"
type CloseReason = "take_profit" | "stop_loss" | "manual" | "system" | "error"
```

## Exchange (interface genérica)

```typescript
interface ExchangePosition {
  symbol:     string
  side:       "bid" | "ask"
  amount:     string
  entryPrice: string | null
}

interface MarketInfo {
  symbol:       string
  tickSize:     string
  lotSize:      string
  minOrderSize: string
}

interface TpSlOrder {
  stopPrice:     string
  limitPrice?:   string | null
  clientOrderId?: string | null
}

interface CreateOrderInput {
  symbol:           string
  side:             "bid" | "ask"
  amount:           string
  slippagePercent:  string
  clientOrderId:    string
  reduceOnly?:      boolean
  takeProfit?:      TpSlOrder | null
  stopLoss?:        TpSlOrder | null
}

interface ExchangeInterface {
  getPositions():                              Promise<ExchangePosition[]>
  getMarketInfo():                             Promise<MarketInfo[]>
  createMarketOrder(input: CreateOrderInput):  Promise<CreateOrderResult>
  setPositionTpsl(input: SetTpslInput):        Promise<void>
  closePosition(input: ClosePositionInput):    Promise<void>
}
```
