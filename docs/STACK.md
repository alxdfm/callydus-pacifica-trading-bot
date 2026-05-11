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
| Deploy | **SST v3** → AWS Lambda (Node 22, ESM) |

## Worker (`@pacifica/worker`)

| Camada | Tecnologia |
|--------|-----------|
| ORM | **Drizzle ORM v0.41** |
| Driver de banco | `postgres` (postgres.js v3) |
| WebSocket client | `ws v8` |
| Indicadores técnicos | `technicalindicators v3` (DT-005: substituir) |
| Deploy | **Docker** |

## Frontend (`@pacifica/frontend`)

| Camada | Tecnologia |
|--------|-----------|
| Framework | **React 18** |
| Build tool | **Vite** |
| Porta dev | 5173 |
| State | React Context + hooks |

## Banco de dados

- **PostgreSQL** — qualquer instância (RDS, Neon, Supabase como provider de Postgres, etc.)
- Schema gerenciado via **Drizzle Kit** (migrations SQL em `packages/api/drizzle/`)
- Sem Prisma, sem Supabase SDK — conexão direta via `postgres` driver

## Autenticação

- **Sign-In with Solana Wallet (SIWS)** — assinatura ed25519
- **JWT próprio** — HMAC-SHA256, TTL 24h, formato `base64url(walletAddress:expiresAt:hmac)`
- Sem OAuth, sem Supabase Auth, sem NextAuth

## Integração Pacifica

- REST assinado com ed25519 (agent wallet)
- Replay protection: `timestamp + PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` (padrão 30s)
- WebSocket para candles em tempo real
- `builderCode` obrigatório em todas as ordens

## Deploy

| Serviço | Plataforma | Config |
|---------|-----------|--------|
| API | AWS Lambda via SST v3 | `sst.config.ts` |
| Worker | Docker | `packages/worker/Dockerfile` |
| Frontend | Vercel ou S3+CloudFront | — |

Secrets da API em produção via `npx sst secret set`:
- `DatabaseUrl`
- `CredentialEncryptionKey`
- `PacificaBuilderCode`
