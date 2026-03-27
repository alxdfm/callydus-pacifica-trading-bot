# Matriz de Estados do Onboarding

## Objetivo
Consolidar os estados visuais e a microcopy operacional minima do onboarding da Sprint 1 para reduzir adivinhacao de dev e QA.

## Escopo
Este artefato cobre os estados criticos formais da Sprint 1 para o onboarding.

Inclui:
- wallet Solana
- `builder approval`
- `Agent Wallet`
- `operational verification`

Nao inclui ainda:
- catalogo completo de chaves de i18n do onboarding

## Wallet Solana

| Estado visual | Quando aparece | Sinal visual principal | Acao principal | Microcopy curta |
|---|---|---|---|---|
| `Not connected` | estado inicial ou apos perda de sessao | badge neutra, card sem destaque de sucesso | `Connect wallet` | `Connect Phantom to continue.` |
| `Connecting` | usuario iniciou conexao ou app tenta reconectar sessao | badge informativa, indicador de loading visivel | sem acao primaria extra | `Connecting to Phantom...` |
| `Connected` | wallet ativa e public key disponivel na sessao atual | badge de sucesso, card com destaque positivo moderado | `Change wallet` | `Wallet connected and ready.` |
| `Error` | conexao falhou, foi recusada ou provider nao esta disponivel | badge de erro, mensagem curta proxima do card | `Try again` | `Could not connect wallet.` |

## Builder Approval

| Estado visual | Quando aparece | Sinal visual principal | Acao principal | Microcopy curta |
|---|---|---|---|---|
| `Pending` | wallet conectada, mas a conta ainda nao autorizou o builder code | badge neutra, bloco explicativo abaixo da wallet | `Approve builder code` | `Approve the builder code with the connected wallet.` |
| `Approving` | usuario iniciou a assinatura e o backend aguarda confirmacao | badge de loading, CTA em loading e mensagem curta | sem acao primaria extra | `Waiting for wallet signature and Pacifica confirmation.` |
| `Approved` | aprovacao concluida com sucesso para a conta atual | badge de sucesso e confirmacao curta no mesmo bloco | seguir para `Agent Wallet` | `Builder code approved for this account.` |
| `Rejected or Error` | assinatura foi recusada ou houve falha operacional | badge de erro, mensagem curta e orientacao de retry quando aplicavel | `Approve builder code` | `Review the wallet approval and try again.` |

## Agent Wallet

| Estado visual | Quando aparece | Sinal visual principal | Acao principal | Microcopy curta |
|---|---|---|---|---|
| `Empty` | wallet conectada, mas campos obrigatorios ainda nao preenchidos | campos vazios, CTA desabilitado, status neutro | preencher formulario | `Enter your Agent Wallet details.` |
| `Filled` | campos obrigatorios preenchidos, antes da validacao | campos completos, CTA habilitado, sem badge de sucesso | `Validate and Continue` | `Ready to validate Agent Wallet.` |
| `Validating` | usuario iniciou a validacao | CTA em loading, feedback informativo visivel | sem acao primaria extra | `Validating Agent Wallet...` |
| `Valid` | validacao concluida com sucesso | badge de sucesso, confirmacao clara no bloco e no painel de conta | `Continue to dashboard` | `Agent Wallet verified.` |
| `Invalid` | validacao falhou e produto segue bloqueado | badge de erro, mensagem proxima do campo ou do bloco relacionado | corrigir campo ou tentar novamente | `Agent Wallet could not be verified.` |

## Operational Verification

| Estado visual | Quando aparece | Sinal visual principal | Acao principal | Microcopy curta |
|---|---|---|---|---|
| `Pending` | `Agent Wallet` ja validada, mas o check operacional ainda nao foi executado | badge neutra, disclosure explicando o teste controlado | `Run readiness check` | `Run the operational check to unlock the product.` |
| `Running` | backend executa `create limit order + cancel order` de forma controlada | badge de loading, CTA em loading e aviso visivel | sem acao primaria extra | `Running a controlled order check...` |
| `Verified` | probe operacional foi aceito e concluido com cancelamento imediato | badge de sucesso, confirmacao clara e CTA final liberado | `Continue to dashboard` | `Account verified and ready to operate.` |
| `Retryable error` | falha transitoria da Pacifica ou indisponibilidade momentanea | badge de erro, mensagem curta e retry visivel | `Run readiness check` | `The operational check is temporarily unavailable. Try again.` |
| `Blocked by account` | assinatura passou, mas a conta falhou por regra operacional | badge de erro, mensagem curta explicando bloqueio real | revisar conta e tentar novamente | `The account is not ready to operate yet.` |

## Regras de Interpretacao
- `reconnecting` deve reutilizar o mesmo tratamento visual de `Connecting`
- `Connected` e `Error` nao podem depender apenas de cor; precisam de label clara
- loading deve parecer transitorio, nunca estado travado
- a wallet aceita na Sprint 1 e `Phantom`
- nenhum estado de wallet libera o produto sem `builder approval`, validacao bem-sucedida de `Agent Wallet` e `operational verification`
- `builder approval` deve parecer autorizacao unica da conta, nao transferencia nem validacao da `Agent Wallet`
- `builder approval` usa a wallet principal conectada; nao pedir `Agent Wallet` nesse passo
- `mainWalletPublicKey` deve parecer dado herdado da wallet conectada, nunca campo editavel
- `agentWalletPrivateKey` precisa de helper text explicito para evitar confusao com a wallet principal
- `Invalid` deve separar falha transitoria de erro que exige edicao antes de nova tentativa
- `operational verification` deve ser descrita como check operacional controlado, nao como trade espontaneo
- a UX deve explicar que a ordem tecnica e criada e cancelada em seguida para provar readiness
- erro transitorio e bloqueio real da conta precisam ter mensagens diferentes

## Observacoes Para QA
- validar se `Connecting` e percebido como tentativa em andamento, nao como travamento
- validar se `Error` aparece proximo do bloco da wallet
- validar se `Connected` exibe a wallet correta e mantem clareza do proximo passo
- validar se o onboarding volta para estado pendente de wallet quando a sessao e perdida
- validar se `builder approval` e entendido como passo separado entre wallet e `Agent Wallet`
- validar se o texto deixa claro que a assinatura nao expoe a private key da wallet principal
- validar se `Rejected or Error` oferece retry sem parecer falha irreversivel quando for retryavel
- validar se `Empty` e `Filled` sao distinguiveis sem depender de texto longo
- validar se `Validating` nao compete visualmente com estado de erro
- validar se `Valid` desbloqueia o CTA final sem ambiguidade
- validar se `Invalid` mantem o produto bloqueado e aponta o proximo passo com clareza
- validar se o usuario entende que o check operacional cria e cancela uma ordem tecnica controlada
- validar se `Retryable error` nao parece bloqueio permanente
- validar se `Blocked by account` comunica readiness insuficiente sem parecer bug opaco
- validar se o CTA final so libera apos `operationally_verified`

## Microcopy Principal

| Grupo | Contexto | Mensagem base | Tom esperado |
|---|---|---|---|
| `loading.wallet.connecting` | conexao inicial ou reconexao em andamento | `Connecting to Phantom...` | curta, informativa |
| `loading.builder.approving` | assinatura de `builder approval` em andamento | `Waiting for wallet signature and Pacifica confirmation.` | curta, informativa |
| `loading.agent_wallet.validating` | validacao de `Agent Wallet` em andamento | `Validating Agent Wallet...` | curta, informativa |
| `loading.operational.running` | check operacional em andamento | `Running a controlled order check...` | curta, informativa |
| `success.wallet.connected` | wallet conectada com sucesso | `Wallet connected and ready.` | curta, confirmatoria |
| `success.builder.approved` | `builder approval` concluido | `Builder code approved for this account.` | curta, confirmatoria |
| `success.agent_wallet.valid` | `Agent Wallet` validada | `Agent Wallet verified.` | curta, confirmatoria |
| `success.operational.verified` | `operational verification` concluida | `Account verified and ready to operate.` | curta, confirmatoria |
| `error.wallet.generic` | falha de conexao de wallet | `Could not connect wallet.` | curta, acionavel |
| `error.builder.generic` | falha generica no `builder approval` | `Review the wallet approval and try again.` | curta, acionavel |
| `error.builder.retry_allowed` | falha transitoria no `builder approval` | `Approval is temporarily unavailable. Try again.` | curta, acionavel |
| `error.agent_wallet.generic` | falha de validacao sem detalhe extra | `Agent Wallet could not be verified.` | curta, acionavel |
| `error.agent_wallet.edit_required` | erro que exige ajuste de campo | `Review your Agent Wallet details and try again.` | curta, acionavel |
| `error.agent_wallet.retry_allowed` | falha transitoria com retry permitido | `Validation is temporarily unavailable. Try again.` | curta, acionavel |
| `error.operational.retry_allowed` | falha transitoria no check operacional | `The operational check is temporarily unavailable. Try again.` | curta, acionavel |
| `error.operational.account_blocked` | falha operacional real da conta | `The account is not ready to operate yet.` | curta, acionavel |
| `blocked.dashboard.pending_wallet` | produto bloqueado por falta de wallet valida | `Connect your wallet to continue.` | curta, diretiva |
| `blocked.dashboard.pending_builder` | produto bloqueado por falta de `builder approval` | `Approve builder code to continue.` | curta, diretiva |
| `blocked.dashboard.pending_agent_wallet` | produto bloqueado por falta de `Agent Wallet` valida | `Validate Agent Wallet to continue.` | curta, diretiva |
| `blocked.dashboard.pending_operational` | produto bloqueado por falta de `operationally_verified` | `Run the operational check to continue.` | curta, diretiva |
| `ready.account.unlocked` | conta pronta para prosseguir | `Account ready. You can continue.` | curta, confirmatoria |

## Regras de Microcopy
- manter frases curtas e diretamente acionaveis
- nao expor detalhes tecnicos do provider ou do backend no texto principal
- nao transformar o `builder approval` em explicacao de assinatura criptografica para o usuario
- distinguir claramente `wallet` de `Agent Wallet`
- distinguir claramente `builder approval` de validacao de `Agent Wallet`
- usar `operational check` ou `readiness check` como linguagem de produto, evitando `probe`
- usar mensagens de bloqueio para indicar o proximo passo, nao apenas o problema
- erros transitórios e erros que exigem edicao devem ter mensagens diferentes
