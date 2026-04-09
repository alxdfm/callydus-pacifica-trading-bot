# BG-029 Card

## Status
- status: `TODO`
- tipo: `decisao em aberto`
- prioridade: `P0`
- owner: `PO`
- area: `runtime / start bot`
- ultima atualizacao: `2026-04-09`

## Objetivo
Formalizar no backlog de produto o `Start bot readiness check` como gate operacional obrigatorio antes do `resume`, evitando que o bot entre em `active` sem validar a viabilidade real do preset com saldo, mercado e configuracao da conta naquele instante.

## Contexto
O onboarding ja prova readiness geral da conta, mas nao prova que o preset ativo consegue operar agora com:
- saldo atual
- sizing real configurado
- `min_order_size` do mercado
- `margin mode`
- `leverage` real da conta

O desenho tecnico ja foi estudado em:
- `docs/dev/START_BOT_READINESS_CHECK_TECH_DESIGN.pt-BR.md`
- `docs/dev/PRESET_PRE_TRADE_READINESS_CHECK_PROPOSAL.pt-BR.md`

Faltava o espelho no fluxo de PO/backlog, para o item nao ficar solto apenas em documentacao tecnica.

## Escopo Fechado
- tratar o `Start bot readiness check` como gate interno do `Start bot`
- nao reabrir onboarding por causa desse check
- bloquear o `resume` quando o preset ativo nao for operacionalmente viavel naquele momento
- exigir mensagem explicita quando o sizing calculado ficar abaixo do minimo aceito pela Pacifica
- manter o check contextual ao preset ativo, saldo atual e configuracao real da conta
- registrar isso como backlog formal de produto antes da entrega final

## Fora de Escopo
- redesign completo do dashboard
- alterar silenciosamente leverage ou margin mode na Pacifica
- criar novo endpoint publico separado se o contrato de produto continuar embutido no `resume`

## Dependencias
- [x] `docs/dev/START_BOT_READINESS_CHECK_TECH_DESIGN.pt-BR.md`
- [x] `docs/dev/PRESET_PRE_TRADE_READINESS_CHECK_PROPOSAL.pt-BR.md`
- [x] FM-013 a FM-017 em baseline funcional

## Critérios de Aceite Iniciais
- [x] existe item formal de PO para o readiness de `Start bot`
- [ ] fica claro que o gate e diferente do `operational verification` do onboarding
- [ ] fica claro que o bot nao entra em `active` quando o preset nao consegue operar com a configuracao atual
- [ ] produto e dev compartilham a mesma expectativa de mensagem e bloqueio

## Proximo Passo Recomendado
Transformar este card em handoff curto de PO para dev e design, fechando copy visivel, semantica do bloqueio e criterio de sucesso/erro no `Start bot`.

## Log de Acompanhamento
- `2026-04-09`: card criado para espelhar no backlog de PO a trilha de `Start bot readiness check`, que ate entao existia apenas em documentacao tecnica de dev.
