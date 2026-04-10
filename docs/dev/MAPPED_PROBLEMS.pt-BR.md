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
