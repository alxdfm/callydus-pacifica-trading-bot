# Deploy

O deploy completo (API + worker + frontend) é disparado ao **publicar um GitHub
release** (`.github/workflows/deploy.yml`): o workflow roda `npx sst deploy
--stage production` (Lambda + ECS) e depois dispara o job do Amplify. Os comandos
manuais abaixo servem para staging e diagnóstico.

## API — Lambda via SST v4

### Configuração (`sst.config.ts`)

- Runtime: Node.js 22.x, ESM
- Handler: `packages/api/src/index.handler`
- Memory: 1024 MB (subiu de 512 MB em 2026-07-10 — backtest de 90d era CPU-bound)
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
npx sst secret set AuthSigningSecret     "$(openssl rand -hex 32)"
npx sst secret set PacificaBuilderCode   "callydus"
```

> `AuthSigningSecret` assina os tokens de sessão e deve ser diferente de
> `CredentialEncryptionKey` — rotacionar sessões não pode exigir
> re-criptografar credenciais.

### Variáveis exigidas no deploy

Em `production`, o deploy falha se `APP_ORIGIN` não estiver definido no
ambiente (evita CORS apontando para localhost):

```bash
APP_ORIGIN=https://app.exemplo.com npx sst deploy --stage production
```

### Throttling

O API Gateway aplica throttling global no stage (`throttlingRateLimit: 50`,
`throttlingBurstLimit: 100`), e as rotas `/api/auth/*` têm rate limit por IP
na aplicação (30 req/min por instância).

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

## Worker — ECS Fargate via SST

Em produção o worker é um `sst.aws.Service` (`sst.config.ts`) no cluster
`PacificaCluster`: o `sst deploy` builda a imagem do `packages/worker/Dockerfile`,
publica no ECR e substitui a task. Não há passo manual de Docker no deploy.

- Memory: 0.5 GB
- Env injetado pela task definition (mesmas variáveis do `.env`)
- Alarme "dead man's switch": ausência de métrica de CPU = worker parado → SNS

Para rodar localmente:

```bash
docker build -f packages/worker/Dockerfile -t pacifica-worker .
docker run --env-file .env pacifica-worker
```

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
| `AUTH_SIGNING_SECRET` | API | mínimo 32 chars, diferente de `CREDENTIAL_ENCRYPTION_KEY` |
| `PACIFICA_BUILDER_CODE` | API + Worker | código de builder da Pacifica |

## Frontend — AWS Amplify

Build do Vite hospedado no **Amplify** (`trade.callydus.xyz`, config em
`amplify.yml`). O workflow de release dispara o job com
`aws amplify start-job --branch-name master --job-type RELEASE` e aguarda o status.

As variáveis `VITE_*` (incluindo `VITE_APP_API_BASE_URL`) são configuradas no app
do Amplify e ficam **baked no bundle** — mudá-las exige novo build.

```bash
pnpm --filter @pacifica/frontend build   # dist/
```

## Alertas

`sst.config.ts` cria alarmes CloudWatch + tópico SNS (erros da Lambda, worker sem
task). Requer `ALERT_EMAIL` no ambiente do deploy.
