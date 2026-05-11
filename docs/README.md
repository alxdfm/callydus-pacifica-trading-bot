# Documentação — trading-bot-pacifica

Documentação técnica da stack atual (pós-refatoração para Hono + Drizzle + WS-first).

## Índice

| Arquivo | Conteúdo |
|---------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visão geral, fluxos de dados completos, regras invioláveis |
| [STACK.md](STACK.md) | Stack técnica: frameworks, ORMs, deploy, autenticação |
| [DATABASE.md](DATABASE.md) | Schema Drizzle: todas as tabelas, colunas, enums |
| [API.md](API.md) | Todos os endpoints REST, contratos de request/response |
| [WORKER.md](WORKER.md) | Bot, CandleBuffer, WsFeed, DbWatcher, Engine de sinais |
| [TYPES.md](TYPES.md) | Tipos compartilhados: Candle, StrategyConfig, ExchangeInterface |
| [DEPLOY.md](DEPLOY.md) | Deploy Lambda (SST v3), Docker, variáveis de ambiente |
| [FRONTEND.md](FRONTEND.md) | Rotas, páginas, auth flow, variáveis Vite |

## Stack em uma linha

**API:** Hono + Drizzle + PostgreSQL → Lambda (SST v3)  
**Worker:** Bot WS-first + Drizzle + PostgreSQL → Docker  
**Auth:** Sign-In with Solana Wallet (SIWS) + JWT próprio (HMAC-SHA256)  
**Banco:** PostgreSQL direto — sem Supabase SDK, sem Prisma
