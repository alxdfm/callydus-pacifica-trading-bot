# Frontend (`@pacifica/frontend`)

React 18 + Vite. Porta dev: **5173**.

## Rotas

```
/                   → redirect para /onboarding
/onboarding         → OnboardingRoute   (sem guard)
/dashboard          → DashboardPage     (requer auth)
/strategies         → StrategiesPage    (requer auth)
/trades             → TradesPage        (requer auth)
/history            → HistoryPage       (requer auth)
/operations         → OperationsPage    (requer auth)
/profile            → ProfileRoute      (requer auth)
```

## Páginas

| Página | Responsabilidade |
|--------|-----------------|
| `OnboardingPage` | Conectar wallet Solana, SIWS, setup de agent wallet credentials |
| `DashboardPage` | Overview: trades abertos, eventos recentes, status do bot |
| `StrategiesPage` | Construtor YOUR Strategy: indicadores, triggers, risk, backtest preview |
| `TradesPage` | Trades abertos com opção de close manual |
| `HistoryPage` | Trades fechados com PnL realizado |
| `OperationsPage` | Controles de runtime (pause/resume) |
| `ProfilePage` | Credential status, agent wallet info |

## Auth

Gerenciado por `AuthContext`. Token JWT armazenado em sessão.

Fluxo de login:
1. Usuário conecta wallet Solana (ex: Phantom)
2. `GET /api/auth/nonce?wallet=<address>`
3. Wallet assina a mensagem
4. `POST /api/auth/verify` → JWT
5. JWT enviado como `Authorization: Bearer <token>` em todas as requests protegidas

## Variáveis de ambiente

```env
VITE_APP_API_BASE_URL=http://localhost:3003
VITE_PACIFICA_BUILDER_CODE=callydus
VITE_PACIFICA_BUILDER_MAX_FEE_RATE=0.007
VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS=30000
```

## Desenvolvimento

```bash
pnpm --filter @pacifica/frontend dev
# http://localhost:5173
```

## Build

```bash
pnpm --filter @pacifica/frontend build
# output: packages/frontend/dist/
```
