# CLAUDE.md — Project Intelligence

> Este arquivo é o ponto de entrada para toda sessão de trabalho.
> Leia-o completamente antes de qualquer ação.

---

## ⚡ Protocolo de início de sessão

**Ao abrir qualquer sessão neste projeto, faça SEMPRE em ordem:**

1. Leia este CLAUDE.md completo
2. Leia `docs/architecture/STACK.md`
3. Leia `docs/conventions/UBIQUITOUS_LANGUAGE.md`
4. Leia `docs/sessions/latest.md`
5. Confirme: "Contexto carregado. Stack: Node.js + Hono (API) / Worker Docker / React + Vite. Domínio: trading bot Pacifica perps. Pronto."

**Nunca assuma contexto que não foi lido. Nunca invente nomes sem consultar a linguagem ubíqua.**

---

## 🎯 Sobre este projeto

```
Nome:        pacifica-trader
Domínio:     Bot de trading automatizado para perpetuals na exchange Pacifica.
             O usuário configura estratégias via UI; o worker executa ordens
             fielmente à parametrização — SL/TP obrigatórios, builder_code em tudo.
Status:      active
Iniciado em: 2025-05-04
```

---

## 🏗️ Arquitetura — 3 peças independentes

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND  (React + Vite)                                │
│  Vercel / static hosting                                 │
│  ↕ REST + WebSocket                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  API  (Hono — AWS Lambda / SST)                          │
│  Gerencia strategies, auth, posições, histórico          │
│  Lê/escreve no banco (Neon PostgreSQL via Drizzle)       │
│  Emite eventos para o frontend via WebSocket             │
│  ↕ DB                                                    │
└──────────────────┬──────────────────────────────────────┘
                   │  (Neon PostgreSQL)
┌──────────────────▼──────────────────────────────────────┐
│  WORKER  (Node.js — Docker, Oracle Cloud Always Free)    │
│  Processo persistente — NUNCA comunica com a API         │
│  Escuta o banco: lê strategies ativas                    │
│  Conecta ao WebSocket da Pacifica (price feed)           │
│  Avalia signals → executa ordens via Pacifica API        │
│  Escreve trades executados e events no banco             │
└─────────────────────────────────────────────────────────┘

Comunicação:
  Frontend ↔ API:    REST + WebSocket (/ws/events)
  API ↔ Worker:      APENAS via banco (Neon PostgreSQL)
  Worker ↔ Pacifica: WebSocket (price feed) + REST (ordens)
  Worker → Frontend: NUNCA direto — sempre via banco → API → WS
```

---

## 📐 Regras de trabalho

### Arquivos e módulos
- Nenhum arquivo deve ultrapassar **400 linhas**. Se ultrapassar, proponha divisão.
- Um arquivo = uma responsabilidade.
- Arquivos: `kebab-case`. Classes/tipos: `PascalCase`. Funções/variáveis: `camelCase`.
- Constantes: `SCREAMING_SNAKE_CASE`.

### Antes de criar qualquer código
1. Confirme que entende o requisito
2. `rg "termo-chave" --type ts` para verificar se já existe
3. Consulte `UBIQUITOUS_LANGUAGE.md` para nomear
4. Proponha abordagem antes de implementar algo novo/arquitetural

### Decisões técnicas
- Registrar em `docs/decisions/YYYY-MM-DD_titulo.md`
- Usar template `docs/decisions/_TEMPLATE.md`

### Ao encerrar sessão
- Atualizar `docs/sessions/latest.md`

---

## 🗂️ Mapa do projeto

```
CLAUDE.md
docs/
  architecture/
    STACK.md
    OVERVIEW.md
  conventions/
    UBIQUITOUS_LANGUAGE.md
    CODE_STYLE.md
  decisions/
    _TEMPLATE.md
    YYYY-MM-DD_*.md
  sessions/
    latest.md
scripts/
  onboarding.sh
.ripgrepignore
.gitignore

packages/
  api/                          ← Hono — AWS Lambda via SST
    src/
      routes/                   ← handlers por domínio
      db/                       ← Drizzle schema + queries
      exchange/
        base.ts                 ← ExchangeInterface (contrato)
        pacifica/
          adapter.ts            ← PacificaAdapter implements ExchangeInterface
          signing.ts            ← Ed25519 signing — NÃO TOCAR sem decisão
          client.ts             ← httpx-like fetch wrapper
      lib/
        ws-manager.ts           ← WebSocket connections para o frontend
      index.ts                  ← entry point Lambda handler

  worker/                       ← Node.js — Docker, Oracle Cloud
    src/
      exchange/
        base.ts                 ← mesmo contrato (shared ou copiado)
        pacifica/
          adapter.ts
          signing.ts
          client.ts
      engine/
        indicators.ts           ← EMA, SMA, RSI, ATR
        strategy-schema.ts      ← Zod schema da strategy
        evaluator.ts            ← avalia condições → Signal
      feed/
        ws-feed.ts              ← WebSocket price feed da Pacifica
        candle-buffer.ts        ← ring buffer em memória
      bot.ts                    ← loop principal
      db-watcher.ts             ← lê strategies ativas do banco
      index.ts                  ← entry point

  shared/                       ← tipos e utils compartilhados (sem deps de runtime)
    src/
      types.ts                  ← Strategy, Signal, Order, Position, Event, Candle
      constants.ts

  frontend/                     ← React + Vite
    src/
      components/
        StrategyBuilder/
        Dashboard/
      hooks/
        use-websocket.ts
      store/                    ← Zustand

docker/
  docker-compose.yml
  Dockerfile.worker
sst.config.ts                   ← SST config (API Lambda + infra)
drizzle.config.ts
.env                            ← NUNCA commitar
```

---

## 🚫 Guardrails — nunca faça isso

- **Nunca** worker se comunica diretamente com a API — só via banco
- **Nunca** commite ou logue a private key — somente em `.env`
- **Nunca** altere `signing.ts` sem decisão registrada em `docs/decisions/`
- **Nunca** crie uma ordem sem `builder_code`
- **Nunca** crie uma ordem sem `stop_loss` + `take_profit`
- **Nunca** persista candles no banco — buffer em memória no worker
- **Nunca** use polling de preço — WebSocket obrigatório no worker
- **Nunca** instale dependência nova sem registrar motivo em `docs/decisions/`
- **Nunca** faça refactor além do escopo pedido — proponha separado

---

## 📎 Referências rápidas

- Stack: `docs/architecture/STACK.md`
- Glossário: `docs/conventions/UBIQUITOUS_LANGUAGE.md`
- Código: `docs/conventions/CODE_STYLE.md`
- Última sessão: `docs/sessions/latest.md`
- Builder Program: https://pacifica.gitbook.io/docs/programs/builder-program
- Pacifica API: https://docs.pacifica.fi/api-documentation/api
