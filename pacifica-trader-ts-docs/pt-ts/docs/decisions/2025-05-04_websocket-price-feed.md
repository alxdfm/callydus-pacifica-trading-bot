# Decisão: WebSocket para price feed — sem polling

**Data:** 2025-05-04  
**Status:** aceita  
**Autor:** Callydus

## Contexto

O bot atual usa polling de preço a cada 1 minuto. Latência de até 60s para detectar sinal é inaceitável. Além disso, acumula registros desnecessários no banco.

## Opções consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| Polling 1min | simples | latência 60s, lixo no banco |
| Polling 5s | latência menor | mais requests, não escala |
| WebSocket Pacifica | latência ms, event-driven | reconexão necessária |

## Decisão tomada

**WebSocket nativo da Pacifica em `ws-feed.ts` com reconexão automática (backoff exponencial).**

CandleBuffer mantém últimos 300 candles em memória via `deque`. Zero candles no banco.

## Consequências

- Latência de detecção de sinal: milissegundos
- Reconexão automática com backoff — worker sobrevive a quedas de rede
- Sem tabela de candles no banco
- Revisitar se Pacifica deprecar o WS de candles
