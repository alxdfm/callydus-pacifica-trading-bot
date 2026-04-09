# BG-030 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P1`
- owner: `PO`
- area: `presets / mercados`
- ultima atualizacao: `2026-04-09`

## Objetivo
Registrar formalmente no backlog de produto a restricao dos pares editaveis dos presets para `BTC/USDC`, `ETH/USDC` e `SOL/USDC`.

## Contexto
O produto final ja tinha decisao de PO congelada para operar inicialmente com `BTC`, `SOL` e `ETH`. Essa direcao foi absorvida em codigo no fluxo real de presets, removendo `ARB/USDC` do contrato editavel e do catalogo permitido.

## Escopo Fechado
- restringir os symbols editaveis de preset para `BTC/USDC`, `ETH/USDC` e `SOL/USDC`
- refletir a restricao no contrato compartilhado
- refletir a restricao no frontend dos presets
- remover `ARB/USDC` do escopo atual do produto

## Fora de Escopo
- expansao de mercados alem dos tres pares definidos
- abrir dinamicamente lista de symbols sem nova decisao de PO

## Dependencias
- [x] `PRODUCT_FINALIZATION_PO_GUIDE.pt-BR.md`
- [x] implementacao em `packages/contracts`
- [x] implementacao em `apps/app`

## Critérios de Aceite Iniciais
- [x] o contrato compartilhado aceita apenas `BTC/USDC`, `ETH/USDC` e `SOL/USDC`
- [x] o fluxo de presets do app nao oferece mais `ARB/USDC`
- [x] a implementacao segue a decisao de produto ja congelada para mercados iniciais

## Proximo Passo Recomendado
Manter qualquer expansao futura de pares como nova decisao de produto, com card sequencial proprio.

## Log de Acompanhamento
- `2026-04-09`: card criado para registrar no padrao de PO a absorcao da decisao de produto sobre mercados iniciais no fluxo real de presets.
