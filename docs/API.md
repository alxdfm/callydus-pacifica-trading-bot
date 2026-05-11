# API (`@pacifica/api`)

Framework: **Hono v4**. Porta local: **3003**. Lambda-ready via SST v3.

## Middlewares globais

| Middleware | Onde aplica |
|-----------|-------------|
| CORS | todas as rotas |
| Auth (JWT Bearer) | `/api/strategies/*`, `/api/trades/*`, `/api/events/*`, `/api/positions/*`, `/api/account/*`, `/api/runtime/*` |

## Autenticação

### `GET /api/auth/nonce`

Query: `?wallet=<solanaAddress>`

Gera nonce com TTL 5min para assinatura SIWS.

```json
// Response
{
  "nonce": "abc123...",
  "message": "Sign this message...",
  "expiresAt": "2026-05-11T12:05:00.000Z"
}
```

### `POST /api/auth/verify`

Verifica assinatura ed25519 e emite JWT (TTL 24h).

```json
// Body
{
  "walletAddress": "...",
  "nonce": "abc123...",
  "expiresAt": "2026-05-11T12:05:00.000Z",
  "signature": "<base58>"
}

// Response
{ "token": "<jwt>", "expiresAt": "..." }
```

### `POST /api/auth/credentials`

Valida, criptografa e persiste agent wallet credentials.

```json
// Body
{
  "mainWalletPublicKey": "...",
  "agentWalletPublicKey": "...",
  "agentWalletPrivateKey": "<base58>",
  "credentialAlias": "opcional"
}

// Response
{ "credentialId": "...", "keyFingerprint": "...", "validationStatus": "valid" }
```

### `POST /api/auth/verify-operational`

Executa ordem-probe ALO na Pacifica para validar permissão do agent wallet, cancela imediatamente.

```json
// Body
{ "credentialId": "...", "walletAddress": "..." }

// Response
{ "operationalVerificationStatus": "verified" }
```

## Estratégias

Todas as rotas abaixo requerem `Authorization: Bearer <token>`.

### `GET /api/strategies`

Lista estratégias do usuário autenticado.

### `PUT /api/strategies/:id`

Atualiza `config` e/ou `symbol` de uma estratégia.

### `POST /api/strategies/:id/activate`

Muda `status → "active"`.

### `POST /api/strategies/:id/pause`

Muda `status → "paused"`.

### `POST /api/strategies/:id/resume`

Muda `status → "active"`.

### `POST /api/strategies/your/save`

Salva/atualiza o draft da YOUR Strategy.

```json
// Body: draft StrategyConfig (ver types/TYPES.md)
```

### `POST /api/strategies/your/activate`

Materializa e ativa a YOUR Strategy.

```json
// Response
{ "activation": { ... }, "runtime": { ... } }
```

### `POST /api/strategies/your/backtest-preview`

Simula a YOUR Strategy com dados históricos da Pacifica.

```json
// Body
{ "draft": <StrategyConfig> }

// Response
{
  "equityCurve": [{ "time": "...", "equity": 1000 }],
  "holdCurve": [{ "time": "...", "equity": 950 }],
  "drawdownCurve": [{ "time": "...", "drawdownPercent": -5 }],
  "trades": [...],
  "summary": {
    "totalTrades": 42,
    "winRate": 0.55,
    "totalReturnPercent": 12.3
  }
}
```

## Trades

### `GET /api/trades`

Lista trades do usuário (abertos + fechados).

### `POST /api/trades/:id/close`

Marca trade como `"close_requested"`. O Worker executa o close no próximo tick.

## Account (endpoints batch para o frontend)

Todos via `POST` — retornam snapshots de estado para hidratação da UI.

| Endpoint | Retorna |
|----------|---------|
| `POST /api/account/session` | account, credential, strategy, trades, events |
| `POST /api/account/profile` | credential + bot status |
| `POST /api/account/dashboard` | trades abertos/fechados + events recentes |
| `POST /api/account/presets` | presets disponíveis + market info |
| `POST /api/account/trades` | trades abertos |
| `POST /api/account/history` | trades fechados |

## Runtime

### `POST /api/runtime/pause`

Pausa o bot (muda `strategy.status → "paused"`).

### `POST /api/runtime/resume`

Retoma o bot (muda `strategy.status → "active"`).

## Onboarding

### `POST /api/onboarding/account/lookup`

Retorna `account` + status da `credential` pelo `walletAddress`. Usado antes do login completo.

## Token JWT

Formato interno (não padrão JWT RFC):
```
base64url( walletAddress:expiresAt:HMAC-SHA256(secret, "walletAddress:expiresAt") )
```

- TTL: 24h
- Secret: derivado de `CREDENTIAL_ENCRYPTION_KEY`
- Enviado como `Authorization: Bearer <token>`
- Extraído em `c.get("walletAddress")` nos handlers protegidos
