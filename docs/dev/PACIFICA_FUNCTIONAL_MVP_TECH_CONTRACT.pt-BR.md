# Contrato Tecnico da Pacifica para o MVP Funcional

## Objetivo
Fechar o contrato tecnico minimo da Pacifica necessario para tirar o produto do modo local/mockado e permitir implementacao real de backend, runtime e leitura operacional.

## Fontes Primarias Utilizadas
- API overview: https://docs.pacifica.fi/api-documentation/api
- Signing e Agent Wallets: https://docs.pacifica.fi/api-documentation/api/signing/api-agent-keys
- Signing implementation: https://docs.pacifica.fi/api-documentation/api/signing/implementation
- Builder Program: https://docs.pacifica.fi/builder-program
- Rate limits: https://docs.pacifica.fi/api-documentation/api/rate-limits
- API Config Keys: https://docs.pacifica.fi/api-documentation/api/rate-limits/api-config-keys
- Get prices: https://docs.pacifica.fi/api-documentation/api/rest-api/markets/get-prices
- Get candle data: https://docs.pacifica.fi/api-documentation/api/rest-api/markets/get-candle-data
- Get mark price candle data: https://docs.pacifica.fi/api-documentation/api/rest-api/markets/get-mark-price-candle-data
- Websocket overview: https://docs.pacifica.fi/api-documentation/api/websocket
- Websocket subscriptions: https://docs.pacifica.fi/api-documentation/api/websocket/subscriptions
- Prices websocket: https://docs.pacifica.fi/api-documentation/api/websocket/subscriptions/prices
- Last order ID: https://docs.pacifica.fi/api-documentation/api/last-order-id

## Conclusao Executiva
- A Pacifica faz sentido como fonte primaria de `preco` e `candles`, porque e a venue de execucao.
- Nao faz sentido depender de provider externo para `indicadores` do caminho critico; o backend deve calcular `EMA`, `RSI`, `ATR` e `volume SMA` internamente sobre candles da Pacifica.
- A Pacifica nao expoe um conceito nativo de `bot`, `preset`, `pause bot` ou `resume bot`; isso precisa continuar como contrato proprio do nosso backend.
- Parte do fluxo do MVP funcional depende diretamente da Pacifica; parte depende de um `adapter interno` nosso para traduzir runtime, comandos e read models de produto.
- Mudanca de direcao confirmada em teste real: `approve_builder_code` nao deve mais ser tratado como validacao backend da `Agent Wallet`; ele passa a ser um passo separado de autorizacao da conta, assinado com a wallet principal no frontend.

## O Que Integrar Diretamente com a Pacifica

### Credenciais e Assinatura
- `Agent Wallet` e o segredo operacional recomendado pela propria Pacifica.
- A assinatura operacional usa a `API Agent Private Key`.
- O backend deve receber a private key apenas para criptografar e persistir com seguranca, nunca para devolve-la ao frontend.

### Market Data
- `GET /api/v1/info/prices` para snapshot agregado de preco, funding, open interest e volume.
- `GET /api/v1/kline` para candles historicos de mercado.
- `GET /api/v1/kline/mark` para candles de mark price.
- Websocket `prices` para feed de preco em tempo real.
- Websocket `candle` e `mark_price_candle` para streaming incremental de candles quando precisarmos reduzir polling.

Contrato externo da Pacifica confirmado em teste:
- candles retornam em objetos com chaves:
  - `t`: candle start time
  - `T`: candle end time
  - `s`: symbol
  - `i`: interval
  - `o`: open
  - `c`: close
  - `h`: high
  - `l`: low
  - `v`: volume
  - `n`: number of trades
- na pratica, a Pacifica rejeita ranges muito amplos sem `end_time`, com erro do tipo:
  - `Time range too large for 1h interval with limit 4000. Max range: 4000 candles`
- por isso, nosso adapter local deve tratar `limit` apenas como conveniencia interna e convertê-lo para `end_time` antes de chamar a Pacifica

Contrato interno normalizado do nosso backend:
- o backend nao expoe esse formato compacto diretamente ao restante do sistema
- o payload interno normalizado de candles usa:
  - `symbol`
  - `interval`
  - `openTime`
  - `closeTime`
  - `open`
  - `high`
  - `low`
  - `close`
  - `volume`
- isso reduz acoplamento com o shape externo da Pacifica e deixa o motor de indicadores trabalhar sobre um contrato mais semantico

### Estado de Trading
- A doc oficial indica leitura de `positions`, `trades` e `orders` como fontes canonicas de eventos de trading.
- `last_order_id` deve ser tratado como cursor oficial para ordenacao de eventos entre endpoints e streams de trading.
- Websockets de conta como `account_positions`, `account_orders`, `account_order_updates` e `account_trades` sao a melhor base para read models em tempo quase real.

## O Que Nao Existe como Contrato Nativo da Pacifica
- ativacao de preset
- pausa do bot
- retomada do bot
- encerramento conceitual do bot
- alertas operacionais do produto
- read models de dashboard no formato do nosso app

Esses pontos devem ser implementados pelo nosso backend como:
- `command layer`
- `runtime state`
- `read models`
- `operational alerts`

## Mapeamento por Task do Functional MVP

### FM-001
Sai do campo de suposicao. O contrato abaixo ja permite desenhar backend real.

### FM-002
Fluxo recomendado:
1. frontend conecta a wallet principal e executa o `builder approval` como assinatura explicita de onboarding
2. frontend envia `wallet public key + agent wallet public key + agent wallet private key`
3. backend cifra a private key
4. backend valida e persiste a `Agent Wallet` sem depender do `approve_builder_code` como prova de validade da credencial

Observacao:
- o `builder code` continua obrigatorio antes de operar, mas o gate pertence a autorizacao da conta e nao a validacao da `Agent Wallet`
- em teste real, o `approve_builder_code` falhou com `Verification failed` quando assinado pela `Agent Wallet` e respondeu `200` quando assinado com a chave da conta principal em modo diagnostico local
- isso mudou a direcao do projeto: o approval do builder sera modelado como passo frontend com a wallet principal conectada, sem jamais pedir a private key principal ao usuario
- se o usuario trocar de `Agent Wallet`, a nova credencial so substitui a anterior apos validacao backend bem-sucedida; em falha, a credencial antiga permanece valida
- ainda precisamos fechar qual chamada backend da Pacifica sera o criterio definitivo de validacao da `Agent Wallet`

### FM-003
- `OperatorAccount`, `PacificaCredential`, `PresetActivation`, `BotRuntimeState`, `OpenTrade`, `ClosedTrade` e `OperationalAlert` do schema atual suportam a transicao para backend como fonte de verdade
- `localStorage` deve ficar restrito a preferencia de UI

### FM-004
- Fonte recomendada: Pacifica
- Canonico recomendado:
  - snapshot inicial via REST
  - atualizacao incremental via WebSocket
  - fallback para polling de candles quando stream nao estiver disponivel

### FM-005
- Indicadores devem ser calculados por nos sobre candles Pacifica
- Isso preserva coerencia entre sinal, auditoria e venue de execucao
- O contrato tecnico canonico dos presets deve ficar compartilhado em `packages/contracts`, nao duplicado entre frontend e backend
- O primeiro adaptador auditavel do slice pode ser exposto como `POST /api/presets/evaluate-signal`, recebendo `presetDefinitionId + editableConfig` e devolvendo:
  - `signal`
  - snapshots dos indicadores relevantes (`previous/current`)
  - explicacao de quais regras `cross`/`threshold` passaram ou falharam
  - `entryReferencePrice`
  - `longRiskPlan` e `shortRiskPlan` com `stopLossPrice`, `takeProfitPrice` e `riskDistance` derivados do contrato de risco do preset

Observacao de congruencia:
- o contrato de produto usa simbolos como `BTC/USDC`
- a Pacifica consome simbolos de mercado como `BTC`
- o adapter backend deve fazer essa traducao na borda, sem contaminar o contrato interno do preset

### FM-006 a FM-008
- ativacao, pause, resume e close trade devem ser comandos internos do nosso backend
- a traducao para a Pacifica acontece em camada de infraestrutura
- dashboard, current trades e history devem ler de read models persistidos, nao direto da Pacifica

Observacao pratica ja validada:
- o primeiro comando real dessa trilha pode ser `POST /api/presets/activate`
- ele deve:
  - persistir `PresetActivation`
  - gerar `effectiveContractJson` com os campos editaveis aplicados sobre o contrato base do preset
  - desativar o preset ativo anterior da conta
  - atualizar `BotRuntimeState.activePresetActivationId`

### FM-009 e FM-010
- `last_order_id` e subscriptions de conta sao base para reconciliacao minima
- rate limits, falhas de websocket e assinaturas invalidas devem virar eventos auditaveis do runtime

### FM-017
- `POST /api/account/session` deixa de ser apenas read model interno e passa a tentar sincronizacao externa com a Pacifica antes de devolver a sessao.
- quando a Pacifica responde, o runtime deve marcar:
  - `exchangeSnapshotStatus = confirmed`
  - `exchangeLastSyncedAt`
  - `exchangeSnapshotMessage = null`
- quando a Pacifica nao responde, o produto nao deve vender o estado local como se fosse confirmado:
  - o ultimo estado persistido pode continuar visivel
  - mas o runtime deve marcar `exchangeSnapshotStatus = last_known`
  - e expor `exchangeSnapshotMessage` explicando o fallback
- drift relevante entre exchange e banco/runtime deve ser tratado como reconciliacao externa, nao como diferenca silenciosa de read model

## Contrato Minimo Recomendado para o Nosso Backend

### Inbound para API
- `POST /api/onboarding/credentials/validate`
- `GET /api/account/runtime`
- `POST /api/presets/activate`
- `POST /api/runtime/pause`
- `POST /api/runtime/resume`
- `POST /api/trades/:id/close`

### Inbound para Frontend
- assinatura explicita do payload `approve_builder_code` com a wallet principal conectada
- envio do approval assinado para a Pacifica antes da liberacao operacional da conta

### Outbound para Pacifica
- assinatura de requests com `Agent Wallet`
- leitura de market data por REST + WebSocket
- leitura de posicoes, ordens e trades para reconcilicao
- envio de ordens/cancelamentos para materializar comandos reais

## Rate Limit e Regras Operacionais Relevantes
- A Pacifica usa janela rolante de `60s`.
- Quota base sem `API Config Key`: `125` creditos por 60s.
- Quota base com `API Config Key` valido: `300` creditos por 60s.
- Websocket: maximo de `300` conexoes concorrentes por IP e `20` subscriptions por canal por conexao.

## Decisao Tecnica Fechada
- `Pacifica` sera a fonte primaria para `preco`, `candles`, `orders`, `positions` e `trades`.
- `Indicadores` serao calculados internamente pelo backend.
- `Bot runtime`, `preset activation`, `pause/resume`, `operational alerts` e `read models de produto` permanecem como responsabilidade nossa.
- O ambiente local de banco para essa trilha deve subir por `docker compose`.
- `Builder approval` passa a ser um gate separado de autorizacao da conta, assinado pela wallet principal no frontend.
- `Agent Wallet validation` continua como gate backend separado e nao deve mais depender do endpoint `approve_builder_code` como criterio principal.
- A doc atual da Pacifica nao expoe um endpoint neutro de `check` para `Agent Wallet`; por isso, o projeto deve distinguir entre `credencial validada` e `credencial operacionalmente comprovada`.

## Riscos e Gaps Ainda Abertos
- Ainda precisamos validar em teste real o comportamento de `approve_builder_code` quando o builder code ja estiver previamente aprovado no fluxo frontend com a wallet principal.
- Ainda precisamos fechar com mais evidencia o formato canonico de assinatura aceito pela Pacifica nos endpoints assinados; no estado atual usamos fallback entre `type + data` e `unsignedBody` por compatibilidade observada na POC.
- Evidencia ja obtida: no `approve_builder_code` assinado pela wallet principal, o caminho `primary` (`type + data`) respondeu `200`; o `fallback` nao foi necessario nesse fluxo.
- Ainda precisamos confirmar qual endpoint ou criterio da Pacifica usaremos como prova backend definitiva de validade da `Agent Wallet`.
- Ainda precisamos decidir se o MVP aceitara validacao em dois niveis (`validated` e `operationally_verified`) ou se exigira um `POST` real de menor impacto como probe pre-trade.
- Ainda precisamos desenhar a camada de criptografia/secret storage para `Agent Wallet private key`.
- Ainda precisamos definir idempotencia e deduplicacao dos comandos reais.
- Ainda precisamos testar na pratica o custo de polling vs websocket dentro dos limites da Pacifica.

## Proximo Passo Recomendado
- ajustar `FM-002` para separar `builder approval` frontend de `Agent Wallet validation` backend
- manter a persistencia criptografada da `Agent Wallet`
- liberar trades backend somente apos `builder approval` confirmado e credencial operacional validada
