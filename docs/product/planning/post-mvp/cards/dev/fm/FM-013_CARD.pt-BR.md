# FM-013 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-30`

## Objetivo
Transformar o `worker` em consumidor operacional continuo do runtime, por conta/preset ativo, com `heartbeat`, retomada segura e protecao contra dupla execucao.

## Escopo Fechado
- [ ] consumir contas aptas a operar a partir do runtime persistido
- [ ] manter loop continuo por conta/preset ativo
- [ ] registrar `heartbeat` real do worker
- [ ] evitar dupla execucao da mesma conta
- [ ] suportar retomada segura apos restart
- [ ] aplicar retry e backoff tecnicos no loop

## Fora de Escopo
- [ ] novos fluxos de produto fora do fechamento operacional final
- [ ] redesign de UX sem impacto na operacao real

## Checklist de Entrega Real
- [ ] o `worker` passa a ser o consumidor canonico do runtime persistido
- [ ] `heartbeat` reflete atividade real do loop
- [ ] restart do processo nao gera perda silenciosa de ownership da conta
- [ ] ha protecao minima contra dupla execucao e corrida entre loops

## Dependencias
- [x] baseline implementada em `FM-006`
- [x] baseline implementada em `FM-009`
- [x] baseline implementada em `FM-010`

## Critérios de Aceite da Task
- [ ] existe loop operacional continuo por conta/preset ativo
- [ ] o runtime distingue conta parada de conta ativa com worker saudavel
- [ ] o produto nao depende apenas de acoes manuais para parecer operacionalmente vivo

## Proximo Passo Recomendado
Usar esse loop como base para plugar a avaliacao recorrente de sinais em `FM-014`.

## Log de Acompanhamento
- `2026-03-30`: card criado a partir do fechamento do `PRODUCT_FINALIZATION_PO_GUIDE`, para transformar o worker em runtime continuo alinhado as decisoes finais de produto.
