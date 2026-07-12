# Banco de Dados

Schema Drizzle em `packages/api/src/db/schema.ts`.
Migrations geradas em `packages/api/src/db/migrations/`.

O worker tem uma cópia do schema (`packages/worker/src/db/schema.ts`) com as
tabelas que ele consome — a de referência é a da API.

## Comandos

```bash
pnpm --filter @pacifica/api db:generate   # gera SQL de migration
pnpm --filter @pacifica/api db:migrate    # aplica no banco
pnpm --filter @pacifica/api db:studio     # Drizzle Studio (inspeção)
```

## Enums

```sql
strategy_status: "active" | "paused" | "stopped"
trade_side:      "long" | "short"
trade_status:    "open" | "close_requested" | "closing" | "closed"
close_reason:    "take_profit" | "stop_loss" | "manual" | "system" | "error"
event_type:      "signal_evaluated" | "order_submitted" | "order_failed"
               | "trade_opened" | "trade_closed"
               | "strategy_activated" | "strategy_paused" | "strategy_stopped"
               | "reconciliation" | "error"
```

## Tabelas

### `accounts`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | default random() |
| walletAddress | text UNIQUE | endereço Solana do usuário |
| onboardingStatus | text | default `"wallet_pending"` |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

### `credentials`

Chaves agent wallet do usuário. Vinculada a `accounts`.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| accountId | uuid FK→accounts | onDelete=cascade |
| publicKey | text | agent wallet public key (base58) |
| encryptedPrivateKeyRef | text | private key criptografada (AES) |
| keyFingerprint | text | |
| credentialAlias | text? | |
| validationStatus | text | default `"pending"` |
| lifecycleStatus | text | default `"pending"` |
| operationallyVerified | boolean | default false — prova de order ALO |
| lastValidatedAt | timestamptz? | |
| lastValidationErrorCode | text? | |
| lastOperationalVerifiedAt | timestamptz? | |
| lastOperationalErrorCode | text? | |
| lastOperationalProbeJson | jsonb? | resultado bruto da probe Pacifica |
| createdAt | timestamptz | |

### `strategies`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| userId | text | walletAddress do owner (index) |
| config | jsonb | o **draft** (`strategyDraftSchema`) — o contrato técnico é derivado em runtime, nunca persistido |
| symbol | text | ex: `"BTC/USDC"` |
| status | strategy_status | index — **default `"active"` no schema**, mas o insert da API força `"paused"`: salvar nunca liga o bot |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

### `trades`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| strategyId | uuid FK→strategies | onDelete=cascade (index) |
| symbol | text | ex: `"BTC/USDC"` |
| side | trade_side | |
| amount | numeric(24,8) | quantidade em moeda base |
| entryPrice | numeric(24,8) | |
| exitPrice | numeric(24,8)? | |
| sl | numeric(24,8)? | stop loss |
| tp | numeric(24,8)? | take profit |
| status | trade_status | index |
| closeReason | close_reason? | |
| realizedPnl | numeric(24,8)? | |
| pacificaOrderId | text? | ID da ordem na exchange |
| clientOrderId | text? | UUID gerado pelo bot |
| openedAt | timestamptz | index |
| closedAt | timestamptz? | |
| createdAt | timestamptz | |

### `events`

Log de eventos operacionais. Usado pelo frontend para exibir histórico e status.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| strategyId | uuid FK→strategies? | index — nullable para eventos globais |
| type | event_type | index |
| payload | jsonb? | contexto específico do evento |
| createdAt | timestamptz | index |
| consumedAt | timestamptz? | para polling de consumo |

### `builderApprovals`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| userId | text | |
| builderCode | text | |
| maxFeeRate | text | |
| approvedAt | timestamptz | |
| unique | (userId, builderCode) | |

### `authNonces`

Nonces de autenticação SIWS com TTL de 5 minutos.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| walletAddress | text | |
| nonce | text UNIQUE | |
| expiresAt | timestamptz | TTL 5min |
| usedAt | timestamptz? | marcado ao consumir |
| createdAt | timestamptz | |
