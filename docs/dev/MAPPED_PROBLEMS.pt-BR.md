# Problemas Mapeados

## 2026-04-01 - Regressao no `verify-operational` da Pacifica

### Sintoma
- `Run readiness check` passou a falhar com `Pacifica API request failed (400).`
- body retornado pela Pacifica: `Invalid signature`
- afetava tanto `Agent Wallet` nova quanto wallet antiga que ja havia funcionado antes

### Commit onde o desvio principal entrou
- `792fb7d` - `feat(packages): add shared Pacifica trading package`

### Causa mapeada
- na extracao do client para `packages/pacifica-trading`, o fluxo de assinatura saiu do contrato que estava funcionando antes
- a regressao principal foi trocar a codificacao da assinatura de `base58` para `base64`
- alem disso, o client compartilhado deixou de enviar `builder_code` nos requests de ordem, divergindo da POC funcional em `/deprecated`

### Evidencia
- client anterior em `41fd029` assinava e transmitia assinatura em `base58`
- package novo introduzido em `792fb7d` passou a usar `.toString("base64")`
- a POC funcional em `/deprecated/bot/src/integrations/pacifica-client.ts` tambem incluia `builder_code` nos requests de ordem quando configurado
- a documentacao oficial da Pacifica para signing exige:
  - serializacao JSON compacta
  - ordenacao recursiva de chaves
  - assinatura transmitida em `base58`

### Correcao aplicada
- restaurado o encoding da assinatura para `base58`
- restaurada a serializacao canonica do payload assinado
- restaurado o envio de `builder_code` nas ordens quando configurado
- removidos os logs temporarios usados no diagnostico

### Arquivos envolvidos
- [packages/pacifica-trading/src/index.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/pacifica-trading/src/index.ts)
- [packages/contracts/src/index.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/contracts/src/index.ts)
- [apps/api/src/infrastructure/pacifica/PacificaOperationalVerificationGateway.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/api/src/infrastructure/pacifica/PacificaOperationalVerificationGateway.ts)
- [deprecated/bot/src/integrations/pacifica-client.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/deprecated/bot/src/integrations/pacifica-client.ts)

### Licao
- qualquer extracao/refatoracao do client Pacifica precisa ser validada contra:
  - documentacao oficial de signing
  - POC funcional anterior
  - teste real de `verify-operational`

## 2026-04-10 - Bugs operacionais em execucao real e fechamento manual Pacifica

### Sintomas
- ordem de mercado abria, mas configuracao de protecao falhava com `400`
- `responseJson` e `responseBody` vinham `null` em falhas operacionais
- `currentTrades` nao refletia automaticamente trades abertos pelo worker
- `Close trade` parecia fechar no produto, mas nao zerava a posicao na Pacifica
- contas pausadas com `manual close` pendente nao eram processadas
- posicoes `short` da Pacifica apareciam como `long` no produto
- reconciliacao apagava o estado de `close_requested`, impedindo o worker de concluir o fechamento

### Causas mapeadas
- TP/SL estava sendo enviado junto de `create_market_order`, divergindo do fluxo validado na POC
- parser do client Pacifica descartava resposta crua em alguns `400`
- app mantinha sessao stale apos abertura real pelo worker
- API de `Close trade` historicamente fechava so o read model local
- worker filtrava pendencias manuais por `tradeStatus = close_requested`, mas a reconciliacao voltava esse campo para `open`
- gateway de snapshot Pacifica interpretava `side = ask` com `amount` positivo como `long`

### Correcao aplicada
- abertura e protecao foram separadas:
  - `create_market_order`
  - espera da posicao aparecer em `/positions`
  - `set_position_tpsl`
- protecao ganhou retry controlado para o timing de reconhecimento da posicao
- parser do client passou a preservar body cru como `{ raw }`
- worker passou a persistir payload real e contexto de erro
- app passou a fazer polling leve de sessao para atualizar `currentTrades`
- `Close trade` passou a registrar apenas intencao persistida
- worker passou a executar fechamento real com `reduce_only`
- worker passou a processar `manual close` mesmo com bot pausado
- gateway de snapshot passou a mapear:
  - `bid -> long`
  - `ask -> short`
- reconciliacao passou a preservar `close_requested` quando o fechamento manual ja foi pedido
- worker passou a detectar pendencia manual por `closeRequestedAt != null` + `closeReasonPending = manual`

### Arquivos envolvidos
- [packages/pacifica-trading/src/index.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/pacifica-trading/src/index.ts)
- [apps/worker/src/application/createOperationalWorker.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/worker/src/application/createOperationalWorker.ts)
- [apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/worker/src/infrastructure/persistence/PrismaWorkerRuntimeRepository.ts)
- [apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts)
- [apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts)
- [apps/app/src/features/wallet/solana/SolanaWalletStateBridge.tsx](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/app/src/features/wallet/solana/SolanaWalletStateBridge.tsx)

### Licao
- execucao real, protecao e fechamento manual precisam ser validados contra a exchange, nao apenas contra o read model local
- reconciliacao externa nunca pode apagar a intencao operacional pendente do produto
- o mapeamento de `side` da Pacifica (`bid/ask`) precisa permanecer coberto por teste automatizado

## 2026-04-11 - `create_market_order` com TP/SL embutido falhando por `client_order_id` invalido

### Sintoma
- `create_market_order` com `take_profit` e `stop_loss` embutidos passou a falhar com `400`
- a mesma abertura sem protecao ou com readiness basico continuava funcionando
- `responseBody` podia continuar `null`, tornando o erro opaco

### Causa mapeada
- o payload embutido de protecao enviava:
  - `take_profit.client_order_id = <uuid>:tp`
  - `stop_loss.client_order_id = <uuid>:sl`
- a Pacifica documenta `client_order_id` desses objetos como opcional, mas quando enviado deve ser um UUID valido
- os suffixes `:tp` e `:sl` quebravam esse contrato

### Evidencia
- o `client_order_id` raiz da ordem funcionava normalmente como UUID puro
- o fluxo passou a funcionar imediatamente apos remover os `client_order_id` internos de `take_profit` e `stop_loss`
- a abertura continuou com:
  - `client_order_id` raiz valido
  - `take_profit` e `stop_loss` embutidos como objetos

### Correcao aplicada
- o worker deixou de enviar `clientOrderId` dentro dos objetos embutidos de `takeProfit` e `stopLoss`
- a ordem continua enviando apenas:
  - `stop_price`
  - `limit_price`
- o `client_order_id` valido permanece apenas no nivel raiz de `create_market_order`

### Arquivos envolvidos
- [apps/worker/src/application/createOperationalWorker.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/worker/src/application/createOperationalWorker.ts)
- [packages/pacifica-trading/src/index.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/pacifica-trading/src/index.ts)

### Licao
- em payloads aninhados da Pacifica, campo opcional nao deve ser inventado ou adaptado livremente
- se a doc pedir UUID, use UUID puro ou omita o campo

## 2026-04-11 - `TP/SL` calculado pelo preco do sinal em vez do `entryPrice` real

### Sintoma
- em alguns trades `long`, a UI passava a mostrar:
  - `stop loss > entry`
  - ou `take profit < entry`
- a Pacifica podia aceitar apenas parte da protecao

### Causa mapeada
- o plano de risco era calculado a partir do preco de referencia do sinal
- a ordem real podia entrar com slippage e ser executada em outro `entryPrice`
- isso deixava `TP/SL` valido para o sinal, mas invalido para a posicao real aberta

### Evidencia
- `SignalDecision.entryReferencePrice` e `OpenTrade.entryPrice` divergiam no banco
- os mesmos `stopLossPrice` e `takeProfitPrice` eram persistidos mesmo com `entryPrice` real diferente

### Correcao aplicada
- a abertura voltou a sair sem `TP/SL` embutido
- o worker passou a esperar a posicao aparecer em `/positions`
- o worker passou a recalcular a protecao com base no `entryPrice` real da exchange
- depois disso, a protecao e aplicada por `set_position_tpsl`

### Arquivos envolvidos
- [apps/worker/src/application/createOperationalWorker.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/worker/src/application/createOperationalWorker.ts)
- [packages/pacifica-trading/src/index.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/pacifica-trading/src/index.ts)
- [packages/preset-engine/src/index.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/preset-engine/src/index.ts)

### Licao
- `TP/SL` precisa nascer do `entryPrice` real que a exchange executou, nao apenas do preco teorico do sinal

## 2026-04-11 - Close manual repetido enquanto o trade ja estava em `waiting`

### Sintoma
- clique repetido de `Close trade` podia gerar novo `manual close`
- o worker podia receber tentativa redundante e bater em `422`

### Causa mapeada
- a UI ainda deixava `Close trade` e `Close selected trade` ativos enquanto o trade ja estava em `waiting` / `closing`

### Correcao aplicada
- os botoes de close passaram a ficar desabilitados enquanto o trade nao estiver `open`

### Arquivos envolvidos
- [apps/app/src/ui/pages/TradesPage.tsx](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/app/src/ui/pages/TradesPage.tsx)

### Licao
- a UI precisa refletir o lifecycle real do comando operacional para nao incentivar reenvio desnecessario

## 2026-04-11 - `Account PnL` da conta ficando em `+$0.00` por normalizacao frouxa do snapshot Pacifica

### Sintoma
- o card `Account PnL` no Dashboard podia ficar travado em `+$0.00`
- o problema podia coexistir com saldo total correto e conta operacional ativa
- o mesmo risco existia para `unrealizedPnl/currentPrice` de posicoes quando o payload viesse com chaves alternativas

### Causa mapeada
- a normalizacao do saldo da Pacifica aceitava `pnl` como campo generico cedo demais
- em payloads onde `pnl = 0`, mas existia um campo mais especifico como `floating_pnl`, o parser podia priorizar o valor errado
- o gateway tambem estava estreito demais para variações de chave em camelCase e aliases comuns da Pacifica

### Evidencia
- o parser antigo priorizava:
  - `unrealized_pnl`
  - `unrealised_pnl`
  - `pnl`
  - `account_unrealized_pnl`
  - `account_unrealised_pnl`
- isso permitia que `pnl = 0` mascarasse um `floating_pnl` valido
- o endurecimento do parser com fixture cobrindo:
  - `accountEquity`
  - `walletBalance`
  - `freeCollateral`
  - `totalMarginUsed`
  - `pnl = 0`
  - `floating_pnl = 10.50`
  passou a retornar `aggregatedPnl = 10.5`

### Correcao aplicada
- o gateway passou a priorizar campos especificos de `PnL` antes do `pnl` generico
- o parser passou a aceitar variantes adicionais em camelCase e aliases equivalentes para:
  - saldo total
  - saldo disponivel
  - PnL agregado
  - capital em uso
  - `currentPrice`
  - `unrealizedPnl`
- foram adicionados testes automatizados cobrindo:
  - `aggregatedPnl` com prioridade correta
  - `currentPrice` e `unrealizedPnl` de posicoes com chaves alternativas

### Arquivos envolvidos
- [apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts)
- [apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.test.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.test.ts)

### Licao
- payload da Pacifica nao deve ser normalizado assumindo um unico naming estável
- campos genericos como `pnl` nao podem ter precedencia sobre campos mais especificos de conta

## 2026-04-11 - `History` marcando `Closed by system` apos remocao do `client_order_id` interno de TP/SL

### Sintoma
- trades fechados por `take profit` ou `stop loss` podiam aparecer no historico como `Closed by system`
- registros antigos podiam continuar misturados entre `Closed by stop` e `Closed by system`

### Causa mapeada
- a inferencia de `closeReason` no backend dependia de `clientOrderId` com sufixos:
  - `:tp`
  - `:sl`
- essa heuristica ficou fragil depois da correcao onde os `client_order_id` internos de `take_profit` e `stop_loss` foram removidos para satisfazer o contrato da Pacifica
- com isso, a inferencia perdia o sinal legado e caia no fallback `system`

### Evidencia
- `findMatchingExternalCloseEvent()` inferia:
  - `take_profit` se `clientOrderId.endsWith(":tp")`
  - `stop_loss` se `clientOrderId.endsWith(":sl")`
  - `system` caso contrario
- o snapshot da Pacifica ja normalizava `recentTradeHistory` com campo `cause`
- depois da remocao dos `client_order_id` internos, a heuristica antiga passou a ter menos informação e ficava inclinada ao fallback

### Correcao aplicada
- a inferencia de `closeReason` passou a priorizar `cause` vindo da Pacifica
- o fallback legado por `clientOrderId` com `:tp` / `:sl` foi mantido para compatibilidade com historico antigo ou eventos legados
- foram adicionados testes automatizados cobrindo:
  - `take profit` por `cause`
  - `stop loss` por `cause`
  - fallback legado por `clientOrderId`
  - fallback final para `system`

### Arquivos envolvidos
- [apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts)
- [apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.test.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.test.ts)

### Licao
- heuristica de fechamento nao pode depender apenas de convention interna de `client_order_id`
- quando a exchange expuser um motivo semantico como `cause`, esse campo deve ser a fonte canonica da inferencia
