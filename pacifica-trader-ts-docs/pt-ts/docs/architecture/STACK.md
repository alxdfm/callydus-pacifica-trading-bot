# Stack & Arquitetura

> Atualize este arquivo sempre que uma decisão de stack mudar.
> Registre a decisão em `docs/decisions/` antes de alterar.

---

## Linguagem & Runtime

```
Linguagem:       TypeScript 5.4 (strict mode)
Runtime API:     Node.js 22 (Lambda environment)
Runtime Worker:  Node.js 22 (Docker container)
Package manager: pnpm (workspaces monorepo)
```

## Frontend

```
Framework:    React 18 + Vite 5
Estilização:  Tailwind CSS 3  (dark terminal aesthetic)
State:        Zustand
HTTP:         fetch nativo
WS:           hook use-websocket.ts (browser WebSocket nativo)
```

## API (serverless)

```
Framework:    Hono (leve, edge-compatible, ideal para Lambda)
Deploy:       AWS Lambda via SST v3
Banco:        Neon PostgreSQL (serverless Postgres)
ORM:          Drizzle ORM
Auth:         JWT — usuário assina com wallet Ed25519
WS frontend:  API Gateway WebSocket ou Hono WS adapter
```

## Worker (processo persistente)

```
Runtime:      Node.js 22
Deploy:       Docker — Oracle Cloud Always Free (AMD shape)
Função:       processo único e persistente — escuta banco, executa ordens
Banco:        mesma Neon PostgreSQL (leitura de strategies, escrita de trades/events)
Price feed:   WebSocket nativo da Pacifica (sem polling)
Exchange:     Pacifica API via PacificaAdapter
```

## Exchange / Signing

```
Exchange:     Pacifica Finance (perpetuals)
Signing:      Ed25519 — recursive key sort → compact JSON → sign → Base58
Builder code: incluído em TODAS as ordens
Ambiente:     mainnet (https://api.pacifica.fi)
Testnet:      https://test-app.pacifica.fi  (code: "Pacifica")
```

## Infra

```
API:          AWS Lambda (via SST) — escala para zero, sem custo idle
Worker:       Oracle Cloud Always Free — VM 1 OCPU / 1GB RAM (suficiente)
Banco:        Neon PostgreSQL — serverless, free tier generoso
Frontend:     Vercel / Netlify
CI/CD:        indefinido por ora
```

---

## Versões fixadas (crítico)

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `@noble/ed25519` | ^2.1 | Signing protocol — não atualizar sem testar assinatura |
| `drizzle-orm` | ^0.30 | API muda entre minors |
| `hono` | ^4.0 | API de WS muda entre majors |
| `zod` | ^3.22 | Schema da Strategy — compatibilidade com frontend |

---

## Padrões de arquitetura

```
Padrão:      monorepo com workspaces (packages/)
Separação:   shared/ → tipos puros | api/ → Lambda handler | worker/ → processo persistente
Testes:      Vitest unit em engine/ e exchange/ — sem e2e por ora
```

---

## O que NÃO usar neste projeto

- Não usar `axios` — `fetch` nativo (Node 22 tem fetch global)
- Não usar `moment.js` — `date-fns` ou `Intl` nativo
- Não usar `socket.io` — WebSocket nativo do browser + Hono WS
- Não usar `sequelize` ou `typeorm` — Drizzle apenas
- Não usar polling de preço — WebSocket obrigatório no worker
- Não usar `any` em TypeScript — `unknown` + narrowing
