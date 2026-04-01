# Revisao de Codigo de API e Worker

## Objetivo
Registrar a revisao tecnica das camadas `api` e `worker`, com foco em bugs, duplicacao, performance, reutilizacao e riscos de escalabilidade.

## Escopo Revisado
- `apps/api/src/application/get-operational-session-by-wallet/GetOperationalSessionByWallet.ts`
- `apps/api/src/application/pause-bot/PauseBot.ts`
- `apps/api/src/application/resume-bot/ResumeBot.ts`
- `apps/api/src/application/lookup-operational-account-by-wallet/LookupOperationalAccountByWallet.ts`
- `apps/worker/src/application/createOperationalWorker.ts`
- `apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts`

## Conclusao Executiva
- A base de `api` e `worker` esta bem direcionada em termos de separacao de casos de uso e persistencia, mas a revisao encontrou problemas concretos de idempotencia, throughput e semantica de retry.
- Os findings objetivos desta rodada foram tratados em seguida: retry real no `worker`, filtro melhor no scan, amortizacao do refresh externo da Pacifica e remocao de cast frouxo no lookup.
- O residual principal agora e arquitetural: o scan do worker ainda nao e paginado e a leitura de sessao continua acumulando responsabilidades, mesmo com TTL para reduzir custo.

## Findings

### 1. Alta: o worker marca falhas retryable como terminais e inviabiliza retry real
Trecho observado:
- `apps/worker/src/application/createOperationalWorker.ts`

Leitura atual:
- `classifyOrderExecutionFailure` distingue falhas retryable, por exemplo `429` e erros marcados como retryable pela Pacifica
- mas, no `catch`, toda falha leva a `failSignalDecision`

Impacto:
- uma falha temporaria nao volta para fila
- o sistema grava `retryableFailure: true`, mas o fluxo nao usa essa informacao para recuperar a decisao
- isso reduz resiliencia exatamente onde o worker diz suportar retry

Referencias:
- `apps/worker/src/application/createOperationalWorker.ts:529`
- `apps/worker/src/application/createOperationalWorker.ts:812`

Status do finding:
- resolvido em `2026-03-31`
- falhas `retryable` e nao bloqueantes agora voltam a `pending` por `requeueSignalDecision`, em vez de serem tratadas como terminais

### 2. Media: o worker faz scan full-table periodico de contas operacionais
Trecho observado:
- `apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts`

Leitura atual:
- `listRunnableRuntimeCandidates` faz `findMany` em `operatorAccount` sem filtro de runtime elegivel nem paginação
- a filtragem de contas pausadas, sem preset ativo ou com lease vigente e feita em memoria depois da leitura

Impacto:
- custo cresce linearmente com a base inteira
- a cada ciclo do worker, contas inelegiveis continuam sendo carregadas do banco
- isso tende a virar gargalo quando a quantidade de operadores aumentar

Referencia:
- `apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts:46`

Status do finding:
- parcialmente resolvido em `2026-03-31`
- o scan deixou de ser full-table puro e passou a filtrar no banco por preset ativo, runtime nao pausado e lease inexistente/expirada
- residual: ainda nao ha paginacao nem estrategia de particionamento

### 3. Media: `pause` e `resume` dizem usar idempotencia, mas a chave inclui timestamp e nao protege retries reais
Trechos observados:
- `apps/api/src/application/pause-bot/PauseBot.ts`
- `apps/api/src/application/resume-bot/ResumeBot.ts`

Leitura atual:
- a chave de idempotencia e montada com `walletAddress + nowIso`
- qualquer retry do mesmo comando gera uma chave diferente

Impacto:
- retries de rede ou cliques duplicados podem criar comandos duplicados
- a semantica de idempotencia existe no contrato, mas nao na pratica
- isso e especialmente ruim em comandos operacionais

Referencias:
- `apps/api/src/application/pause-bot/PauseBot.ts:39`
- `apps/api/src/application/resume-bot/ResumeBot.ts:39`

Status do finding:
- resolvido em `2026-03-31`
- a persistencia passou a deduplicar semanticamente `pause`/`resume` com base no estado atual do runtime e a usar chave derivada da versao atual do runtime, em vez de timestamp puro

### 4. Media: leitura de sessao operacional faz reconciliacao local e refresh externo da Pacifica em toda chamada
Trecho observado:
- `apps/api/src/application/get-operational-session-by-wallet/GetOperationalSessionByWallet.ts`

Leitura atual:
- toda leitura pode:
  - reconciliar runtime local
  - ler sessao persistida
  - chamar `synchronizePacificaAccountState`
  - reler a sessao persistida

Impacto:
- latencia de leitura aumenta
- chamadas de UI para `session snapshot` passam a custar acesso externo frequente
- o endpoint tende a escalar mal e a consumir quota da Pacifica sem amortizacao

Risco adicional:
- a leitura de sessao passa a misturar leitura e sincronizacao externa, o que torna comportamento menos previsivel operacionalmente

Referencia:
- `apps/api/src/application/get-operational-session-by-wallet/GetOperationalSessionByWallet.ts:66`

Status do finding:
- parcialmente resolvido em `2026-03-31`
- a leitura agora usa TTL para evitar refresh externo da Pacifica em toda chamada quando o snapshot confirmado ainda esta fresco
- residual: o caso de uso ainda mistura leitura e sincronizacao externa; isso segue como decisao pragmatica de MVP, nao como forma final ideal

### 5. Baixa: `LookupOperationalAccountByWallet` ainda depende de type cast manual para `onboardingStatus`
Trecho observado:
- `apps/api/src/application/lookup-operational-account-by-wallet/LookupOperationalAccountByWallet.ts`

Leitura atual:
- o caso de uso faz cast do `onboardingStatus` em vez de usar o tipo compartilhado diretamente

Impacto:
- risco baixo hoje
- mas e um cheiro de contrato frouxo numa borda de resposta

Referencia:
- `apps/api/src/application/lookup-operational-account-by-wallet/LookupOperationalAccountByWallet.ts:67`

Status do finding:
- resolvido em `2026-03-31`
- o lookup agora usa o tipo compartilhado de `OnboardingStatus` em vez de cast manual

## Recomendacoes
- no worker, separar falha terminal de falha retryable com transicao de estado diferente para `SignalDecision`
- trocar o scan full-table por query filtrada por preset ativo, runtime elegivel e lease expirada/inexistente
- na API, revisar a estrategia de idempotencia para `pause` e `resume` com chave estavel por intencao de comando
- desacoplar leitura de sessao de refresh externo, ou ao menos colocar TTL/backoff para sincronizacao Pacifica
- remover casts manuais onde o contrato compartilhado ja deveria ser suficiente

## Status
- documento criado em `2026-03-31`
- alteracoes de codigo aplicadas em `2026-03-31` para tratar os findings 1, 2, 3, 4 e 5, com residual arquitetural explicitado nos findings 2 e 4
