# Arquitetura do Sistema

## Visão geral

Monorepo de trading automatizado para a exchange Pacifica (Solana/perps). Três serviços desacoplados que se comunicam via banco de dados e WebSocket.

```
Pacifica WS ──▶ Worker (CandleBuffer) ──▶ Engine (evaluateSignal)
                      │                          │
                      ▼                          ▼
                  DbWatcher              Executor (ordens)
                  (strategies)               │
                      │                    Drizzle DB ◀──▶ API (Hono)
                      └──────────────────────┘                │
                                                           Frontend
```

## Pacotes

| Pacote | Responsabilidade | Deploy |
|--------|-----------------|--------|
| `@pacifica/api` | REST API, autenticação, queries, backtest | Lambda (SST v3) |
| `@pacifica/worker` | Bot WS-first, candles, sinais, ordens | Docker |
| `@pacifica/frontend` | UI React, onboarding, dashboard | Vercel/S3 |
| `@pacifica/shared` | Tipos primitivos (Candle, Signal, StrategyConfig) | — |
| `@pacifica/config` | tsconfig base | — |

## Separação de responsabilidades

**API** nunca executa ordens. É stateless e serve somente para:
- Autenticar usuários (SIWS + JWT)
- CRUD de estratégias e consultas de trades/eventos
- Backtest preview (simulação histórica)
- Operações de controle (pause/resume)

**Worker** nunca faz HTTP para a API. Toda leitura/escrita de estado é via Drizzle direto no banco.

**CandleBuffer** nunca toca o banco — apenas `push()` e `get()` em memória.

## Regras invioláveis

1. `CandleBuffer` nunca toca o banco — só `push()` e `get()`
2. `bot.ts` nunca faz HTTP para a API — só queries Drizzle
3. Toda ordem deve ter SL e TP antes de ser submetida
4. Toda ordem deve ter `builderCode` preenchido
5. `PRIVATE_KEY` nunca aparece em logs
6. Toda requisição assinada usa `timestamp + expiryWindowMs` (replay protection)

## Fluxo de autenticação e onboarding

```
1. GET /api/auth/nonce?wallet=<address>
   → upsertNonce(db) → {nonce, message, expiresAt}

2. Usuário assina mensagem com carteira Solana

3. POST /api/auth/verify {walletAddress, nonce, expiresAt, signature}
   → verifySolanaWalletSignature() → issueJWT() → upsertAccount()
   ← {token, expiresAt}

4. POST /api/auth/credentials {mainWalletPublicKey, agentWalletPublicKey, agentWalletPrivateKey}
   → valida derivação → criptografa AES → upsertCredential()

5. POST /api/auth/verify-operational {credentialId, walletAddress}
   → descriptografa → cria PacificaClient → ordem-probe ALO → cancela
   → credential.operationallyVerified = true
```

## Fluxo de trading (Worker)

```
Bootstrap:
  loadActiveStrategies(db) → extrai {symbols, intervals}
  CandleBuffer(capacity=300)
  createWsFeed() → conecta WS, warm-up REST (300 candles históricos)
  createBot() → tick periódico
  createDbWatcher() → polling de estratégias a cada 30s

Tick (HEARTBEAT_INTERVAL_MS = 15s):
  Para cada estratégia ativa:
    reconcileOpenTradesWithExchange()  ← detecta closes por SL/TP
    if shouldEvaluateSignals():
      evaluateAndExecute()

evaluateAndExecute():
  candles = CandleBuffer.get(symbol, interval)
  signal = evaluateSignal(config, candles)   → "none" | "long" | "short"
  if signal == "none" → skip
  if posição já aberta → skip
  buildRiskPlans() → {sl, tp}
  exchange.createMarketOrder({..., sl, tp})
  exchange.getPositions() → confirma entrada real
  exchange.setPositionTpsl() → ajusta proteção pós-slippage
  insertTrade(db) + insertEvent(db, "trade_opened")
```

## Fluxo de close manual

```
POST /api/trades/:id/close
→ updateTrade(db, {status: "close_requested"})

Bot (próximo tick, reconciliação):
→ detecta status "close_requested"
→ exchange.closePosition()
→ aguarda desaparecimento da posição na exchange
→ updateTrade(db, {status: "closed", closeReason: "manual"})
→ insertEvent(db, "trade_closed")
```

## Comunicação entre serviços

| De | Para | Mecanismo |
|----|------|-----------|
| Frontend | API | HTTP REST + JWT |
| Worker | DB | Drizzle (direto) |
| API | DB | Drizzle (direto) |
| Worker | Pacifica | WebSocket (candles) + REST assinado (ordens) |
| API | Pacifica | REST assinado (probe, market info) |
| DbWatcher | Bot | Callback in-process |

## Débitos técnicos

| ID | Descrição |
|----|-----------|
| DT-001 | Substituir polling do `db-watcher.ts` por LISTEN/NOTIFY do PostgreSQL |
| DT-002 | WebSocket na API para push de eventos ao frontend em tempo real |
| DT-003 | Circuit breaker formal no bot |
| DT-004 | Testes de integração para `bot.ts` |
| DT-005 | Substituir `technicalindicators` por implementações puras |
