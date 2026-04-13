# Agrupamento de Lambdas da API e Plano de Implementação

## Objetivo
Definir um critério concreto para agrupar os endpoints atuais da API em poucas Lambdas por domínio funcional, evitando tanto uma Lambda monolítica única quanto uma função por endpoint, e descrever um plano de implementação incremental.

## Contexto
A API atual expõe os endpoints diretamente em `apps/api/src/server.ts` com roteamento manual sobre `node:http`.

No estado atual, os endpoints mapeados são:

### Onboarding
- `POST /api/onboarding/builder/approve`
- `POST /api/onboarding/account/lookup`
- `POST /api/onboarding/credentials/validate`
- `POST /api/onboarding/credentials/verify-operational`

### Runtime e comandos operacionais
- `POST /api/runtime/pause`
- `POST /api/runtime/heartbeat`
- `POST /api/runtime/reconcile`
- `POST /api/runtime/resume`
- `POST /api/trades/:tradeId/close`

### Estratégia
- `POST /api/strategies/your/activate`
- `POST /api/strategies/your/save`
- `POST /api/strategies/your/backtest-preview`

### Market data
- `POST /api/market/candles`
- `GET /api/market/prices`
- `POST /api/internal/market/refresh`

### Leituras de conta
- `POST /api/account/session`
- `POST /api/account/profile`
- `POST /api/account/dashboard`
- `POST /api/account/presets`
- `POST /api/account/trades`
- `POST /api/account/history`

## Pergunta de arquitetura
Por que não fazer uma Lambda por endpoint?

## Resposta curta
Porque uma função por endpoint não é automaticamente mais performática e costuma aumentar bastante a complexidade operacional antes de entregar ganho real.

## O que realmente define o agrupamento
Os grupos de Lambda devem ser definidos por:

- dependências compartilhadas
- perfil de carga e latência
- perfil de memória e timeout
- blast radius aceitável
- frequência de mudança
- necessidade de permissões/segredos diferentes
- tipo de chamador: browser, worker, scheduler ou uso interno

## O que não usar como critério principal
- quantidade arbitrária de rotas por função
- "uma rota por função" como suposto atalho de performance
- organização por pasta apenas

## Tradeoff entre os extremos

### Uma Lambda para tudo
Vantagens:

- menos artefatos
- menos configuração inicial
- bootstrap único

Desvantagens:

- blast radius maior
- tuning único de memória/timeout
- deploy da API inteira a cada mudança
- cold start potencialmente maior com mais dependências

### Uma Lambda por endpoint
Vantagens:

- isolamento máximo
- tuning por rota
- blast radius mínimo

Desvantagens:

- muito mais infraestrutura para manter
- mais mapeamentos no `API Gateway`
- mais bootstrap repetido
- mais observabilidade espalhada
- mais chance de inconsistência entre handlers
- ganho de performance nem sempre relevante se todos carregam praticamente as mesmas dependências

## Recomendação para este projeto
Começar com poucas Lambdas por domínio funcional.

Quantidade alvo inicial:

- `4` Lambdas HTTP públicas
- `2` Lambdas internas/agendadas

Isso oferece:

- separação suficiente entre contextos
- tuning onde realmente importa
- complexidade ainda controlada

## Critério prático de agrupamento para o projeto

### Grupo 1. Onboarding HTTP
Responsabilidade:

- validação de credenciais
- verificação operacional inicial
- aprovação do builder
- lookup inicial da conta operacional

Rotas:

- `POST /api/onboarding/builder/approve`
- `POST /api/onboarding/account/lookup`
- `POST /api/onboarding/credentials/validate`
- `POST /api/onboarding/credentials/verify-operational`

Por que juntas:

- mesmo contexto de negócio
- alta coesão funcional
- chamadas concentradas no início do lifecycle do usuário
- dependências similares de validação e gateways Pacifica

Nome sugerido:

- `onboarding-http-handler`

### Grupo 2. Account Reads HTTP
Responsabilidade:

- leitura dos modelos operacionais de sessão, profile, dashboard e histórico

Rotas:

- `POST /api/account/session`
- `POST /api/account/profile`
- `POST /api/account/dashboard`
- `POST /api/account/presets`
- `POST /api/account/trades`
- `POST /api/account/history`

Por que juntas:

- todas são leituras orientadas a UI
- compartilham perfil de consulta ao banco
- tendem a ter tráfego parecido
- não executam ação operacional destrutiva

Nome sugerido:

- `account-read-http-handler`

### Grupo 3. Strategy and Runtime Commands HTTP
Responsabilidade:

- comandos do usuário que alteram estado operacional
- persistência de intenção para o worker
- ações de estratégia e runtime

Rotas:

- `POST /api/strategies/your/activate`
- `POST /api/strategies/your/save`
- `POST /api/runtime/pause`
- `POST /api/runtime/resume`
- `POST /api/trades/:tradeId/close`

Por que juntas:

- todas são mutations
- compartilham semântica de comando e persistência de estado
- costumam exigir validação mais cuidadosa e observabilidade própria
- permitem tuning diferente de leituras

Nome sugerido:

- `runtime-command-http-handler`

Observação:

- `save strategy` e `activate strategy` ficam aqui porque ainda são parte do fluxo operacional da estratégia do bot

### Grupo 4. Market Query HTTP
Responsabilidade:

- leitura e simulação baseadas em market data

Rotas:

- `POST /api/market/candles`
- `GET /api/market/prices`
- `POST /api/strategies/your/backtest-preview`

Por que juntas:

- dependem do subsistema de market data
- têm perfil de cálculo e acesso a snapshots diferente das rotas de conta
- `backtest-preview` é mais próximo de market data/simulação do que de comando operacional

Nome sugerido:

- `market-query-http-handler`

### Grupo 5. Runtime Internal HTTP
Responsabilidade:

- endpoints internos do ecossistema operacional

Rotas:

- `POST /api/runtime/heartbeat`
- `POST /api/runtime/reconcile`

Por que juntas:

- não são endpoints de UI
- podem ter autenticação/permissão interna diferente
- são operacionalmente mais sensíveis

Nome sugerido:

- `runtime-internal-handler`

Observação:

- este grupo pode ficar fora da superfície pública do browser
- o chamador esperado tende a ser worker, automação ou fluxo interno

### Grupo 6. Market Refresh Scheduled/Internal
Responsabilidade:

- refresh de market data disparado por scheduler

Rotas / gatilhos:

- substituir `POST /api/internal/market/refresh`
- receber eventos do `EventBridge Scheduler`

Por que separado:

- não é endpoint de browser
- tem perfil de execução periódico
- deve ter timeout/memória próprios
- não deve compartilhar ciclo de deploy com a API HTTP pública

Nome sugerido:

- `market-refresh-handler`

## Proposta de mapeamento final

```text
Public HTTP
  onboarding-http-handler
  account-read-http-handler
  runtime-command-http-handler
  market-query-http-handler

Internal HTTP / machine-to-machine
  runtime-internal-handler

Scheduled
  market-refresh-handler
```

## Por que isso é melhor que uma por endpoint

### Performance real
Uma função por endpoint só melhora performance quando:

- o endpoint tem bootstrap muito diferente
- o endpoint precisa de timeout ou memória muito diferentes
- o endpoint sofre tráfego muito distinto dos outros

Se todas as funções:

- instanciam `PrismaClient`
- carregam o mesmo módulo base
- usam os mesmos adapters

então o ganho real de cold start tende a ser menor do que parece.

### Manutenção
Com grupos por domínio:

- menos artefatos
- menos repetição de bootstrap
- menos configuração de `API Gateway`
- menos risco de drift entre handlers

### Evolução futura
Se algum grupo ficar quente demais, aí sim vale dividir mais.

Exemplos de gatilho para nova divisão:

- `market-query-http-handler` virar hot path
- `backtest-preview` precisar de muito mais memória
- `runtime-command-http-handler` ganhar requisitos de autorização diferentes
- `account-read-http-handler` ficar grande demais por dependências específicas

## Critérios objetivos para dividir mais tarde
Dividir um grupo em subgrupos apenas se houver evidência de:

- memória muito diferente
- timeout muito diferente
- taxa de chamadas muito diferente
- dependências muito diferentes
- necessidade clara de deploy independente
- permissão/segredo diferente

## Plano de implementação

## Fase 1. Congelar o inventário de rotas
Objetivo:

- formalizar todos os endpoints atuais
- classificar cada rota em `public`, `internal` ou `scheduled`

Entregáveis:

- tabela de rotas atualizada
- classificação de chamador por rota

Saída esperada:

- não haver mais dúvida sobre quais rotas são UI, internas ou cron

## Fase 2. Extrair uma borda HTTP agnóstica
Objetivo:

- criar um contrato comum de request/response
- desacoplar a API de `node:http`

Entregáveis:

- `ui/http/request-response.ts`
- `ui/http/createApiHttpHandler.ts`

Saída esperada:

- os grupos de rota podem ser montados sem depender de `server.ts`

## Fase 3. Criar registry de rotas por grupo
Objetivo:

- organizar explicitamente quais rotas pertencem a cada Lambda

Entregáveis sugeridos:

- `ui/http/groups/createOnboardingHttpHandler.ts`
- `ui/http/groups/createAccountReadHttpHandler.ts`
- `ui/http/groups/createRuntimeCommandHttpHandler.ts`
- `ui/http/groups/createMarketQueryHttpHandler.ts`
- `ui/http/groups/createRuntimeInternalHandler.ts`

Saída esperada:

- agrupamento definido em código, não só em documentação

## Fase 4. Extrair o bootstrap compartilhado
Objetivo:

- centralizar criação de `PrismaClient`, `createApiModule` e config

Entregáveis sugeridos:

- `bootstrap/createApiRuntime.ts`
- cache/controlado de instância de `PrismaClient`

Saída esperada:

- todos os handlers usam a mesma composição de dependências

## Fase 5. Criar handlers Lambda reais
Objetivo:

- expor cada grupo como adapter Lambda

Entregáveis sugeridos:

- `lambda/onboardingHttpHandler.ts`
- `lambda/accountReadHttpHandler.ts`
- `lambda/runtimeCommandHttpHandler.ts`
- `lambda/marketQueryHttpHandler.ts`
- `lambda/runtimeInternalHandler.ts`
- `lambda/marketRefreshHandler.ts`

Saída esperada:

- cada grupo já pode ser ligado ao `API Gateway` ou `EventBridge`

## Fase 6. Mover scheduler para Lambda agendada
Objetivo:

- remover o timer do processo HTTP

Entregáveis:

- `marketRefreshHandler` ligado ao `EventBridge Scheduler`
- remoção de `startLocalMarketDataRefreshScheduler` do runtime serverless

Saída esperada:

- o refresh deixa de depender do boot da API

## Fase 7. Configurar infraestrutura por grupo
Objetivo:

- mapear rotas do `API Gateway` para cada handler
- configurar envs e permissões corretas

Entregáveis:

- mapeamento HTTP por grupo
- env vars por função
- política de acesso por função

Saída esperada:

- grupos públicos e internos separados

## Fase 8. Testar a borda e observar
Objetivo:

- garantir que a migração não quebrou serialização, status code ou contrato

Entregáveis:

- testes de roteamento
- testes do adapter Lambda
- smoke tests por grupo
- logs e métricas básicos por função

Saída esperada:

- baseline confiável de operação

## Ordem recomendada de implementação
1. extrair borda HTTP agnóstica
2. extrair bootstrap compartilhado
3. montar route registries por grupo
4. criar handlers Lambda por grupo
5. migrar `market-refresh` para scheduler
6. publicar primeiro grupos públicos
7. publicar endpoints internos
8. remover dependência de `server.ts` no deploy

## Riscos conhecidos
- `runtime-command-http-handler` pode crescer rápido se acumular muitas mutations
- `market-query-http-handler` pode exigir memória maior por causa de backtest preview
- `runtime-internal-handler` merece autorização mais restrita do que a API pública
- `market-refresh-handler` não deve compartilhar acoplamento com rotas públicas

## Regra de revisão futura
Depois do MVP em produção, revisar o agrupamento com base em:

- cold start observado
- memória observada
- timeout observado
- taxa de erro por grupo
- frequência real de deploy por domínio

Se os dados mostrarem necessidade, quebrar um grupo adicionalmente. Não antes disso.
