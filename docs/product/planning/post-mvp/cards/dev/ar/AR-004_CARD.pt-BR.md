# AR-004 — Criar cobertura automatizada para onboarding e profile nos fluxos de credencial

## Tipo
Architectural Refactoring

## Status
TODO

## Prioridade
P1

## Area
testes / onboarding / profile

## Contexto
Os reviews tecnicos recentes mostraram que onboarding e profile compartilham contratos e semantica sensiveis, mas o projeto ainda nao tem cobertura automatizada suficiente nesses fluxos.

## Problema
- ausencia de testes de contrato entre frontend e backend local
- ausencia de testes de fluxo para onboarding
- ausencia de testes de fluxo para replacement no profile

## Impacto
- regressao silenciosa em refatoracoes futuras
- menor confianca para consolidar arquitetura depois
- custo manual alto de validacao

## Direcao Recomendada
- adicionar testes de contrato para respostas backend usadas por onboarding/profile
- adicionar testes de fluxo para onboarding e `Replace Agent Wallet`
- cobrir casos de erro, retry, readiness e credencial ativa/replaced

## Criterio de Pronto
- existe cobertura automatizada minima para onboarding e profile
- os principais cenarios de sucesso/falha estao protegidos
- as futuras refatoracoes arquiteturais passam a ter rede de seguranca

## Referencias
- [ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md](../../../../dev/code-review/ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md)
