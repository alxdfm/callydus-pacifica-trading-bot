# Plano de Deploy AWS MVP e Migração da API para Lambda

## Objetivo
Documentar uma arquitetura AWS viável para o MVP com custo inicial mínimo, mantendo o projeto próximo do estado atual do código, e definir um plano incremental para migrar a API atual para `AWS Lambda`.

## Data de referência
Esta análise considera o cenário e a documentação pública consultada em `2026-04-12`.

## Resumo Executivo
Para o MVP com pouquíssimos usuários, faz sentido iniciar na AWS com a seguinte direção:

- `app`: `AWS Amplify Hosting` ou `S3 + CloudFront`
- `api`: `AWS Lambda + API Gateway HTTP API`
- `scheduler`: `EventBridge Scheduler` chamando uma Lambda de refresh de market data a cada `60s`
- `worker`: `Oracle Cloud Always Free`, como processo privado sem exposição HTTP pública
- `database`: `Supabase Postgres`

Documento complementar para o desenho dos handlers HTTP:
- `docs/dev/API_LAMBDA_GROUPING_AND_IMPLEMENTATION_PLAN_2026-04-12.pt-BR.md`

Essa direção é coerente com o projeto, mas exige um refactor moderado na API atual, porque hoje:

- a borda HTTP está acoplada a `node:http` em `apps/api/src/server.ts`
- o scheduler de market data nasce no mesmo processo da API
- a execução está orientada a servidor Node contínuo, não a handler serverless

## Decisões registradas
Ficam registradas as seguintes decisões de infraestrutura para o MVP:

- `app`: publicar na AWS
- `api`: migrar para `AWS Lambda + API Gateway HTTP API`
- `scheduler`: usar `EventBridge Scheduler + Lambda`
- `worker`: hospedar na `Oracle Cloud Always Free`
- `database`: usar `Supabase Postgres`

Leitura dessas decisões:

- a AWS fica responsável pela camada HTTP pública e pelo agendamento
- o worker fica fora da AWS por restrição de custo e aderência a processo contínuo
- o banco fica fora da AWS para evitar `VPC`/`NAT Gateway` cedo demais e manter o MVP simples

## Leitura do estado atual do projeto

### O que já está bom para deploy
- o `app` já é uma SPA estática em `React + Vite`
- a `api` já tem boa separação entre casos de uso, infraestrutura e rotas em `createApiModule`
- o `worker` já é separado e explicitamente contínuo
- o projeto já usa persistência compartilhada para estado operacional, comandos e snapshots

### O que ainda não está pronto para AWS serverless
- a API sobe servidor próprio em vez de expor `handler(event)`
- o scheduler está embutido no boot da API
- os scripts de produção da API ainda são `tsx src/server.ts`
- o `.env` ainda está centralizado na raiz, em vez de segmentado por serviço

## Arquitetura AWS recomendada para o MVP

### 1. Frontend
Direção recomendada:

- usar `AWS Amplify Hosting` se a prioridade for simplicidade operacional
- usar `S3 + CloudFront` se a prioridade for controle fino e alinhamento mais "infra AWS raiz"

Escolha recomendada para o MVP:
- `Amplify Hosting`

Motivo:
- deploy mais rápido
- preview de branch facilita validação
- elimina parte da configuração manual de `CloudFront`, invalidação e pipeline

Quando preferir `S3 + CloudFront`:
- quando o pipeline já estiver maduro
- quando houver necessidade clara de mais controle de CDN, headers e distribuição

### 2. API HTTP
Direção recomendada:

- `API Gateway HTTP API`
- integração com uma ou mais `AWS Lambda`

Motivo:
- a API do produto é majoritariamente request/response
- o volume inicial deve ser baixo
- a escalabilidade pode crescer sem manter servidor permanentemente ativo

### 3. Scheduler de market data
Direção recomendada:

- `EventBridge Scheduler`
- uma Lambda dedicada para `refresh` de prices, market info e candles

Motivo:
- separa a coleta de market data da API HTTP
- evita scheduler duplicado em cada cold start ou réplica da API
- combina com a proposta já documentada em `docs/dev/PACIFICA_MARKET_DATA_CENTRALIZATION_PROPOSAL.pt-BR.md`

### 4. Worker
Direção recomendada:

- manter o worker fora de HTTP público
- rodar como processo privado

Hospedagem escolhida para o MVP:

- `Oracle Cloud Always Free`

Motivo:
- o worker atual foi desenhado como processo contínuo com `lease`, `heartbeat`, scan loop e execução recorrente
- isso não encaixa bem no modelo de invocação curta do Lambda
- a `Oracle Cloud Always Free` oferece um caminho mais aderente ao objetivo de custo zero inicial

Observação operacional:
- o worker continua privado do ponto de vista do produto
- ele não precisa expor endpoint HTTP público para o `app`
- a comunicação com a `api` continua indireta via banco

### 5. Banco
Direção recomendada:

- manter `PostgreSQL`, porque o projeto já está em `Prisma + PostgreSQL`
- usar `Supabase Postgres` no MVP

Observação importante:
- o `Supabase` simplifica o acesso inicial da `Lambda` sem obrigar `VPC` desde o começo
- essa escolha reduz custo e complexidade de rede para o MVP
- o banco continua acessado apenas por `api`, `scheduler` e `worker`, nunca pelo browser

## Topologia recomendada

```text
Browser
  -> Amplify Hosting
  -> API Gateway HTTP API
      -> Lambda API
          -> Supabase Postgres

EventBridge Scheduler (1 min)
  -> Lambda Market Data Refresh
      -> Pacifica public market data
      -> Supabase Postgres

Worker privado
  -> Oracle Cloud Always Free
  -> Supabase Postgres
  -> Pacifica trading/account APIs
```

## Como o worker se comunica com a API sem ficar exposto

## Princípio
O worker não precisa conversar com a API por HTTP.

O modelo mais simples e robusto para o estado atual do projeto é:

- a `api` grava comando, estado ou intenção no banco
- o `worker` lê esse estado do banco, executa e persiste o resultado

## Por que isso já combina com o código atual
Hoje a comunicação já é majoritariamente indireta via persistência:

- a API registra comandos de `pause`, `resume` e `close trade`
- o worker mantém `lease`, `heartbeat`, decisões de sinal e snapshots no banco

Peças que já apontam para isso:

- `BotCommand` em `packages/database/prisma/schema.prisma`
- `BotCommandRepository` em `apps/api/src/domain/bot-commands/BotCommandRepository.ts`
- `pauseBot`, `resumeBot` e `closeTrade` em `apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts`
- `WorkerRuntimeRepository` em `apps/worker/src/domain/WorkerRuntimeRepository.ts`

## Modelo recomendado

### Fluxos síncronos
Usar HTTP apenas para:

- browser -> api
- scheduler -> lambda de refresh

### Fluxos assíncronos internos
Usar banco para:

- fila lógica de comandos operacionais
- estado de runtime
- snapshots de market data
- status de reconciliação

## Quando introduzir fila real
Ainda não há necessidade obrigatória de `SQS` no MVP.

Só faz sentido introduzir `SQS` se aparecerem sinais concretos de:

- picos de comando
- necessidade de retry desacoplado por mensagem
- múltiplos workers concorrentes em escala maior
- isolamento mais forte entre API e execução

Para o momento atual, banco + polling controlado é suficiente e reduz complexidade.

## Scheduler a cada 60 segundos e impacto no banco

## Resposta curta
No estado atual do projeto, não parece um volume preocupante para um banco pequeno.

## Baseado na implementação atual
Hoje o scheduler local da API está configurado com:

- símbolos: `BTC-PERP`, `ETH-PERP`, `SOL-PERP`
- intervalos: `5m`, `15m`, `1h`
- refresh a cada `60000 ms`

Isso aparece em:

- `apps/api/src/server.ts`
- `apps/api/src/infrastructure/market-data/startLocalMarketDataRefreshScheduler.ts`

Além disso:

- `prices` e `market info` são `upsert` em tabelas de estado atual
- candles usam `upsert` por chave `symbol + interval + priceSource + openTime`

Consequência:
- não há crescimento linear de uma linha nova por minuto para tudo
- grande parte do trabalho é refresh de snapshot já existente

## Leitura prática de carga
Com `3` símbolos e `3` intervalos, você tem `9` combinações de candles.

Mesmo executando a cada `60s`:

- `marketPriceCurrent` tende a receber poucas linhas por execução
- `marketInfoCurrent` idem
- `marketCandleSnapshot` tende a atualizar candles já conhecidos e só inserir quando um candle novo fecha

Para esse volume inicial, o gargalo mais provável é:

- latência externa da Pacifica
- tempo da Lambda
- conexões ao banco

E não volume puro de escrita.

## Onde o risco começa a subir
O custo pode começar a incomodar se você ampliar muito:

- quantidade de símbolos
- quantidade de timeframes
- retenção longa de candles
- número de jobs independentes
- leitura excessiva do mesmo dado por múltiplas funções

## Recomendação prática
Para o MVP:

- manter cron de `60s`
- manter poucos símbolos/timeframes
- manter retenção curta para candles
- medir volume real antes de otimizar

Se necessário depois:

- reduzir cardinalidade do refresh
- separar snapshots correntes de histórico curto
- executar cleanup agendado

## VPC, NAT Gateway e quando isso importa

## O que é VPC
`VPC` é a rede privada virtual da sua conta AWS.

Na prática, ela define:

- sub-redes
- rotas
- regras de tráfego
- quais recursos ficam públicos ou privados

## É necessário para esse MVP?
Não necessariamente em todos os componentes.

### Casos em que pode não ser necessário
- `Lambda` chamando APIs públicas e acessando serviços públicos gerenciados
- frontend em `Amplify`
- API simples sem dependência de recurso privado

### Casos em que normalmente entra em cena
- banco privado dentro da AWS
- worker em `EC2`
- necessidade de isolamento de rede mais forte

## O que é NAT Gateway
É o componente usado para dar saída para a internet a recursos privados dentro da VPC.

Exemplo típico:
- uma Lambda em sub-rede privada precisa chamar a Pacifica
- uma instância privada precisa baixar dependências ou chamar API externa

Se ela não tem IP público e precisa sair para a internet, o caminho clássico é NAT.

## O problema do NAT Gateway no MVP
NAT Gateway costuma ser o item que mais cria custo-surpresa em arquitetura AWS pequena.

Para o MVP, a regra deveria ser:

- evitar NAT Gateway enquanto não houver exigência real de rede privada completa

## Direção recomendada

### Para a API Lambda
Preferir não colocá-la em VPC no início, a menos que o banco force isso.

### Para o worker
Como o worker ficará na `Oracle Cloud Always Free`, ele pode seguir sem endpoint exposto ao produto e sem depender da topologia de rede AWS para operar.

### Para o banco
Se o banco for privado dentro da AWS, a discussão de VPC passa a importar muito mais.

## Estratégia recomendada para o MVP
Usar a menor quantidade possível de componentes de rede:

- `Amplify`
- `API Gateway`
- `Lambda`
- `EventBridge Scheduler`
- worker sem exposição pública do produto
- banco com a topologia mais simples possível

## Faz sentido uma Lambda HTTP por rota?

## Resposta curta
Para o MVP, não por padrão.

## Recomendações

### Começo recomendado
Agrupar a API em poucas Lambdas por domínio funcional.

Exemplo:

- `onboarding-handler`
- `account-read-handler`
- `runtime-command-handler`
- `market-data-handler`

### Quando uma Lambda por rota faz sentido
- rotas com perfil de tráfego muito diferente
- necessidade forte de permissões isoladas
- dependências muito distintas
- cold start muito diferente entre grupos
- ownership forte por squads ou contextos

## Ganhos de granularidade
Uma Lambda por rota pode trazer:

- deploy menor por endpoint
- blast radius menor
- tuning de memória/timeout por caso
- observabilidade mais específica
- IAM mais fino

## Custos da granularidade excessiva
Mas uma Lambda por rota também piora:

- quantidade de artefatos para deploy
- configuração de infra
- overhead de observabilidade
- repetição de bootstrap
- atrito para manutenção em projeto pequeno

## Recomendação para este projeto
Não quebrar em uma Lambda por rota agora.

Começar com handlers agrupados por contexto.

Exemplo de agrupamento inicial:

- onboarding e validação
- account reads
- runtime commands
- market data

Depois, se uma área ficar mais quente ou mais crítica, você separa.

## Plano de refatoração da API para Lambda

## Objetivo do refactor
Levar a API atual para `Lambda + API Gateway` sem reescrever casos de uso nem duplicar regra de negócio.

## Princípio central
Preservar:

- `createApiModule`
- casos de uso em `application`
- adapters de persistência e Pacifica em `infrastructure`

Substituir apenas:

- a borda HTTP
- o bootstrap do processo
- o scheduler embutido

## Fase 0. Congelar fronteiras
Antes de migrar:

- não adicionar mais lógica de negócio em `server.ts`
- tratar `server.ts` como detalhe temporário de runtime local

Meta:
- toda regra continuar em `application` e `createApiModule`

## Fase 1. Extrair uma borda HTTP agnóstica
Criar uma camada intermediária que receba algo como:

- `method`
- `path`
- `headers`
- `body`

E retorne:

- `statusCode`
- `headers`
- `body`

Essa camada deve usar os mesmos handlers atuais do `createApiRouter`.

Resultado esperado:
- a API deixa de depender diretamente de `IncomingMessage` e `ServerResponse`

## Fase 2. Centralizar o bootstrap do módulo
Extrair de `server.ts` a criação de:

- `PrismaClient`
- `createApiModule`
- config de ambiente

Criar algo como:

- `apps/api/src/bootstrap/createApiRuntime.ts`

Responsabilidade:
- montar o módulo uma vez
- permitir reuse em `server local` e em `lambda handler`

Resultado esperado:
- um único lugar para composição de dependências

## Fase 3. Criar handler Lambda único inicial
Criar um primeiro adapter:

- `apps/api/src/lambda/httpHandler.ts`

Esse arquivo deve:

- traduzir `APIGatewayProxyEventV2` para o contrato HTTP interno
- chamar a borda HTTP agnóstica
- traduzir resposta de volta para `APIGatewayProxyStructuredResultV2`

Resultado esperado:
- a API já roda em Lambda sem quebrar o desenho interno

## Fase 4. Remover scheduler do processo HTTP
Extrair o refresh de market data para uma função separada, por exemplo:

- `apps/api/src/application/refresh-market-data`
- `apps/api/src/lambda/marketDataRefreshHandler.ts`

Essa Lambda será chamada por:

- `EventBridge Scheduler`

Resultado esperado:
- a API HTTP deixa de iniciar timer
- não há risco de scheduler duplicado por cold start ou concorrência

## Fase 5. Ajustar a configuração de ambiente por serviço
Separar env vars por runtime:

### API HTTP
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- segredos Pacifica necessários à borda da API
- `CREDENTIAL_ENCRYPTION_KEY`
- `CREDENTIAL_ENCRYPTION_KEY_ID`

### Scheduler
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `PACIFICA_REST_BASE_URL`
- flags de refresh

### Worker
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- credenciais/segredos necessários para execução contínua

Resultado esperado:
- reduzir vazamento de segredo entre componentes
- permitir separar a conexão usada pelo runtime serverless da conexão usada por migrações e operações administrativas

## Fase 6. Adicionar build de produção
Hoje a API está orientada a `tsx`.

Para Lambda, é melhor ter build explícito, por exemplo com:

- `tsc`
- `esbuild`

Meta:
- gerar artefato enxuto
- evitar empacotar dependência desnecessária
- preparar a função para deploy previsível

## Fase 7. Revisar acesso ao banco em ambiente serverless
Pontos de atenção:

- reuso de `PrismaClient`
- número de conexões simultâneas
- tempo de cold start
- esgotamento rápido do pool do `Supabase` sob concorrência em `Lambda`

Risco concreto:
- `Prisma` mantém conexões TCP persistentes
- em `AWS Lambda`, múltiplas execuções concorrentes podem abrir conexões demais em pouco tempo
- isso pode saturar o pool do `Supabase` e gerar falhas intermitentes

Direção explícita para o MVP:
- a `API HTTP` serverless deve usar o `Supabase Transaction Pooler`
- o runtime da Lambda deve apontar `DATABASE_URL` para a porta do pooler transacional
- a conexão direta do banco deve ficar separada em `DIRECT_DATABASE_URL`

Uso recomendado por componente:

### API HTTP em Lambda
- usar `DATABASE_URL` apontando para o `Transaction Pooler` do `Supabase`
- reutilizar `PrismaClient` entre invocações quando possível
- evitar criar cliente novo por request

### Scheduler em Lambda
- usar a mesma estratégia da API HTTP, preferindo `DATABASE_URL` no `Transaction Pooler`
- isso mantém comportamento consistente entre funções serverless

### Worker contínuo
- pode usar `DATABASE_URL` direta ou pooler, conforme comportamento observado
- como não sofre o mesmo padrão explosivo de concorrência do Lambda, a decisão pode ser operacional

### Migrations e tarefas administrativas
- usar `DIRECT_DATABASE_URL`
- não depender do pooler transacional para `prisma migrate`, manutenção e operações administrativas

Resultado esperado:
- reduzir risco de exaustão de conexões no `Supabase`
- manter separação clara entre runtime serverless e operações de schema/admin
- tornar a configuração de `Prisma` explícita desde a primeira versão da API em Lambda

## Fase 8. Reorganizar handlers por domínio
Depois que o handler único estiver estável, avaliar split por contexto:

- `onboarding`
- `account`
- `runtime`
- `market`

Motivo:
- manter granularidade suficiente sem cair em uma função por rota cedo demais

## Fase 9. Atualizar testes
Adicionar testes para:

- roteamento HTTP agnóstico
- adapter Lambda
- scheduler handler
- serialização de erros e respostas

Sem isso, a API migra de runtime mas perde confiança na borda.

## Estrutura alvo sugerida para a API

```text
apps/api/src/
  application/
  domain/
  infrastructure/
  ui/http/
    createApiHttpHandler.ts
    request-response.ts
  bootstrap/
    createApiRuntime.ts
  lambda/
    httpHandler.ts
    marketDataRefreshHandler.ts
  server.ts
```

## Sequência recomendada de implementação
1. extrair bootstrap e borda HTTP agnóstica
2. adicionar handler Lambda único
3. manter `server.ts` só para dev local
4. mover scheduler para Lambda agendada
5. separar env e build
6. só depois avaliar split em múltiplas Lambdas

## Resposta objetiva às dúvidas

### 1. Faz sentido ter uma Lambda HTTP por rota?
Não como padrão inicial.

Melhor começar com poucas Lambdas por domínio.

O ganho de "uma por rota" é:

- blast radius menor
- tuning específico
- deploy menor
- IAM mais granular

O custo é:

- mais infra para manter
- mais bootstrap repetido
- mais arquivos, mapping e observabilidade

Para este projeto, a melhor relação custo/benefício inicial é `poucas Lambdas por contexto`.

### 2. Se o worker não for HTTP, como ele comunica com a API?
Idealmente ele não comunica com a API.

O fluxo recomendado é:

- API grava intenção e estado no banco
- worker lê do banco
- worker executa e persiste o resultado

Isso já combina com a presença atual de `BotCommand`, runtime state e snapshots persistidos.

### 3. O scheduler de candles a cada 60 segundos sobrecarrega o free tier do banco?
No volume atual do projeto, não parece.

Com poucos símbolos e poucos intervalos, a escrita é pequena e majoritariamente baseada em `upsert`.

O risco real aparece quando crescerem:

- símbolos
- timeframes
- retenção
- número de jobs

### 4. O que é VPC? É necessário? NAT Gateway?
- `VPC` é a rede privada virtual da sua conta AWS
- nem todo componente do MVP precisa estar em VPC
- `NAT Gateway` é usado para dar saída à internet para recursos privados
- para o MVP, a recomendação é evitar NAT Gateway cedo, porque ele costuma gerar custo-surpresa

## Decisões recomendadas para o MVP
- usar `Amplify Hosting` para o `app`
- migrar a `api` para `Lambda + API Gateway HTTP API`
- mover o scheduler para `EventBridge Scheduler + Lambda`
- hospedar o worker na `Oracle Cloud Always Free`
- manter o worker privado, sem HTTP público
- usar `Supabase Postgres` como banco
- manter comunicação API-worker via banco
- evitar granularidade excessiva de Lambdas no início
- evitar NAT Gateway até existir necessidade concreta

## Riscos conhecidos
- `Supabase` reduz atrito no MVP, mas mantém o banco fora da AWS
- API serverless com `Prisma` exige cuidado com conexão e bootstrap
- se o scheduler crescer em cardinalidade, o banco precisará de retenção e limpeza disciplinadas
- o worker na `Oracle Cloud Always Free` ainda exige operação manual básica, observabilidade e restart controlado

## Próxima decisão técnica recomendada
Implementar primeiro o refactor estrutural da API sem mudar deploy:

1. extrair bootstrap
2. extrair borda HTTP agnóstica
3. criar handler Lambda
4. mover scheduler para função agendada

Só depois disso vale congelar a infraestrutura final.

## Referências oficiais
- AWS Free Tier: https://aws.amazon.com/free/
- AWS Lambda pricing: https://aws.amazon.com/lambda/pricing/
- API Gateway pricing: https://aws.amazon.com/api-gateway/pricing/
- EventBridge pricing: https://aws.amazon.com/eventbridge/pricing/
- AWS Amplify pricing: https://aws.amazon.com/amplify/pricing/
- Amazon RDS free tier: https://aws.amazon.com/rds/free/
- Amazon VPC pricing: https://aws.amazon.com/vpc/pricing/
- Supabase billing and free plan: https://supabase.com/docs/guides/platform/billing-on-supabase
- Oracle Cloud Always Free: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
