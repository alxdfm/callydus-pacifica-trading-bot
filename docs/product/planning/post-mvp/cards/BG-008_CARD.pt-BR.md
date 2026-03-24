# BG-008 Card

## Status
- status: `TODO`
- tipo: `ajuste de UX`
- prioridade: `P1`
- owner: `PO`
- area: `trades/history`
- ultima atualizacao: `2026-03-24`

## Objetivo
Reforcar o feedback visual de item selecionado em `Current Trades` e `History`, deixando claro que o painel da direita reflete o item ativo.

## Contexto
Hoje a relacao mestre-detalhe nao tem contraste suficiente para indicar selecao e vinculo com o painel lateral.

## Escopo Fechado
- estado selecionado mais evidente na lista
- reforco visual de que o painel da direita e contextual ao item ativo
- consistencia entre `Current Trades` e `History`

## Fora de Escopo
- redesenho completo das telas operacionais
- mudanca de arquitetura da pagina alem do necessario para melhorar feedback

## Racional de Produto
- reduz ambiguidade de leitura
- melhora confianca em operacoes sensiveis
- facilita entendimento rapido em listas com varios trades

## Dependencias
- alinhamento com design sobre padrao mestre-detalhe

## Critérios de Aceite Iniciais
- o item selecionado e claramente distinguivel dos demais
- o painel lateral parece explicitamente conectado ao item ativo
- a mesma logica visual se repete em trades e history

## Proximo Passo Recomendado
Definir um padrao visual unico de selecao para as telas de lista + detalhe.
