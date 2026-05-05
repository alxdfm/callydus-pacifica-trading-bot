# Plano de Refatoração: trading-bot-pacifica

**Data:** 2026-05-05  
**Última atualização:** 2026-05-05  
**Status do sistema:** parado — sem necessidade de compatibilidade retroativa  
**Objetivo:** migrar para Hono + Drizzle + WS-first no Worker, com estrutura de pacotes flat em `packages/`

## Progresso

| Fase | Status |
|------|--------|
| 1 — Limpeza de dead code | ✅ Concluída |
| 2 — Schema Drizzle | ✅ Concluída |
| 3 — `packages/shared/` | pendente |
| 4 — `packages/worker/` | pendente |
| 5 — `packages/api/` (Hono) | pendente |
| 6 — `packages/frontend/` | pendente |
| 7 — Deletar pacotes obsoletos | pendente |
| 8 — SST v3 + Dockerfile | pendente |

---

## Mapeamento atual vs. alvo

| Atual | Alvo | Ação |
|---|---|---|
| `apps/api/` | `packages/api/` | mover + reescrever framework (Express-like → Hono) |
| `apps/worker/` | `packages/worker/` | mover + decompor `createOperationalWorker.ts` |
| `apps/app/` | `packages/frontend/` | mover sem reescrever |
| `packages/database/` (Prisma) | `packages/api/src/db/` (Drizzle inline) | migrar ORM, deletar pacote |
| `packages/contracts/` | `packages/shared/` | renomear + enxugar |
| `packages/pacifica-trading/` | `packages/worker/src/exchange/pacifica/` + `packages/api/src/exchange/pacifica/` | inlinar, deletar pacote |
| `packages/pacifica-market-data/` | deletar | substituído por WS no worker; API não usa market data |
| `packages/preset-engine/` | `packages/worker/src/engine/` | portar, deletar pacote |
| `packages/credential-crypto/` | `packages/api/src/crypto/` | inlinar, deletar pacote |

---

## Fase 1 — Preparação e limpeza de dead code ✅

**Objetivo:** remover arquivos transitórios e código morto antes de qualquer reestruturação, para ter uma base limpa.

**Critério de conclusão:** `pnpm typecheck` passa; nenhum arquivo dos itens abaixo existe mais.

**Concluída em:** 2026-05-05 — typecheck verde em `@pacifica/api` e `@pacifica/worker`.

### 1.1 Deletar arquivos transitórios de market data na API

```
DELETE apps/api/src/infrastructure/market-data/HybridMarketDataGateway.ts
DELETE apps/api/src/infrastructure/market-data/HybridMarketDataGateway.test.ts
DELETE apps/api/src/infrastructure/market-data/RealtimeCandleCache.ts
DELETE apps/api/src/infrastructure/market-data/startLocalMarketDataRefreshScheduler.ts
DELETE apps/api/src/infrastructure/market-data/startLocalMarketDataRefreshScheduler.test.ts
DELETE apps/api/src/infrastructure/market-data/marketDataFreshness.ts
DELETE apps/api/src/infrastructure/market-data/candleWindow.ts
DELETE apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.ts
DELETE apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.test.ts
DELETE apps/api/src/infrastructure/persistence/PrismaMarketDataSnapshotRepository.ts
DELETE apps/api/src/infrastructure/persistence/PrismaMarketDataSnapshotRepository.test.ts
```

### 1.2 Deletar use cases de market data na API

```
DELETE apps/api/src/application/refresh-market-data/RefreshMarketData.ts
DELETE apps/api/src/application/refresh-market-data/RefreshMarketData.test.ts
DELETE apps/api/src/application/refresh-market-data/RefreshMarketDataManually.ts
DELETE apps/api/src/application/cleanup-market-data/CleanupMarketData.ts
DELETE apps/api/src/application/cleanup-market-data/CleanupMarketData.test.ts
DELETE apps/api/src/application/get-market-candles/GetMarketCandles.ts
DELETE apps/api/src/application/get-market-candles/GetMarketCandles.test.ts
DELETE apps/api/src/application/get-market-prices/GetMarketPrices.ts
DELETE apps/api/src/application/get-market-prices/GetMarketPrices.test.ts
```

### 1.3 Deletar rotas e scripts de market data na API

```
DELETE apps/api/src/ui/http/routes/createGetMarketCandlesRoute.ts
DELETE apps/api/src/ui/http/routes/createGetMarketPricesRoute.ts
DELETE apps/api/src/ui/http/routes/createRefreshMarketDataRoute.ts
DELETE apps/api/src/lambda/marketRefreshHandler.ts
DELETE apps/api/src/scripts/refreshMarketData.ts
DELETE apps/api/src/scripts/cleanupMarketData.ts
```

### 1.4 Deletar domain ports de market data na API

```
DELETE apps/api/src/domain/market-data/MarketDataPort.ts
DELETE apps/api/src/domain/market-data/MarketDataSnapshotRepository.ts
```

### 1.5 Deletar PersistedWorkerMarketDataGateway no Worker (substituído por CandleBuffer)

```
DELETE apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.ts
DELETE apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.test.ts
```

### 1.6 Remover referências no createApiModule.ts e createApiRuntime.ts

Em `apps/api/src/createApiModule.ts`:
- Remover imports de `RefreshMarketData`, `RefreshMarketDataManually`, `CleanupMarketData`, `GetMarketCandles`, `GetMarketPrices`
- Remover os use cases correspondentes do objeto retornado
- Remover o parâmetro `marketData` / `HybridMarketDataGateway` do factory

Em `apps/api/src/bootstrap/createApiRuntime.ts`:
- Remover `allowStaleCandleFallbackInProduction` do environment
- Remover instanciação de `HybridMarketDataGateway` e `startLocalMarketDataRefreshScheduler`

Em `apps/api/src/server.ts`:
- Remover import e chamada de `startLocalMarketDataRefreshScheduler`

Em `apps/api/src/infrastructure/config/createApiEnvironment.ts`:
- Remover campos relativos a market data refresh

---

## Fase 2 — Novo schema de banco (Drizzle) ✅

**Objetivo:** definir o schema alvo em Drizzle e gerar a migration SQL de transição. O Prisma continua existindo até a Fase 5.

**Critério de conclusão:** arquivo `apps/api/src/db/schema.ts` compilando com Drizzle; migration SQL gerada e revisada.

**Concluída em:** 2026-05-05 — schema em `apps/api/src/db/schema.ts` (será movido para `packages/api/src/db/schema.ts` na Fase 5). Migration SQL em `apps/api/src/db/migrations/0000_military_makkari.sql`. Scripts `db:generate` e `db:migrate` adicionados ao `package.json`. Migration **não executada** no banco — aguarda Fase 7.

### 2.1 Instalar Drizzle no workspace

No `packages/api/package.json` (ainda não existe — criar o pacote é Fase 4, mas as deps podem ser adicionadas no package.json raiz como dev antecipado para viabilizar geração de schema):

```bash
pnpm add drizzle-orm postgres --filter @pacifica/api
pnpm add -D drizzle-kit --filter @pacifica/api
```

### 2.2 Criar `packages/api/src/db/schema.ts`

Schema alvo — quatro tabelas + enums necessários:

```typescript
// packages/api/src/db/schema.ts
import {
  pgTable, pgEnum, uuid, text, jsonb, numeric,
  timestamp, boolean, index, uniqueIndex
} from "drizzle-orm/pg-core";

export const strategyStatusEnum = pgEnum("strategy_status", [
  "active", "paused", "stopped"
]);

export const tradeSideEnum = pgEnum("trade_side", ["long", "short"]);

export const tradeStatusEnum = pgEnum("trade_status", [
  "open", "close_requested", "closing", "closed"
]);

export const closeReasonEnum = pgEnum("close_reason", [
  "take_profit", "stop_loss", "manual", "system", "error"
]);

export const eventTypeEnum = pgEnum("event_type", [
  "signal_evaluated", "order_submitted", "order_failed",
  "trade_opened", "trade_closed", "strategy_activated",
  "strategy_paused", "strategy_stopped", "reconciliation",
  "error"
]);

export const strategies = pgTable("strategies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),           // wallet address
  config: jsonb("config").notNull(),           // PresetTechnicalContract (JSON)
  symbol: text("symbol").notNull(),
  status: strategyStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("strategies_user_id_idx").on(t.userId),
  index("strategies_status_idx").on(t.status),
]);

export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  strategyId: uuid("strategy_id").notNull().references(() => strategies.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  side: tradeSideEnum("side").notNull(),
  amount: numeric("amount", { precision: 24, scale: 8 }).notNull(),
  entryPrice: numeric("entry_price", { precision: 24, scale: 8 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 24, scale: 8 }),
  sl: numeric("sl", { precision: 24, scale: 8 }),
  tp: numeric("tp", { precision: 24, scale: 8 }),
  status: tradeStatusEnum("status").notNull().default("open"),
  closeReason: closeReasonEnum("close_reason"),
  realizedPnl: numeric("realized_pnl", { precision: 24, scale: 8 }),
  pacificaOrderId: text("pacifica_order_id"),
  clientOrderId: text("client_order_id"),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("trades_strategy_id_idx").on(t.strategyId),
  index("trades_status_idx").on(t.status),
  index("trades_opened_at_idx").on(t.openedAt),
]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  strategyId: uuid("strategy_id").references(() => strategies.id, { onDelete: "cascade" }),
  type: eventTypeEnum("type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
}, (t) => [
  index("events_strategy_id_idx").on(t.strategyId),
  index("events_type_idx").on(t.type),
  index("events_consumed_at_idx").on(t.consumedAt),
]);

export const builderApprovals = pgTable("builder_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  builderCode: text("builder_code").notNull(),
  maxFeeRate: text("max_fee_rate").notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("builder_approvals_user_builder_idx").on(t.userId, t.builderCode),
]);
```

### 2.3 Gerar migration SQL via drizzle-kit

```bash
npx drizzle-kit generate --schema packages/api/src/db/schema.ts --out packages/api/src/db/migrations
```

A migration deve incluir `DROP TABLE` para todas as tabelas Prisma que não existem no schema alvo (ver Fase 5 para quando executar o DROP).

**Importante:** não executar a migration de DROP ainda. Apenas revisar o SQL gerado nesta fase.

---

## Fase 3 — Novo pacote `packages/shared/`

**Objetivo:** substituir `packages/contracts/` com um pacote `packages/shared/` contendo apenas tipos puros usados por múltiplos pacotes. Schemas Zod de API request/response pertencem ao pacote `packages/api/`, não ao shared.

**Critério de conclusão:** `packages/shared/` compila; nenhum consumidor importa de `@pacifica/contracts`.

### 3.1 Criar estrutura

```
packages/shared/
  package.json         (name: "@pacifica/shared")
  tsconfig.json
  src/
    index.ts
    types/
      candle.ts        — Candle, CandleInterval, CandleBuffer types
      signal.ts        — Signal ("none" | "long" | "short"), StrategyConfig
      exchange.ts      — ExchangeInterface, PacificaPosition, MarketInfo
      trade.ts         — Trade, TradeSide, CloseReason (tipos primitivos)
      result.ts        — Result<T, E> helper type
```

### 3.2 Conteúdo de `packages/shared/src/types/candle.ts`

Extrair de `@pacifica/contracts`:
- `MarketCandle` → `Candle`
- `MarketCandleInterval` → `CandleInterval`
- `MarketCandleRequest` → manter apenas o tipo base, sem Zod

### 3.3 Conteúdo de `packages/shared/src/types/signal.ts`

Extrair de `@pacifica/contracts` e `packages/preset-engine/src/index.ts`:
- `PresetSignal` → `Signal`
- `PresetTechnicalContract` → `StrategyConfig` (renomear para clareza)
- `PresetIndicatorConfig`, `PresetTriggerRule`, etc. — manter nomes atuais

### 3.4 Conteúdo de `packages/shared/src/types/exchange.ts`

Interface alvo do ExchangeInterface (contrato entre worker e adapters):

```typescript
export interface ExchangeInterface {
  getPositions(): Promise<ExchangePosition[]>;
  getMarketInfo(): Promise<MarketInfo[]>;
  createMarketOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  setPositionTpsl(input: SetTpslInput): Promise<void>;
  closePosition(input: ClosePositionInput): Promise<void>;
}
```

### 3.5 O que NÃO vai para shared

Os seguintes permanecem em `@pacifica/contracts` até a Fase 5 (quando ele é deletado):
- Todos os schemas Zod de request/response HTTP (pertencem à camada API)
- `presetTechnicalContractCatalog` (pertence à API/worker, não a shared)
- Funções como `serializePacificaSigningPayload`, `createPacificaBuilderApprovalSigningPayload` (pertencem ao exchange adapter)

---

## Fase 4 — Novo pacote `packages/worker/`

**Objetivo:** criar o worker com CandleBuffer in-memory, WS feed, engine portado, e bot refatorado a partir de `createOperationalWorker.ts`.

**Critério de conclusão:** `packages/worker/` compila e executa `pnpm dev` sem erros; worker conecta ao WS e avalia sinais sem tocar no banco para market data.

### 4.1 Criar estrutura de pastas

```
packages/worker/
  package.json
  tsconfig.json
  Dockerfile
  src/
    index.ts                            — entrypoint: wires up tudo e chama bot.start()
    ws-feed.ts                          — WebSocket price/candle feed
    candle-buffer.ts                    — ring buffer in-memory (300 candles por symbol/interval)
    db-watcher.ts                       — polling leve de strategies ativas no banco
    bot.ts                              — orquestra db-watcher + ws-feed + engine + executor
    engine/
      indicators.ts                     — EMA, SMA, RSI, ATR (funções puras, portadas de preset-engine)
      evaluator.ts                      — evaluateSignal(contract, buffer) → Signal
    exchange/
      pacifica/
        signing.ts                      — Ed25519 + Base58 (portado de pacifica-trading)
        client.ts                       — fetch wrapper REST Pacifica
        adapter.ts                      — implementa ExchangeInterface
    db/
      client.ts                         — instância Drizzle
      queries.ts                        — queries tipadas (strategies, trades, events)
    config/
      env.ts                            — lê e valida env vars do worker
```

### 4.2 `packages/worker/src/candle-buffer.ts`

Ring buffer simples. Nunca persiste no banco.

```typescript
export type CandleBufferKey = `${string}_${string}`;  // "BTC_15m"

export class CandleBuffer {
  private readonly buffers = new Map<CandleBufferKey, Candle[]>();
  private readonly capacity: number;

  constructor(capacity = 300) {
    this.capacity = capacity;
  }

  push(symbol: string, interval: CandleInterval, candle: Candle): void {
    const key: CandleBufferKey = `${symbol}_${interval}`;
    const buffer = this.buffers.get(key) ?? [];
    buffer.push(candle);
    if (buffer.length > this.capacity) buffer.shift();
    this.buffers.set(key, buffer);
  }

  get(symbol: string, interval: CandleInterval): Candle[] {
    return this.buffers.get(`${symbol}_${interval}`) ?? [];
  }

  isWarm(symbol: string, interval: CandleInterval, minCandles = 50): boolean {
    return this.get(symbol, interval).length >= minCandles;
  }
}
```

### 4.3 `packages/worker/src/ws-feed.ts`

```typescript
// Conecta ao WebSocket da Pacifica
// Reconexão com backoff exponencial: base 1s, max 60s
// Ao receber candle fechado: chama candleBuffer.push(symbol, interval, candle)
// Ao reconectar: seed buffer com candles históricos via REST (cold start warm-up)
// NUNCA persiste candles no banco

export function createWsFeed(input: {
  wsUrl: string;
  restBaseUrl: string;
  symbols: string[];
  intervals: CandleInterval[];
  buffer: CandleBuffer;
  onWarm?: (symbol: string, interval: CandleInterval) => void;
  logger?: Logger;
}): {
  start(): void;
  stop(): void;
}
```

**Cold start warm-up:** ao conectar pela primeira vez, buscar os últimos 300 candles via REST para cada symbol/interval antes de marcar como warm. Isso elimina o tempo de espera por dados suficientes.

### 4.4 `packages/worker/src/engine/indicators.ts`

Portar **diretamente** de `packages/preset-engine/src/technicalIndicatorSeries.ts`:
- `calculateEmaSeries(values, period): number[]`
- `calculateSmaSeries(values, period): number[]`
- `calculateRsiSeries(values, period): number[]`
- `calculateAtrSeries(highs, lows, closes, period): number[]`
- `createIndicatorNaNSeries(length): number[]`

Dependência de `technicalindicators` permanece.

### 4.5 `packages/worker/src/engine/evaluator.ts`

Portar **diretamente** de `packages/preset-engine/src/index.ts`:
- `evaluatePresetSignal` → renomear para `evaluateSignal`
- `buildPresetRiskPlans` → renomear para `buildRiskPlans`
- `getRequiredPeriod`
- `getIntervalDurationMs`
- `toPacificaMarketSymbol`
- Funções privadas: `buildIndicatorSeriesMap`, `evaluateRuleGroup`, `evaluateRule`, etc.

Remover de `evaluator.ts`:
- `simulatePresetBacktest` — fica somente na API (backtest é feature da API, não do worker)
- `materializeEffectivePresetContract` — vai para `packages/api/`
- `materializeYourStrategyTechnicalContract` — vai para `packages/api/`

### 4.6 `packages/worker/src/exchange/pacifica/signing.ts`

Portar **diretamente** de `packages/pacifica-trading/src/index.ts`:
- Todo o código de Ed25519 + Base58 (constantes, `decodeBase58`, `encodeBase58`, `signPayload`, `derivePublicKeyBase58`, `parsePrivateKey`, prefixos PKCS8/SPKI)
- `serializePacificaSigningPayload` — copiar de `@pacifica/contracts` (não importar de lá)

### 4.7 `packages/worker/src/exchange/pacifica/client.ts`

Portar de `packages/pacifica-trading/src/index.ts`:
- Classe `PacificaClient` (sem alterações estruturais)
- `PacificaApiError`
- `findMarketInfo`, `normalizeMarketOrderInput`, `calculateTargetPositionSizing`

### 4.8 `packages/worker/src/exchange/pacifica/adapter.ts`

Nova classe que implementa `ExchangeInterface` usando `PacificaClient`:

```typescript
export class PacificaAdapter implements ExchangeInterface {
  constructor(private readonly client: PacificaClient) {}

  async getPositions(): Promise<ExchangePosition[]> { ... }
  async getMarketInfo(): Promise<MarketInfo[]> { ... }
  async createMarketOrder(input: CreateOrderInput): Promise<CreateOrderResult> { ... }
  async setPositionTpsl(input: SetTpslInput): Promise<void> { ... }
  async closePosition(input: ClosePositionInput): Promise<void> { ... }
}
```

### 4.9 `packages/worker/src/db-watcher.ts`

```typescript
// Polling simples a cada N segundos (configurável, default 30s)
// Query: SELECT * FROM strategies WHERE status = 'active'
// Notifica bot quando uma strategy muda de status
// Alternativa futura: LISTEN/NOTIFY do Postgres (não implementar agora — adicionar como TODO)

export function createDbWatcher(input: {
  db: DrizzleDb;
  pollIntervalMs?: number;
  onStrategiesChanged: (strategies: Strategy[]) => void;
  logger?: Logger;
}): {
  start(): void;
  stop(): void;
}
```

### 4.10 `packages/worker/src/bot.ts`

Decompor `createOperationalWorker.ts` (1635 linhas) neste módulo:

**O que preservar (portar diretamente):**
- `resolveAutomaticClose` — lógica de SL/TP
- `resolveDetectedClose` — inferência de reason quando posição desaparece
- `deriveProtectionFromActualEntry` — ajuste de SL/TP ao entry real
- `formatProtectedPrice` — formatação de preço para tickSize
- `calculateUnrealizedPnl` — PnL mark-to-market
- `waitForMatchingPosition` — polling pós-ordem
- `validateProtectionLevels` — validação de SL/TP contra entry
- `extractPacificaErrorMessage` — parser de erros da Pacifica
- `buildLeaseExpiryIso`, `shouldEvaluateSignals` — lógica de cadência
- `classifyOrderExecutionFailure` — retry logic
- Toda a lógica de `processExecutableSignalDecision` (execução de ordem, TP/SL, recording)
- Toda a lógica de `reconcileOpenTradesWithExchange` (reconciliação com exchange)
- Toda a lógica de `processRequestedTradeClosures` (fechamento manual)

**O que muda estruturalmente:**
- `marketData.getCandles()` agora vem do `CandleBuffer` (sem io)
- `dependencies.repository` (Prisma) → `db` (Drizzle queries)
- Estratégias chegam do `DbWatcher` em vez de ser escaneadas diretamente

**Assinatura do entrypoint:**
```typescript
export function createBot(input: {
  db: DrizzleDb;
  exchange: ExchangeInterface;  // PacificaAdapter
  candleBuffer: CandleBuffer;
  env: WorkerEnv;
  logger?: Logger;
}): {
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

### 4.11 `packages/worker/src/index.ts`

```typescript
// Wire-up completo:
const env = loadWorkerEnv();
const db = createDrizzleClient(env.DATABASE_URL);
const buffer = new CandleBuffer(300);
const wsFeed = createWsFeed({ wsUrl: env.PACIFICA_WS_URL, ... });
const adapter = new PacificaAdapter(new PacificaClient({ ... }));
const bot = createBot({ db, exchange: adapter, candleBuffer: buffer, env });

wsFeed.start();
await bot.start();

process.on("SIGTERM", async () => {
  await bot.stop();
  wsFeed.stop();
});
```

### 4.12 `packages/worker/Dockerfile`

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod
COPY packages/worker/dist/ ./dist/
CMD ["node", "dist/index.js"]
```

### 4.13 `packages/worker/package.json`

```json
{
  "name": "@pacifica/worker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@pacifica/shared": "workspace:*",
    "drizzle-orm": "^0.41.0",
    "postgres": "^3.4.5",
    "technicalindicators": "^3.1.0",
    "ws": "^8.20.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/ws": "^8.18.1",
    "tsx": "^4.20.0",
    "typescript": "^5.4.0"
  }
}
```

---

## Fase 5 — Novo pacote `packages/api/`

**Objetivo:** criar a API em Hono com Drizzle, sem nenhum import de Prisma ou do framework anterior.

**Critério de conclusão:** todos os endpoints existentes respondendo via Hono; `pnpm typecheck` passa; nenhum import de `@prisma/client` ou `@pacifica/pacifica-market-data`.

### 5.1 Criar estrutura de pastas

```
packages/api/
  package.json
  tsconfig.json
  src/
    index.ts                            — entrypoint Lambda + local server
    app.ts                              — instancia Hono app, registra rotas
    db/
      client.ts                         — instância Drizzle (Neon + postgres)
      schema.ts                         — schema Drizzle (da Fase 2)
      queries/
        strategies.ts
        trades.ts
        events.ts
        accounts.ts
    routes/
      strategies.ts                     — POST /strategies, PUT /strategies/:id, GET /strategies
      positions.ts                      — GET /positions (delega ao exchange)
      trades.ts                         — GET /trades, POST /trades/:id/close
      events.ts                         — GET /events
      builder.ts                        — POST /builder/approve
      auth.ts                           — POST /auth/nonce, POST /auth/verify
      backtest.ts                       — POST /backtest/preview
    exchange/
      pacifica/
        signing.ts                      — idêntico ao worker (copiar, não importar)
        client.ts                       — idêntico ao worker
        adapter.ts                      — idêntico ao worker
    crypto/
      credential-encryption.ts         — portado de packages/credential-crypto
    engine/
      evaluator.ts                      — apenas simulatePresetBacktest + materialize
      indicators.ts                     — idem worker (copiar)
    middleware/
      auth.ts                           — BearerToken middleware
      cors.ts
    config/
      env.ts
```

### 5.2 `packages/api/src/app.ts`

```typescript
import { Hono } from "hono";
import { strategiesRoutes } from "./routes/strategies";
import { tradesRoutes } from "./routes/trades";
// ...

export function createApp(deps: AppDependencies): Hono {
  const app = new Hono();

  app.use("*", corsMiddleware(deps.env.APP_ORIGIN));
  app.use("/api/*", authMiddleware(deps.db));

  app.route("/api/strategies", strategiesRoutes(deps));
  app.route("/api/trades", tradesRoutes(deps));
  app.route("/api/events", eventsRoutes(deps));
  app.route("/api/builder", builderRoutes(deps));
  app.route("/api/auth", authRoutes(deps));
  app.route("/api/backtest", backtestRoutes(deps));

  return app;
}
```

### 5.3 Roteamento — mapeamento atual → novo

| Endpoint atual (Express-like) | Endpoint alvo (Hono) |
|---|---|
| `GET /session/:wallet` | `GET /api/strategies` (filtrado por auth) |
| `POST /activate-your-strategy` | `POST /api/strategies/:id/activate` |
| `POST /save-your-strategy` | `PUT /api/strategies/:id` |
| `POST /pause-bot` | `POST /api/strategies/:id/pause` |
| `POST /resume-bot` | `POST /api/strategies/:id/resume` |
| `POST /close-trade` | `POST /api/trades/:id/close` |
| `POST /validate-pacifica-credentials` | `POST /api/auth/credentials` |
| `POST /approve-pacifica-builder` | `POST /api/builder/approve` |
| `POST /verify-pacifica-operational` | `POST /api/auth/verify-operational` |
| `POST /auth/nonce` | `POST /api/auth/nonce` |
| `POST /auth/verify` | `POST /api/auth/verify` |
| `POST /backtest/preview` | `POST /api/backtest/preview` |
| `GET /positions` | `GET /api/positions` (via exchange adapter) |

**Endpoints a remover** (sem equivalente no alvo):
- `GET /market-candles` — eliminado (market data não é responsabilidade da API)
- `GET /market-prices` — eliminado
- `POST /refresh-market-data` — eliminado
- `POST /reconcile-runtime` — substituído por reconciliação no worker
- `POST /heartbeat-runtime` — eliminado (worker não chama API)

### 5.4 `packages/api/package.json`

```json
{
  "name": "@pacifica/api",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@pacifica/shared": "workspace:*",
    "drizzle-orm": "^0.41.0",
    "hono": "^4.0.0",
    "postgres": "^3.4.5",
    "technicalindicators": "^3.1.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.161",
    "@types/node": "^24.0.0",
    "drizzle-kit": "^0.30.0",
    "tsx": "^4.20.0",
    "typescript": "^5.4.0"
  }
}
```

### 5.5 Lambda handler para SST v3

```typescript
// packages/api/src/index.ts
import { handle } from "hono/aws-lambda";
import { createApp } from "./app";

const app = createApp(loadDependencies());

// Para Lambda
export const handler = handle(app);

// Para dev local
if (process.env.NODE_ENV !== "production") {
  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port: 3003 });
}
```

---

## Fase 6 — Mover frontend

**Objetivo:** mover `apps/app/` para `packages/frontend/` sem reescrever código de produto.

**Critério de conclusão:** `pnpm dev` em `packages/frontend/` funciona e conecta à nova API.

### 6.1 Mover o diretório

```bash
mv apps/app packages/frontend
```

### 6.2 Atualizar `packages/frontend/package.json`

```json
{
  "name": "@pacifica/frontend",
  ...
}
```

### 6.3 Atualizar paths nos arquivos de config

- `packages/frontend/vite.config.ts` (se existir): ajustar aliases
- `packages/frontend/tsconfig.json`: atualizar paths de `@pacifica/contracts` → `@pacifica/shared`
- Substituir imports de `@pacifica/contracts` por `@pacifica/shared` nos arquivos afetados

### 6.4 Ajustar variáveis de ambiente

- `VITE_APP_API_BASE_URL` continua apontando para a API (agora em novo path)
- Sem outras mudanças necessárias

---

## Fase 7 — Deletar pacotes obsoletos

**Objetivo:** remover todos os pacotes que foram inlinarados ou tornados obsoletos.

**Critério de conclusão:** `pnpm install` passa sem referencias a pacotes deletados; `pnpm typecheck` continua verde.

### 7.1 Deletar pacotes

```bash
rm -rf packages/database/
rm -rf packages/contracts/
rm -rf packages/pacifica-trading/
rm -rf packages/pacifica-market-data/
rm -rf packages/preset-engine/
rm -rf packages/credential-crypto/
rm -rf apps/api/
rm -rf apps/worker/
rm -rf apps/app/          # já movido para packages/frontend/
```

### 7.2 Deletar diretório deprecated

```bash
rm -rf deprecated/
```

### 7.3 Atualizar `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
```

Remover entradas de `apps/*`.

### 7.4 Executar migration de DROP no banco

Apenas após confirmar que `packages/api/` e `packages/worker/` estão operacionais:

```sql
DROP TABLE IF EXISTS "MarketCandleSnapshot";
DROP TABLE IF EXISTS "MarketPriceCurrent";
DROP TABLE IF EXISTS "MarketInfoCurrent";
DROP TABLE IF EXISTS "MarketRefreshLog";
DROP TABLE IF EXISTS "AccountBalanceSnapshot";
DROP TABLE IF EXISTS "SymbolOperationalConfig";
DROP TABLE IF EXISTS "OperationalAlert";
DROP TABLE IF EXISTS "BotCommand";
DROP TABLE IF EXISTS "OrderExecutionAttempt";
DROP TABLE IF EXISTS "SignalDecision";
```

As tabelas que têm equivalente no schema Drizzle (`OperatorAccount` → `strategies`, `OpenTrade`/`ClosedTrade` → `trades`, `OperationalEvent` → `events`, `PacificaCredential` info relevante → `builderApprovals`) requerem **migration de dados** antes do DROP:

```sql
-- Migrar strategies ativas
INSERT INTO strategies (id, user_id, config, symbol, status, created_at, updated_at)
SELECT
  pa.id,
  oa.wallet_address,
  pa."effectiveContractJson",
  pa.symbol,
  CASE pa."activationStatus"
    WHEN 'active' THEN 'active'
    WHEN 'paused' THEN 'paused'
    ELSE 'stopped'
  END,
  pa."createdAt",
  pa."updatedAt"
FROM "PresetActivation" pa
JOIN "OperatorAccount" oa ON oa.id = pa."operatorAccountId"
WHERE pa."activationStatus" IN ('active', 'paused');

-- Migrar trades abertas
INSERT INTO trades (id, strategy_id, symbol, side, amount, entry_price, sl, tp, status, opened_at, created_at)
SELECT
  ot.id,
  ot."presetActivationId",
  ot.symbol,
  ot.side::text::trade_side,
  ot.quantity,
  ot."entryPrice",
  ot."stopLossPrice",
  ot."takeProfitPrice",
  'open',
  ot."openedAt",
  ot."createdAt"
FROM "OpenTrade" ot
WHERE ot."presetActivationId" IS NOT NULL;
```

---

## Fase 8 — SST v3 e Dockerfile

**Objetivo:** configurar deploy da API em Lambda (SST) e do Worker em Docker.

**Critério de conclusão:** `sst deploy` sobe a API; `docker build` e `docker run` sobem o worker.

### 8.1 Configurar SST v3

Criar/atualizar `sst.config.ts` na raiz:

```typescript
import { SSTConfig } from "sst";
import { Function, Api } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "trading-bot-pacifica",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function API({ stack }) {
      const api = new Api(stack, "Api", {
        routes: {
          "ANY /{proxy+}": {
            function: {
              handler: "packages/api/src/index.handler",
              runtime: "nodejs22.x",
              environment: {
                DATABASE_URL: process.env.DATABASE_URL!,
                CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY!,
                PACIFICA_BUILDER_CODE: process.env.PACIFICA_BUILDER_CODE!,
              },
            },
          },
        },
      });

      stack.addOutputs({ ApiEndpoint: api.url });
    });
  },
} satisfies SSTConfig;
```

### 8.2 Atualizar `packages/worker/Dockerfile`

```dockerfile
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/worker/package.json packages/worker/
COPY packages/shared/package.json packages/shared/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/worker/ packages/worker/
COPY packages/shared/ packages/shared/
RUN pnpm --filter @pacifica/worker build

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=builder /app/packages/worker/dist/ ./dist/
COPY --from=builder /app/node_modules/ ./node_modules/
CMD ["node", "dist/index.js"]
```

---

## Sequência de execução recomendada

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → Fase 8
```

Cada fase pode ser uma sessão de trabalho independente. As fases 4 e 5 podem ser paralelizadas por dois engenheiros distintos, desde que a Fase 3 (shared) esteja completa.

A Fase 7 (deletar pacotes antigos) só deve ser executada quando as Fases 4, 5 e 6 estiverem com `typecheck` verde e testes passando.

---

## Débitos técnicos explícitos (não bloquear migração)

| ID | Descrição | Quando resolver |
|---|---|---|
| DT-001 | LISTEN/NOTIFY no DbWatcher em vez de polling | após migração estável |
| DT-002 | WebSocket manager na API para push de eventos para o frontend | após migração estável |
| DT-003 | Circuit breaker formal no bot (atualmente só backoff) | após migração estável |
| DT-004 | Testes de integração para bot.ts (reconciliação, execução) | pós-Fase 4 |
| DT-005 | `technicalindicators` lib substituível por implementações puras sem deps | baixa prioridade |

---

## Regras invioláveis a garantir durante a implementação

1. `CandleBuffer` nunca recebe uma chamada de banco — só `candleBuffer.push()` e `candleBuffer.get()`
2. `bot.ts` nunca faz HTTP para a API — toda comunicação é via Drizzle queries
3. Toda ordem DEVE ter SL e TP antes de ser submetida — `validateProtectionLevels()` é obrigatório
4. Toda ordem DEVE ter `builderCode` preenchido — verificar no `PacificaAdapter`
5. Chave privada (`PRIVATE_KEY`) só aparece em `.env`, nunca em logs — usar `sanitizeForLog()` em todo logger
6. Signing de ordens é stateless mas com replay protection: `timestamp + expiry_window` em toda requisição assinada
