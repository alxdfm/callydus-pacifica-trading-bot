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
