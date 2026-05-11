# Deploy

## API — Lambda via SST v3

### Configuração (`sst.config.ts`)

- Runtime: Node.js 22.x, ESM
- Handler: `packages/api/src/index.handler`
- Memory: 512 MB
- Timeout: 29s
- API Gateway v2 (HTTP API)

### Stages

| Stage | Behavior |
|-------|----------|
| `staging` | `removal: "remove"` |
| `production` | `removal: "retain"`, `protect: true` |

### Secrets (via `npx sst secret set`)

```bash
npx sst secret set DatabaseUrl           "postgres://..."
npx sst secret set CredentialEncryptionKey "$(openssl rand -hex 32)"
npx sst secret set PacificaBuilderCode   "callydus"
```

### Variáveis injetadas automaticamente

```
CREDENTIAL_ENCRYPTION_KEY_ID=...
PACIFICA_BUILDER_MAX_FEE_RATE=0.007
PACIFICA_REST_BASE_URL=https://api.pacifica.fi
APP_ORIGIN=https://app.example.com
```

### Deploy

```bash
# staging
npx sst deploy --stage staging

# produção
npx sst deploy --stage production
```

## Worker — Docker

```bash
# Build
docker build -f packages/worker/Dockerfile -t pacifica-worker .

# Run local
docker run --env-file .env pacifica-worker
```

Todas as variáveis de ambiente do worker devem ser injetadas via `--env-file` ou variáveis do container (ECS task definition, etc.).

## Banco de dados

Qualquer PostgreSQL é compatível (RDS, Neon, Supabase como provider de Postgres, etc.).

```bash
# Gera migration SQL
pnpm --filter @pacifica/api db:generate

# Aplica no banco (usa DATABASE_URL do .env)
pnpm --filter @pacifica/api db:migrate
```

## Variáveis de ambiente

Ver `.env.example` na raiz do repositório para a lista completa.

Variáveis críticas (obrigatórias em todos os ambientes):

| Variável | Usado por | Notas |
|----------|-----------|-------|
| `DATABASE_URL` | API + Worker | PostgreSQL connection string |
| `CREDENTIAL_ENCRYPTION_KEY` | API + Worker | mínimo 32 chars — `openssl rand -hex 32` |
| `CREDENTIAL_ENCRYPTION_KEY_ID` | API + Worker | IDs `"v2*"` → HKDF; outros → SHA-256 legado |
| `PACIFICA_BUILDER_CODE` | API + Worker | código de builder da Pacifica |

## Frontend

Deploy estático (Vite build). Configurar `VITE_APP_API_BASE_URL` para apontar para a API deployada.

```bash
pnpm --filter @pacifica/frontend build
# dist/ → Vercel, S3+CloudFront, etc.
```
