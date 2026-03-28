# Revisao de Codigo de Onboarding e Profile

## Objetivo
Registrar a revisao tecnica do fluxo de onboarding e do fluxo de manutencao de credencial no profile, com foco em bugs, duplicacao de regra, reutilizacao, performance e escalabilidade.

## Escopo Revisado
- `apps/app/src/ui/pages/OnboardingPage.tsx`
- `apps/app/src/ui/pages/ProfilePage.tsx`
- `apps/app/src/features/profile/use-agent-wallet-replacement-flow.ts`
- `apps/app/src/features/wallet/solana/SolanaWalletStateBridge.tsx`
- `apps/app/src/features/onboarding/backend-builder-approval.ts`
- `apps/app/src/features/onboarding/backend-credential-validation.ts`
- `apps/app/src/features/onboarding/backend-operational-verification.ts`
- `apps/app/src/features/onboarding/backend-operational-account-lookup.ts`
- `apps/app/src/state/app-state.tsx`

## Conclusao Executiva
- O fluxo atual esta coerente no nivel funcional geral.
- Parte dos achados originais desta revisao ja foi corrigida no mesmo dia, especialmente em clientes HTTP e no fluxo de replacement do profile.
- O principal residual agora deixou de ser bug funcional imediato e passou a ser divida estrutural de consolidacao entre onboarding e profile.
- A base esta operavel, mas ainda precisa de consolidacao para escalar sem drift entre onboarding e profile.

## Findings

### 1. Alta: substituicao de Agent Wallet no profile pode deixar `agentWalletPrivateKey` antigo no estado global
O estado global ainda modela `agentWalletPrivateKey` como parte de `CredentialState`.

Trechos observados:
- `apps/app/src/state/app-state.tsx`
- `apps/app/src/ui/pages/OnboardingPage.tsx`
- `apps/app/src/features/profile/use-agent-wallet-replacement-flow.ts`

Leitura atual:
- o onboarding grava `agentWalletPrivateKey` no store em `updateCredentialField`
- o fluxo de replacement no profile atualiza `agentWalletPublicKey`, `credentialId`, `keyFingerprint` e `credentialAlias`, mas nao atualiza nem limpa `agentWalletPrivateKey`
- isso significa que o app pode terminar com chave publica nova e segredo antigo coexistindo no estado em memoria

Impacto:
- estado inconsistente para qualquer fluxo futuro que leia `state.credentials.agentWalletPrivateKey`
- risco de bug silencioso em manutencoes futuras, porque o store aparenta representar a credencial ativa inteira, mas fica parcialmente desatualizado
- risco adicional por manter segredo antigo em memoria mesmo apos a troca logica da credencial

Recomendacao:
- decidir explicitamente se `agentWalletPrivateKey` deve existir no estado global
- se a resposta for sim, o replacement precisa atualizar ou limpar esse campo de forma canonica
- se a resposta for nao, a chave privada deve sair do store compartilhado e ficar restrita ao draft local de onboarding/profile

Status em `2026-03-28`:
- parcialmente corrigido
- a chave privada deixou de ser persistida em `localStorage`
- o fluxo de replacement no profile passou a limpar `agentWalletPrivateKey` no estado global ao concluir a substituicao
- ainda existe divida arquitetural porque o onboarding continua modelando esse campo no store em memoria

### 2. Media: os clientes frontend de onboarding tratam respostas inesperadas de forma inconsistente e ainda mascaram erros reais
O cliente de `builder approval` ja ganhou parse tolerante, mas os clientes de validacao de credencial, verificacao operacional e account lookup continuam usando `response.json()` direto.

Trechos observados:
- `apps/app/src/features/onboarding/backend-builder-approval.ts`
- `apps/app/src/features/onboarding/backend-credential-validation.ts`
- `apps/app/src/features/onboarding/backend-operational-verification.ts`
- `apps/app/src/features/onboarding/backend-operational-account-lookup.ts`

Leitura atual:
- um endpoint usa parse defensivo de resposta
- os outros tres assumem sempre JSON valido
- qualquer corpo vazio, texto puro, HTML ou payload invalido cai em `catch` e vira indisponibilidade do provider

Impacto:
- classificacao incorreta de erros
- diagnostico operacional pior
- comportamento desigual entre clientes com responsabilidade praticamente identica

Recomendacao:
- extrair um helper compartilhado para chamadas HTTP de onboarding
- padronizar parse tolerante, validacao do schema e fallback por tipo de falha

Status em `2026-03-28`:
- corrigido
- os clientes de `builder approval`, `credential validation`, `operational verification` e `account lookup` passaram a usar helper compartilhado com parse tolerante e fallback explicito para `internal_error` ou `provider_unavailable`

### 3. Media: a regra de validacao e persistencia de credencial esta duplicada entre onboarding e profile
O onboarding e o profile reimplementam a mesma semantica de validacao da Agent Wallet em camadas diferentes.

Trechos observados:
- `apps/app/src/ui/pages/OnboardingPage.tsx`
- `apps/app/src/features/profile/use-agent-wallet-replacement-flow.ts`

Leitura atual:
- ambos validam campos obrigatorios
- ambos chamam os mesmos endpoints backend
- ambos mapeiam respostas de validacao e verificacao para atualizacao de estado
- ambos definem mensagens, resets e transicoes de status com implementacoes paralelas

Impacto:
- custo alto para manter consistencia entre os dois fluxos
- qualquer ajuste de contrato ou de UX precisa ser lembrado em mais de um lugar
- drift entre onboarding e profile tende a reaparecer com facilidade

Recomendacao:
- extrair um modulo/hook compartilhado para a maquina de estados de `credential validation + operational verification`
- deixar onboarding e profile responsaveis apenas por composicao de UI e regras realmente especificas do contexto

Status em `2026-03-28`:
- ainda faz sentido
- o `Profile` melhorou ao extrair parte da orquestracao para hook proprio, mas onboarding e profile continuam com semantica parcialmente paralela

### 4. Media: `OnboardingPage.tsx` concentra excesso de responsabilidade e ja virou ponto de manutencao caro
O componente mistura:
- derivacao de labels e badges
- navegacao entre passos
- regras de desbloqueio
- resets de estado
- chamadas async
- parse de respostas
- renderizacao de todos os passos

Trecho observado:
- `apps/app/src/ui/pages/OnboardingPage.tsx`

Impacto:
- leitura lenta
- teste mais dificil
- maior chance de regressao ao tocar qualquer passo do fluxo
- reuso quase impossivel sem copiar logica

Recomendacao:
- quebrar por passo ou por dominio
- mover handlers e transicoes para hooks dedicados
- centralizar helpers de reset/transicao num modulo de fluxo

Status em `2026-03-28`:
- ainda faz sentido
- nenhuma refatoracao estrutural foi aplicada nesta revisao complementar

### 5. Baixa: existem sinais de redundancia e micro-otimizacoes sem ganho real no profile
Trechos observados:
- `apps/app/src/ui/pages/ProfilePage.tsx`

Leitura atual:
- `readonlyAgentWalletKey` usa `useMemo`, mas so devolve a string original ou `""`
- status e tone da Agent Wallet sao calculados com ternarios encadeados grandes
- o botao `Stop bot` usa texto hardcoded em ingles enquanto o restante da tela usa i18n

Impacto:
- nao e um bug critico
- mas aumenta ruído visual, reduz consistencia e complica evolucao da tela

Recomendacao:
- remover `useMemo` sem ganho
- extrair mapeadores pequenos para status/tone
- internacionalizar o label do botao

Status em `2026-03-28`:
- corrigido
- `useMemo` redundante foi removido
- o badge de status passou a usar um mapeador pequeno
- o botao `Stop bot` passou a usar i18n

## Gaps de Teste
- nao encontrei testes automatizados cobrindo o fluxo de onboarding
- nao encontrei testes automatizados cobrindo o flow de replacement no profile
- faltam testes de contrato para consistencia entre onboarding e profile nas mesmas respostas backend
- falta teste especifico para garantir que troca de Agent Wallet nao deixa segredo antigo no estado ativo

## Proximo Passo Recomendado
- validar primeiro o finding de alta prioridade sobre `agentWalletPrivateKey` no estado global
- depois consolidar os clientes HTTP de onboarding em um helper compartilhado
- por fim, extrair a maquina de estados compartilhada de validacao/verificacao para reduzir duplicacao entre onboarding e profile

## Status
- documento criado em `2026-03-28`
- revisao complementar aplicada em `2026-03-28`
- findings `2` e `5` corrigidos
- finding `1` parcialmente mitigado
- findings `3` e `4` permanecem como divida estrutural
