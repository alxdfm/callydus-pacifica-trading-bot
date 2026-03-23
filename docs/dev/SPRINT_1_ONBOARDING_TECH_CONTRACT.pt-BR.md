# Sprint 1: Contrato Tecnico de Onboarding

## Objetivo
Congelar as decisoes tecnicas de dev que destravam a implementacao funcional do onboarding da Sprint 1 sem reabrir o escopo do MVP.

## Status
- decisao: `FECHADO_POR_DEV`
- data: `2026-03-22`
- escopo: `wallet Solana`, `persistencia minima de sessao` e `contrato de validacao Pacifica via Agent Wallet`

## 1. Wallet Solana

### Decisao
A implementacao da Sprint 1 deve usar um adapter proprio de app (`SolanaWalletPort`) com implementacao concreta inicial baseada em `@solana/wallet-adapter`.

Escolha operacional do MVP:
- biblioteca base: `@solana/wallet-adapter-react`
- modal/adapters: `@solana/wallet-adapter-wallets`
- wallet obrigatoria para aceite da Sprint 1: `Phantom`
- outras wallets podem ser adicionadas depois sem alterar o contrato interno do app

### Motivo
- e o caminho mais padrao no ecossistema Solana para SPA React
- reduz risco de integracao artesanal com providers diferentes
- permite manter o app desacoplado do provider concreto por meio do port interno
- preserva espaco para trocar modal ou carteira depois sem retrabalho estrutural

### Regra de carregamento
- a stack Solana nao deve subir no bootstrap global do app
- `SolanaWalletEnvironment` e `SolanaWalletStateBridge` devem carregar apenas no fluxo de onboarding
- o contrato interno `SolanaWalletPort` continua sendo a borda estavel para permitir novas wallets depois

### Contrato interno minimo
O app deve trabalhar com estes estados:
- `disconnected`
- `reconnecting`
- `connected`
- `error`

Dados minimos expostos ao onboarding:
- `provider`: nome do provider selecionado
- `mainWalletPublicKey`: public key da wallet principal conectada
- `sessionStatus`: status atual da sessao de wallet
- `lastConnectedAt`: timestamp local da ultima conexao bem-sucedida
- `errorCode`: codigo curto opcional para UI e telemetria minima

## 2. Persistencia Minima da Sessao

### Decisao
A Sprint 1 deve persistir apenas estado minimo de UX no cliente.

Pode persistir:
- `selectedWalletProvider`
- `lastConnectedMainWalletPublicKey`
- `lastConnectedAt`

Nao pode persistir como prova de autenticacao:
- status final de onboarding como se fosse confiavel por si so
- liberacao do dashboard sem revalidar a sessao de wallet atual
- qualquer segredo sensivel

### Regra de reidratacao
Ao recarregar a pagina:
1. o app le o provider previamente selecionado
2. tenta `autoConnect` se o provider suportar
3. marca o estado como `reconnecting` durante a tentativa
4. so considera a etapa de wallet valida quando o provider reportar `connected` na sessao atual
5. se a reconexao falhar, volta para `disconnected` sem liberar o produto

## 3. Comportamento de Erro da Wallet

### Codigos esperados
- `wallet_provider_missing`: wallet obrigatoria nao instalada
- `wallet_connection_rejected`: usuario recusou a conexao
- `wallet_connection_failed`: falha generica de conexao
- `wallet_session_lost`: provider perdeu a sessao
- `wallet_unsupported`: wallet fora do escopo aceito no MVP

### Regra de UX
- erros de rejeicao ou ausencia de provider permitem retry imediato
- perda de sessao volta o onboarding para etapa pendente de wallet
- nenhum erro de wallet pode destravar a etapa seguinte

## 4. Contrato Pacifica para Sprint 1

### Decisao
A Sprint 1 nao deve usar `API key + secret` como contrato de onboarding.

O contrato funcional de dev fica alinhado ao fluxo de `Agent Wallet`:
- `mainWalletPublicKey`: vem da wallet conectada e e readonly no formulario
- `agentWalletPublicKey`: informado ou derivado do fluxo de Agent Wallet
- `agentWalletPrivateKey`: segredo operacional enviado apenas no submit inicial para validacao e armazenamento criptografado
- `credentialAlias`: opcional, apenas para identificacao amigavel futura

### Regra de seguranca
- a private key principal do usuario nunca entra no formulario
- a private key do `Agent Wallet` pode ser recebida no submit inicial, mas nunca deve voltar ao browser depois disso
- backend e worker so devem persistir referencia criptografada e fingerprint do `Agent Wallet`

## 5. Acao que Dispara a Validacao

### Decisao
A validacao deve acontecer por acao explicita do usuario no CTA final da etapa de credenciais.

Acao:
- botao: `Validate and Continue`

Pre-condicoes:
- wallet principal conectada
- `agentWalletPublicKey` preenchida
- `agentWalletPrivateKey` preenchida

## 6. Payload Tecnico da Validacao

### Request
```json
{
  "mainWalletPublicKey": "<solana-public-key>",
  "agentWalletPublicKey": "<solana-public-key>",
  "agentWalletPrivateKey": "<agent-wallet-secret>",
  "credentialAlias": "Trading Bot Wallet"
}
```

### Success response
```json
{
  "status": "valid",
  "credentialId": "<uuid>",
  "mainWalletPublicKey": "<solana-public-key>",
  "agentWalletPublicKey": "<solana-public-key>",
  "keyFingerprint": "abcd1234",
  "validationStatus": "valid",
  "validatedAt": "2026-03-22T12:00:00.000Z",
  "canProceed": true
}
```

### Error response
```json
{
  "status": "invalid",
  "code": "agent_wallet_mismatch",
  "message": "Agent wallet could not be validated for this account.",
  "retryable": false,
  "field": "agentWalletPublicKey",
  "canProceed": false
}
```

## 7. Codigos de Erro Pacifica
- `wallet_not_connected`
- `invalid_agent_wallet_format`
- `invalid_agent_wallet_secret`
- `account_not_found`
- `agent_wallet_mismatch`
- `validation_rejected`
- `provider_unavailable`
- `rate_limited`
- `internal_error`

## 8. Regra de Retry versus Falha Bloqueante

### Retry permitido sem editar campos
- `provider_unavailable`
- `rate_limited`
- `internal_error`

### Edicao obrigatoria antes de nova tentativa
- `invalid_agent_wallet_format`
- `invalid_agent_wallet_secret`
- `account_not_found`
- `agent_wallet_mismatch`
- `validation_rejected`

### Regra de produto aplicada por dev
- qualquer resposta diferente de `valid` mantem o produto bloqueado
- somente `status: valid` com `canProceed: true` libera dashboard

## 9. Impacto direto nas Tasks
- `V1.4`: pode ser implementada sem dependencia aberta de provider
- `V1.5`: deve usar formulario de `Agent Wallet`, nao `API key + secret`
- `V1.6`: pode integrar contra este contrato de request/response como fronteira estavel

## 10. Referencias
- [PACIFICA_AGENT_WALLET_FLOW.pt-BR.md](./PACIFICA_AGENT_WALLET_FLOW.pt-BR.md)
- [ARCHITECTURE_FOUNDATION.pt-BR.md](./ARCHITECTURE_FOUNDATION.pt-BR.md)
