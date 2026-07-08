# Worker (`@pacifica/worker`)

Bot WS-first de trading automatizado. Roda em **ECS Fargate** (provisionado pelo `sst.config.ts`, imagem via `packages/worker/Dockerfile`), acessa o banco diretamente via Drizzle. Instância única — exclusão mútua garantida por lease no banco.

## Estrutura de módulos

```
packages/worker/src/
├── index.ts          bootstrap e inicialização
├── bot.ts            motor de trading (tick, reconciliação, execução)
├── candle-buffer.ts  buffer in-memory de candles
├── ws-feed.ts        conexão WebSocket com Pacifica
├── db-watcher.ts     polling de estratégias ativas no banco
├── config/
│   └── env.ts        carregamento e validação de env vars
├── db/               queries Drizzle
├── engine/
│   ├── evaluator.ts  avaliação de sinais e backtesting
│   └── indicators.ts implementações puras dos indicadores (golden tests)
└── exchange/
    └── pacifica/
        ├── client.ts   cliente REST assinado
        ├── adapter.ts  implementa ExchangeInterface
        └── signing.ts  assinatura ed25519
```

## Bootstrap (`index.ts`)

Ordem de inicialização:

1. Carrega `WorkerEnv` do `process.env`
2. Cria Drizzle client com `DATABASE_URL`
3. Cria `CandleBuffer(capacity=300)`
4. Carrega estratégias ativas do DB → extrai `{symbols, intervals}`
5. Cria `PacificaClient` + `PacificaAdapter`
6. Cria `createWsFeed()` com símbolos e intervals
7. Cria `createBot()` e `createDbWatcher()`
8. Inicia: WS feed → DbWatcher → Bot
9. Registra handlers `SIGTERM`/`SIGINT` para graceful shutdown

## CandleBuffer

```typescript
type CandleBufferKey = `${symbol}_${interval}`  // ex: "BTC_1h"

class CandleBuffer {
  constructor(capacity = 300)
  push(symbol: string, interval: CandleInterval, candle: Candle): void
  get(symbol: string, interval: CandleInterval): Candle[]
  isWarm(symbol: string, interval: CandleInterval, minCandles = 50): boolean
}
```

**Invariante:** nunca acessa o banco. Apenas memória.

## WsFeed

Conecta ao WebSocket da Pacifica, faz warm-up via REST e alimenta o `CandleBuffer`.

```typescript
createWsFeed({
  wsUrl, restBaseUrl,
  symbols, intervals,
  buffer,
  onWarm?: (symbol, interval) => void
})
```

**Warm-up:** `GET /api/v1/klines?symbol={}&interval={}&limit=300` para cada par (symbol, interval).

**Candle fechado:** quando a mensagem WS tem `k.isClosed` (ou `k.x`) === true → `buffer.push()`.

**Reconexão:** backoff exponencial: `min(1000 * 2^attempt, 60000)` ms.

## DbWatcher

Polling a cada 30s (padrão) para detectar mudanças nas estratégias ativas.

```typescript
createDbWatcher({
  db,
  pollIntervalMs = 30000,
  onStrategiesChanged: (strategies: Strategy[]) => void
})
```

Compara IDs com a lista anterior. Se mudou → chama `onStrategiesChanged()`.

**DT-001:** substituir por LISTEN/NOTIFY do PostgreSQL.

## Bot

```typescript
createBot({
  db,
  exchange: ExchangeInterface,
  candleBuffer: CandleBuffer,
  env: WorkerEnv
})
// → { start(), stop() }
```

### Ciclo de tick (a cada `HEARTBEAT_INTERVAL_MS` = 15s)

Para cada estratégia ativa:
1. **`reconcileOpenTradesWithExchange()`** — busca posições na exchange; se posição desapareceu, detecta motivo (SL/TP/preço atual) e fecha o trade no DB.
2. Se `shouldEvaluateSignals()` (a cada `ANALYSIS_INTERVAL_MS` = 60s): **`evaluateAndExecute()`**

### Execução de ordem (`evaluateAndExecute`)

```
1. CandleBuffer.get(symbol, interval)
2. evaluateSignal(config, candles) → signal
3. signal == "none" → skip
4. posição já aberta → skip (onePositionPerSymbol)
5. buildRiskPlans() → {sl, tp}
6. validateProtectionLevels(side, entryRef, sl, tp)
7. exchange.getMarketInfo() → tick/lot sizes
8. Normaliza quantidade
9. exchange.createMarketOrder({..., sl, tp})
10. Aguarda 100ms
11. exchange.getPositions() → confirma entryPrice real
12. deriveProtectionFromActualEntry() → ajusta sl/tp para slippage real
13. exchange.setPositionTpsl()
14. insertTrade(db, {status: "open"})
15. insertEvent(db, "trade_opened")
```

Se qualquer passo falhar: `insertEvent(db, "order_failed")` com classificação retryable/blocking.

### Detecção de close (reconciliação)

```
Para cada trade "open" / "close_requested" / "closing":
  exchange.getPositions()
  se posição não encontrada na exchange:
    resolveDetectedClose(trade, currentPrice) → closeReason
    calculateRealizedPnl()
    updateTrade(db, {status: "closed", closeReason, realizedPnl, exitPrice})
    insertEvent(db, "trade_closed")
```

## Engine de sinais (`engine/evaluator.ts`)

### `evaluateSignal(config, candles)`

```typescript
type EvaluatedSignal = {
  signal: "none" | "long" | "short"
  longSignal: boolean
  shortSignal: boolean
  indicators: Record<string, { previous: number; current: number }>
  longRuleEvaluations: RuleEvaluation[]
  shortRuleEvaluations: RuleEvaluation[]
}
```

Fluxo:
1. `buildIndicatorSeriesMap()` — calcula EMA, SMA, RSI, ATR, Donchian e ADX sobre os candles (implementações puras em `engine/indicators.ts`, sem dependência externa; paridade numérica com a lib substituída garantida por golden tests)
2. Extrai valores `previous` e `current` (últimos 2) de cada indicador
3. Avalia regras (threshold ou cross) para entry long e short
4. TriggerGroupType `"all"` = AND, `"any"` = OR
5. Resultado: `"long"`, `"short"` ou `"none"` (conflito = none)

### `buildRiskPlans(config, indicators, entryPrice)`

Calcula `{long: {sl, tp}, short: {sl, tp}}` com base em:
- `stopLoss.mode === "static"` → distância percentual fixa
- `stopLoss.mode === "atr"` → `atrValue * multiplier`
- `takeProfit.mode === "rr"` → `riskDistance * multiple`

### `simulatePresetBacktest(input)`

Simula estratégia candle a candle:
- Entra no open do candle seguinte ao sinal
- Detecta SL/TP touches dentro do candle (SL preferido se ambos tocam)
- Aplica slippage e fee por operação
- Retorna `equityCurve`, `holdCurve`, `drawdownCurve`, `trades`, `summary`

## Cliente Pacifica (`exchange/pacifica/client.ts`)

```typescript
class PacificaClient {
  // Endpoints
  getMarketInfo()                    // GET /api/v1/info (não assinado)
  getPositions()                     // POST /api/v1/positions (assinado)
  createMarketOrder(input)           // POST /api/v1/orders (assinado)
  createLimitOrder(input)            // POST /api/v1/orders (assinado)
  setPositionTpsl(input)             // POST /api/v1/orders (assinado)
  cancelOrder(input)                 // POST /api/v1/orders/{id}/cancel (assinado)
}
```

**Assinatura:** ed25519 com agent wallet private key. Inclui `timestamp` + `builderCode` + payload. A chave de assinatura é derivada **sob demanda** (lazy) — endpoints públicos (market info, candles) funcionam com o client raiz de placeholders.

Replay protection: requisições com `timestamp` fora da janela `expiryWindowMs` são rejeitadas.

## Variáveis de ambiente do Worker

| Variável | Padrão | Obrigatória |
|----------|--------|-------------|
| `DATABASE_URL` | — | sim |
| `CREDENTIAL_ENCRYPTION_KEY` | — (mín. 32 chars) | sim |
| `CREDENTIAL_ENCRYPTION_KEY_ID` | `local-dev-v1` | não |
| `PACIFICA_BUILDER_CODE` | — | sim |
| `PACIFICA_WS_URL` | `wss://ws.pacifica.fi/ws` | não |
| `PACIFICA_REST_URL` | `https://api.pacifica.fi` | não |
| `WORKER_ID` | `worker-local-1` | não |
| `MARKET_ORDER_SLIPPAGE_PERCENT` | `0.5` | não |
| `TAKER_FEE_PERCENT` | `0.05` | não |
| `SCAN_INTERVAL_MS` | `5000` | não |
| `HEARTBEAT_INTERVAL_MS` | `15000` | não |
| `ANALYSIS_INTERVAL_MS` | `60000` | não |
| `LEASE_DURATION_MS` | `45000` | não |
| `MAX_BACKOFF_MS` | `30000` | não |
| `PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` | `30000` | não |
| `SIGNAL_TRACE_ENABLED` | `false` | não — NUNCA ativar em produção (expõe dados financeiros) |
