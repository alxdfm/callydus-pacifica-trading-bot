# Convenções de Código — PacificaTrader

---

## Princípios gerais

1. **Explícito > implícito** — nomes longos e claros valem mais que abreviações
2. **Funções pequenas** — máximo 30 linhas; se maior, extraia
3. **Um nível de abstração por função** — não misture negócio com I/O
4. **Erro explícito** — nunca silenciar; sempre logar ou propagar
5. **Sem estado global** — state local ou injetado

---

## Nomenclatura

```
variáveis/funções:  camelCase         → userId, placeOrder()
constantes:         SCREAMING_SNAKE   → MAX_CANDLES, DEFAULT_TIMEOUT
classes/interfaces: PascalCase        → PacificaAdapter, CandleBuffer
arquivos:           kebab-case        → candle-buffer.ts, ws-feed.ts
componentes React:  PascalCase file   → StrategyBuilder.tsx
```

> Use sempre os termos do `UBIQUITOUS_LANGUAGE.md` nos nomes.

---

## TypeScript

### Strict mode — sempre
```typescript
// tsconfig.json obrigatório em todos os packages
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Types explícitos em interfaces públicas
```typescript
// ✅
interface PlaceOrderInput {
  symbol: string
  side: 'long' | 'short'
  amount: number
  stopLoss: number
  takeProfit: number
  builderCode: string
}

// ❌ Nunca any — use unknown + narrowing
function handleEvent(data: unknown) {
  if (isOrderFilled(data)) { ... }
}
```

### Result pattern para erros de negócio
```typescript
// Em shared/src/types.ts
type Ok<T> = { ok: true; data: T }
type Err = { ok: false; error: string; context?: Record<string, unknown> }
type Result<T> = Ok<T> | Err

// Uso no evaluator:
function evaluate(strategy: Strategy, buffer: CandleBuffer): Result<Signal> {
  if (buffer.length < strategy.minCandles) {
    return { ok: false, error: 'insufficient_candles', context: { required: strategy.minCandles } }
  }
  return { ok: true, data: 'long' }
}
```

### Zod para validação de entrada externa
```typescript
// strategy-schema.ts — valida JSON que vem da UI
import { z } from 'zod'

export const StrategyConfigSchema = z.object({
  symbol: z.string(),
  interval: z.enum(['1m', '5m', '15m', '1h', '4h']),
  riskPercent: z.number().gt(0).lte(5),
  slAtrMultiplier: z.number().gt(0),
  tpAtrMultiplier: z.number().gt(0),
  conditions: ConditionGroupSchema,
})

export type StrategyConfig = z.infer<typeof StrategyConfigSchema>
```

### Async/await — sem callbacks
```typescript
// ✅
const result = await adapter.placeMarketOrder(input).catch((err) => {
  logger.error('placeMarketOrder failed', { symbol: input.symbol, err })
  return null
})

// ❌ Nunca deixe promise sem tratamento
await adapter.placeMarketOrder(input) // sem catch = risco silencioso
```

### Imports ordenados
```typescript
// externos → internos → tipos
import { Hono } from 'hono'
import { db } from '@/db'
import type { Strategy, Signal } from '@pacifica-trader/shared'
```

---

## Hono (API)

```typescript
// ✅ Handler enxuto — lógica em service separado
app.post('/strategies', async (c) => {
  const body = await c.req.json()
  const parsed = StrategyConfigSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const strategy = await strategyService.create(parsed.data)
  return c.json(strategy, 201)
})

// ✅ Errors como valores — não throw para erros de negócio
// ❌ Não colocar lógica de banco diretamente no handler
```

---

## Drizzle

```typescript
// ✅ Queries em arquivos separados por domínio
// db/queries/strategies.ts
export async function getActiveStrategies(db: DbClient) {
  return db.select().from(strategies).where(eq(strategies.status, 'active'))
}

// ❌ Não escrever SQL raw inline nos handlers
```

---

## Worker

```typescript
// ✅ Loop principal baseado em eventos — não polling
// bot.ts consome da Queue que o ws-feed.ts preenche
for await (const candle of candleQueue) {
  const signal = evaluator.evaluate(activeStrategy, buffer)
  if (signal.ok && signal.data !== 'none') {
    await bot.executeSignal(signal.data)
  }
}

// ❌ Nunca setInterval para preço
setInterval(() => fetchPrice(), 60_000) // PROIBIDO
```

---

## Comentários — por quê, nunca o quê

```typescript
// ❌ Ruim
// Calcula EMA
const ema = calculateEma(closes, period)

// ✅ Bom — explica decisão não-óbvia
// Pacifica retorna slippage em bps; dividimos por 10_000
// para converter para decimal antes de aplicar ao preço
const slippage = rawSlippage / 10_000
```

---

## Estrutura de módulo

```
packages/worker/src/engine/
  index.ts                ← exportações públicas
  indicators.ts           ← funções puras
  strategy-schema.ts      ← Zod schema + tipos inferidos
  evaluator.ts            ← classe Evaluator
  evaluator.test.ts       ← Vitest
```

---

## Proibido neste projeto

```
- import axios               → use fetch nativo (Node 22)
- import moment              → use date-fns ou Intl
- type any                   → use unknown + narrowing
- console.log em produção    → use o logger configurado
- setInterval para preço     → use WebSocket
- ordens sem builderCode     → validação no adapter
- ordens sem sl + tp         → validação no evaluator/bot
```
