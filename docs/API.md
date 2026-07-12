# API (`@pacifica/api`)

Framework: **Hono v4**. Local port: **3003**. Lambda-ready via SST v3 (1024 MB / 29s).

Surface since the contract-v2 rewrite (2026-07-10): **auth + onboarding + v2**.
The v1 routes (`/api/account/*`, `/api/runtime/*`, `/api/strategies/*`,
`/api/trades/*`) were removed — history in `docs/FLOWS.md` §7.

## Middlewares

| Middleware | Applies to |
|-----------|-------------|
| CORS (`APP_ORIGIN`) | all routes |
| Rate limit (30/min) | `/api/auth/*` |
| Auth (Bearer token) | `/api/v2/*` |

## Auth (SIWS)

### `GET /api/auth/nonce?wallet=<solanaAddress>`

Generates a nonce with a 5-minute TTL for the SIWS signature.

### `POST /api/auth/verify`

Verifies the ed25519 signature and issues the session token (TTL 24h).

## Onboarding

| Endpoint | Purpose |
|----------|---------|
| `POST /api/onboarding/account/lookup` | account + credential status by wallet (pre-login) |
| `POST /api/onboarding/credentials/validate` | derive pubkey from privkey, AES-256-GCM encrypt, upsert credential |
| `POST /api/onboarding/builder/approve` | signed builder-code approval (timestamp + expiry window) |
| `POST /api/onboarding/credentials/verify-operational` | decrypt credential, place + cancel a probe order |

## v2 (contract in `@pacifica/shared/contracts`)

All routes require `Authorization: Bearer <token>`. Every response is validated
against the shared schema before being sent; violations return 500 and log
`[v2] response contract violation`. Errors use the envelope
`{status:"error", code, message, retryable}`. See `docs/modules/api-v2.md` for
the non-obvious rules.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v2/session` | hydration snapshot: walletAddress, access, credential, strategy, balanceUsd |
| `GET /api/v2/trades?limit=` | open + closed trades (closed sorted by closedAt desc; limit 1–200, default 50) |
| `GET /api/v2/markets` | real market metadata from Pacifica `/info` (tick/lot/min size, maxLeverage) |
| `GET /api/v2/events` | latest 50 worker events for the active strategy |
| `POST /api/v2/strategy` | upsert the draft; 409 `strategy_running` while active |
| `POST /api/v2/strategy/activate` | `status → active`; 400 if activation blockers exist |
| `POST /api/v2/strategy/pause` | `status → paused` |
| `POST /api/v2/strategy/backtest` | simulate the SAVED strategy over Pacifica candles |
| `POST /api/v2/trades/:id/close` | `status → close_requested` (worker executes the close) |

Strategy commands return the full updated strategy record.

## Session token

Not RFC JWT — internal format:

```
base64url( walletAddress:expiresAt:HMAC-SHA256(AUTH_SIGNING_SECRET, "walletAddress:expiresAt") )
```

- TTL: 24h, secret: `AUTH_SIGNING_SECRET` (distinct from `CREDENTIAL_ENCRYPTION_KEY`)
- Sent as `Authorization: Bearer <token>`; handlers read `c.get("walletAddress")`
