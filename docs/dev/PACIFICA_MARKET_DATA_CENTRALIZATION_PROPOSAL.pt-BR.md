# Proposta de Centralizacao de Market Data da Pacifica

## Objetivo
Documentar uma proposta para reduzir chamadas redundantes a Pacifica, diminuir ocorrencias de `rate limit`, e criar uma fonte interna reaproveitavel para leitura de `candles` e `prices`.

## Contexto
Hoje, diferentes partes do sistema podem consultar a Pacifica diretamente:
- worker operacional para avaliar sinais
- endpoints da API para candles e prices
- fluxos de simulacao e avaliacao de preset
- eventuais leituras auxiliares para tela e diagnostico

Isso aumenta o risco de:
- multiplicar chamadas identicas para o mesmo `symbol + timeframe + source`
- produzir `429` / `Rate limit exceeded`
- acoplar UX e runtime diretamente a disponibilidade imediata da Pacifica

No worker atual, a avaliacao do preset consulta candles diretamente em:
- `apps/worker/src/application/createOperationalWorker.ts`

Os endpoints da API tambem leem market data diretamente em:
- `apps/api/src/application/get-market-candles/GetMarketCandles.ts`
- `apps/api/src/application/get-market-prices/GetMarketPrices.ts`
- `apps/api/src/application/evaluate-preset-signal/EvaluatePresetSignal.ts`
- `apps/api/src/application/preview-preset-backtest/PreviewPresetBacktest.ts`

Ao mesmo tempo, o projeto ja adota em outros fluxos a ideia de snapshot interno com refresh controlado, por exemplo para sessao operacional e estado externo da conta.

## Problema a Resolver
Precisamos evitar que cada consumidor de market data:
- descubra por conta propria quando deve chamar a Pacifica
- repita a mesma consulta externa em paralelo
- trate `rate limit` isoladamente

Tambem precisamos de uma base interna que permita:
- servir leituras recentes mesmo durante degradacao temporaria da Pacifica
- auditar a idade do dado retornado
- desacoplar melhor a logica de negocio da estrategia do fetch externo

## Proposta
Centralizar a aquisicao de market data publico da Pacifica em um fluxo interno unico e fazer os demais consumidores lerem primeiro de uma base/cache interna atualizada por esse fluxo.

Em termos praticos:
- um componente centralizado busca `candles` e `prices` na Pacifica
- esse componente persiste snapshots internos com metadados de frescor
- worker e API passam a consultar primeiro essa fonte interna
- refresh externo deixa de ser responsabilidade do consumidor final

## Recomendacao de Execucao
Para o contexto atual do projeto, a recomendacao preferencial e executar o refresh centralizado fora do worker operacional.

Direcao sugerida:
- usar uma `AWS Lambda` agendada por `EventBridge Scheduler`
- rodar a cada `1 minuto`
- persistir snapshots internos no banco da aplicacao

Motivos:
- separa coleta de market data da logica de trading
- evita acoplamento entre refresh compartilhado e loop operacional do bot
- simplifica escalabilidade e observabilidade do componente de refresh

Consideracao de cadencia:
- como o menor timeframe previsto e `3m`, um cron de `1 minuto` e suficiente para manter o snapshot recente
- a execucao nao precisa estar sincronizada ao segundo exato de fechamento do candle para entregar valor nesta fase

Consideracao de custo:
- um agendamento por minuto gera cerca de `43.200` execucoes em 30 dias
- isso fica muito abaixo do free tier mensal de `AWS Lambda` e `EventBridge Scheduler`, desde que a funcao permaneça leve

Observacao:
- se no futuro o projeto passar a depender de timeframes menores, sincronizacao mais precisa ou refresh por muitas chaves independentes, vale reavaliar para um processo dedicado de `market-data worker`

## Escopo da Centralizacao

### Dados que fazem sentido centralizar
- `candles`
- `prices`
- possivelmente `market info` publico com `tick_size`, `lot_size`, `min_order_size`

Esses dados sao:
- publicos
- compartilhados por varios consumidores
- naturalmente cacheaveis por chave
- tolerantes a pequeno atraso controlado

### Dados que nao devem virar snapshot interno como fonte primaria
- envio de ordem
- cancelamento de ordem
- acoes assinadas pela `Agent Wallet`
- leituras transacionais da conta que precisam refletir o estado mais atual no momento da execucao

Esses fluxos continuam dependendo de chamada direta e tratamento transacional proprio.

## Arquitetura Sugerida

### Escolha de storage
Para a primeira iteracao, a recomendacao e usar `PostgreSQL`, e nao introduzir um banco separado como `MongoDB`.

Motivos:
- o projeto ja usa stack relacional e `Prisma`
- o volume esperado do refresh centralizado e baixo para padroes de banco
- as consultas sao previsiveis e indexaveis por chave
- reduz custo operacional e evita adicionar outra tecnologia cedo demais

Mongo ou outro storage especializado so devem entrar se houver necessidade real posterior, por exemplo:
- crescimento forte do volume historico
- escrita muito mais intensa
- necessidade analitica fora do perfil atual
- limites de custo/performance ja comprovados no Postgres

### Modelo de uso do banco
A recomendacao nao e tratar essa base como historico ilimitado de mercado.

Ela deve ser pensada como:
- cache persistido compartilhado
- snapshot operacional recente
- historico curto para auditoria e fallback

Isso significa que faz sentido ter politica de retencao desde o inicio.

### Schema inicial sugerido
A recomendacao inicial e separar:
- tabelas de `estado atual`, focadas em leitura rapida
- tabelas de `historico curto`, focadas em auditoria e fallback recente

Essa separacao tende a simplificar:
- consulta do snapshot vigente
- politica de limpeza
- crescimento controlado da base

#### 1. `market_price_current`
Responsabilidade:
- guardar o ultimo price snapshot conhecido por simbolo

Campos sugeridos:
- `symbol`
- `markPrice`
- `indexPrice`
- `lastPrice`
- `volume24h`
- `openInterest`
- `fundingRate`
- `capturedAt`
- `fetchedAt`
- `snapshotStatus`
- `source`

Chave sugerida:
- `unique(symbol)`

Uso principal:
- API de prices
- leitura rapida de ultimo estado conhecido

#### 2. `market_price_history`
Responsabilidade:
- guardar historico curto de prices para debug e fallback observavel

Campos sugeridos:
- `id`
- `symbol`
- `markPrice`
- `indexPrice`
- `lastPrice`
- `volume24h`
- `openInterest`
- `fundingRate`
- `capturedAt`
- `fetchedAt`
- `snapshotStatus`
- `source`

Indices sugeridos:
- `(symbol, fetchedAt desc)`
- `(fetchedAt desc)`

Uso principal:
- auditoria curta
- investigacao de degradacao
- comparacao entre snapshots recentes

#### 3. `market_candle_current`
Responsabilidade:
- guardar o ultimo candle conhecido por chave de mercado

Campos sugeridos:
- `symbol`
- `interval`
- `priceSource`
- `openTime`
- `closeTime`
- `open`
- `high`
- `low`
- `close`
- `volume`
- `fetchedAt`
- `snapshotStatus`
- `source`

Chave sugerida:
- `unique(symbol, interval, priceSource, openTime)`

Observacao:
- apesar do nome `current`, esta tabela pode conter mais de um candle recente por chave, se isso simplificar consumo local
- ainda assim, o objetivo dela e servir leituras operacionais recentes, nao historico amplo

#### 4. `market_candle_history`
Responsabilidade:
- guardar historico curto de candles obtidos pelo refresher

Campos sugeridos:
- `id`
- `symbol`
- `interval`
- `priceSource`
- `openTime`
- `closeTime`
- `open`
- `high`
- `low`
- `close`
- `volume`
- `fetchedAt`
- `snapshotStatus`
- `source`

Restricao sugerida:
- `unique(symbol, interval, priceSource, openTime)`

Indices sugeridos:
- `(symbol, interval, priceSource, openTime desc)`
- `(fetchedAt desc)`

Uso principal:
- worker operacional
- endpoints de candles
- auditoria curta de qual candle foi usado

#### 5. `market_info_current`
Responsabilidade:
- guardar o ultimo `market info` conhecido por simbolo

Campos sugeridos:
- `symbol`
- `tickSize`
- `lotSize`
- `minOrderSize`
- `maxOrderSize`
- `maxLeverage`
- `fetchedAt`
- `snapshotStatus`
- `source`

Chave sugerida:
- `unique(symbol)`

Uso principal:
- suporte a normalizacao de ordem com cache controlado

#### 6. `market_refresh_log`
Responsabilidade:
- registrar execucoes do refresher sem poluir as tabelas de snapshot

Campos sugeridos:
- `id`
- `refreshType`
- `key`
- `startedAt`
- `finishedAt`
- `status`
- `errorMessage`
- `recordsWritten`

Uso principal:
- observabilidade
- diagnostico de falhas e latencia

### Recomendacao de modelagem pratica
Se a equipe quiser reduzir escopo inicial, da para comecar com apenas:
- `market_price_current`
- `market_candle_history`
- `market_info_current`

Motivo:
- `prices` costumam ser lidos como ultimo estado
- `candles` costumam precisar de uma pequena janela recente
- `market info` muda pouco e combina bem com snapshot atual

Nesse desenho inicial:
- `market_price_current` atende leitura rapida
- `market_candle_history` atende leitura de janela recente por `symbol + interval + source`
- `market_info_current` atende cache curto de metadados de mercado

Se mais tarde surgir necessidade forte de auditoria de prices, adiciona-se `market_price_history`.

### Recomendacao de indices
Indices iniciais recomendados:
- `market_price_current(symbol)`
- `market_candle_history(symbol, interval, priceSource, openTime desc)`
- `market_info_current(symbol)`
- indices auxiliares por `fetchedAt` nas tabelas historicas para limpeza rapida

### Recomendacao de leitura
Leituras mais comuns devem ser simples:
- ultimo price por simbolo
- ultimos `N` candles por `symbol + interval + priceSource`
- market info atual por simbolo

Essas consultas combinam bem com `PostgreSQL` e nao exigem banco documental neste estagio.

### Proposta inicial de `schema.prisma`
Abaixo, uma proposta inicial de modelagem em `Prisma`, pensada para caber no schema atual sem introduzir dependencia em outro banco.

Observacoes:
- os nomes sao sugestoes e podem ser adaptados ao padrao do projeto
- o foco aqui e clareza de leitura e evolucao incremental
- a proposta abaixo parte do escopo enxuto recomendado

```prisma
enum MarketSnapshotStatus {
  confirmed
  stale
  unavailable
}

enum MarketPriceSource {
  market
  mark
}

model MarketPriceCurrent {
  symbol         String               @id
  markPrice      Decimal              @db.Decimal(28, 12)
  indexPrice     Decimal?             @db.Decimal(28, 12)
  lastPrice      Decimal?             @db.Decimal(28, 12)
  volume24h      Decimal?             @db.Decimal(28, 12)
  openInterest   Decimal?             @db.Decimal(28, 12)
  fundingRate    Decimal?             @db.Decimal(18, 12)
  capturedAt     DateTime
  fetchedAt      DateTime
  snapshotStatus MarketSnapshotStatus @default(confirmed)
  source         String
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt

  @@index([fetchedAt])
}

model MarketCandleSnapshot {
  id             String               @id @default(cuid())
  symbol         String
  interval       String
  priceSource    MarketPriceSource
  openTime       DateTime
  closeTime      DateTime
  open           Decimal              @db.Decimal(28, 12)
  high           Decimal              @db.Decimal(28, 12)
  low            Decimal              @db.Decimal(28, 12)
  close          Decimal              @db.Decimal(28, 12)
  volume         Decimal              @db.Decimal(28, 12)
  fetchedAt      DateTime
  snapshotStatus MarketSnapshotStatus @default(confirmed)
  source         String
  createdAt      DateTime             @default(now())

  @@unique([symbol, interval, priceSource, openTime])
  @@index([symbol, interval, priceSource, openTime(sort: Desc)])
  @@index([fetchedAt])
}

model MarketInfoCurrent {
  symbol         String               @id
  tickSize       Decimal              @db.Decimal(28, 12)
  lotSize        Decimal              @db.Decimal(28, 12)
  minOrderSize   Decimal              @db.Decimal(28, 12)
  maxOrderSize   Decimal?             @db.Decimal(28, 12)
  maxLeverage    Decimal?             @db.Decimal(18, 8)
  fetchedAt      DateTime
  snapshotStatus MarketSnapshotStatus @default(confirmed)
  source         String
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt

  @@index([fetchedAt])
}

model MarketRefreshLog {
  id             String    @id @default(cuid())
  refreshType    String
  refreshKey     String
  startedAt      DateTime
  finishedAt     DateTime?
  status         String
  errorMessage   String?
  recordsWritten Int       @default(0)
  createdAt      DateTime  @default(now())

  @@index([refreshType, startedAt(sort: Desc)])
  @@index([refreshKey, startedAt(sort: Desc)])
}
```

### Justificativa da proposta de schema

#### `MarketPriceCurrent`
Escolhido como tabela de estado atual porque:
- a leitura mais comum de prices e "qual o ultimo snapshot por simbolo?"
- `upsert` por `symbol` e simples
- evita carregar historico quando o consumidor so quer o dado vigente

#### `MarketCandleSnapshot`
Escolhido como historico curto porque:
- candles naturalmente formam serie temporal
- o worker e endpoints tendem a pedir os ultimos `N` candles
- `unique(symbol, interval, priceSource, openTime)` evita duplicacao do mesmo candle

#### `MarketInfoCurrent`
Escolhido como estado atual porque:
- `market info` muda pouco
- leitura tende a ser sempre o ultimo valor conhecido por simbolo
- o caso de uso principal e apoio operacional, nao analitico

#### `MarketRefreshLog`
Separado dos snapshots porque:
- facilita diagnosticar falhas do refresher
- evita sobrecarregar tabelas de leitura com metadados de execucao
- ajuda a medir latencia, erros e volume de escrita

### Politica recomendada de operacao por tabela

#### `MarketPriceCurrent`
Politica:
- sobrescrever com `upsert`
- nao acumular historico nesta tabela

#### `MarketCandleSnapshot`
Politica:
- inserir candles novos
- ignorar duplicados via chave unica
- apagar registros antigos conforme retencao

#### `MarketInfoCurrent`
Politica:
- sobrescrever com `upsert`
- guardar apenas ultimo estado conhecido

#### `MarketRefreshLog`
Politica:
- reter por poucos dias ou semanas
- usar para suporte operacional, nao como auditoria infinita

### Retencao sugerida no schema proposto
Direcao inicial:
- `MarketPriceCurrent`: sem limpeza por historico, porque representa somente estado atual
- `MarketCandleSnapshot`: limpeza por `fetchedAt` ou `openTime`, conforme politica de retencao
- `MarketInfoCurrent`: sem limpeza por historico, porque representa somente estado atual
- `MarketRefreshLog`: limpeza periodica

### Consultas previstas com esse schema

#### Ultimo price por simbolo
Consulta esperada:
- `findUnique` por `symbol` em `MarketPriceCurrent`

#### Ultimos candles por mercado
Consulta esperada:
- `findMany` em `MarketCandleSnapshot`
- filtro por `symbol + interval + priceSource`
- ordenacao por `openTime desc`
- `take N`

#### Market info atual
Consulta esperada:
- `findUnique` por `symbol` em `MarketInfoCurrent`

#### Historico de refresh
Consulta esperada:
- `findMany` em `MarketRefreshLog`
- filtro por tipo/chave
- ordenacao por `startedAt desc`

### Evolucoes futuras possiveis
Se o volume crescer, a modelagem pode evoluir para:
- particionamento de `MarketCandleSnapshot`
- tabela adicional de `MarketPriceHistory`
- materializacao de janelas prontas por chave
- storage frio para historico mais longo

Essas evolucoes nao sao necessarias para a primeira implementacao.

### 1. Camada de snapshot interno
Criar um repositorio interno para dados de mercado, por exemplo:
- `MarketDataSnapshotRepository`

Responsabilidades:
- armazenar candles por chave `symbol + interval + priceSource`
- armazenar prices por simbolo
- armazenar `fetchedAt`, `source`, `status` e eventualmente `expiresAt`
- permitir leitura do ultimo snapshot confirmado

### 2. Chaves de cache e frescor
Cada conjunto de dados deve ter chave e TTL explicitos.

Exemplos:
- candles `BTC-PERP + 1m + market`
- candles `ETH-PERP + 5m + mark`
- prices globais
- market info global

Cada leitura interna deve retornar, alem do payload:
- `fetchedAt`
- idade do snapshot
- indicador de `fresh`, `stale` ou `unavailable`

### 2.1 TTL e retencao
Faz sentido usar `TTL` logico, mesmo em `PostgreSQL`.

Aqui, `TTL` nao significa expiracao automatica nativa do banco; significa regra de aplicacao para:
- definir quando um snapshot ainda pode ser servido como `fresh`
- definir quando ele passa a ser `stale`
- definir quando um registro antigo pode ser removido por rotina de limpeza

Recomendacao:
- ter TTL de leitura
- ter retencao de historico
- nao usar historico infinito por padrao

### 2.2 Recomendacao de frescor
Uma politica inicial simples:
- `prices`: considerar `fresh` por alguns minutos
- `market info`: considerar `fresh` por algumas horas
- `candles 3m`: considerar `fresh` ate a janela esperada do candle seguinte, com pequena tolerancia

Importante:
- `freshness TTL` e diferente de `retention TTL`
- um dado pode deixar de ser `fresh` rapido e ainda ser mantido no banco por dias

### 2.3 Recomendacao de historico
Nao faz sentido guardar historico grande logo de inicio.

Para esta fase, a recomendacao e:
- manter snapshots de `prices` por poucos dias
- manter snapshots de `candles` por alguns dias ou poucas semanas, no maximo
- manter apenas o necessario para auditoria operacional curta, debug e fallback

Exemplo de direcao inicial:
- `prices`: 3 a 7 dias
- `candles`: 7 a 30 dias, dependendo do volume de simbolos
- `market info`: manter o ultimo snapshot confirmado e poucos historicos recentes

Isso costuma ser suficiente para:
- depurar comportamentos recentes
- confirmar se o worker usou dado fresco ou stale
- evitar crescimento desnecessario da base

### 2.4 Limpeza
Para evitar inflar o banco, a recomendacao e incluir uma rotina periodica de limpeza.

Essa rotina pode:
- apagar snapshots vencidos pela politica de retencao
- rodar diariamente
- registrar quantos registros foram removidos

Se o volume crescer no futuro, podem entrar otimizacoes adicionais:
- particionamento por data
- tabelas separadas para snapshot atual e historico
- compressao/extensoes analiticas
- armazenamento frio fora do banco transacional

### 3. Refresher centralizado
Criar um processo ou modulo central, por exemplo:
- `MarketDataRefresher`

Responsabilidades:
- decidir quando consultar a Pacifica
- deduplicar refresh concorrente da mesma chave
- aplicar rate limiting interno por chave e global
- persistir snapshot atualizado
- registrar falha sem apagar o ultimo snapshot valido

### 4. Leitura preferencial via snapshot
Consumidores deixam de chamar a Pacifica diretamente como caminho principal.

Novo comportamento esperado:
1. tentar ler snapshot interno
2. se fresco, usar snapshot
3. se stale mas aceitavel para o caso, usar snapshot com sinalizacao
4. se ausente ou antigo demais, solicitar refresh controlado
5. somente o refresher centralizado acessa a Pacifica

## Beneficios Esperados
- reducao forte de chamadas repetidas para a Pacifica
- menor chance de `429`
- comportamento mais previsivel em cenarios de degradacao externa
- reuso do mesmo dado entre worker, API e telas
- melhor observabilidade sobre idade e origem do dado
- possibilidade de fallback para ultimo snapshot confirmado

## Trade-offs
- maior complexidade de infraestrutura e persistencia
- risco de consumidores usarem dado stale sem perceber
- necessidade de definir TTLs por caso de uso
- necessidade de governar quais fluxos aceitam snapshot stale e quais exigem refresh
- necessidade de governar retencao para nao transformar cache operacional em historico infinito

## Recomendacao de Politica por Caso de Uso

### Worker operacional
Recomendacao:
- usar snapshot interno para avaliacao de sinal
- exigir frescor compativel com o timeframe
- quando snapshot estiver vencido, pedir refresh ao componente centralizado em vez de consultar a Pacifica diretamente

Motivo:
- e o principal gerador recorrente de leitura de candles
- varios loops podem pedir o mesmo mercado ao mesmo tempo

### Endpoints de leitura de mercado
Recomendacao:
- responder a partir do snapshot interno
- incluir no payload metadados de frescor quando fizer sentido

Motivo:
- o usuario geralmente tolera alguns segundos de defasagem em leituras publicas

### Simulacao, preview e avaliacao ad hoc de preset
Recomendacao:
- preferir snapshot para janelas recentes
- avaliar separadamente se backtests longos continuam buscando historico direto, sob politica controlada

Motivo:
- parte dessas chamadas pode ser pesada e nao precisa competir com o runtime operacional

### Execucao de ordem
Recomendacao:
- nao depender apenas de snapshot persistido
- se precisar `market info`, considerar cache interno curto, mas com refresh controlado e regras conservadoras

Motivo:
- esse fluxo precisa minimizar risco de decisao com dado defasado em momento critico

## Alternativas Consideradas

### Opcao 1. Manter cada consumidor chamando a Pacifica
Conclusao:
- simples agora
- ruim para escala, quota e confiabilidade

### Opcao 2. So aumentar backoff e retry
Conclusao:
- ajuda a suavizar falhas
- nao resolve duplicacao estrutural de chamadas

### Opcao 3. Cache local em memoria por processo
Conclusao:
- melhora parcialmente
- nao resolve concorrencia entre processos/instancias
- reduz pouco o problema quando API e worker escalam separadamente

### Opcao 4. Snapshot interno centralizado
Conclusao:
- melhor equilibrio para o projeto
- reduz chamadas redundantes sem misturar responsabilidades de trading transacional

## Desenho Incremental Recomendado

### Fase 1. Base interna para market data
- criar schema/repositorio para snapshot de `candles` e `prices`
- definir chaves, TTLs e metadados minimos
- adicionar metricas de hit, miss, stale e refresh failure

### Fase 2. Refresher centralizado com deduplicacao
- implementar refresh por chave
- evitar chamadas paralelas identicas
- manter ultimo snapshot confirmado durante indisponibilidade externa

### Fase 3. Migrar consumidores de leitura
- mover `GetMarketCandles`
- mover `GetMarketPrices`
- mover `EvaluatePresetSignal`
- mover `PreviewPresetBacktest` quando aplicavel

### Fase 4. Migrar worker operacional
- substituir fetch direto de candles por leitura interna
- manter contrato de frescor explicito por timeframe
- observar impacto em taxa de `runtime_loop_error`

### Fase 5. Avaliar cache curto de `market info`
- considerar centralizar `GET /api/v1/info`
- manter execucao de ordem como fluxo transacional proprio

## Regras de Observabilidade Recomendadas
- registrar quando um consumidor recebe dado `fresh`
- registrar quando recebe dado `stale`
- registrar quando refresh e bloqueado por deduplicacao
- registrar idade do snapshot usado pelo worker na avaliacao
- medir reducao de chamadas externas por endpoint e por tipo de consumidor
- medir ocorrencias de `429` antes e depois da migracao

## Riscos de Produto e Engenharia
- usar candle stale demais pode mudar sinal calculado
- usar market info stale demais pode impactar normalizacao de ordem
- TTL unico para tudo nao deve ser adotado
- fallback silencioso sem metadado de frescor pode mascarar degradacao
- reter historico demais sem politica de limpeza pode inflar o Postgres sem ganho proporcional

## Recomendacao Final
Implementar centralizacao para market data publico da Pacifica faz sentido e esta alinhado com a direcao ja usada pelo projeto para snapshots internos de outros dominios.

A recomendacao preferencial e:
- centralizar `candles` e `prices`
- executar o refresh em `Lambda + EventBridge Scheduler` a cada `1 minuto`
- usar `PostgreSQL` como storage inicial
- aplicar TTL logico de frescor e politica de retencao curta desde o inicio
- avaliar `market info` como extensao posterior
- nao centralizar como fonte primaria os fluxos transacionais de trading

## Escopo Recomendado para Implementacao Futura
- documentar schema de persistencia
- definir TTLs por tipo de dado
- introduzir `MarketDataSnapshotRepository`
- introduzir `MarketDataRefresher`
- adaptar API e worker para consumir snapshot interno antes de qualquer refresh externo

## Checklist de Implementacao

### Alinhamento e decisao tecnica
- [X] confirmar escopo inicial da feature: `prices`, `candles` e `market info`
- [X] confirmar que o menor timeframe operacional sera `3m`
- [X] confirmar a decisao de executar refresh em `AWS Lambda + EventBridge Scheduler`
- [X] confirmar `PostgreSQL` como storage inicial
- [X] fechar politica inicial de `freshness TTL` e `retention TTL`

### Modelagem de dados
- [X] revisar a proposta de schema com a equipe
- [X] adicionar enums de snapshot no `schema.prisma`
- [X] adicionar modelo de `MarketPriceCurrent`
- [X] adicionar modelo de `MarketCandleSnapshot`
- [X] adicionar modelo de `MarketInfoCurrent`
- [X] adicionar modelo de `MarketRefreshLog`
- [X] revisar nomes, precisao de `Decimal` e indices
- [X] gerar migration
- [X] validar migration em ambiente local

### Repositorio e persistencia
- [X] criar `MarketDataSnapshotRepository` no dominio
- [X] definir contratos de leitura para:
- [X] ultimo price por simbolo
- [X] ultimos candles por `symbol + interval + priceSource`
- [X] market info atual por simbolo
- [X] definir contratos de escrita com `upsert` para tabelas `current`
- [X] definir contratos de insercao idempotente para candles
- [X] implementar repositorio Prisma
- [X] cobrir repositorio com testes

### Refresher centralizado
- [X] criar caso de uso ou servico `MarketDataRefresher`
- [X] definir chaves de refresh por tipo de dado
- [X] implementar fetch de `prices`
- [X] implementar fetch de `candles`
- [X] implementar fetch de `market info`
- [X] persistir snapshots confirmados
- [X] registrar falhas em `MarketRefreshLog`
- [X] garantir que falha externa nao apague ultimo snapshot valido
- [X] cobrir refresher com testes unitarios

### Lambda e agendamento
- [ ] criar entrypoint da Lambda
- [ ] configurar `EventBridge Scheduler` para rodar a cada `1 minuto`
- [ ] definir variaveis de ambiente necessarias
- [ ] garantir timeout e memoria adequados
- [ ] validar execucao local/sandbox da Lambda
- [ ] validar deploy em ambiente de teste

### Politica de frescor e retencao
- [X] implementar regra de `fresh`, `stale` e `unavailable`
- [X] definir TTL de frescor para `prices`
- [X] definir TTL de frescor para `market info`
- [X] definir TTL de frescor para `candles 3m`
- [X] implementar rotina periodica de limpeza
- [X] definir retencao para `MarketCandleSnapshot`
- [X] definir retencao para `MarketRefreshLog`
- [X] testar limpeza sem afetar leituras correntes

### Integracao com API
- [X] adaptar `GetMarketPrices` para ler do snapshot interno
- [X] adaptar `GetMarketCandles` para ler do snapshot interno
- [X] adaptar `EvaluatePresetSignal` para usar a leitura interna
- [X] revisar `PreviewPresetBacktest` para usar snapshot apenas quando fizer sentido
- [ ] decidir se responses da API passam a expor metadados de frescor
- [X] cobrir fluxos da API com testes

### Integracao com worker
- [X] adaptar o worker operacional para nao buscar candles diretamente na Pacifica
- [X] ler candles do snapshot interno
- [ ] definir comportamento quando snapshot estiver stale ou indisponivel
- [X] garantir que o worker registre degradacao sem explodir chamadas externas
- [X] cobrir novo fluxo com testes

### Observabilidade
- [X] adicionar logs de refresh iniciado, concluido e falho
- [X] adicionar log de idade do snapshot usado pelos consumidores criticos
- [X] medir `hit`, `miss`, `stale hit` e `refresh failure`
- [ ] acompanhar taxa de `429` antes e depois da migracao
- [ ] acompanhar tempo medio de refresh

### Validacao final
- [ ] validar que API e worker nao dependem mais de fetch direto para market data publico
- [X] validar que snapshots continuam sendo servidos durante indisponibilidade temporaria da Pacifica
- [ ] validar que a rotina de limpeza mantem o banco sob controle
- [ ] validar impacto real em volume de chamadas externas
- [ ] documentar operacao, troubleshooting e limites conhecidos

## Como Testar Localmente

### Preparacao
1. subir o banco local:
   `pnpm db:up`
2. sincronizar o schema local com o banco:
   `pnpm --filter @pacifica/database db:push`
3. iniciar a API:
   `pnpm --filter @pacifica/api dev`
4. iniciar o worker, se quiser validar consumo do snapshot pelo runtime:
   `pnpm --filter @pacifica/worker dev`

### Scheduler local
O projeto agora suporta refresh local automatico por `setInterval`, pensado apenas para desenvolvimento.

Variaveis principais:
- `LOCAL_MARKET_DATA_REFRESH_ENABLED=true`
- `LOCAL_MARKET_DATA_REFRESH_INTERVAL_MS=60000`
- `LOCAL_MARKET_DATA_REFRESH_RUN_ON_START=true`
- `LOCAL_MARKET_DATA_REFRESH_PRICES=true`
- `LOCAL_MARKET_DATA_REFRESH_MARKET_INFO=true`

Observacao:
- o scheduler local nao usa mais uma lista fixa de `symbol + timeframe` em `env`
- os `candleRequests` sao derivados dinamicamente dos presets ativos atuais no banco
- o simbolo e convertido para o formato Pacifica no momento do refresh

Com essa configuracao:
- a API faz refresh no startup
- continua refrescando a cada `1 minuto`
- persiste `prices`, `market info` e candles configurados

### Refresh manual
Tambem e possivel disparar refresh manualmente.

Via script:
- `pnpm --filter @pacifica/api refresh:market-data`

Com candle especifico:
- `MARKET_REFRESH_SYMBOL=BTC-PERP MARKET_REFRESH_INTERVAL=3m MARKET_REFRESH_LIMIT=120 pnpm --filter @pacifica/api refresh:market-data`

Via endpoint interno:
```bash
curl -X POST http://localhost:3000/api/internal/market/refresh \
  -H 'Content-Type: application/json' \
  -d '{
    "refreshPrices": true,
    "refreshMarketInfo": true,
    "candleRequests": [
      {
        "symbol": "BTC-PERP",
        "interval": "3m",
        "priceSource": "market",
        "startTime": 1712484000000,
        "limit": 120
      }
    ]
  }'
```

### Cleanup manual
Para testar retencao localmente:
- `pnpm --filter @pacifica/api cleanup:market-data`

Variaveis opcionais:
- `MARKET_DATA_CANDLE_RETENTION_MS`
- `MARKET_DATA_REFRESH_LOG_RETENTION_MS`

### Validacoes recomendadas
Depois de iniciar a API e deixar o refresh rodar:
1. chamar `GET /api/market/prices`
2. chamar `GET /api/market/info`
3. chamar `POST /api/market/candles`
4. chamar o endpoint de simulacao/backtest do preset
5. observar o worker consumindo candles sem consultar a Pacifica em toda iteracao

### Sinais esperados em log
Na API:
- `api.market_data_prices_cache_hit`
- `api.market_data_prices_cache_stale`
- `api.market_data_candles_cache_hit`
- `api.market_data_candles_cache_miss`
- `api.market_data_market_info_cache_hit`
- `api.market_data_market_info_cache_miss`
- `local_market_data_refresh_scheduler.completed`
- `market_data_cleanup.completed`

No worker:
- `worker.market_data_snapshot_cache_hit`
- `worker.market_data_snapshot_cache_miss`
- `worker.market_data_snapshot_stale_fallback_served`

### Interpretacao rapida
- `cache_hit`: leitura servida do banco interno
- `cache_miss`: nao havia snapshot suficiente, houve refresh ou fallback
- `cache_stale`: havia snapshot, mas fora da janela de frescor
- `stale_fallback_served`: refresh externo falhou e o sistema serviu o ultimo snapshot conhecido

### Limitacoes atuais
- o scheduler local existe apenas para desenvolvimento
- a execucao em producao ainda nao foi movida para `Lambda + EventBridge Scheduler`
- os endpoints ainda nao expoem metadado explicito de frescor no payload
- a medicao formal da queda de `429` ainda depende de observacao no ambiente real
