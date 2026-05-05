# Overview do Sistema

## O que este sistema faz

```
Bot de trading automatizado para perpetuals na Pacifica exchange.
O usuário configura Strategies via UI; o Worker as executa em tempo real
via WebSocket de preço — com SL/TP obrigatórios e builder_code em todas as ordens.
A API nunca executa ordens; o Worker nunca fala com a API — tudo via banco.
```

---

## Fluxo principal — configurar e ativar uma strategy

```
[Usuário configura Strategy no StrategyBuilder]
      │
      ▼
[POST /api/strategies  →  API salva no banco (Neon PG)]
      │
      ▼
[Worker: db-watcher detecta nova strategy ativa]
      │
      ▼
[Worker: ws-feed.ts conecta ao WS Pacifica para o symbol]
      │
      ▼
[Candle chega → CandleBuffer.push() → Evaluator.evaluate()]
      │
      ▼
[Signal = 'long' | 'short' | 'none']
      │ (se long ou short)
      ▼
[Bot: calcula size, SL, TP → PacificaAdapter.placeMarketOrder()]
      │   (inclui builder_code em todas as chamadas)
      ▼
[PacificaAdapter.setTpsl() → Position aberta com SL/TP]
      │
      ▼
[Worker escreve Trade + Event no banco]
      │
      ▼
[API detecta novo Event no banco → emite via /ws/events → Dashboard]
```

---

## Módulos principais

| Módulo | Peça | Responsabilidade |
|--------|------|-----------------|
| `ExchangeInterface` | shared/api/worker | Contrato ABC para qualquer exchange |
| `PacificaAdapter` | api + worker | Implementa ExchangeInterface para Pacifica |
| `signing.ts` | api + worker | Ed25519 signing — não tocar sem decisão |
| `indicators.ts` | worker/engine | EMA, SMA, RSI, ATR |
| `strategy-schema.ts` | worker/engine | Zod schema da Strategy configurável |
| `evaluator.ts` | worker/engine | Condições AND/OR → Signal |
| `ws-feed.ts` | worker/feed | WebSocket price feed da Pacifica |
| `candle-buffer.ts` | worker/feed | Ring buffer em memória (300 candles) |
| `bot.ts` | worker | Loop principal — orquestra tudo |
| `db-watcher.ts` | worker | Lê strategies ativas do banco |
| `routes/` | api | Hono handlers: strategies, positions, events, builder |
| `ws-manager.ts` | api | Gerencia conexões WS com o frontend |
| `StrategyBuilder` | frontend | UI visual de configuração |
| `Dashboard` | frontend | PnL, posições abertas, event log |

---

## Integrações externas

| Serviço | Peça | Tipo | Para que serve |
|---------|------|------|----------------|
| Pacifica REST API | api + worker | fetch async | Ordens, posições, account, builder code |
| Pacifica WebSocket | worker | WS nativo | Price feed de candles (sem polling) |
| Neon PostgreSQL | api + worker | Drizzle | Strategies, trades, events — bridge entre peças |
| AWS Lambda | api | SST deploy | Hosting serverless da API |
| Oracle Cloud | worker | Docker | VM always-free para o worker persistente |

---

## Schema do banco (visão geral)

```
strategies      ← criadas pela API, lidas pelo worker
  id, user_id, config (jsonb), symbol, status (active|paused|stopped), created_at

trades          ← escritas pelo worker, lidas pela API
  id, strategy_id, symbol, side, amount, entry_price, sl, tp, status, pnl, created_at

events          ← escritas pelo worker, consumidas pela API → WS frontend
  id, strategy_id, type, payload (jsonb), created_at, consumed_at

builder_approvals ← escritas pela API após fluxo de approve
  id, user_id, builder_code, max_fee_rate, approved_at
```

---

## Regras de negócio invioláveis

1. **SL/TP obrigatórios** — nenhuma ordem sem `stopLoss` + `takeProfit`
2. **Builder code em tudo** — `builderCode` em `placeMarketOrder`, `placeOrder`, `placeStopOrder`, `setTpsl`
3. **Sem polling** — price feed exclusivamente via WebSocket no worker
4. **Sem candles no banco** — `CandleBuffer` é in-memory; só trades são persistidos
5. **Worker isolado** — worker não faz HTTP para a API, nunca
6. **Chave privada isolada** — somente em `.env`, nunca em log ou imagem Docker
