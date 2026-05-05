# PacificaTrader

Bot de trading automatizado para perpetuals na [Pacifica exchange](https://app.pacifica.fi/).

Hackathon Pacifica — Track 1: Trading Applications & Bots | Builder Program

---

## Arquitetura

```
Frontend (React + Vite)  ↔  API (Hono / AWS Lambda)  ↔  Banco (Neon PG)  ↔  Worker (Node / Docker)
                                                                                      ↕
                                                                            Pacifica WebSocket + REST
```

## Setup

```bash
cp .env.example .env       # preencha PRIVATE_KEY e BUILDER_CODE

pnpm install               # instala todos os packages

pnpm dev:api               # API local (Lambda emulado via SST)
pnpm dev:worker            # Worker local
pnpm dev:frontend          # Frontend Vite

# ou tudo junto:
docker compose up          # worker + banco local
pnpm dev:api && pnpm dev:frontend
```

## Documentação

Leia `CLAUDE.md` antes de qualquer sessão no Claude Code.

- Arquitetura: `docs/architecture/OVERVIEW.md`
- Stack: `docs/architecture/STACK.md`
- Glossário: `docs/conventions/UBIQUITOUS_LANGUAGE.md`
- Decisões: `docs/decisions/`
