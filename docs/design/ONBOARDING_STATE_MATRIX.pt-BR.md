# Matriz de Estados do Onboarding

## Objetivo
Consolidar os estados visuais e a microcopy operacional minima do onboarding da Sprint 1 para reduzir adivinhacao de dev e QA.

## Escopo
Este artefato cobre os estados criticos formais da Sprint 1 para o onboarding.

Inclui:
- wallet Solana
- `Agent Wallet`

Nao inclui ainda:
- catalogo completo de chaves de i18n do onboarding

## Wallet Solana

| Estado visual | Quando aparece | Sinal visual principal | Acao principal | Microcopy curta |
|---|---|---|---|---|
| `Not connected` | estado inicial ou apos perda de sessao | badge neutra, card sem destaque de sucesso | `Connect wallet` | `Connect Phantom to continue.` |
| `Connecting` | usuario iniciou conexao ou app tenta reconectar sessao | badge informativa, indicador de loading visivel | sem acao primaria extra | `Connecting to Phantom...` |
| `Connected` | wallet ativa e public key disponivel na sessao atual | badge de sucesso, card com destaque positivo moderado | `Change wallet` | `Wallet connected and ready.` |
| `Error` | conexao falhou, foi recusada ou provider nao esta disponivel | badge de erro, mensagem curta proxima do card | `Try again` | `Could not connect wallet.` |

## Agent Wallet

| Estado visual | Quando aparece | Sinal visual principal | Acao principal | Microcopy curta |
|---|---|---|---|---|
| `Empty` | wallet conectada, mas campos obrigatorios ainda nao preenchidos | campos vazios, CTA desabilitado, status neutro | preencher formulario | `Enter your Agent Wallet details.` |
| `Filled` | campos obrigatorios preenchidos, antes da validacao | campos completos, CTA habilitado, sem badge de sucesso | `Validate and Continue` | `Ready to validate Agent Wallet.` |
| `Validating` | usuario iniciou a validacao | CTA em loading, feedback informativo visivel | sem acao primaria extra | `Validating Agent Wallet...` |
| `Valid` | validacao concluida com sucesso | badge de sucesso, confirmacao clara no bloco e no painel de conta | `Continue to dashboard` | `Agent Wallet verified.` |
| `Invalid` | validacao falhou e produto segue bloqueado | badge de erro, mensagem proxima do campo ou do bloco relacionado | corrigir campo ou tentar novamente | `Agent Wallet could not be verified.` |

## Regras de Interpretacao
- `reconnecting` deve reutilizar o mesmo tratamento visual de `Connecting`
- `Connected` e `Error` nao podem depender apenas de cor; precisam de label clara
- loading deve parecer transitorio, nunca estado travado
- a wallet aceita na Sprint 1 e `Phantom`
- nenhum estado de wallet libera o produto sem validacao bem-sucedida de `Agent Wallet`
- `mainWalletPublicKey` deve parecer dado herdado da wallet conectada, nunca campo editavel
- `agentWalletPrivateKey` precisa de helper text explicito para evitar confusao com a wallet principal
- `Invalid` deve separar falha transitoria de erro que exige edicao antes de nova tentativa

## Observacoes Para QA
- validar se `Connecting` e percebido como tentativa em andamento, nao como travamento
- validar se `Error` aparece proximo do bloco da wallet
- validar se `Connected` exibe a wallet correta e mantem clareza do proximo passo
- validar se o onboarding volta para estado pendente de wallet quando a sessao e perdida
- validar se `Empty` e `Filled` sao distinguiveis sem depender de texto longo
- validar se `Validating` nao compete visualmente com estado de erro
- validar se `Valid` desbloqueia o CTA final sem ambiguidade
- validar se `Invalid` mantem o produto bloqueado e aponta o proximo passo com clareza

## Microcopy Principal

| Grupo | Contexto | Mensagem base | Tom esperado |
|---|---|---|---|
| `loading.wallet.connecting` | conexao inicial ou reconexao em andamento | `Connecting to Phantom...` | curta, informativa |
| `loading.agent_wallet.validating` | validacao de `Agent Wallet` em andamento | `Validating Agent Wallet...` | curta, informativa |
| `success.wallet.connected` | wallet conectada com sucesso | `Wallet connected and ready.` | curta, confirmatoria |
| `success.agent_wallet.valid` | `Agent Wallet` validada | `Agent Wallet verified.` | curta, confirmatoria |
| `error.wallet.generic` | falha de conexao de wallet | `Could not connect wallet.` | curta, acionavel |
| `error.agent_wallet.generic` | falha de validacao sem detalhe extra | `Agent Wallet could not be verified.` | curta, acionavel |
| `error.agent_wallet.edit_required` | erro que exige ajuste de campo | `Review your Agent Wallet details and try again.` | curta, acionavel |
| `error.agent_wallet.retry_allowed` | falha transitoria com retry permitido | `Validation is temporarily unavailable. Try again.` | curta, acionavel |
| `blocked.dashboard.pending_wallet` | produto bloqueado por falta de wallet valida | `Connect your wallet to continue.` | curta, diretiva |
| `blocked.dashboard.pending_agent_wallet` | produto bloqueado por falta de `Agent Wallet` valida | `Validate Agent Wallet to continue.` | curta, diretiva |
| `ready.account.unlocked` | conta pronta para prosseguir | `Account ready. You can continue.` | curta, confirmatoria |

## Regras de Microcopy
- manter frases curtas e diretamente acionaveis
- nao expor detalhes tecnicos do provider ou do backend no texto principal
- distinguir claramente `wallet` de `Agent Wallet`
- usar mensagens de bloqueio para indicar o proximo passo, nao apenas o problema
- erros transitórios e erros que exigem edicao devem ter mensagens diferentes
