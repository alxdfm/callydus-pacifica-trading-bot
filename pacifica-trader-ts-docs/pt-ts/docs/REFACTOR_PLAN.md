# Plano de Refatoração — PacificaTrader

> Este documento guia a migração do projeto Python existente para a arquitetura
> TypeScript definitiva. Siga as fases em ordem — cada fase é deployável e testável
> de forma independente antes de avançar.
>
> Repo original: https://github.com/alxdfm/callydus-pacifica-trading-bot

---

## Visão geral das fases

```
Fase 0 — Monorepo e estrutura base        (sem lógica de negócio)
Fase 1 — shared: tipos e contratos        (sem I/O)
Fase 2 — Exchange layer                   (porta signing + client + adapter)
Fase 3 — Worker: engine + feed            (indicadores, evaluator, WS feed)
Fase 4 — Worker: bot + db-watcher         (loop principal)
Fase 5 — API: Hono + Drizzle              (rotas, WS frontend, builder code)
Fase 6 — Frontend: UX                     (StrategyBuilder + Dashboard)
```

---

## Fase 0 — Monorepo e estrutura base

**Objetivo:** repositório TypeScript funcional, sem nenhuma lógica de negócio ainda.

### O que criar

```
pnpm-workspace.yaml
package.json                    (root — scripts de dev/build)
tsconfig.base.json              (strict mode compartilhado)
sst.config.ts                   (SST v3 — define Lambda + infra)
drizzle.config.ts               (aponta para Neon)
.env.example                    (lista todas as vars necessárias)
docker-compose.yml              (worker + postgres local para dev)
docker/Dockerfile.worker

packages/
  shared/
    package.json
    tsconfig.json
    src/index.ts                (vazio por ora)

  api/
    package.json
    tsconfig.json
    src/index.ts                (handler Hono mínimo — retorna 200)

  worker/
    package.json
    tsconfig.json
    src/index.ts                (processo Node mínimo — loga "worker started")

  frontend/
    package.json  (Vite + React existente — mover para cá)
    vite.config.ts
    src/  (código existente)
```

### Variáveis de ambiente necessárias (.env.example)

```
# Pacifica
PACIFICA_PRIVATE_KEY=          # Ed25519 private key (base58)
PACIFICA_WALLET_ADDRESS=       # endereço público
PACIFICA_BUILDER_CODE=         # builder code registrado
PACIFICA_API_URL=https://api.pacifica.fi
PACIFICA_WS_URL=wss://ws.pacifica.fi

# Banco
DATABASE_URL=                  # Neon PostgreSQL connection string

# API
JWT_SECRET=
```

### Critério de conclusão
- `pnpm install` sem erros
- `pnpm dev:worker` loga "worker started"
- `pnpm dev:api` responde 200 em GET /health
- `docker compose up` sobe sem erros

---

## Fase 1 — shared: tipos e contratos

**Objetivo:** definir todos os tipos do domínio uma vez, compartilhados por api e worker.
Nenhum I/O, nenhuma dependência externa além de `zod`.

### O que criar em `packages/shared/src/`

**`types.ts`** — todas as entidades do domínio:
```typescript
// Resultado explícito para erros de negócio
export type Ok<T> = { ok: true; data: T }
export type Err = { ok: false; error: string; context?: Record<string, unknown> }
export type Result<T> = Ok<T> | Err

// Candle OHLCV
export interface Candle {
  open: number; high: number; low: number; close: number
  volume: number; timestamp: number
}

// Signal avaliado pelo Evaluator
export type Signal = 'long' | 'short' | 'none'

// Contrato que qualquer exchange adapter deve implementar
export interface ExchangeInterface {
  placeMarketOrder(input: PlaceOrderInput): Promise<Result<Order>>
  cancelOrder(orderId: string): Promise<Result<boolean>>
  getPosition(symbol: string): Promise<Result<Position | null>>
  setTpsl(input: SetTpslInput): Promise<Result<boolean>>
  subscribeCandles(symbol: string, interval: string, onCandle: (c: Candle) => void): Promise<() => void>
}

// Order, Position, PlaceOrderInput, SetTpslInput, Strategy, Event...
// (todos os tipos completos conforme UBIQUITOUS_LANGUAGE.md)
```

**`strategy-schema.ts`** — Zod schema da Strategy (validação compartilhada entre UI e worker):
```typescript
export const ConditionSchema = z.object({
  indicator: z.enum(['EMA', 'SMA', 'RSI', 'ATR']),
  // ...
})

export const StrategyConfigSchema = z.object({
  symbol: z.string(),
  interval: z.enum(['1m', '5m', '15m', '1h', '4h']),
  riskPercent: z.number().gt(0).lte(5),
  slAtrMultiplier: z.number().gt(0),
  tpAtrMultiplier: z.number().gt(0),
  entryConditions: ConditionGroupSchema,
})

export type StrategyConfig = z.infer<typeof StrategyConfigSchema>
```

**`constants.ts`** — constantes compartilhadas:
```typescript
export const CANDLE_BUFFER_SIZE = 300
export const DEFAULT_EXPIRY_WINDOW_MS = 30_000
export const PACIFICA_SIDES = { long: 'bid', short: 'ask' } as const
```

### Critério de conclusão
- `pnpm --filter shared build` sem erros de tipo
- Todos os tipos do `UBIQUITOUS_LANGUAGE.md` representados

---

## Fase 2 — Exchange layer

**Objetivo:** portar o protocolo de assinatura e o client da Pacifica para TypeScript.
Base para api e worker usarem o mesmo adapter.

### O que criar em `packages/api/src/exchange/pacifica/` (e espelhar no worker)

**`signing.ts`** — porta do `signing.py` existente:
- Ordenação recursiva alfabética das chaves do JSON
- Serialização compacta (sem espaços)
- Assinatura Ed25519 via `@noble/ed25519`
- Encode Base58 do resultado
- ⚠️ Portar a lógica existente linha a linha — não reimaginar

**`client.ts`** — wrapper de fetch para a Pacifica REST API:
```typescript
// Métodos: post(path, payload) → assina automaticamente
// Inclui timestamp, expiry_window, account no payload
// Trata erros HTTP → Result<T>
```

**`adapter.ts`** — implementa `ExchangeInterface`:
```typescript
export class PacificaAdapter implements ExchangeInterface {
  async placeMarketOrder(input: PlaceOrderInput): Promise<Result<Order>> {
    // Traduz 'long'/'short' → 'bid'/'ask'
    // Adiciona builderCode no data antes de assinar
    // Chama client.post('/orders/create_market', ...)
  }
  // setTpsl, cancelOrder, getPosition, subscribeCandles...
}
```

### Dependências novas a registrar em decisions/
- `@noble/ed25519` — signing Ed25519 (registrar ADR)
- `bs58` — encode Base58 (registrar ADR)

### Critério de conclusão
- Teste unitário: `signPayload({ type: 'create_market_order', data: {...} })` produz assinatura válida
- Teste de integração (testnet): `adapter.placeMarketOrder(...)` retorna `{ ok: true }`
- `adapter.setTpsl(...)` com sl e tp válidos retorna `{ ok: true }`

---

## Fase 3 — Worker: engine + feed

**Objetivo:** lógica pura de indicadores, avaliação de condições e price feed via WebSocket.

### O que criar em `packages/worker/src/`

**`engine/indicators.ts`** — funções puras, sem estado:
```typescript
// Porta do indicators.py existente
export function calculateEma(closes: number[], period: number): number[]
export function calculateSma(closes: number[], period: number): number[]
export function calculateRsi(closes: number[], period: number): number[]
export function calculateAtr(candles: Candle[], period: number): number[]
```

**`engine/evaluator.ts`** — avalia condições → Signal:
```typescript
export class Evaluator {
  evaluate(strategy: StrategyConfig, buffer: CandleBuffer): Result<Signal> {
    // Valida buffer.length >= minCandles
    // Calcula indicadores necessários
    // Avalia conditionGroups AND/OR
    // Retorna Signal ou Err
  }
}
```

**`feed/candle-buffer.ts`** — ring buffer em memória:
```typescript
export class CandleBuffer {
  constructor(private readonly maxSize = CANDLE_BUFFER_SIZE) {}
  push(candle: Candle): void   // descarta o mais antigo se cheio
  toArray(): Candle[]          // retorna cópia dos candles em ordem
  get length(): number
  getCloses(): number[]        // array de closes para indicadores
}
```

**`feed/ws-feed.ts`** — WebSocket price feed:
```typescript
export class WsFeed {
  // Conecta ao WS da Pacifica
  // Reconexão automática com backoff exponencial (100ms → 30s)
  // Emite candles fechados via callback
  // Emite evento 'reconnected' no bus
  subscribe(symbol: string, interval: string, onCandle: (c: Candle) => void): () => void
}
```

### Critério de conclusão
- Testes unitários: `calculateEma`, `calculateRsi`, `evaluator.evaluate` com fixtures de candles
- `WsFeed` conecta ao testnet e recebe candles sem erro por 5 minutos
- `CandleBuffer` nunca ultrapassa `maxSize`, `toArray()` retorna na ordem correta

---

## Fase 4 — Worker: bot + db-watcher

**Objetivo:** loop principal do bot e leitura de strategies ativas do banco.

### O que criar em `packages/worker/src/`

**`db-watcher.ts`** — lê strategies ativas e detecta mudanças:
```typescript
export class DbWatcher {
  // Usa LISTEN/NOTIFY do Postgres para receber mudanças em tempo real
  // Alternativa: polling leve a cada 5s se LISTEN não for viável
  // Emite 'strategy_activated' | 'strategy_paused' | 'strategy_stopped'
  onStrategyChange(cb: (event: StrategyChangeEvent) => void): void
  getActiveStrategies(): Promise<Strategy[]>
}
```

**`bot.ts`** — orquestra tudo:
```typescript
export class Bot {
  constructor(
    private exchange: ExchangeInterface,  // injetado
    private evaluator: Evaluator,
    private db: DbClient,
  ) {}

  async run(): Promise<void> {
    // 1. Carrega strategies ativas via DbWatcher
    // 2. Para cada strategy: inicia WsFeed, alimenta CandleBuffer
    // 3. A cada candle fechado: evaluator.evaluate()
    // 4. Se signal !== 'none': executeSignal()
    // 5. Persiste Trade + Event no banco
  }

  private async executeSignal(signal: Signal, strategy: Strategy): Promise<void> {
    // Calcula size via risk percent
    // Calcula sl/tp via ATR multipliers
    // exchange.placeMarketOrder() — com builderCode obrigatório
    // exchange.setTpsl() — com sl e tp obrigatórios
    // Persiste resultado
  }
}
```

**`index.ts`** — entry point do worker:
```typescript
// Instancia PacificaAdapter, Evaluator, Bot
// Chama bot.run()
// Trata SIGTERM para graceful shutdown
```

### Critério de conclusão
- Worker inicia, lê strategies do banco, conecta WS para cada símbolo ativo
- Ao receber sinal: ordem executada no testnet com sl, tp e builderCode
- Trade e Event persistidos no banco após fill
- SIGTERM encerra gracefully (fecha WS, finaliza ordens pendentes)

---

## Fase 5 — API: Hono + Drizzle

**Objetivo:** API serverless para gerenciar strategies, expor dados ao frontend e gerenciar builder code.

### Schema do banco — `packages/api/src/db/schema.ts`

```typescript
export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  config: jsonb('config').notNull(),          // StrategyConfig
  symbol: text('symbol').notNull(),
  status: text('status').notNull(),           // active | paused | stopped
  createdAt: timestamp('created_at').defaultNow(),
})

export const trades = pgTable('trades', { ... })
export const events = pgTable('events', { ... })
export const builderApprovals = pgTable('builder_approvals', { ... })
```

### Rotas — `packages/api/src/routes/`

```
GET  /health
POST /strategies              → cria strategy (valida com StrategyConfigSchema)
GET  /strategies              → lista strategies do usuário
PUT  /strategies/:id/status   → ativa | pausa | para
GET  /positions               → posições abertas (lê do banco ou chama Pacifica)
GET  /trades                  → histórico de trades
GET  /events                  → últimos N events
POST /builder/approve         → monta payload, assina, chama Pacifica approve
DELETE /builder/approve       → revoke builder code
WS   /ws/events               → stream de events do banco para o frontend
```

### WebSocket para o frontend — `ws-manager.ts`

```typescript
// Usa LISTEN/NOTIFY do Postgres para detectar novos events
// Repassa para todos os clientes WS conectados em tempo real
// Hono WS adapter ou API Gateway WebSocket (SST gerencia)
```

### Critério de conclusão
- `POST /strategies` valida, persiste e retorna a strategy criada
- `PUT /strategies/:id/status` muda status no banco (Worker detecta via DbWatcher)
- `WS /ws/events` repassa events do Worker para o browser em tempo real
- `POST /builder/approve` fluxo completo: assina → chama Pacifica → persiste approval

---

## Fase 6 — Frontend: UX

**Objetivo:** interface clara para configurar strategies e monitorar o bot em tempo real.

### StrategyBuilder — `packages/frontend/src/components/StrategyBuilder/`

**Aba visual:**
- Seleção de símbolo e intervalo
- Blocos de indicadores com parâmetros (EMA period, RSI period, etc.)
- Operadores AND/OR para combinar condições de entrada long e short
- Campos de SL e TP: modo fixo (%) ou múltiplo de ATR
- Risk percent por trade
- Preview da configuração em tempo real
- Validação via `StrategyConfigSchema` (Zod — compartilhado do `shared/`)

**Aba raw:**
- Editor YAML/JSON com highlight de sintaxe
- Erros de schema sublinhados inline
- Sync bidirecional com a aba visual

**Builder Code:**
- Tela de aprovação: mostra `fee_rate`, pede confirmação do usuário
- Chama `POST /builder/approve` → persiste
- Indicador de status (aprovado / não aprovado)

### Dashboard — `packages/frontend/src/components/Dashboard/`

- **PnL:** equity curve alimentada por WS events, tabela de trades
- **Posições abertas:** card por posição com edição inline de TP/SL, botão fechar
- **Log de eventos:** feed rolável via `useWebSocket` — signals, fills, erros
- **Bot controls:** start/stop/pause da strategy ativa, status de conexão WS

### Hooks — `packages/frontend/src/hooks/`

```typescript
// use-websocket.ts — conecta ao /ws/events, reconecta automaticamente
// use-strategy.ts — CRUD de strategies via API
// use-positions.ts — posições e trades
```

### Critério de conclusão
- StrategyBuilder salva strategy válida via API
- Dashboard mostra posições e events em tempo real via WS
- Aba raw e aba visual sincronizam bidirecionalmente
- Builder Code flow completo: aprovar → indicador verde → ordens com builderCode

---

## Ordem de execução recomendada no Claude Code

```
Sessão 1:  Fase 0 — estrutura monorepo
Sessão 2:  Fase 1 — shared/types.ts + strategy-schema.ts
Sessão 3:  Fase 2 — signing.ts + client.ts + adapter.ts (testnet ao final)
Sessão 4:  Fase 3 — indicators.ts + evaluator.ts + candle-buffer.ts + ws-feed.ts
Sessão 5:  Fase 4 — db-watcher.ts + bot.ts (teste ponta a ponta no testnet)
Sessão 6:  Fase 5 — schema Drizzle + rotas Hono + ws-manager
Sessão 7:  Fase 6 — StrategyBuilder + Dashboard
```

> Ao encerrar cada sessão: atualizar `docs/sessions/latest.md` com o que foi feito,
> o estado atual e os próximos passos.
