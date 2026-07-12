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

## StrategyDraft (wire + persistido) vs contrato materializado

Desde o contrato v2 (2026-07-10), o que trafega no wire e é persistido como
JSONB em `strategies.config` é o **draft** — fonte única em
`@pacifica/shared/contracts` (`strategyDraftSchema`):

```typescript
interface StrategyDraft {
  name:      string              // 1–80 chars
  symbol:    "BTC/USDC" | "ETH/USDC" | "SOL/USDC"
  timeframe: "3m" | "5m" | "15m"

  indicators: Record<string, IndicatorConfig>

  entry: {
    long:  { enabled: boolean; trigger: TriggerGroup }
    short: { enabled: boolean; trigger: TriggerGroup }
  }                              // refine: pelo menos um lado enabled

  risk: {
    stopLoss:   StopLossConfig
    takeProfit: TakeProfitConfig | null
  }

  positionSizeType:  "fixed_amount" | "balance_percent"
  positionSizeValue: number      // > 0
}
```

O shape com `version` + bloco `execution` (`positionSize.type: "fixedPercent"`,
`onePositionPerSymbol`, `manualCloseAllowed`, `closeOppositePositionOnSignal`)
é o **contrato técnico materializado**, derivado do draft em runtime por
`materializeYourStrategyTechnicalContract` — portado byte a byte em
`api/src/engine/evaluator.ts` E `worker/src/engine/evaluator.ts` (paridade
obrigatória, ver `docs/modules/worker.md`). Ele nunca é persistido nem trafega.

### IndicatorConfig

```typescript
type IndicatorConfig =
  | { type: "ema";      period: number; source?: string }
  | { type: "rsi";      period: number }
  | { type: "atr";      period: number }
  | { type: "volume" }
  | { type: "sma";      source: string; period: number }
  | { type: "donchian"; period: number; band: "upper" | "lower" | "middle" }
  | { type: "adx";      period: number }
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
type TradeStatus = "open" | "close_requested" | "closing" | "closed"
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
