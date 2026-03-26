# Proposta de Verificacao Operacional Pre-Run da Agent Wallet

## Objetivo
Definir uma abordagem para garantir que a `Agent Wallet` esta operacional antes de liberar o bot, evitando que o usuario descubra a falha apenas quando surgir a primeira oportunidade de trade.

## Contexto
O estudo em [PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md](./PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md) mostrou que a Pacifica nao expoe endpoint neutro de `check` para `Agent Wallet`.

Isso cria um problema de produto:
- se a validacao operacional ficar para o primeiro trade real
- o bot pode estar "rodando"
- e ainda assim falhar apenas quando surgir a primeira oportunidade

## Problema a Resolver
Precisamos de um `operational verification` antes de liberar o runtime do bot.

Esse passo deve:
- provar que a `Agent Wallet` consegue assinar e ser aceita pela Pacifica
- acontecer antes do bot entrar em estado pronto
- minimizar side effects operacionais e risco para o usuario

## Opcoes Tecnicas

### Opcao 1. Nao fazer probe pre-run
Fluxo:
- onboarding fecha com `builder approved + agent validated`
- primeiro trade real vira a prova operacional

Conclusao:
- nao recomendado

### Opcao 2. Criar uma ordem minima real como probe
Fluxo:
- backend tenta criar uma ordem minima de mercado ou limite
- se a Pacifica aceitar, marca `operationally_verified`

Conclusao:
- prova forte, mas agressiva para onboarding

### Opcao 3. Usar cancelamento como probe
Fluxo:
- tentar `cancel` ou `cancel_all` via `Agent Wallet`

Conclusao:
- nao serve como check universal

### Opcao 4. Criar ordem controlada de menor risco para verificacao
Fluxo:
- backend tenta uma ordem extremamente controlada, desenhada para ser um `operational probe`
- so depois disso libera `bot ready`

Subopcoes plausiveis:
- ordem limite longe do mercado
- ordem `ALO` / post-only
- valor minimo permitido para reduzir risco

Conclusao:
- melhor equilibrio tecnico, mas precisa decisao explicita de produto

## Recomendacao

### Recomendacao Principal
Adotar `operational verification pre-run` como passo obrigatorio antes de liberar o bot.

### Forma recomendada
Usar uma ordem controlada de menor risco como probe operacional, e nao uma compra de mercado direta.

Motivo:
- reduz risco de o usuario descobrir falha apenas no primeiro trade
- prova a capacidade real da `Agent Wallet`
- e mais controlavel do que "comprar 10 cents" de forma cega

## Regras de Produto Recomendadas
- o onboarding so fica `ready` apos:
  - `builder approved`
  - `Agent Wallet validated`
  - `operational verification passed`
- a UI deve deixar explicito que existe um `operational check`
- esse check nao deve ser mascarado como simples "validacao"

## Regras Tecnicas Recomendadas
- registrar esse passo em auditoria
- persistir status distinto:
  - `validated`
  - `operationally_verified`
- capturar causa de falha separando, quando possivel:
  - assinatura rejeitada
  - simbolo/lot size invalido
  - margem insuficiente
  - rate limit
  - indisponibilidade Pacifica

## Decisao Que Precisa de Refinamento com PO
O PO precisa fechar:
- se o produto aceita side effect controlado no onboarding
- se a experiencia deve chamar isso de:
  - `Operational check`
  - `Exchange readiness check`
  - `Trading readiness check`
- se esse passo acontece:
  - durante onboarding
  - ou imediatamente antes do primeiro `Start bot`

## Recomendacao de Escopo
Nao implementar ainda sem alinhamento de produto.

Motivo:
- a decisao tem impacto de UX, risco operacional e semantica de onboarding
- exige escolher conscientemente qual side effect minimo o produto aceita
