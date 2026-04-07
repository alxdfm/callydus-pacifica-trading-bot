# BG-026 Card

## Status
- status: `TODO`
- tipo: `melhoria`
- prioridade: `P1`
- owner: `Dev`
- area: `market data / observabilidade`
- ultima atualizacao: `2026-04-07`

## Objetivo
Medir o impacto real da centralizacao de market data em `429`, volume de chamadas externas e tempo medio de refresh.

## Contexto
A trilha local-first foi entregue e a observabilidade basica de `hit/miss/stale` ja existe em logs. Ainda falta fechar a evidencia quantitativa de que a pressao sobre a Pacifica caiu no ambiente real.

## Escopo Fechado
- acompanhar taxa de `429` antes e depois da migracao
- acompanhar volume de chamadas externas da API e do worker
- acompanhar tempo medio de refresh
- registrar conclusao tecnica no backlog/doc

## Fora de Escopo
- mudanca de contrato da API
- mudanca de storage

## Dependencias
- [x] BG-023 concluido
- [ ] BG-024 preferencialmente avancado em producao

## Critérios de Aceite Iniciais
- [ ] existe comparativo antes/depois para `429`
- [ ] o time consegue estimar reducao de chamadas redundantes
- [ ] tempo medio de refresh fica observavel
- [ ] ha conclusao tecnica sobre o ganho real da centralizacao

## Proximo Passo Recomendado
Executar a medicao primeiro no ambiente mais proximo de producao e consolidar o resultado antes de novos refinamentos de arquitetura.

## Log de Acompanhamento
- `2026-04-07`: card criado para fechar a lacuna de validacao quantitativa apos a entrega local-first.
