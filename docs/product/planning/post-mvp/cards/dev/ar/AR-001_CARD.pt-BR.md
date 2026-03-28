# AR-001 — Remover `agentWalletPrivateKey` do estado global em memoria

## Tipo
Architectural Refactoring

## Status
TODO

## Prioridade
P1

## Area
frontend / seguranca / estado global

## Contexto
Hoje a `Agent Wallet private key` ja nao e persistida em `localStorage`, mas ainda existe modelada no `AppState` em memoria.

Isso mantem uma responsabilidade sensivel no estado global compartilhado mesmo quando ela so e necessaria nos drafts de onboarding e de `Replace Agent Wallet`.

## Problema
- segredo sensivel continua trafegando pelo store global do app
- onboarding e profile ainda podem depender implicitamente desse campo
- a semantica do store fica mais ampla do que a realmente necessaria

## Impacto
- aumenta superficie de risco de seguranca no frontend
- dificulta raciocinio sobre ownership do segredo
- atrapalha modularizacao posterior dos fluxos de credencial

## Direcao Recomendada
- remover `agentWalletPrivateKey` do `AppState`
- manter o segredo apenas em drafts locais dos fluxos que realmente precisam dele
- ajustar onboarding e profile para nao dependerem do store compartilhado para esse campo

## Criterio de Pronto
- `AppState` nao modela mais `agentWalletPrivateKey`
- onboarding continua funcional usando draft local
- profile replacement continua funcional usando draft local
- nenhum segredo sensivel e escrito em store global, nem em memoria compartilhada, fora do escopo do fluxo local

## Referencias
- [ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md](../../../../dev/code-review/ONBOARDING_PROFILE_CODE_REVIEW.pt-BR.md)
