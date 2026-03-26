# FM-002 Design Tecnico

## Objetivo
Definir o desenho tecnico minimo para substituir a validacao local da `Agent Wallet` por validacao real mediada pelo backend, sem expor segredo no frontend.

## Referencias

### Fontes Primarias
- Pacifica API overview: https://docs.pacifica.fi/api-documentation/api
- Pacifica Agent Wallets: https://docs.pacifica.fi/api-documentation/api/signing/api-agent-keys
- Pacifica Signing Implementation: https://docs.pacifica.fi/api-documentation/api/signing/implementation
- Pacifica Rate Limits: https://docs.pacifica.fi/api-documentation/api/rate-limits
- Pacifica Builder Program: https://docs.pacifica.fi/builder-program

### Contexto Interno
- [PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md](./PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md)
- [PACIFICA_AGENT_WALLET_FLOW.pt-BR.md](./PACIFICA_AGENT_WALLET_FLOW.pt-BR.md)
- [PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md](./PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md)
- [SECRETS_AND_ENVIRONMENTS.pt-BR.md](./SECRETS_AND_ENVIRONMENTS.pt-BR.md)
- [schema.prisma](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/database/prisma/schema.prisma)
- [index.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/packages/contracts/src/index.ts)
- POC anterior: [pacifica-client.ts](/home/alxdfm/Projects/callydus/trading-bot-pacifica/deprecated/bot/src/integrations/pacifica-client.ts#L272)

## Escopo Fechado do FM-002
- receber credenciais Pacifica no backend
- validar por chamada autenticada real
- cifrar a private key da `Agent Wallet`
- persistir status e referencias seguras
- devolver resultado coerente com o contrato do app

## Fora de Escopo
- ativacao real de preset
- runtime real do bot
- read models completos de dashboard, history e trades
- KMS de producao

## Mudanca de Direcao
O desenho inicial do `FM-002` tentou reutilizar `approve_builder_code` como validacao da `Agent Wallet`.

Depois dos testes reais de integracao, essa direcao mudou.

Evidencia:
- com assinatura pela `Agent Wallet`, o endpoint `approve_builder_code` retornou `Verification failed`
- com assinatura pela chave da conta principal, o mesmo endpoint respondeu `200`

Decisao atual:
- `builder approval` continua obrigatorio antes de operar
- mas ele deixa de ser usado como prova de validade da `Agent Wallet`
- `builder approval` passa a ser tratado como autorizacao separada da conta
- a validacao da `Agent Wallet` continua sendo responsabilidade propria do backend e precisa de criterio tecnico separado

## Decisoes Tecnicas Recomendadas

### 1. O frontend nao valida credencial alem do minimo de UX
O app pode continuar validando:
- campo vazio
- formato invalido
- wallet principal nao conectada

Mas a validacao definitiva passa a ser do backend.

### 2. "Credencial valida" nao e mais definida pelo approval do builder code
Nao usar apenas parse de `base58`.

Fluxo recomendado:
1. frontend envia `mainWalletPublicKey`, `agentWalletPublicKey` e `agentWalletPrivateKey`
2. API cifra a private key da `Agent Wallet`
3. API valida coerencia minima entre `account`, `agent_wallet` e keypair
4. API persiste a credencial de forma segura
5. o gate de `builder approval` e tratado separadamente no onboarding

Critero:
- sucesso de parse, coerencia da keypair e persistencia segura = credencial pronta para uso backend
- `builder approval` continua obrigatorio, mas nao define sozinho a validade da `Agent Wallet`

Observacao de implementacao:
- o backend nao deve pedir nem armazenar a private key principal da wallet do usuario
- por isso, qualquer approval de conta que exija assinatura da wallet principal deve acontecer no frontend com a wallet conectada

### 3. Tratar o builder approval como gate separado e explicito
Recomendacao:
- modelar `builder approval` como etapa propria do onboarding
- executar essa etapa via assinatura da wallet principal no frontend
- considerar a conta apta a operar somente apos esse approval ter sido confirmado pela Pacifica

Motivo:
- o builder code continua sendo obrigatorio para operar
- os testes atuais indicam que esse endpoint e `account-level`
- isso evita pedir private key principal ao usuario

Observacao:
- isso faz sentido porque, no produto atual, o usuario sempre precisa aprovar o builder code antes de operar
- essa escolha se apoia em fonte primaria da Pacifica para o Builder Program e na evidencia pratica obtida no teste do endpoint

## Design de API Proposto

### Endpoint
`POST /api/onboarding/credentials/validate`

### Request
```json
{
  "mainWalletPublicKey": "string",
  "agentWalletPublicKey": "string",
  "agentWalletPrivateKey": "base58 string"
}
```

### Response de sucesso
```json
{
  "credentialId": "uuid",
  "validationStatus": "valid",
  "validatedAt": "2026-03-25T12:00:00.000Z"
}
```

### Response de falha
```json
{
  "validationStatus": "invalid",
  "errorCode": "agent_wallet_mismatch"
}
```

## Mapeamento de Erros Recomendado
- `wallet_not_connected`: frontend nao enviou wallet principal valida
- `invalid_agent_wallet_format`: parse base58 falhou
- `invalid_agent_wallet_secret`: secret key nao gera keypair consistente
- `account_not_found`: conta da Pacifica nao encontrada ou nao acessivel
- `agent_wallet_mismatch`: assinatura valida, mas Agent Wallet nao corresponde ao contexto esperado
- `builder_approval_rejected`: Pacifica rejeitou o approval do builder code
- `builder_fee_limit_too_low`: `max_fee_rate` inferior ao necessario para o builder configurado
- `validation_rejected`: Pacifica rejeitou a chamada autenticada
- `provider_unavailable`: erro de rede ou indisponibilidade da Pacifica
- `rate_limited`: limite da Pacifica atingido
- `internal_error`: falha interna nossa

## Persistencia Recomendada

### OperatorAccount
Garantir existencia ou upsert por `walletAddress`.

### PacificaCredential
Persistir:
- `operatorAccountId`
- `publicKey`
- `encryptedPrivateKeyRef`
- `keyFingerprint`
- `validationStatus`
- `lastValidatedAt`
- `lastValidationErrorCode`

Regra de troca de credencial:
- a credencial atualmente ativa so pode ser substituida apos nova validacao bem-sucedida
- se a nova credencial falhar na validacao da `Agent Wallet`, manter a credencial antiga ativa e nao persistir a nova como valida

Nao persistir:
- private key em texto puro
- segredo devolvido ao frontend

## Cifragem Recomendada

### MVP funcional
Implementar:
- `AES-256-GCM`
- chave mestre vinda de `CREDENTIAL_ENCRYPTION_KEY`
- `CREDENTIAL_ENCRYPTION_KEY_ID` persistido junto ao registro

Salvar no banco ou blob seguro:
- ciphertext
- iv
- authTag
- keyId

### Evolucao futura
Trocar a chave local por KMS/envelope encryption sem quebrar o contrato externo.

## Idempotencia Minima
Mesmo no FM-002, a validacao precisa evitar duplicacao boba.

Recomendacao:
- se existir credencial valida para o mesmo `operatorAccountId + publicKey + keyFingerprint`, reaproveitar o registro
- se a mesma credencial estiver em `validating`, devolver estado existente em vez de duplicar
- se o usuario tentar trocar de `Agent Wallet`, tratar como fluxo de substituicao atomica: validar primeiro, promover depois

## Fronteiras por Camada

### App
- coleta wallet principal
- aprova o builder code com assinatura da wallet principal
- coleta Agent Wallet
- envia ao backend
- renderiza loading/sucesso/erro

### API
- valida formato minimo
- cifra segredo
- valida coerencia da `Agent Wallet`
- persiste status e metadados
- responde no contrato do app

### Worker
- fora do caminho critico do FM-002
- consumira essa credencial depois, quando runtime real entrar

## Sequencia de Implementacao Recomendada
1. criar schemas compartilhados de request/response no `packages/contracts`
2. criar `PacificaCredentialsService` na API
3. criar `CredentialEncryptionService`
4. criar criterio backend de validacao da `Agent Wallet`
5. criar `POST /api/onboarding/credentials/validate`
6. trocar o onboarding do app para usar esse endpoint
7. persistir `credentialId` e `validationStatus` reais
8. implementar o passo separado de `builder approval` no frontend

## Politica Operacional de Revalidacao
- se o usuario ja possui credencial ativa e builder aprovado, nao precisa repetir o onboarding a cada acesso
- se o usuario quiser trocar a `Agent Wallet`, deve passar novamente pelo fluxo completo de validacao
- se a nova credencial nao for aprovada, a credencial antiga permanece ativa

## Hipoteses Ainda em Validacao
- os dados submetidos podem estar incorretos ou inconsistentes entre `account`, `agent_wallet` e private key
- a Pacifica pode responder de forma diferente quando o `builder code` ja estiver previamente aprovado para a conta
- ainda precisamos definir qual sera o criterio tecnico definitivo de validacao backend da `Agent Wallet`
- a documentacao atual da Pacifica nao expoe endpoint neutro de `check` para `Agent Wallet`; isso reforca a necessidade de separar `validated` de `operationally_verified`

## Estrutura Tecnica Recomendada na API
- `domain/pacifica-credential`
- `application/validate-pacifica-credentials`
- `infrastructure/pacifica`
- `infrastructure/crypto`
- `infrastructure/persistence`
- `ui/http`

## Riscos Conhecidos
- o comportamento exato de `approve_builder_code` quando o builder ja esta aprovado ainda precisa ser validado em teste real
- o formato canonico de assinatura aceito pela Pacifica ainda nao esta fechado de forma definitiva nos endpoints assinados
- sem rate limiting nosso, uma UI insistente pode pressionar a quota da Pacifica
- a private key so pode existir em memoria pelo menor tempo possivel

## Modo Diagnostico Local
Para investigacao tecnica local, a API pode receber `PACIFICA_ACCOUNT_PRIVATE_KEY` por env e usar essa chave apenas como override temporario da assinatura do approval do builder code.

Regras:
- usar somente em teste local
- nao hardcodar segredo em codigo
- nao tratar esse modo como fluxo definitivo do produto

## Decisao Recomendada para Seguir
- separar `builder approval` e `Agent Wallet validation`
- tratar `builder approval` como assinatura da wallet principal no frontend
- cifrar a private key antes de persistir
- tratar o backend como unica fonte de verdade da validacao

## Atualizacao de Implementacao
- o onboarding do app ja possui passo explicito de `builder approval`
- o frontend monta o payload `approve_builder_code`, assina com a wallet principal e envia a assinatura para a API
- a API faz o forward do approval para a Pacifica
- a validacao backend da `Agent Wallet` foi reduzida ao gate proprio da credencial e nao reutiliza mais `approve_builder_code`
