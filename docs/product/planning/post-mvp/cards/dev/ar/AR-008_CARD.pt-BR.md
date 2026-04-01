# AR-008 Card

## Status
- status: `TODO`
- tipo: `architectural refactoring`
- prioridade: `P1`
- owner: `Dev`
- trilha: `Architectural Refactoring`
- ultima atualizacao: `2026-03-31`

## Objetivo
Escalar o discovery de contas executaveis do `worker` com paginacao e/ou particionamento, evitando que o crescimento de contas ativas degrade o throughput do loop operacional.

## Problema Observado
- `listRunnableRuntimeCandidates` ja deixou de ser full-table puro e hoje filtra melhor no banco
- ainda assim, a estrategia atual continua sem:
  - paginacao
  - particionamento
  - distribuicao explicita entre replicas

## Impacto
- custo do scan cresce com a base
- risco de gargalo conforme aumenta o numero de contas ativas
- maior pressao sobre banco e loop principal do worker
- base menos preparada para escalabilidade horizontal futura

## Escopo Fechado
- [ ] definir estrategia de paginacao ou janelamento para candidatos executaveis
- [ ] preparar caminho para distribuicao horizontal entre replicas do worker
- [ ] reduzir custo do scan recorrente sem perder a semantica de lease persistida
- [ ] manter compatibilidade com a arquitetura atual de ownership por conta

## Fora de Escopo
- [ ] introduzir mensageria/fila distribuida obrigatoriamente
- [ ] quebrar o worker em multiplos tipos de servico sem necessidade real

## Critérios de Pronto
- [ ] o scan do worker deixa de depender de leitura ampla sem limite
- [ ] existe estrategia clara para particionamento horizontal futuro
- [ ] a lease persistida continua sendo a fonte de verdade para ownership
- [ ] a mudanca preserva o comportamento atual do `FM-013` ao `FM-016`

## Referencias
- `apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts`
- `apps/worker/src/application/createOperationalWorker.ts`
- `docs/dev/code-review/API_WORKER_CODE_REVIEW_2026-03-31.pt-BR.md`

## Log de Acompanhamento
- `2026-03-31`: card aberto a partir do residual arquitetural identificado no review de `api/worker`; o filtro atual no banco melhora o scan, mas ainda nao resolve paginacao nem particionamento para crescimento futuro.
