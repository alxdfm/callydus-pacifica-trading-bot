# BG-024 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P1`
- owner: `Dev`
- area: `market data / infraestrutura`
- ultima atualizacao: `2026-04-07`

## Objetivo
Promover o scheduler local de market data para um modo de execucao de producao com `Lambda + EventBridge Scheduler`.

## Contexto
Hoje o refresh automatico roda localmente via `setInterval` no processo da API. Isso foi suficiente para validar o fluxo e desacoplar a logica do refresh do deploy final, mas ainda nao representa a topologia desejada para producao.

## Escopo Fechado
- criar entrypoint de execucao para o refresher fora da API
- manter a logica do `MarketDataRefresher` como nucleo reaproveitado
- configurar agenda de `1 minuto`
- fechar envs, timeout, memoria e telemetria minima do job

## Fora de Escopo
- redesenho do contrato de snapshots
- mudanca do storage para outro banco

## Dependencias
- [x] BG-023 concluido

## Critérios de Aceite Iniciais
- [ ] o refresh automatico nao depende mais do processo da API em producao
- [ ] existe scheduler externo configurado para `1 minuto`
- [ ] a mesma logica validada localmente e reutilizada no entrypoint de producao
- [ ] timeout, memoria e envs ficam explicitamente documentados

## Proximo Passo Recomendado
Criar o entrypoint de producao primeiro e depois conectar `EventBridge Scheduler`.

## Log de Acompanhamento
- `2026-04-07`: card criado como continuidade direta do `BG-023`.
