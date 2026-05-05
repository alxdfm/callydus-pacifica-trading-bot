# Linguagem Ubíqua — Glossário do Domínio

> **Source of truth para todos os nomes usados no projeto.**
> Código, tipos, rotas, UI e docs usam EXATAMENTE estes termos.
> Novo conceito → adicione aqui ANTES de criar o código.

---

## Entidades principais

**Strategy** — Configuração completa de uma estratégia: indicadores, condições de entrada, parâmetros de SL/TP e sizing. Criada pelo usuário na UI, persistida no banco, executada pelo Worker.
[Nunca use: config, setup, plan, botConfig]

**Signal** — Resultado da avaliação da Strategy contra o CandleBuffer. Valores: `'long' | 'short' | 'none'`.
[Nunca use: trigger, alert, indication]

**Position** — Posição aberta na exchange. Campos: `side`, `size`, `entryPrice`, `unrealizedPnl`, `stopLoss`, `takeProfit`.
[Nunca use: trade (para posição aberta), order (para posição)]

**Order** — Instrução enviada à exchange. Status: `pending | filled | cancelled | rejected`.
[Nunca use: request, trade (para ordem)]

**Candle** — OHLCV de um intervalo. Campos: `open`, `high`, `low`, `close`, `volume`, `timestamp`.
[Nunca use: bar, kline, candlestick]

**CandleBuffer** — Ring buffer in-memory com os últimos N candles de um símbolo. Não persistido.
[Nunca use: candleCache, priceHistory, klineBuffer]

**StopLoss** — Preço de saída que limita perda. Sempre obrigatório em toda Order.
[Nunca use: stop. `sl` aceito como nome curto de variável apenas no código TS]

**TakeProfit** — Preço-alvo de realização de lucro. Sempre obrigatório em toda Order.
[Nunca use: target. `tp` aceito como nome curto de variável apenas no código TS]

**BuilderCode** — Identificador do Pacifica Builder Program. Incluído em todas as ordens. Aprovado pelo usuário via assinatura Ed25519.
[Nunca use: referralCode, affiliateCode, feeCode]

**ExchangeInterface** — Contrato TypeScript (`interface`) para qualquer exchange. Permite trocar implementação sem alterar o bot.
[Nunca use: exchangeClient, apiWrapper]

**PacificaAdapter** — Implementação de `ExchangeInterface` para a Pacifica exchange.
[Nunca use: pacificaClient — é detalhe interno do adapter]

**Event** — Mensagem escrita pelo Worker no banco e consumida pela API para repassar ao frontend via WebSocket. Representa algo que aconteceu no sistema.
[Nunca use: message, notification, update]

**DbWatcher** — Módulo do Worker que lê strategies ativas do banco e detecta mudanças de estado.
[Nunca use: poller, scheduler — o DbWatcher usa `LISTEN/NOTIFY` do Postgres ou polling leve no banco, não polling de preço]

---

## Ações / Verbos

**`evaluate`** — Evaluator processa CandleBuffer + Strategy → Signal.
[Nunca use: check, analyze, runStrategy]

**`placeMarketOrder`** — Enviar market order à exchange. Sempre com `builderCode`.
[Nunca use: sendOrder, submitOrder, executeOrder]

**`setTpsl`** — Definir ou atualizar StopLoss e TakeProfit de uma Position aberta.
[Nunca use: updateSlTp, setStops]

**`subscribe`** — Conectar WS feed para receber candles de um símbolo.
[Nunca use: connect, listen, watch]

**`emit`** — Worker escreve um Event no banco.
[Nunca use: publish, broadcast — para o banco]

---

## Estados / Status

**`active`** — Strategy está sendo executada pelo Worker.
**`paused`** — Strategy existe mas Worker ignora temporariamente.
**`stopped`** — Strategy encerrada, Worker para de monitorar.
**`pending`** — Order enviada, aguardando confirmação.
**`filled`** — Order executada.
**`cancelled`** — Order cancelada.
**`rejected`** — Order recusada pela exchange.
**`open`** — Position ativa.
**`closed`** — Position encerrada (tp | sl | manual).

---

## Eventos (Event.type)

**`signal_evaluated`** — Signal calculado. Payload: `{ symbol, signal, timestamp }`.
**`order_placed`** — Order enviada. Payload: `{ orderId, symbol, side, amount }`.
**`order_filled`** — Order confirmada. Payload: `{ orderId, fillPrice }`.
**`position_closed`** — Position encerrada. Payload: `{ symbol, pnl, reason: 'tp'|'sl'|'manual' }`.
**`error`** — Erro no Worker. Payload: `{ message, context }`.
**`ws_reconnected`** — Price feed WS reconectou.

---

## Mapeamento código → domínio

| No código | No domínio | Motivo |
|-----------|-----------|--------|
| `side: 'bid'` | long | Pacifica usa bid/ask; domínio usa long/short na UI |
| `side: 'ask'` | short | idem |
| `sl` | StopLoss | abreviação aceita apenas em variáveis TS internas |
| `tp` | TakeProfit | idem |

---

## Termos BANIDOS

| Banido | Use em vez disso | Motivo |
|--------|-----------------|--------|
| `trade` | `order` ou `position` | ambíguo |
| `botConfig` | `strategy` | genérico demais |
| `kline` | `candle` | jargão Binance |
| `trigger` | `signal` | técnico demais |
| `polling` (de preço) | WebSocket | abordagem proibida |
