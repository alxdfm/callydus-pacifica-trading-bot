# Última Sessão — Contexto Persistido

**Última atualização:** 2026-05-05
**Sessão anterior durou:** ~30min (planejamento de refatoração)

---

## O que foi feito na última sessão

- Levantamento completo da arquitetura atual vs. arquitetura alvo dos docs
- Identificadas inconsistências: HybridMarketDataGateway, RealtimeCandleCache, PersistedWorkerMarketDataGateway como dead code, `createOperationalWorker.ts` com 1635 linhas
- Criado `REFACTOR_PLAN.md` na raiz do repo com plano de 8 fases detalhado

---

## Estado atual do projeto

```
O que está funcionando:   codebase atual (apps/api + apps/worker) com Clean Architecture e Prisma
O que está em progresso:  plano de refatoração definido, nenhuma fase iniciada ainda
O que está bloqueado:     nada — sistema parado, pode ser refatorado sem cautela
```

---

## Mapeamento atual → alvo (resumo)

| Atual | Alvo | Ação |
|---|---|---|
| `apps/api/` | `packages/api/` | Reescrever com Hono + Drizzle |
| `apps/worker/` | `packages/worker/` | Decompor createOperationalWorker.ts |
| `apps/app/` | `packages/frontend/` | Mover sem reescrever |
| `packages/preset-engine/` | `packages/worker/src/engine/` | Portar e deletar |
| `packages/contracts/` | `packages/shared/` | Renomear e enxugar |
| `packages/pacifica-trading/` | Inlinado em api e worker | Deletar pacote |
| `packages/pacifica-market-data/` | Deletar | Substituído por WS no worker |
| `packages/database/` (Prisma) | `packages/api/src/db/` (Drizzle) | Migrar ORM |

---

## Próximos passos (para retomar)

👉 Leia `REFACTOR_PLAN.md` na raiz do repo para o plano completo com arquivos, código e critérios de conclusão.

**Próxima sessão: Fase 1 — Limpeza de dead code**

1. Deletar arquivos de market data na API:
   - `apps/api/src/infrastructure/market-data/HybridMarketDataGateway.ts`
   - `apps/api/src/infrastructure/market-data/HybridMarketDataGateway.test.ts`
   - `apps/api/src/infrastructure/market-data/RealtimeCandleCache.ts`
   - `apps/api/src/infrastructure/market-data/startLocalMarketDataRefreshScheduler.ts`
   - `apps/api/src/infrastructure/market-data/startLocalMarketDataRefreshScheduler.test.ts`
   - `apps/api/src/infrastructure/market-data/marketDataFreshness.ts`
   - `apps/api/src/infrastructure/market-data/candleWindow.ts`
   - `apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.ts`
   - `apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.test.ts`
   - `apps/api/src/infrastructure/persistence/PrismaMarketDataSnapshotRepository.ts`
2. Deletar use cases de market data (RefreshMarketData, GetMarketCandles, GetMarketPrices, CleanupMarketData)
3. Deletar rotas e scripts de market data
4. Deletar `apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.ts`
5. Limpar imports em `createApiModule.ts`, `createApiRuntime.ts`, `server.ts`
6. Critério: `pnpm typecheck` passa sem erros

---

## Contexto técnico importante

- Sistema **parado** — sem necessidade de compatibilidade retroativa
- Framework da API alvo: **Hono 4.x** (leve, Lambda-native, usa Request/Response nativo)
- ORM alvo: **Drizzle** (substitui Prisma completamente)
- Worker: **WebSocket-first**, CandleBuffer 100% in-memory, nunca persiste candles
- `createOperationalWorker.ts` (1635 linhas) será decomposto em: `ws-feed.ts`, `candle-buffer.ts`, `db-watcher.ts`, `bot.ts`
- Signing Ed25519 em `packages/pacifica-trading/` — preservar lógica, mover para `packages/worker/src/exchange/pacifica/signing.ts` e `packages/api/src/exchange/pacifica/signing.ts`
- Worker nunca faz HTTP para a API — comunicação exclusivamente via banco (Drizzle)
- `POST /heartbeat-runtime` e `POST /reconcile-runtime` serão eliminados (worker autônomo)
- Schema DB alvo: 4 tabelas (`strategies`, `trades`, `events`, `builderApprovals`)
- Tabelas a dropar: MarketCandleSnapshot, MarketPriceCurrent, MarketInfoCurrent, MarketRefreshLog, AccountBalanceSnapshot, SymbolOperationalConfig, OperationalAlert, BotCommand, OrderExecutionAttempt, SignalDecision
- Dados a migrar: PresetActivation → strategies, OpenTrade → trades

---

## Guardrails descobertos

- Worker nunca faz HTTP para a API — comunicação exclusivamente via banco (Drizzle)
- `signing.ts` é crítico — qualquer bug de ordering rejeita silenciosamente na Pacifica
- CandleBuffer nunca vai para o banco — apenas em memória no processo do Worker
- Toda ordem precisa de `builderCode`, `stopLoss` e `takeProfit` — validar antes de chamar o adapter
- Não usar polling de preço — WebSocket obrigatório no worker
