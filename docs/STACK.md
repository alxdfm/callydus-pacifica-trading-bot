# Stack Técnica

## Runtime e linguagem

- **TypeScript 5.x** em todos os pacotes
- **Node.js 22.x** (ESM nativo — `"type": "module"` em todos os `package.json`)
- **pnpm workspaces** para gerenciar o monorepo

## API (`@pacifica/api`)

| Camada | Tecnologia |
|--------|-----------|
| Framework HTTP | **Hono v4** |
| Servidor local | `@hono/node-server` |
| ORM | **Drizzle ORM v0.41** |
| Driver de banco | `postgres` (postgres.js v3) |
| Validação | **Zod v3** |
| Crypto | `@noble/curves` (ed25519), `bs58` |
| Deploy | **SST v4** → AWS Lambda (Node 22, ESM) |

## Worker (`@pacifica/worker`)

| Camada | Tecnologia |
|--------|-----------|
| ORM | **Drizzle ORM v0.41** |
| Driver de banco | `postgres` (postgres.js v3) |
| WebSocket client | `ws v8` |
| Indicadores técnicos | implementações puras em `engine/indicators.ts` (golden tests de paridade) |
| Deploy | **ECS Fargate** via SST (imagem `packages/worker/Dockerfile`) |

## Frontend (`@pacifica/frontend`)

| Camada | Tecnologia |
|--------|-----------|
| Framework | **React 18** |
| Build tool | **Vite** |
| Porta dev | 5173 |
| State | React Context + hooks |

## Banco de dados

- **PostgreSQL** — produção usa **Neon**; qualquer Postgres serve (RDS, Supabase como provider, etc.)
- Schema gerenciado via **Drizzle Kit** (migrations SQL em `packages/api/src/db/migrations/`)
- Sem Prisma, sem Supabase SDK — conexão direta via `postgres` driver

## Autenticação

- **Sign-In with Solana Wallet (SIWS)** — assinatura ed25519
- **Token próprio** — HMAC-SHA256 com `AUTH_SIGNING_SECRET` dedicado (separado da chave de criptografia), TTL 24h, formato `base64url(walletAddress:expiresAt:hmac)`
- Rate limiting nas rotas de auth (30 req/min por IP) + throttling no API Gateway
- Sem OAuth, sem Supabase Auth, sem NextAuth

## Integração Pacifica

- REST assinado com ed25519 (agent wallet)
- Replay protection: `timestamp + PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` (padrão 30s)
- WebSocket para candles em tempo real
- `builderCode` obrigatório em todas as ordens

## Deploy

| Serviço | Plataforma | Config |
|---------|-----------|--------|
| API | AWS Lambda via SST v4 | `sst.config.ts` |
| Worker | ECS Fargate via SST v4 | `sst.config.ts` + `packages/worker/Dockerfile` |
| Frontend | AWS Amplify (`trade.callydus.xyz`) | `amplify.yml` |
| Alertas | SNS + CloudWatch alarms | `sst.config.ts` (requer `ALERT_EMAIL`) |

Release completo (backend + frontend) dispara ao **publicar um GitHub release** (`.github/workflows/deploy.yml`).

Secrets em produção via `npx sst secret set`:
- `DatabaseUrl`
- `CredentialEncryptionKey`
- `AuthSigningSecret`
- `PacificaBuilderCode`
