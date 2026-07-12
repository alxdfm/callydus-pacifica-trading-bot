# Frontend (`@pacifica/frontend`)

React 18 + Vite. Porta dev: **5173**. Deploy: **AWS Amplify** (`trade.callydus.xyz`), build disparado pela pipeline de release.

Identidade visual e blueprints das telas: ver [DESIGN.md](DESIGN.md) ("terminal ledger").

## Rotas

```
/                    → redirect para /onboarding
/onboarding          → OnboardingRoute       (sem guard; some após completo)
/dashboard           → DashboardPage         (requer auth)
/strategies          → StrategiesListPage    (requer auth)
/strategies/builder  → StrategyBuilderPage   (requer auth)
/trades              → TradesPage            (requer auth)
/profile             → ProfileRoute          (requer auth)
/history             → redirect para /trades
/operations          → redirect para /dashboard
```

## Páginas

| Página | Responsabilidade |
|--------|-----------------|
| `OnboardingPage` | Stepper resumível: conectar wallet, aprovar builder code, validar agent wallet, readiness check |
| `DashboardPage` | Faixa de saúde do sistema (bot/sync/exchange + pause/resume + alertas), tiles de conta, últimos trades, eventos |
| `StrategiesListPage` | Card da YOUR Strategy: status, resumo de risco, PnL realizado, ativar/pausar, link pro builder |
| `StrategyBuilderPage` | Builder em página inteira: config à esquerda (indicadores, regras, risco), backtest sticky à direita com estado "stale" |
| `TradesPage` | Abas Open/Closed, filtros por símbolo/período, totais, fechamento manual com confirmação |
| `ProfilePage` | Troca de agent wallet com re-validação, status do builder code, logout |

## Infra compartilhada (pós-rewrite v2, 2026-07-10)

- `v2/session.tsx` — `SessionProvider` único (snapshot de `GET /api/v2/session`, só em memória); `v2/client.ts` — fetchers tipados que parseiam com os schemas de `@pacifica/shared/contracts`; `v2/draft-validation.ts` — validação semântica do draft (regras vs indicadores). Ver `docs/modules/frontend-v2.md`
- `shared/format.ts` — formatadores (`formatUsd`, `formatSignedUsd`, `formatPrice`, `formatQty`, `formatWhen`); nunca renderizar número cru
- `types/contracts.ts` — apenas vocabulário de onboarding/auth/wallet (v1 remanescente); o contrato de dados vive em `@pacifica/shared/contracts`

## Auth

Gerenciado por `AuthContext`. Token de sessão (HMAC) armazenado em sessão.

Fluxo de login:
1. Usuário conecta wallet Solana (ex: Phantom)
2. `GET /api/auth/nonce?wallet=<address>`
3. Wallet assina a mensagem
4. `POST /api/auth/verify` → token
5. Token enviado como `Authorization: Bearer <token>` em todas as requests protegidas

## Variáveis de ambiente

```env
VITE_APP_API_BASE_URL=http://localhost:3003
VITE_PACIFICA_BUILDER_CODE=callydus
VITE_PACIFICA_BUILDER_MAX_FEE_RATE=0.007
VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS=30000
```

Em produção, essas variáveis são configuradas no app do Amplify (baked no build).

## Desenvolvimento e build

```bash
pnpm --filter @pacifica/frontend dev     # http://localhost:5173
pnpm --filter @pacifica/frontend build   # output: packages/frontend/dist/
```

## Pendências conhecidas

- Tema claro: tokens definidos em `styles/app.css`, mas o CSS legado ainda tem cores hardcoded — entra após a purga (ver DESIGN.md)
