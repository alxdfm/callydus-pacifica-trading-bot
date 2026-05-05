# Decisão: Worker isolado — comunica com API apenas via banco

**Data:** 2025-05-04  
**Status:** aceita  
**Autor:** Callydus

## Contexto

O Worker precisa ser um processo persistente (WebSocket de preço não pode ser serverless). Precisamos definir como Worker e API se comunicam sem criar acoplamento direto.

## Opções consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| Worker chama API REST | simples | acoplamento; API precisa estar up |
| Banco como message bus | desacoplado; ambos independentes | leve latência de polling no banco |
| Redis pub/sub | baixa latência | infra adicional; Oracle free não tem Redis fácil |

## Decisão tomada

**Banco (Neon PostgreSQL) como única bridge entre Worker e API.**

Worker escreve `events` e `trades`. API lê e repassa ao frontend via WebSocket. Para notificação em tempo real, usar `LISTEN/NOTIFY` nativo do Postgres — zero infra adicional.

## Consequências

- Worker e API totalmente independentes — um pode reiniciar sem derrubar o outro
- Latência Worker → Frontend: ~100-500ms (aceitável para trading não-HFT)
- Sem Redis, sem custo adicional, roda no Oracle Free tier
- Revisitar se latência se tornar problema — considerar Redis no futuro
