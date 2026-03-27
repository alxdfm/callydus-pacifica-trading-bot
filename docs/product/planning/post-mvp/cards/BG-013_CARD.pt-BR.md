# BG-013 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `Designer`
- area: `onboarding`
- ultima atualizacao: `2026-03-26`

## Objetivo
Revisar a UX do onboarding para expor `operationally_verified` de forma clara, transparente e compreensivel para usuario nao tecnico.

## Contexto
PO decidiu que o onboarding deve mostrar explicitamente o check operacional da `Agent Wallet`, deixando claro o que sera feito e por que esse passo existe antes de liberar a aplicacao.

## Escopo Fechado
- definir naming do passo de `operational verification`
- definir microcopy explicando o que sera feito e por que
- definir estados visiveis de loading, sucesso, erro e retry
- definir como comunicar side effect controlado sem parecer trade inesperado
- alinhar handoff para dev e QA

## Fora de Escopo
- redesenho estrutural completo do onboarding
- criacao de novos fluxos paralelos de validacao

## Dependencias
- [x] BG-011 decidido do ponto de vista de produto
- [x] proposta tecnica inicial de dev para o probe operacional

## Critérios de Aceite Iniciais
- [x] o usuario entende que existe um check operacional antes da liberacao
- [x] a UX explica com clareza o que sera feito e por que
- [x] o side effect controlado nao parece comportamento inesperado do produto
- [x] os estados de erro e retry deixam a proxima acao evidente

## Proximo Passo Recomendado
Usar este handoff como referencia base para evolucoes futuras do onboarding operacional.

## Decisao de Design
- naming preferencial do passo: `Run readiness check`
- linguagem de produto preferencial: `readiness check` ou `operational check`
- a UX deve explicar que uma ordem tecnica controlada sera criada e cancelada em seguida
- esse passo nao deve ser comunicado como trade espontaneo
- o gate final de saida do onboarding passa a ser `operationally_verified`

## Evidencia de Design
- [ONBOARDING_STATE_MATRIX.pt-BR.md](../../../../design/ONBOARDING_STATE_MATRIX.pt-BR.md)
- [SCREEN_HANDOFF.pt-BR.md](../../../../design/SCREEN_HANDOFF.pt-BR.md)
- [DESIGN_HANDOFF.pt-BR.md](../../../../design/DESIGN_HANDOFF.pt-BR.md)
- [onboarding.html](../../../../design/preview/onboarding.html)

## Log de Acompanhamento
- `2026-03-26`: card criado a partir da decisao de PO de expor `operationally_verified` no onboarding como gate visivel e transparente para o usuario.
- `2026-03-26`: handoff de design fechado com naming, disclosure, microcopy e estados visiveis para `operational verification` no onboarding.
- `2026-03-26`: handoff aplicado em codigo no onboarding do app, com validacao manual posterior do fluxo completo.
