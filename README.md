# Pacifica Trading Bot

Monorepo for an automated trading bot running on [Pacifica](https://www.pacifica.fi/). It includes a React frontend (`app`), a REST API (`api`), a continuous trading worker (`worker`), and shared packages for contracts, database, encryption, market data, and strategy execution.

## Requirements

- Node.js 20+
- pnpm 10+
- Docker (for local PostgreSQL)

## Installation

From the repo root:

```bash
pnpm install
```

Copy the environment file:

```bash
cp .env.example .env
```

Fill in the required values — see [Environment variables](#environment-variables) below.

## Running locally

**1. Start the local PostgreSQL container:**

```bash
pnpm db:up
```

**2. Apply the database schema:**

```bash
pnpm --filter @pacifica/database db:push
```

**3. Start the API:**

```bash
pnpm --filter @pacifica/api dev
```

**4. Start the worker:**

```bash
pnpm --filter @pacifica/worker dev
```

**5. Start the frontend:**

```bash
pnpm --filter @pacifica/app dev
```

The Vite dev server runs at `http://localhost:5173`. The API listens on port `3003`.

All apps load `.env` from the repo root automatically.

When the API starts in development mode, the local market data scheduler:
- Refreshes prices and market info every 60 seconds
- Derives candles for active presets (BTC-PERP, ETH-PERP, SOL-PERP on 5m/15m/1h intervals)
- Deduplicates `symbol + timeframe` combinations needed by the worker and preset simulation

## Useful commands

```bash
# Type-check everything
pnpm typecheck

# Type-check a specific app
pnpm --filter @pacifica/app typecheck
pnpm --filter @pacifica/worker typecheck

# Build the frontend
pnpm --filter @pacifica/app build

# Database
pnpm db:logs
pnpm db:down

# Tests
pnpm test
pnpm test:watch
```

## Environment variables

Key variables from `.env.example`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (default port 55432) |
| `VITE_APP_API_BASE_URL` | API base URL for the frontend (default `http://localhost:3003`) |
| `APP_ORIGIN` | Allowed CORS origin for the API (default `http://localhost:5173`) |
| `PACIFICA_ENV` | `mainnet` or `testnet` |
| `PACIFICA_REST_BASE_URL` | Pacifica REST API base URL |
| `PACIFICA_API_KEY` | Pacifica API key |
| `PACIFICA_BUILDER_CODE` | Builder code used when placing orders |
| `PACIFICA_BUILDER_MAX_FEE_RATE` | Max fee rate for builder code approval |
| `VITE_PACIFICA_BUILDER_CODE` | Same as above, exposed to the frontend |
| `VITE_PACIFICA_BUILDER_MAX_FEE_RATE` | Same as above, exposed to the frontend |
| `CREDENTIAL_ENCRYPTION_KEY` | AES encryption key for agent wallet credentials (32+ chars) |
| `CREDENTIAL_ENCRYPTION_KEY_ID` | Key ID (`v2-*` for HKDF derivation; legacy SHA-256 if omitted) |
| `INTERNAL_API_SECRET` | Protects `POST /api/internal/market/refresh` |
| `WORKER_ID` | Identifier for the worker instance |
| `WORKER_SIGNAL_TRACE_ENABLED` | Set to `true` to enable verbose signal loop logging |
| `WORKER_MARKET_ORDER_SLIPPAGE_PERCENT` | Slippage tolerance for market orders (default `0.5`) |

## Project structure

```
apps/
  app/       — React + Vite frontend
  api/       — HTTP API (Node.js, port 3003)
  worker/    — Continuous trading worker
packages/
  contracts/           — Zod schemas and shared TypeScript types
  database/            — Prisma schema and generated client (PostgreSQL)
  credential-crypto/   — AES encryption/decryption for agent wallet keys
  pacifica-market-data/— Market data gateway (prices, candles) from Pacifica
  pacifica-trading/    — Order execution against Pacifica
  preset-engine/       — Strategy signal engine (indicators, rules evaluation)
docker-compose.yml     — Local PostgreSQL on port 55432
```

## Onboarding flow

1. Run `pnpm --filter @pacifica/app dev` and open `http://localhost:5173`
2. Have the **Phantom** or **Backpack** browser extension installed
3. Select your wallet provider in the `Wallet to connect` dropdown
4. Click **Connect wallet** and approve in the extension
5. Click **Approve builder code** and sign the transaction with your main wallet
6. Enter the **Agent Wallet public key** and **Agent Wallet private key** (base58 format, as provided by Pacifica)
7. Click **Validate and Continue**

## Worker

The worker runs continuously and handles the full trade lifecycle:

- Scans accounts with an active preset
- Acquires per-account ownership via a database lease (`BotRuntimeState`)
- Evaluates active presets on a recurring analysis loop
- Persists deduplicated `SignalDecision` records
- Consumes pending signals, decrypts the agent wallet, and places real market orders on Pacifica
- Persists `OrderExecutionAttempt` with request, response, and status
- Creates `OpenTrade` from confirmed order executions, with mandatory stop-loss and take-profit
- Updates `currentPrice` and `unrealizedPnL` during the trade lifecycle
- Closes `ClosedTrade` automatically when the latest candle crosses `take_profit` or `stop_loss`
- Blocks new signals for symbols that already have an open position
- Auto-pauses the runtime on blocking order errors
- Releases ownership on pause, deactivation, or shutdown
- Redacts base58 secrets from logs automatically

**Verbose signal tracing:**

```bash
WORKER_SIGNAL_TRACE_ENABLED=true
```

Logs candle fetching, indicator calculation, rule evaluation, signal decision, and persistence.

## Preset backtest preview

The presets screen shows an on-demand backtest preview when a preset is selected or edited.

- Calculated on demand, not persisted
- Fixed window: last 7 days
- Reuses the same signal engine as the live worker
- Displays strategy vs. hold, max drawdown, win rate, and simulated trades
- Simulated entry occurs at the open of the next candle after the signal

**Endpoint:** `POST /api/presets/backtest-preview`

## Deployment

The project deploys to AWS via [SST](https://sst.dev/):

```bash
# Deploy to staging
pnpm sst:deploy

# Deploy to production
pnpm sst:deploy:prod
```

See `docs/dev/DEPLOY_RUNBOOK_2026-04-13.md` for the full deployment runbook including Lambda layer setup, Prisma configuration, and environment variable provisioning.
