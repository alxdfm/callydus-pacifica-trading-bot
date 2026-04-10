# Revisao Incremental de Codigo em 2026-04-10

## Objetivo
Registrar a revisao do que foi implementado desde os reviews anteriores de fim de marco, com foco nas trilhas que mais mudaram no periodo:
- market data persistido
- lifecycle real de trades no worker
- fluxo YOUR Strategy

## Escopo Revisado
- `apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.ts`
- `apps/api/src/infrastructure/persistence/PrismaMarketDataSnapshotRepository.ts`
- `apps/api/src/application/preview-your-strategy-backtest/PreviewYourStrategyBacktest.ts`
- `apps/api/src/application/activate-your-strategy/ActivateYourStrategy.ts`
- `apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.ts`
- `apps/worker/src/application/createOperationalWorker.ts`
- `apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts`
- `packages/database/prisma/schema.prisma`

## Conclusao Executiva
- As mudancas desde o ultimo review trouxeram evolucao real de arquitetura, especialmente em `market data persisted cache`, `worker execution` e `YOUR Strategy`.
- Tambem ha sinais claros de amadurecimento: cobertura de testes aumentou e parte dos findings anteriores de `api/worker` foi tratada.
- Mesmo assim, encontrei tres riscos relevantes no estado atual:
  - leitura truncada de candles por limitar antes de filtrar a janela
  - cache historico sendo tratado como stale por regra de frescor inadequada
  - fechamento manual no worker promovendo close local antes de confirmacao mais robusta

## Findings

### 1. Alta: o cache persistido de candles pode retornar janela incompleta mesmo quando o banco ja tem dados suficientes
Trechos observados:
- `apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.ts`
- `apps/api/src/infrastructure/persistence/PrismaMarketDataSnapshotRepository.ts`
- `apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.ts`
- `apps/api/src/application/preview-your-strategy-backtest/PreviewYourStrategyBacktest.ts`

Leitura atual:
- tanto no worker quanto na API, a consulta pega apenas os `N` candles mais recentes
- so depois a resposta e filtrada por `startTime/endTime`
- isso funciona para janelas coladas no presente, mas falha para janelas historicas ou warmups mais antigos

Impacto:
- o sistema pode concluir que faltam candles mesmo quando o banco ja possui a janela completa
- previews de backtest e leituras historicas podem disparar refresh desnecessario ou falhar como `insufficient_market_data`
- a regra fica especialmente frágil no fluxo de YOUR Strategy, que usa warmup e janelas maiores

Referencias:
- `apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.ts:41`
- `apps/api/src/infrastructure/persistence/PrismaMarketDataSnapshotRepository.ts:122`
- `apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.ts:91`
- `apps/api/src/application/preview-your-strategy-backtest/PreviewYourStrategyBacktest.ts:114`

### 2. Media: a regra de frescor trata candles historicos como stale e tende a forcar refresh desnecessario
Trechos observados:
- `apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.ts`
- `apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.ts`

Leitura atual:
- a frescura do cache e calculada candle a candle contra `now`
- para uma janela historica, candles validos e imutaveis continuam envelhecendo e passam a ser tratados como stale
- como a regra exige que todos os candles do range estejam fresh, consultas historicas podem cair sempre em refresh

Impacto:
- custo operacional maior do que o necessario
- perda do principal beneficio do snapshot persistido em backtests e leituras retroativas
- maior pressao sobre refresh local e sobre a Pacifica quando houver fallback

Referencias:
- `apps/worker/src/infrastructure/market-data/PersistedWorkerMarketDataGateway.ts:58`
- `apps/api/src/infrastructure/market-data/PersistedMarketDataGateway.ts:100`

### 3. Media: o fechamento manual no worker promove o trade para `closed` imediatamente apos submissao da ordem, usando preco local como verdade final
Trechos observados:
- `apps/worker/src/application/createOperationalWorker.ts`
- `apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts`

Leitura atual:
- no fluxo de manual close, basta `createMarketOrder` retornar sem erro para o worker:
  - fechar localmente o trade
  - usar `trade.currentPrice` como `exitPrice`
  - calcular `realizedPnl` em cima desse preco local
- esse caminho nao registra tentativa de execucao com o mesmo nivel de detalhe do fluxo principal de entrada

Impacto:
- o close local pode divergir do preco realmente executado
- uma submissao aceita, mas ainda nao confirmada/fillada, ja remove o trade da visao local
- isso pode causar discrepancia temporaria ou persistente entre lifecycle local e estado de exchange

Referencias:
- `apps/worker/src/application/createOperationalWorker.ts:647`
- `apps/worker/src/application/createOperationalWorker.ts:657`
- `apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts:739`

## Observacao Estrutural
- O gate de ativacao de `YOUR Strategy` depende apenas de `lastBacktestPreviewedAt + fingerprint do draft`.
- No schema atual nao ha persistencia das premissas do preview, como `initialCapitalUsd`, `leverage`, `feePercent` e `slippagePercent`.
- Isso pode ser aceitavel por decisao de produto, mas vale validacao explicita com o dev operacional e com produto para evitar gate “fraco demais”.

Referencias:
- `apps/api/src/application/activate-your-strategy/ActivateYourStrategy.ts:98`
- `packages/database/prisma/schema.prisma:300`

## Status
- documento criado em `2026-04-10`
- nenhuma alteracao de codigo de aplicacao foi realizada como parte desta revisao
