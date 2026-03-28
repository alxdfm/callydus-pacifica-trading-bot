# AR-002 — Consolidar fluxo compartilhado de validacao e readiness entre Onboarding e Profile

## Tipo
Architectural Refactoring

## Status
TODO

## Prioridade
P1

## Area
frontend / fluxo / estado

## Contexto
Onboarding e `Profile` executam a mesma semantica central:
- validar `Agent Wallet`
- interpretar resposta backend
- rodar readiness check
- promover estados locais de UI

Hoje isso existe em implementacoes paralelas.

## Problema
- duplicacao de regra entre onboarding e profile
- maior risco de drift de UX e de contrato interno
- manutencao mais cara a cada mudanca de backend ou de estado

## Impacto
- bugs de consistencia tendem a reaparecer
- revisoes e correcoes precisam ser lembradas em mais de um lugar
- escalabilidade do slice de credenciais fica pior

## Direcao Recomendada
- extrair um modulo/hook compartilhado para a maquina de estados de `credential validation + operational verification`
- manter onboarding e profile como composicao de UI e regras contextuais

## Criterio de Pronto
- existe um fluxo compartilhado para validacao/readiness
- onboarding e profile deixam de duplicar transicoes e mapeamentos principais
- contratos de sucesso, erro e retry ficam alinhados entre os dois contextos

## Referencias
- [ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md](../../../../dev/code-review/ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md)
