# Sprint 1: Decisao de PO sobre Agent Wallet

## Status
- status: `APROVADA_POR_PO`
- data de aprovacao: `2026-03-22`
- origem: proposta tecnica de dev incorporada por produto
- impacto principal: `V1.5`, `V1.6`, copy, handoff de design e validacao de onboarding

## Decisao
O MVP da Sprint 1 passa a adotar `Agent Wallet` como contrato oficial de credenciais no onboarding.

## O Que Fica Fechado
- `Agent Wallet` substitui oficialmente `API key + secret` como contrato de credenciais da Sprint 1
- o formulario do onboarding deve usar:
  - `mainWalletPublicKey` como dado readonly vindo da wallet conectada
  - `agentWalletPublicKey` como campo obrigatorio
  - `agentWalletPrivateKey` como campo obrigatorio no submit inicial
  - `credentialAlias` como campo opcional
- a validacao continua por CTA explicito `Validate and Continue`
- somente `status: valid` com `canProceed: true` libera o dashboard
- qualquer resposta diferente de valida mantem o produto bloqueado

## Racional de Produto
- o contrato tecnico ficou claro, executavel e alinhado ao fluxo operacional proposto para a Sprint 1
- a mudanca reduz ambiguidade entre wallet principal, credencial operacional e validacao Pacifica
- manter `API key + secret` em paralelo abriria duplicidade de fluxo e retrabalho desnecessario nesta sprint

## Guardrails
- a private key principal do usuario nunca entra no formulario
- `agentWalletPrivateKey` pode ser enviada apenas no submit inicial e nunca deve voltar ao browser depois disso
- a UI deve explicar a etapa com copy simples e sem linguagem excessivamente tecnica
- se design identificar queda relevante de clareza para usuario nao tecnico, deve escalar para PO antes de fechar handoff

## Impacto Pratico
- `V1.5` deve implementar formulario oficial de `Agent Wallet`
- `V1.6` deve integrar validacao oficial de `Agent Wallet`
- design deve ajustar campos, textos e mensagens de erro para esse contrato
- QA deve validar o fluxo usando esse contrato como verdade da Sprint 1

## Pendencias Restantes
Nao resta pendencia de produto sobre o contrato de credenciais da Sprint 1. O que resta agora e execucao das tasks e validacao de clareza de UX durante o handoff.
