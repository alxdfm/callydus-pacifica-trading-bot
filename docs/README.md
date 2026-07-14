# Documentação — trading-bot-pacifica

Documentação técnica da stack atual (Hono + Drizzle + worker agendado).

## Índice

| Arquivo | Conteúdo |
|---------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visão geral, fluxos de dados completos, regras invioláveis |
| [STACK.md](STACK.md) | Stack técnica: frameworks, ORMs, deploy, autenticação |
| [DATABASE.md](DATABASE.md) | Schema Drizzle: todas as tabelas, colunas, enums |
| [API.md](API.md) | Todos os endpoints REST, contratos de request/response |
| [WORKER.md](WORKER.md) | Bot, CandleBuffer, WsFeed, DbWatcher, Engine de sinais |
| [TYPES.md](TYPES.md) | Tipos compartilhados: Candle, StrategyDraft, ExchangeInterface |
| [DEPLOY.md](DEPLOY.md) | Deploy Lambda (API + worker/Cron, SST v4), Amplify, variáveis de ambiente |
| [FRONTEND.md](FRONTEND.md) | Rotas, páginas, auth flow, variáveis Vite |
| [FLOWS.md](FLOWS.md) | Cada ação do usuário e seu caminho completo pela stack |
| [DESIGN.md](DESIGN.md) | Identidade visual "terminal ledger" e blueprints das telas |

### Módulos (`modules/`)

Conhecimento **não dedutível do código** — invariantes ocultos, armadilhas e o
porquê das decisões. Ler antes de mexer no módulo correspondente.

| Arquivo | Conteúdo |
|---------|---------|
| [modules/contracts.md](modules/contracts.md) | Contrato v2 compartilhado (zod): invariantes do envelope e do vocabulário |
| [modules/api-v2.md](modules/api-v2.md) | Rotas v2, validação de resposta e os fatos da REST da Pacifica |
| [modules/frontend-v2.md](modules/frontend-v2.md) | SessionProvider, client tipado e as regras do draft/fingerprint |
| [modules/wallet-solana.md](modules/wallet-solana.md) | As 5 regras do connect/SIWS — quebrar qualquer uma reintroduz o loop de nonce |
| [modules/worker.md](modules/worker.md) | Execução, pipeline de close, protocolo WS real e paridade do materialize |

## Stack em uma linha

**API:** Hono + Drizzle + PostgreSQL → Lambda (SST v4)  
**Worker:** Bot agendado (Lambda/Cron) + Drizzle + PostgreSQL  
**Auth:** Sign-In with Solana Wallet (SIWS) + JWT próprio (HMAC-SHA256)  
**Banco:** PostgreSQL direto — sem Supabase SDK, sem Prisma
