# Deploy

O deploy completo (API + worker + frontend) é disparado ao **publicar um GitHub
release** (`.github/workflows/deploy.yml`): o workflow roda `npx sst deploy
--stage production` (Lambdas da API e do worker) e depois dispara o job do
Amplify. Os comandos manuais abaixo servem para staging e diagnóstico.

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

## Worker — Lambda agendada via SST (`sst.aws.Cron`)

Desde 2026-07-14 o worker não é mais um serviço residente (era ECS Fargate
24/7): é uma Lambda invocada por um cron do EventBridge **de hora em hora, no
minuto :01 UTC**. O bot só avalia candle fechado e os timeframes são 1h/4h,
então o sinal só pode mudar de hora em hora — os fechamentos de 4h são
subconjunto dos de 1h, um único schedule cobre os dois. SL/TP são submetidos à
exchange junto com a ordem, então o bot fora do ar entre invocações não
desprotege posição nenhuma.

Motivação: presença 24/7 mantinha o Neon acordado o mês inteiro (~182 CU-h
contra 100 do plano Free — o compute seria suspenso no meio do mês) e custava
~$13/mês de Fargate/rede para não fazer nada entre candles. A Lambda horária
cai no free tier e deixa o Neon adormecer (~15-20 CU-h/mês).

Configuração (`sst.config.ts`):

- Handler: `packages/worker/src/handler.handler` (Node.js 22.x, ESM, arm64,
  512 MB, timeout 2 min) — sem Docker, sem VPC, sem ECR
- `retries: 0` — **crítico**: EventBridge invoca async e por default re-executa
  2x em erro; um retry depois de "ordem submetida + crash antes do insert"
  abriria posição duplicada. O pior caso com 0 é perder uma avaliação horária.
- `concurrency: { reserved: 1 }` — exclusão mútua real (não existe lease no
  código; o guard de posição em `bot.ts` é read-then-act)
- Alarmes (com `ALERT_EMAIL`): `Errors >= 1` em 1h, e dead man's switch
  `Invocations < 1` por 2h consecutivas com `treatMissingData: breaching` —
  cron parado é falha silenciosa que nenhum alarme de erro pega

Cada invocação: carrega estratégias ativas → busca ~300 candles por
(símbolo, timeframe) via `/api/v1/kline` → um tick do bot (reconcile +
avaliação) → snapshot horário de funding/OI → fecha a conexão com o banco.

Consequências operacionais:

- Trade fechado por SL/TP na exchange aparece no banco/UI **até 1h depois**
  (trade-off aceito; o dinheiro está protegido pela exchange o tempo todo)
- Entrada acontece até ~1 min depois do fechamento do candle
- IP de saída muda a cada invocação — se a Pacifica ou o Neon um dia exigirem
  allowlist de IP, o desenho precisa ser revisto

Para rodar localmente (um tick e sai):

```bash
pnpm --filter @pacifica/worker dev
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
