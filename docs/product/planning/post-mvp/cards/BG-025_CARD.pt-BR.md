# BG-025 Card

## Status
- status: `TODO`
- tipo: `melhoria`
- prioridade: `P2`
- owner: `Dev`
- area: `market data / api`
- ultima atualizacao: `2026-04-07`

## Objetivo
Decidir e expor, quando fizer sentido, metadados de frescor de market data nas respostas da API.

## Contexto
A politica interna de `fresh/stale/unavailable` ja existe e orienta o consumo pela API e pelo worker, mas os endpoints publicos ainda retornam apenas o payload de mercado sem explicar explicitamente a idade/frescor do snapshot ao cliente.

## Escopo Fechado
- decidir se `prices`, `candles` e `market info` devem expor frescor
- desenhar contrato sem quebrar consumidores atuais
- alinhar copy/semantica com o produto

## Fora de Escopo
- redesenho completo das telas
- mudanca da politica interna de frescor

## Dependencias
- [x] BG-023 concluido

## Critérios de Aceite Iniciais
- [ ] existe decisao clara de produto para metadado de frescor
- [ ] o contrato da API permanece coerente para consumidores atuais
- [ ] `stale` e `unavailable` nao sao expostos de forma ambigua

## Proximo Passo Recomendado
Refinar se o metadado deve ficar em endpoints de debug primeiro ou entrar direto no contrato publico principal.

## Log de Acompanhamento
- `2026-04-07`: card criado a partir do backlog residual da centralizacao de market data.
