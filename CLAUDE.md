# trading-bot-pacifica

Monorepo de trading automatizado para a exchange Pacifica (Solana/perps).

## Estrutura

```
packages/
  api/        Hono + Drizzle — API REST, Lambda-ready (SST v3)
  worker/     Bot WS-first — CandleBuffer in-memory, Drizzle, engine de sinais
  frontend/   React + Vite — UI do usuário
  shared/     Tipos primitivos compartilhados (candle, trade, signal, exchange)
  config/     Configuração TypeScript compartilhada
apps/
  landing/    Landing page
```

## Setup

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# editar .env com os valores reais
```

Variáveis obrigatórias:
- `DATABASE_URL` — PostgreSQL
- `CREDENTIAL_ENCRYPTION_KEY` — mínimo 32 chars (gere com `openssl rand -hex 32`)
- `AUTH_SIGNING_SECRET` — mínimo 32 chars, diferente de `CREDENTIAL_ENCRYPTION_KEY`
- `PACIFICA_BUILDER_CODE` — código de builder da Pacifica

### 3. Criar o schema no banco

```bash
pnpm --filter @pacifica/api db:generate   # gera o SQL de migration
pnpm --filter @pacifica/api db:migrate    # aplica no banco
```

### 4. Rodar em desenvolvimento

```bash
# Terminal 1 — API (porta 3003)
pnpm --filter @pacifica/api dev

# Terminal 2 — Worker
pnpm --filter @pacifica/worker dev

# Terminal 3 — Frontend (porta 5173)
pnpm --filter @pacifica/frontend dev
```

## Comandos úteis

```bash
# Typecheck de todos os pacotes
pnpm --filter @pacifica/api typecheck
pnpm --filter @pacifica/worker typecheck
pnpm --filter @pacifica/frontend typecheck

# Build da API
pnpm --filter @pacifica/api build

# Build do Worker
pnpm --filter @pacifica/worker build

# Drizzle Studio (inspecionar banco)
pnpm --filter @pacifica/api db:studio
```

## Deploy

### API — Lambda via SST v3

```bash
# staging
npx sst deploy --stage staging

# produção
npx sst deploy --stage production
```

Secrets SST necessários (configurar via `npx sst secret set`):
- `DatabaseUrl`
- `CredentialEncryptionKey`
- `AuthSigningSecret`
- `PacificaBuilderCode`

Em `production`, `APP_ORIGIN` é obrigatório no ambiente do deploy.

### Worker — Docker

```bash
# Build da imagem
docker build -f packages/worker/Dockerfile -t pacifica-worker .

# Run local
docker run --env-file .env pacifica-worker
```

## Arquitetura

### Fluxo de dados

```
Pacifica WS ──▶ Worker (CandleBuffer) ──▶ Engine (evaluateSignal)
                      │                          │
                      ▼                          ▼
                  DbWatcher              Executor (ordens)
                  (strategies)               │
                      │                    Drizzle DB
                      └──────────────────────┘
                                            │
                                            ▼
                                        API (Hono) ──▶ Frontend
```

### Regras invioláveis

1. `CandleBuffer` nunca toca o banco — só `push()` e `get()`
2. `bot.ts` nunca faz HTTP para a API — só queries Drizzle
3. Toda ordem deve ter SL e TP antes de ser submetida
4. Toda ordem deve ter `builderCode` preenchido
5. `PRIVATE_KEY` nunca aparece em logs
6. Toda requisição assinada usa `timestamp + expiry_window` (replay protection)

### Banco de dados

Schema Drizzle em `packages/api/src/db/schema.ts`. Tabelas principais:
- `strategies` — configurações de estratégia por usuário
- `trades` — trades abertos e fechados
- `events` — log de eventos operacionais
- `builder_approvals` — aprovações de builder code
- `accounts` + `credentials` (via queries em `db/queries/accounts.ts`)

### Autenticação

Sign-in com carteira Solana (SIWS):
1. `GET /api/auth/nonce?wallet=<address>` — gera nonce com TTL de 5 min
2. Usuário assina a mensagem com a carteira
3. `POST /api/auth/verify` — verifica assinatura ed25519 e retorna JWT

O JWT é enviado como `Authorization: Bearer <token>` nas rotas protegidas.

## Débitos técnicos

| ID | Descrição |
|----|-----------|
| DT-001 | LISTEN/NOTIFY no DbWatcher em vez de polling |
| DT-002 | WebSocket na API para push de eventos ao frontend |
| DT-003 | Circuit breaker formal no bot |
| DT-004 | Testes de integração para bot.ts |
| DT-005 | Substituir `technicalindicators` por implementações puras |
