# Callydus — Pacifica Trading Bot

Monorepo for an automated trading bot running on [Pacifica](https://www.pacifica.fi/) (Solana perps). React frontend, REST API, and a WS-first trading worker — deployed as a single stack on AWS.

**Production:** [trade.callydus.xyz](https://trade.callydus.xyz)

## Structure

```
packages/
  api/        Hono + Drizzle — REST API, AWS Lambda via SST
  worker/     WS-first bot — in-memory CandleBuffer, signal engine, order executor (ECS Fargate)
  frontend/   React + Vite — deployed on AWS Amplify
  shared/     Shared primitive types (candle, trade, signal, exchange)
  config/     Shared TypeScript config
apps/
  landing/    Landing page
docs/         Technical documentation (architecture, API, worker, design system)
```

## Requirements

- Node.js 22 (`.nvmrc`)
- pnpm 10+
- Docker (local PostgreSQL)

## Local development

```bash
pnpm install
cp .env.example .env   # fill in the REQUIRED values

# 1. Local PostgreSQL
pnpm db:up

# 2. Apply migrations
pnpm --filter @pacifica/api db:migrate

# 3. Run the services (one terminal each)
pnpm --filter @pacifica/api dev        # API on :3003
pnpm --filter @pacifica/worker dev     # trading worker
pnpm --filter @pacifica/frontend dev   # UI on :5173
```

## Required environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CREDENTIAL_ENCRYPTION_KEY` | AES key for agent wallet credentials — min 32 chars (`openssl rand -hex 32`) |
| `AUTH_SIGNING_SECRET` | HMAC secret for session tokens — min 32 chars, **different** from the encryption key |
| `PACIFICA_BUILDER_CODE` | Pacifica builder code (required on every order) |

See `.env.example` for the full list with defaults.

## Useful commands

```bash
pnpm -r typecheck        # type-check all packages
pnpm test                # run the test suite (vitest)
pnpm --filter @pacifica/api build
pnpm --filter @pacifica/worker build
pnpm --filter @pacifica/frontend build
pnpm --filter @pacifica/api db:studio   # inspect the database
```

## Deployment

Everything ships together when a **GitHub release is published**: the `Deploy` workflow runs typecheck + tests, then `sst deploy --stage production` (API Lambda, worker on ECS Fargate, SNS/CloudWatch alerts) and triggers the Amplify frontend build. Pushes to `master` only run CI.

Manual deploy from a machine with AWS credentials:

```bash
npx sst deploy --stage production
```

SST secrets (one-time setup per stage): `DatabaseUrl`, `CredentialEncryptionKey`, `AuthSigningSecret`, `PacificaBuilderCode` — via `npx sst secret set`. `APP_ORIGIN` must be present in the deploy environment for production (comma-separated CORS origins).

See [docs/DEPLOY.md](docs/DEPLOY.md) for details.

## Architecture in one diagram

```
Pacifica WS ──▶ Worker (CandleBuffer) ──▶ Engine (evaluateSignal)
                      │                          │
                      ▼                          ▼
                  DbWatcher              Executor (orders w/ SL+TP)
                  (strategies)               │
                      └──────────────▶ PostgreSQL ◀──▶ API (Hono) ◀── Frontend
```

Non-negotiable rules: every order carries stop-loss, take-profit and the builder code; the worker never calls the API (database only); private keys never appear in logs. Full list in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flows, service boundaries, invariants |
| [docs/API.md](docs/API.md) | REST endpoints and auth |
| [docs/WORKER.md](docs/WORKER.md) | Bot internals, signal engine, indicators |
| [docs/DESIGN.md](docs/DESIGN.md) | Design system and UX blueprints |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Infrastructure and release pipeline |
