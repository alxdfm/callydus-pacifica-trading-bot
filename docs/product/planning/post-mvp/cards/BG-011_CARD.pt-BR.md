# BG-011 Card

## Status
- status: `DONE`
- tipo: `decisao em aberto`
- prioridade: `P0`
- owner: `PO`
- trilha: `Post-MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Definir com o PO se o onboarding passara a liberar a aplicacao apenas com `operational verification` da `Agent Wallet`, usando um probe operacional controlado, e qual side effect minimo e aceitavel para isso.

## Contexto
A doc da Pacifica nao expoe endpoint neutro de `check` para `Agent Wallet`. Isso deixa aberto o risco de o bot parecer pronto e falhar apenas quando surgir a primeira oportunidade de trade.

Direcao preferencial ja sugerida por dev:
- usar `limit order` extremamente fora do mercado
- seguida de cancelamento imediato
- como `operational verification` pre-run

## Escopo Fechado
- [x] decidir se o produto exige `operational verification` antes do bot ficar pronto
- [x] decidir se essa verificacao ocorre no onboarding ou no `start bot`
- [x] decidir qual side effect minimo e aceitavel
- [x] alinhar direcao de naming e copy da UX para esse passo
- [x] decidir se o produto quer expor um unico gate visivel de readiness ou mais de uma verificacao na UX

## Referencias
- [PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md](/home/alxdfm/Projects/callydus/trading-bot-pacifica/docs/dev/PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md)
- [PACIFICA_AGENT_WALLET_PRE_RUN_VERIFICATION_PROPOSAL.pt-BR.md](/home/alxdfm/Projects/callydus/trading-bot-pacifica/docs/dev/PACIFICA_AGENT_WALLET_PRE_RUN_VERIFICATION_PROPOSAL.pt-BR.md)

## Perguntas para Refinamento
- O produto aceita um side effect controlado antes do bot ficar pronto?
- O check deve ser obrigatorio no onboarding ou antes do primeiro `start`?
- Como comunicar isso ao usuario sem parecer trade espontaneo inesperado?
- O produto concorda em expor apenas `operationally_verified` como gate visivel de saida do onboarding?
- Estados tecnicos como `signature_verified` devem ficar apenas para diagnostico interno?

## Decisao de PO
- `operational verification` deve aparecer no onboarding, nao apenas antes do primeiro `start bot`
- o produto pode expor o check `operationally_verified` como gate visivel de saida do onboarding
- a UX deve ser transparente com o usuario sobre:
  - o que sera feito
  - por que esse check existe
  - que o objetivo e garantir que a conta realmente consegue operar antes de liberar o produto
- estados tecnicos internos adicionais nao precisam virar gate visivel principal se nao ajudarem a compreensao do usuario

## Impacto em Produto
- onboarding deixa de validar apenas assinatura ou formato e passa a validar prontidao operacional real
- o gate principal de saida do onboarding passa a ser `operationally_verified`
- copy, naming e estados do onboarding precisam explicar explicitamente o probe operacional e sua finalidade
- o side effect minimo aceitavel para o MVP funcional foi fechado como `create limit order + cancel order` de forma controlada

## Proximo Passo Recomendado
Usar a decisao fechada como base para as proximas tasks do Functional MVP que dependem de conta operacionalmente pronta.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do gap de produto identificado na validacao operacional da `Agent Wallet` contra a Pacifica.
- `2026-03-26`: PO decidiu que o check deve aparecer no onboarding e que `operationally_verified` pode ser exposto como gate visivel, com transparencia explicita sobre o que sera feito e por que.
- `2026-03-26`: decisao operacional fechada em conjunto com dev e design: o side effect minimo aceitavel no onboarding passa a ser um probe controlado de `create limit order + cancel order`, com UX transparente e gate final de saida baseado em `operationally_verified`.
