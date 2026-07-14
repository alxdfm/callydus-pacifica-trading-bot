# Arquitetura do Sistema

## Visão geral

Monorepo de trading automatizado para a exchange Pacifica (Solana/perps). Três serviços desacoplados que se comunicam via banco de dados e REST.

```
Cron horário (:01 UTC)
        │
        ▼
Worker handler ── REST /api/v1/kline ──▶ CandleBuffer ──▶ Engine (evaluateSignal)
        │                                                        │
        ├── strategies (Drizzle DB)                              ▼
        ├── snapshot funding/OI (1/h)                    Executor (ordens)
        │                                                        │
        └────────────────────── Drizzle DB ◀─────────────────────┘
                                    │
                              API (Hono) ◀──▶ Frontend
```

## Pacotes

| Pacote | Responsabilidade | Deploy |
|--------|-----------------|--------|
| `@pacifica/api` | REST API, autenticação, queries, backtest | Lambda (SST v4) |
| `@pacifica/worker` | Bot agendado, candles, sinais, ordens | Lambda + Cron horário (SST v4) |
| `@pacifica/frontend` | UI React, onboarding, dashboard | AWS Amplify |
| `@pacifica/shared` | Tipos primitivos (Candle, Signal) + **contrato v2** (`/contracts`, zod) | — |
| `@pacifica/config` | tsconfig base | — |

## Separação de responsabilidades

**API** nunca executa ordens. É stateless e serve somente para:
- Autenticar usuários (SIWS + token HMAC) e onboarding de credenciais
- Snapshot de sessão, estratégia e consultas de trades/eventos (superfície v2)
- Backtest (simulação histórica)
- Operações de controle (activate/pause) — escrevem `strategies.status`, quem age é o worker

A API valida as **próprias respostas** contra o contrato de `@pacifica/shared/contracts`
antes de enviar (violação = 500 + log), então divergência de schema explode no
servidor em vez de quebrar o parse do cliente.

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

4. POST /api/onboarding/credentials/validate {mainWalletPublicKey, agentWalletPublicKey, agentWalletPrivateKey}
   → valida derivação → criptografa AES-256-GCM → upsertAccount + upsertCredential()

5. POST /api/onboarding/builder/approve  → builder_approvals

6. POST /api/onboarding/credentials/verify-operational {credentialId, walletAddress}
   → descriptografa → cria PacificaClient → ordem-probe ALO → cancela
   → credential.operationallyVerified = true  → GET /api/v2/session passa a devolver access="ready"
```

## Fluxo de trading (Worker)

```
Invocação (Cron horário, minuto :01 UTC):
  loadActiveStrategies(db) → deriva os pares exatos (symbol, timeframe)
  CandleBuffer(capacity=300) ← REST /api/v1/kline (300 candles por par)
  createBot() → runOnce()

Tick (um por invocação):
  Para cada estratégia ativa:
    reconcile()            ← closes por SL/TP + executa close_requested (reduce-only)
    evaluateAndExecute()   ← só quando há candle FECHADO ainda não avaliado

evaluateAndExecute():
  config  = materializeYourStrategyTechnicalContract(strategy.config)
  candles = CandleBuffer.get(symbol, timeframe)
  signal  = evaluateSignal(config, candles)   → "none" | "long" | "short"
  if signal == "none" ou posição já aberta → skip
  saldo   = GET /api/v1/account (available_to_spend); sem saldo → skip
  notional = saldo × positionSizeValue / 100   (sem alavancagem — ver task #13)
  buildRiskPlans() → {sl, tp}   (obrigatórios)
  client.createMarketOrder({..., sl, tp, builderCode})   ← cliente assinado POR estratégia
  setPositionTpsl() → re-ancora proteção no preço de fill real
  insertTrade(db) + insertEvent(db, "trade_opened")
```

A marcação de "candle avaliado" (`lastEvaluatedCandleOpenTime`) acontece **antes**
da execução: ordem lenta não pode disparar duas vezes no mesmo candle.

## Fluxo de close manual

```
POST /api/v2/trades/:id/close
→ updateTrade(db, {status: "close_requested"})   ← a API nunca chama a exchange

Bot (próximo tick, reconciliação):
→ detecta status "close_requested"
→ createMarketOrder({reduceOnly: true}) assinado com a credencial do dono
→ updateTrade(db, {status: "closing"})
→ tick seguinte: posição sumiu da exchange (grace de 120s)
→ preço de saída e PnL vindos do fill real (/api/v1/positions/history)
→ updateTrade(db, {status: "closed", closeReason: "manual"})
→ insertEvent(db, "trade_closed")
```

## Comunicação entre serviços

| De | Para | Mecanismo |
|----|------|-----------|
| Frontend | API | HTTP REST + JWT |
| Worker | DB | Drizzle (direto) |
| API | DB | Drizzle (direto) |
| Worker | Pacifica | REST (candles/info) + REST assinado (ordens) |
| API | Pacifica | REST assinado (probe, market info) |
| Cron (EventBridge) | Worker | Invocação Lambda horária |

## Débitos técnicos

| ID | Descrição |
|----|-----------|
| DT-002 | WebSocket na API para push de eventos ao frontend em tempo real |
| DT-003 | Circuit breaker formal no bot |
| DT-004 | Testes de integração para `bot.ts` |

Resolvidos: **DT-005** (indicadores puros com golden tests de paridade em `engine/indicators.ts`).
