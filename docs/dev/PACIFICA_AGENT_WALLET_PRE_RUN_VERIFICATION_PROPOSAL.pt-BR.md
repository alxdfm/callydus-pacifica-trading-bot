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

### Atualizacao de Direcao Preferencial
Para UX e produto, a recomendacao preferencial passa a ser um unico gate visivel para saida do onboarding:
- `operationally_verified`

Isso significa:
- o usuario nao precisa enxergar duas verificacoes separadas
- o produto so libera acesso quando a conta estiver realmente apta a operar
- estados tecnicos intermediarios, como `validated` ou `signature_verified`, podem existir internamente para diagnostico e auditoria, mas nao precisam virar etapa explicita da experiencia

### Forma recomendada
Usar uma ordem limite extremamente fora do mercado, seguida de cancelamento imediato, como probe operacional preferencial.

Motivo:
- reduz risco de o usuario descobrir falha apenas no primeiro trade
- prova a capacidade real da `Agent Wallet`
- e mais controlavel do que "comprar 10 cents" de forma cega

### Desenho preferencial atual
1. criar `limit order` com `agent_wallet`
2. usar `TIF = ALO` quando aplicavel, para reduzir risco de execucao imediata
3. escolher preco extremamente fora do mercado
4. esperar confirmacao de criacao
5. cancelar imediatamente a ordem criada
6. marcar a credencial como `operationally_verified`

### Detalhes tecnicos relevantes da doc da Pacifica
- `POST /api/v1/orders/create` usa `operation type = create_order` e aceita `agent_wallet`
- `POST /api/v1/orders/cancel` usa `operation type = cancel_order` e aceita `agent_wallet`
- `GET /api/v1/info` expoe `tick_size`, `lot_size`, `min_order_size` e `max_order_size` por simbolo
- `min_order_size` e denominado em USD
- `price` e `amount` precisam ser multiplos de `tick_size` e `lot_size`

Exemplo da doc atual para `BTC`:
- `tick_size = 1`
- `lot_size = 0.00001`
- `min_order_size = 10`

Implicacao:
- uma ordem de `BTC` com `price = 1` precisa ter notional de pelo menos `10 USD`
- com `price = 1`, isso implica `amount = 10`
- portanto, a ideia "BTC a 1 dolar" e viavel em principio como notional de `10 USD`, mas o probe precisa ser montado conscientemente para nao falhar por regra de mercado/parametro em vez de credencial

### Parametrizacao atual do projeto
O probe operacional do projeto passa a usar um notional-alvo configuravel, com defaults:
- `PACIFICA_OPERATIONAL_PROBE_SYMBOL=BTC`
- `PACIFICA_OPERATIONAL_PROBE_PRICE=20000`
- `PACIFICA_OPERATIONAL_PROBE_TARGET_NOTIONAL_USD=11`
- `PACIFICA_OPERATIONAL_PROBE_TIF=ALO`

Regra tecnica:
- o backend usa `max(min_order_size, target_notional_usd)` como notional efetivo
- com a configuracao atual, o objetivo e tentar uma ordem de `11 USD` em `BTC @ 20000 USD`, seguida de cancelamento imediato

## Regras de Produto Recomendadas
- o onboarding so fica `ready` apos:
  - `builder approved`
  - `operational verification passed`
- a UI deve deixar explicito que existe um `operational check`
- esse check nao deve ser mascarado como simples "validacao"
- o usuario deve saber que:
  - uma ordem tecnica de verificacao sera criada
  - ela sera cancelada em seguida
  - esse processo existe apenas para comprovar readiness operacional

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

### Interpretacao recomendada de falhas
Se a Pacifica responder erro de negocio apos aceitar o request assinado, isso ja e evidencia forte de que a `Agent Wallet` passou pela camada de assinatura.

Exemplos:
- saldo insuficiente
- margem insuficiente
- ordem abaixo do minimo
- parametro invalido de mercado

Esses casos nao significam `operationally_verified`, mas significam algo importante:
- a assinatura foi aceita
- a conta chegou na validacao de negocio da Pacifica

Recomendacao:
- classificar esse resultado como algo como `signature_verified_but_account_blocked`
- nao confundir com `operationally_verified`
- usar isso para reduzir ambiguidade diagnostica

Para produto:
- esse estado nao precisa liberar a aplicacao
- se a conta falhar por saldo, margem ou restricao operacional, o onboarding deve continuar bloqueado

## Decisao Que Precisa de Refinamento com PO
O PO precisa fechar:
- se o produto aceita side effect controlado no onboarding
- qual naming final da experiencia:
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
