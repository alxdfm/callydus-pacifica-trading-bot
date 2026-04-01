# AR-007 Card

## Status
- status: `TODO`
- tipo: `architectural refactoring`
- prioridade: `P1`
- owner: `Dev`
- trilha: `Architectural Refactoring`
- ultima atualizacao: `2026-03-31`

## Objetivo
Desacoplar a leitura de sessao operacional da sincronizacao externa com a Pacifica, reduzindo latencia, ambiguidade operacional e acoplamento entre `read model` e refresh externo.

## Problema Observado
- `GetOperationalSessionByWallet` hoje acumula:
  - reconciliacao interna de runtime
  - leitura de sessao persistida
  - refresh externo da Pacifica
  - releitura da sessao persistida
- o TTL introduzido na revisao de `2026-03-31` reduz custo, mas nao muda a responsabilidade misturada do caso de uso

## Impacto
- latencia variavel na leitura de sessao
- consumo de quota externa acoplado a um endpoint lido pela UI
- comportamento operacional menos previsivel
- dificuldade maior de observabilidade e testes isolados

## Escopo Fechado
- [ ] separar explicitamente `session read` de `exchange synchronization`
- [ ] definir fronteira clara entre snapshot persistido e refresh externo
- [ ] manter fallback explicito para `last_known` sem obrigar refresh em toda leitura
- [ ] tornar o comportamento operacional da sessao mais previsivel e testavel

## Fora de Escopo
- [ ] trocar imediatamente a estrategia atual por polling ou websocket
- [ ] reabrir a decisao de que a Pacifica e a fonte visivel de verdade

## Critérios de Pronto
- [ ] `account/session` consegue devolver snapshot sem obrigar sincronizacao externa no mesmo caso de uso
- [ ] a sincronizacao externa passa a ter boundary proprio e observavel
- [ ] o contrato de fallback `confirmed` vs `last_known` permanece preservado
- [ ] a refatoracao nao regride a UX ja consolidada no `FM-017`

## Referencias
- `apps/api/src/application/get-operational-session-by-wallet/GetOperationalSessionByWallet.ts`
- `apps/api/src/application/synchronize-pacifica-account-state/SynchronizePacificaAccountState.ts`
- `docs/dev/code-review/API_WORKER_CODE_REVIEW_2026-03-31.pt-BR.md`

## Log de Acompanhamento
- `2026-03-31`: card aberto a partir do residual arquitetural identificado no review de `api/worker`; o TTL atual reduz custo, mas nao fecha a separacao ideal entre leitura de sessao e sincronizacao externa.
