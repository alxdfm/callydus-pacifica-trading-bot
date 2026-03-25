# Referencia de Profile

## Objetivo
Consolidar a estrutura, os blocos, as regras de edição e o handoff visual da página `Profile` do pós-MVP.

## Papel da Tela
- separar manutenção recorrente de conta da jornada de `Onboarding`
- dar um destino claro para edição posterior de dados sensíveis
- preservar clareza para usuário não técnico

## Estrutura da Tela

### Desktop
Ordem dos blocos:
1. header da tela
2. resumo de status da conta
3. bloco de `Main wallet`
4. bloco de `Agent Wallet`
5. bloco de segurança e impacto das mudanças

### Mobile
Ordem dos blocos:
1. header da tela
2. resumo de status
3. `Main wallet`
4. `Agent Wallet`
5. segurança e impacto

## Resumo de Status da Conta
Campos mínimos:
- status da conta
- status da wallet principal
- status da `Agent Wallet`
- data da última validação bem-sucedida

Regras:
- o estado global da conta precisa ser escaneável em uma linha
- `Ready`, `Needs validation` e `Attention required` não dependem só de cor
- o resumo aparece acima dos blocos editáveis

## Main Wallet
Campos mínimos:
- wallet provider
- `mainWalletPublicKey`

Ações:
- `Reconnect wallet`

Regras:
- `mainWalletPublicKey` é somente leitura
- a wallet principal representa a identidade da conta, não um campo comum de formulário
- troca de wallet não acontece inline sem aviso
- ao acionar `Reconnect wallet`, a UI deve avisar que a identidade da conta pode mudar e exigir confirmação antes de seguir

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

## Segurança e Impacto
Mensagens mínimas:
- mudar a `Main wallet` pode alterar a identidade da conta
- mudar a `Agent Wallet` exige nova validação
- durante revalidação, áreas protegidas podem ficar temporariamente bloqueadas

Regras:
- o bloco deve reduzir surpresa, não dramatizar
- a consequência da ação precisa aparecer antes do CTA final

## Estados Principais

### Conta
- `Ready`
- `Needs validation`
- `Attention required`

### Main Wallet
- `Connected`
- `Reconnecting`
- `Error`

### Agent Wallet
- `Unchanged`
- `Editing`
- `Validating`
- `Validated`
- `Invalid`

## Microcopy Base
- `Profile`
- `Manage account access and connected credentials.`
- `Main wallet`
- `This wallet identifies the account and cannot be edited directly.`
- `Reconnect wallet`
- `Agent Wallet`
- `Update the Agent Wallet used to operate the account.`
- `Use the private key from the Agent Wallet only.`
- `Save and revalidate`
- `Changes to Agent Wallet require validation before the account is fully unlocked again.`
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
