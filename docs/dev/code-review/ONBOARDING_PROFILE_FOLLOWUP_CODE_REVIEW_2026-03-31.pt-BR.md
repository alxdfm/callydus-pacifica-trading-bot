# Revisao de Codigo do Follow-up de Onboarding e Profile

## Objetivo
Registrar a revisao tecnica das implementacoes feitas depois da revisao `ONBOARDING_PROFILE`, com foco no que foi corrigido, no que ainda permanece como risco e em regressões introduzidas pela nova refatoracao.

## Escopo Revisado
- `apps/app/src/features/onboarding/backend-response.ts`
- `apps/app/src/features/onboarding/backend-builder-approval.ts`
- `apps/app/src/features/onboarding/backend-credential-validation.ts`
- `apps/app/src/features/onboarding/backend-operational-verification.ts`
- `apps/app/src/features/onboarding/backend-operational-account-lookup.ts`
- `apps/app/src/features/account/apply-account-session.ts`
- `apps/app/src/features/account/backend-account-session.ts`
- `apps/app/src/features/profile/use-agent-wallet-replacement-flow.ts`
- `apps/app/src/features/runtime/backend-bot-commands.ts`
- `apps/app/src/features/wallet/solana/SolanaWalletStateBridge.tsx`
- `apps/app/src/ui/pages/ProfilePage.tsx`

## Conclusao Executiva
- As mudancas novas resolveram dois pontos importantes da revisao anterior: a inconsistência dos clientes HTTP de onboarding foi reduzida com `backend-response`, e o replacement flow agora limpa `agentWalletPrivateKey` no estado global.
- O follow-up identificou duas regressões funcionais ligadas a snapshot/hidratação de sessão e uma perda de type safety na camada de aplicação do snapshot.
- Esses três pontos foram tratados em seguida, sem reabrir refatoração estrutural maior.

## Pontos Resolvidos
- Os clientes de onboarding agora compartilham parse tolerante de resposta por `parseJsonResponse` e `parseSchemaOrFallback`.
- O replacement flow passou a limpar `agentWalletPrivateKey` ao promover a nova credencial para o estado global.
- O `ProfilePage` reduziu parte do ruído com a extração de `deriveAgentWalletBadgeState`.

## Findings

### 1. Alta: `SolanaWalletStateBridge` pode sobrescrever `onboardingStatus` vindo do snapshot backend com um status local simplificado
Trechos observados:
- `apps/app/src/features/account/apply-account-session.ts`
- `apps/app/src/features/wallet/solana/SolanaWalletStateBridge.tsx`

Leitura atual:
- `applyAccountSessionSnapshot` aplica `snapshot.onboardingStatus` diretamente no store
- logo depois, a primeira `useEffect` da bridge recalcula `status` usando apenas:
  - `credentials.validationStatus`
  - `operational.status`
  - conectividade da wallet
- esse recalculo ignora explicitamente estados mais ricos do contrato, como `blocked`

Impacto:
- um estado de onboarding derivado do backend pode ser perdido logo apos a hidratacao
- a UI passa a refletir uma heuristica local em vez do contrato canonico recebido
- isso pode reabrir drift entre backend e frontend no exato ponto que a nova `account session` tentava centralizar

Referencias:
- `apps/app/src/features/account/apply-account-session.ts:67`
- `apps/app/src/features/wallet/solana/SolanaWalletStateBridge.tsx:101`

Status do finding:
- resolvido em `2026-03-31`
- a bridge agora preserva o `onboardingStatus` canonico vindo do backend quando a wallet ja foi identificada como `existing_account`

### 2. Media: `handleStopBot` aplica o snapshot da sessao e logo em seguida sobrescreve `runtimeState`, ocultando erro ou estado real vindo do backend
Trechos observados:
- `apps/app/src/features/account/apply-account-session.ts`
- `apps/app/src/features/profile/use-agent-wallet-replacement-flow.ts`

Leitura atual:
- `applyAccountSessionSnapshot` popula `screenStatus` e `lastRuntimeMessage` com base no snapshot backend
- imediatamente depois, `handleStopBot` faz novo `setRuntimeState` com:
  - `screenStatus: "ready"`
  - `lastRuntimeMessage: commandResult.message`
- isso descarta o estado real recem-hidratado

Impacto:
- se o snapshot vier com erro de runtime ou mensagem importante, ela some
- o profile pode exibir sucesso local mesmo quando a sessao carregada sinaliza problema
- a refatoracao para centralizar snapshot perde autoridade no ultimo passo do fluxo

Referencias:
- `apps/app/src/features/account/apply-account-session.ts:52`
- `apps/app/src/features/profile/use-agent-wallet-replacement-flow.ts:186`

Status do finding:
- resolvido em `2026-03-31`
- o flow de `Pause bot` no replacement modal deixou de sobrescrever `runtimeState` depois de `applyAccountSessionSnapshot`

### 3. Baixa: o helper novo `applyAccountSessionSnapshot` perdeu type safety e aceita qualquer `Record<string, unknown>` nos setters
Trecho observado:
- `apps/app/src/features/account/apply-account-session.ts`

Leitura atual:
- a funcao usa assinaturas genericas demais para `setBuilderApprovalState`, `setCredentialState`, `setOperationalState`, `setPresetState`, `setRuntimeState` e `setOnboardingState`
- isso reduz a protecao de compilacao justamente no modulo que tenta centralizar transicao de estado

Impacto:
- erros de chave, shape ou tipo podem passar despercebidos em refactors futuros
- o ganho de reutilizacao vem com perda de confiabilidade estatica

Recomendacao:
- tipar as dependencias com os contratos reais dos setters do `useAppState`

Referencia:
- `apps/app/src/features/account/apply-account-session.ts:5`

Status do finding:
- resolvido em `2026-03-31`
- o helper passou a depender dos tipos reais de setter/estado do `useAppState`, em vez de `Record<string, unknown>`

## Recomendacoes
- preservar `snapshot.onboardingStatus` como fonte canonica quando o frontend hidratar sessao backend
- evitar sobrescrever `runtimeState` depois de `applyAccountSessionSnapshot`, ou mesclar apenas o que for realmente complementar
- reforcar tipagem do helper de snapshot usando os tipos reais do estado da app

## Status
- documento criado em `2026-03-31`
- alteracoes de codigo aplicadas em `2026-03-31` para tratar os findings 1, 2 e 3
