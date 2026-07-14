# Worker (`@pacifica/worker`)

Bot de trading **agendado** (desde 2026-07-14; antes era WS-first em ECS
Fargate 24/7). Roda como Lambda invocada por um `sst.aws.Cron` horário no
minuto :01 UTC, acessa o banco diretamente via Drizzle. Exclusão mútua vem de
`concurrency: { reserved: 1 }` na função — nunca duas execuções em paralelo.

O bot só avalia candle FECHADO e os timeframes são 1h/4h, então o sinal só pode
mudar de hora em hora. SL/TP são submetidos à exchange junto com a ordem: o bot
fora do ar entre invocações não desprotege posição nenhuma.

## Estrutura de módulos

```
packages/worker/src/
├── handler.ts           entry da Lambda: um tick por invocação
├── index.ts             entry local de dev (invoca o handler uma vez)
├── bot.ts               motor de trading (tick, reconciliação, execução)
├── candle-buffer.ts     buffer in-memory de candles
├── candle-fetch.ts      busca de candles via REST (/api/v1/kline)
├── market-snapshot.ts   snapshot horário de funding/OI (/api/v1/info)
├── config/
│   └── env.ts           carregamento e validação de env vars
├── db/                  queries Drizzle
├── engine/
│   ├── evaluator.ts     avaliação de sinais e backtesting
│   └── indicators.ts    implementações puras dos indicadores (golden tests)
└── exchange/
    └── pacifica/
        ├── client.ts    cliente REST assinado
        ├── adapter.ts   implementa ExchangeInterface
        └── signing.ts   assinatura ed25519
```

## Handler (`handler.ts`)

Cada invocação é um mundo novo:

1. Carrega `WorkerEnv` do `process.env` e cria o Drizzle client
2. Carrega estratégias ativas do DB → deriva os pares exatos
   `(símbolo, timeframe)` (`resolveCandlePairs`, sem cross-product)
3. Busca ~300 candles por par via REST e enche um `CandleBuffer` novo
4. Cria `createBot()` e roda **um** tick (`runOnce()`)
5. Grava o snapshot horário de funding/OI (`market-snapshot.ts`)
6. `finally`: fecha a conexão com o banco (`db.$client.end()`) — em Lambda uma
   conexão pendurada não é confiável na invocação seguinte e atrasa o
   autosuspend do Neon

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

## CandleFetch (`candle-fetch.ts`)

`GET /api/v1/kline?symbol={}&interval={}&start_time={}&end_time={}` — endpoint
no singular, janelas em ms. Mesma tolerância de shape do warm-up antigo do WS
(camelCase, snake_case e o formato compacto `t/T/o/h/l/c/v`). Falha devolve
`[]`; quem decide se dá para avaliar é o bot (mínimo de candles), não o fetch.

O parse pode incluir o candle EM ANDAMENTO — não é problema: o bot filtra por
`closeTime <= alignToLastClosedCandleEndTime(now)` e só avalia candle fechado.

## Bot

```typescript
createBot({
  db,
  exchange: ExchangeInterface,
  candleBuffer: CandleBuffer,
  env: WorkerEnv
})
// → { runOnce(), onStrategiesChanged() }
```

O bot não tem agendador próprio: quem decide QUANDO tickar é o chamador (o
handler, invocado pelo cron). As estratégias entram por `onStrategiesChanged()`
antes do `runOnce()` — não há mais watcher/hot-reload porque cada invocação
carrega a lista fresca do banco.

### Ciclo de tick (uma vez por invocação)

Para cada estratégia ativa:
1. **`reconcileOpenTradesWithExchange()`** — busca posições na exchange; se posição desapareceu, detecta motivo (SL/TP/preço atual) e fecha o trade no DB.
2. **`evaluateAndExecute()`** — avalia o último candle fechado e executa se houver sinal.

### Execução de ordem (`evaluateAndExecute`)

```
1. CandleBuffer.get(symbol, interval), filtrado a candle fechado
2. candle já avaliado (lastEvaluatedCandleOpenTime) → skip
3. evaluateSignal(config, candles) → signal
4. signal == "none" → skip
5. posição já aberta no BANCO → skip (onePositionPerSymbol)
6. posição não registrada na EXCHANGE → skip (guard contra posição órfã:
   crash entre a ordem e o insert, ou trade manual do usuário — o reconcile
   só anda banco→exchange e nunca a veria; sem verificar, não entra)
7. buildRiskPlans() → {sl, tp}
8. validateProtectionLevels(side, entryRef, sl, tp)
9. exchange.getMarketInfo() → tick/lot sizes
10. Normaliza quantidade
11. exchange.createMarketOrder({..., sl, tp})
12. exchange.getPositions() → confirma entryPrice real
13. deriveProtectionFromActualEntry() → ajusta sl/tp para slippage real
14. exchange.setPositionTpsl()
15. insertTrade(db, {status: "open"})
16. insertEvent(db, "trade_opened")
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
| `PACIFICA_REST_URL` | `https://api.pacifica.fi` | não |
| `MARKET_ORDER_SLIPPAGE_PERCENT` | `0.5` | não |
| `TAKER_FEE_PERCENT` | `0.05` | não |
| `PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` | `30000` | não |
| `SIGNAL_TRACE_ENABLED` | `false` | não — NUNCA ativar em produção (expõe dados financeiros) |

As variáveis de cadência do worker residente (`SCAN/HEARTBEAT/ANALYSIS_INTERVAL_MS`,
`LEASE_DURATION_MS`, `MAX_BACKOFF_MS`, `WORKER_ID`, `PACIFICA_WS_URL`) morreram
com o modelo 24/7 — a cadência agora é o schedule do cron.
