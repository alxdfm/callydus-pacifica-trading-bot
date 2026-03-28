# AR-003 — Decompor `OnboardingPage` por dominio e passo

## Tipo
Architectural Refactoring

## Status
TODO

## Prioridade
P2

## Area
frontend / onboarding / modularizacao

## Contexto
`OnboardingPage.tsx` concentra derivacao de labels, navegacao entre passos, regras de desbloqueio, resets, handlers async e renderizacao dos steps.

O fluxo esta funcional, mas o componente ja virou ponto caro de manutencao.

## Problema
- excesso de responsabilidades no mesmo arquivo
- leitura lenta e teste dificil
- alto risco de regressao ao tocar qualquer passo

## Impacto
- dificulta evolucao futura do onboarding
- reduz reuso
- aumenta custo de debugging

## Direcao Recomendada
- quebrar por passo ou por dominio
- mover handlers e transicoes para hooks dedicados
- centralizar helpers de reset/transicao do fluxo

## Criterio de Pronto
- `OnboardingPage` vira composicao de subcomponentes/hooks
- regras de negocio e transicao saem da camada de renderizacao
- cada step passa a ter ownership mais claro

## Referencias
- [ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md](../../../../dev/code-review/ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md)
