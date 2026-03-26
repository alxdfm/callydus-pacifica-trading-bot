# BG-011 Card

## Status
- status: `TODO`
- tipo: `refinamento`
- prioridade: `P0`
- owner: `PO`
- trilha: `Post-MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Definir com o PO se o produto exigira uma verificacao operacional pre-run da `Agent Wallet` antes de liberar o bot e qual side effect minimo e aceitavel para isso.

## Contexto
A doc da Pacifica nao expoe endpoint neutro de `check` para `Agent Wallet`. Isso deixa aberto o risco de o bot parecer pronto e falhar apenas quando surgir a primeira oportunidade de trade.

## Escopo Fechado
- [ ] decidir se o produto exige `operational verification` antes do bot ficar pronto
- [ ] decidir se essa verificacao ocorre no onboarding ou no `start bot`
- [ ] decidir qual side effect minimo e aceitavel
- [ ] alinhar naming e copy da UX para esse passo

## Referencias
- [PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md](/home/alxdfm/Projects/callydus/trading-bot-pacifica/docs/dev/PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md)
- [PACIFICA_AGENT_WALLET_PRE_RUN_VERIFICATION_PROPOSAL.pt-BR.md](/home/alxdfm/Projects/callydus/trading-bot-pacifica/docs/dev/PACIFICA_AGENT_WALLET_PRE_RUN_VERIFICATION_PROPOSAL.pt-BR.md)

## Perguntas para Refinamento
- O produto aceita um side effect controlado antes do bot ficar pronto?
- O check deve ser obrigatorio no onboarding ou antes do primeiro `start`?
- Como comunicar isso ao usuario sem parecer trade espontaneo inesperado?

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do gap de produto identificado na validacao operacional da `Agent Wallet` contra a Pacifica.
