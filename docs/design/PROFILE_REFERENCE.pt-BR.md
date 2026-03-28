# Referencia de Profile

## Objetivo
Consolidar a estrutura, os blocos, as regras de edição e o handoff visual da página `Profile` do pós-MVP.

## Papel da Tela
- separar manutenção recorrente de conta da jornada de `Onboarding`
- dar um destino claro para edição posterior de dados sensíveis
- mostrar quando a operação precisa parar antes de uma mudança crítica
- preservar clareza para usuário não técnico

## Estrutura da Tela

### Desktop
Ordem dos blocos:
1. header da tela
2. resumo de status da conta
3. bloco de sessão atual
4. bloco de `Main wallet`
5. bloco de `Agent Wallet`
6. bloco de segurança e impacto das mudanças

### Mobile
Ordem dos blocos:
1. header da tela
2. resumo de status
3. sessão atual
4. `Main wallet`
5. `Agent Wallet`
6. segurança e impacto

## Resumo de Status da Conta
Campos mínimos:
- status da conta
- status operacional do bot
- status da wallet principal
- status da `Agent Wallet`
- data da última validação bem-sucedida

Regras:
- o estado global da conta precisa ser escaneável em uma linha
- `Ready`, `Maintenance required` e `Attention required` não dependem só de cor
- o resumo aparece acima dos blocos editáveis
- quando o bot estiver rodando, o resumo precisa deixar explícito que edições críticas ficam bloqueadas

## Sessão Atual
Campos mínimos:
- estado da sessão atual
- regra de logout atual

Ações:
- `Log out`

Regras:
- `Log out` precisa aparecer como ação distinta das edições de credencial
- a copy deve deixar claro que a sessão atual será encerrada no dispositivo
- logout não compete visualmente com o CTA crítico de revalidação

## Main Wallet
Campos mínimos:
- wallet provider
- `mainWalletPublicKey`

Ações:
- nenhuma troca inline de wallet principal

Regras:
- `mainWalletPublicKey` é somente leitura
- a wallet principal representa a identidade da conta, não um campo comum de formulário
- o bloco deve comunicar que usar outra wallet principal significa iniciar outra conta, não editar a atual
- o `Profile` não deve sugerir que a wallet principal pode ser trocada como manutenção leve

## Agent Wallet
Campos mínimos:
- `agentWalletPublicKey`
- `agentWalletPrivateKey`
- `credentialAlias`

Ações:
- `Clear changes`
- `Save and revalidate`

Regras:
- `agentWalletPublicKey` é editável
- `agentWalletPrivateKey` não deve aparecer pré-preenchida; quando necessário, entra vazia para nova validação
- `credentialAlias` é opcional e de baixa criticidade visual
- alterações em `agentWalletPublicKey` ou `agentWalletPrivateKey` exigem revalidação
- alteração apenas de `credentialAlias` pode salvar sem bloquear a conta
- quando o bot estiver rodando, a edição crítica de `Agent Wallet` fica bloqueada
- a UI precisa deixar evidente a próxima ação: parar operação para liberar edição, ou salvar e revalidar
- salvar mudança crítica reabre validação de `Agent Wallet` e novo `operational verification`

## Segurança e Impacto
Mensagens mínimas:
- outra `Main wallet` significa outra conta
- mudar a `Agent Wallet` exige nova validação
- mudar a `Agent Wallet` exige novo `operational verification`
- durante revalidação, a operação permanece bloqueada

Regras:
- o bloco deve reduzir surpresa, não dramatizar
- a consequência da ação precisa aparecer antes do CTA final
- quando a conta estiver bloqueada por runtime, o bloco deve explicar o motivo e a ação de saída

## Estados Principais

### Conta
- `Ready`
- `Maintenance required`
- `Attention required`

### Sessão
- `Signed in`
- `Ending session`

### Main Wallet
- `Connected`
- `Identity locked`

### Agent Wallet
- `Locked while bot is running`
- `Editing`
- `Validating`
- `Validated`
- `Reverification required`
- `Invalid`

## Microcopy Base
- `Profile`
- `Manage recurring account maintenance without reopening onboarding.`
- `Current session`
- `End access on this device.`
- `Log out`
- `Main wallet`
- `This wallet identifies the account and is not editable in Profile.`
- `Using another main wallet starts a different account.`
- `Agent Wallet`
- `Update the Agent Wallet used to operate the account.`
- `Use the private key from the Agent Wallet only.`
- `Stop the bot to edit Agent Wallet.`
- `Save and revalidate`
- `Changes to Agent Wallet require validation and a new readiness check before operation resumes.`
- `Alias updated.`
- `Agent Wallet validated.`
- `Validation failed. Review the Agent Wallet fields and try again.`

## Comportamento Mobile
- blocos em coluna única sem scroll horizontal
- CTAs principais ocupam largura total quando necessário
- helper texts e avisos de segurança toleram tradução maior sem quebrar a hierarquia

## Orientação de i18n
- separar grupos de mensagem para:
  - header de `Profile`
  - resumo de status da conta
  - `Main wallet`
  - `Agent Wallet`
  - avisos de segurança
- manter distinção explícita entre `Main wallet` e `Agent Wallet`
- não concatenar avisos longos de segurança dinamicamente

## Referencias
- [preview/profile.html](./preview/profile.html)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
- [DESIGN_HANDOFF.pt-BR.md](./DESIGN_HANDOFF.pt-BR.md)
- [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md)
