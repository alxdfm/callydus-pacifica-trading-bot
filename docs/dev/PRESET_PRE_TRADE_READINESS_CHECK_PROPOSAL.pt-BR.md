# Proposta de Validacao de Readiness do Preset Antes de Operar

## Objetivo
Definir uma feature de validacao operacional do preset antes de ativar o bot ou antes de confirmar a ativacao do preset, usando o tamanho real configurado para a posicao e nao apenas o probe tecnico generico do onboarding.

## Problema de Produto
Hoje o produto ja executa um `operational check` no onboarding:
- cria uma ordem tecnica controlada
- cancela logo em seguida
- prova que a conta consegue operar em termos gerais

Esse check reduz risco, mas nao prova uma coisa importante:
- que o tamanho real configurado no preset vai passar nas regras atuais da Pacifica

Exemplo pratico:
- usuario configura `5%` da margem
- o worker calcula um notional abaixo de `10 USD`
- a Pacifica rejeita a ordem real por valor minimo

Resultado:
- a conta passa no onboarding
- o preset ativa
- o bot inicia
- a falha so aparece quando surge um sinal real

## Atualizacao de Direcao
Esta proposta foi refinada com a direcao de produto abaixo:
- o sistema nao deve "corrigir para cima" silenciosamente a intencao do usuario no check pre-start
- se o valor calculado para o trade ficar abaixo do minimo da Pacifica, o usuario deve ser informado explicitamente
- o melhor ponto para esse check passa a ser o `Start bot`
- o check de `Start bot` deve usar o mercado selecionado no preset e o valor real calculado a partir do saldo atual da conta

Em outras palavras:
- o comportamento tecnico atual do worker pode hoje elevar para `min_order_size`
- mas a experiencia desejada para produto nao deve esconder esse desvio do usuario

## Estado Atual da Implementacao

### 1. O preset hoje nao valida viabilidade operacional no momento da ativacao
Na ativacao, o backend apenas:
- verifica se a conta esta pronta
- monta o `effectiveContract`
- persiste a ativacao do preset

Nao existe hoje uma simulacao ou probe do tamanho real configurado na ativacao do preset.

Referencias:
- [ActivatePreset.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/application/activate-preset/ActivatePreset.ts)
- [PresetsPage.tsx](/home/dev/Projects/callydus-pacifica-trading-bot/apps/app/src/ui/pages/PresetsPage.tsx)

### 2. O tamanho real da ordem e calculado so no worker, na hora do sinal
O worker calcula o notional alvo assim:
- `fixed_amount`: usa o valor configurado
- `balance_percent`: usa `availableBalance * (percentual / 100)`

Referencia:
- [createOperationalWorker.ts:87](/home/dev/Projects/callydus-pacifica-trading-bot/apps/worker/src/application/createOperationalWorker.ts#L87)

Formula atual:

```ts
if (positionSizeType === "fixed_amount") {
  targetNotionalUsd = positionSizeValue;
} else {
  targetNotionalUsd = availableBalance * (positionSizeValue / 100);
}
```

### 3. O sistema hoje normaliza a ordem para respeitar minimo de mercado
Antes de enviar ordem real, o worker chama `normalizeMarketOrderInput(...)`.

Essa funcao:
- usa `tickSize`
- usa `lotSize`
- usa `minOrderSize`
- aplica `effectiveNotionalUsd = max(minOrderSize, targetNotionalUsd)`

Referencia:
- [index.ts:304](/home/dev/Projects/callydus-pacifica-trading-bot/packages/pacifica-trading/src/index.ts#L304)

Implicacao importante no codigo atual:
- se o usuario configurou `3.46 USD`
- e o `minOrderSize` do mercado e `10 USD`
- o sistema tenta elevar o notional para `10 USD`

Ou seja, hoje existe um comportamento tecnico de "floor" para o minimo do mercado.

### 4. Esse comportamento atual diverge da direcao de produto desejada
Pela direcao refinada, isso nao deve acontecer de forma silenciosa no fluxo de readiness do bot.

O desejado passa a ser:
- calcular o valor real da ordem
- comparar com o minimo do mercado
- bloquear o `Start bot` quando esse valor for insuficiente
- informar ao usuario o valor calculado, o minimo exigido e, quando aplicavel, o impacto da alavancagem
### 5. Mesmo assim ainda existe risco operacional
Esse ajuste tecnico nao garante sozinho que a ordem vai passar, porque ainda podem existir falhas como:
- margem insuficiente para suportar o notional efetivo
- saldo disponivel insuficiente
- restricao da conta no momento atual
- rejeicao especifica do endpoint por regra adicional da Pacifica

### 6. O operational check atual e generico, nao contextual ao preset
O gateway do onboarding usa:
- simbolo configuravel
- preco configuravel
- `target_notional_usd` configuravel
- cria `limit order`
- cancela em seguida

Referencia:
- [PacificaOperationalVerificationGateway.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/infrastructure/pacifica/PacificaOperationalVerificationGateway.ts)

Esse fluxo prova readiness geral da conta, mas nao readiness do preset configurado.

## Como a Alavancagem Esta Hoje

## Diagnostico Atual
Hoje nao existe implementacao explicita de alavancagem no fluxo operacional do bot.

Nao encontrei no codigo atual:
- campo de `leverage` no `PresetEditableConfig`
- persistencia de `leverage` no preset ativo
- chamada para endpoint de update de leverage ou margin mode
- calculo de tamanho da ordem multiplicado por alavancagem

O tamanho da ordem hoje depende apenas de:
- `availableBalance`
- `positionSizeType`
- `positionSizeValue`

Referencias:
- [createOperationalWorker.ts:87](/home/dev/Projects/callydus-pacifica-trading-bot/apps/worker/src/application/createOperationalWorker.ts#L87)
- [preset-catalog.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/app/src/features/presets/preset-catalog.ts)
- [contracts index](/home/dev/Projects/callydus-pacifica-trading-bot/packages/contracts/src/index.ts)

## O Que a Documentacao Oficial da Pacifica Afirma

### Margin mode e leverage default
A documentacao oficial da Pacifica afirma que:
- o modo padrao e `cross margin`
- o leverage padrao e o maximo do mercado
- o endpoint `GET /api/v1/account/settings` retorna vazio para mercados que ainda estao com valores default

Implicacao:
- se nao lermos `account/settings`, nao sabemos por codigo se um simbolo esta usando o default implicito ou um ajuste manual persistido

### Formula oficial de margem inicial
A documentacao oficial afirma:

```text
initial_margin = (position_size × entry_price / leverage)
```

Inferencia direta:
- `position_size × entry_price` e o notional da posicao
- logo, `notional = initial_margin × leverage`

### Market info oficial
A documentacao oficial do `GET /api/v1/info` afirma que cada simbolo expoe:
- `tick_size`
- `lot_size`
- `max_leverage`
- `min_order_size`
- `max_order_size`

Isso e suficiente para um check pre-start decidir:
- se o valor calculado fica abaixo do minimo
- se o leverage esperado ultrapassa o `max_leverage` do simbolo
- se o preco e a quantidade precisam de arredondamento valido

## Consequencia Pratica
Hoje o percentual configurado parece ser interpretado como percentual do saldo disponivel, sem uma camada explicita de multiplicacao por alavancagem.

Entao, se o usuario configura `5%`:
- o sistema calcula `5%` do `availableBalance`
- nao `5% * leverage`

## Ponto de Atencao
Ainda assim, a Pacifica pode estar aplicando regras de margem internamente no momento da ordem. Ou seja:
- mesmo sem controle explicito de alavancagem no nosso codigo
- a conta pode ser afetada por configuracao real de `cross/isolated` e `leverage` existente na exchange

Isso cria um gap importante na nossa implementacao atual:
- o bot calcula sizing sem considerar leverage
- mas a exchange valida a margem necessaria considerando leverage

Isso significa que a nova feature deve ser pensada com duas camadas:
- validacao do que o nosso sistema calcula
- verificacao do que a Pacifica aceita de fato para aquela conta naquele momento

## Leitura de Saldo e Margem no Projeto
O backend ja le alguns campos relevantes da conta:
- `totalBalance`
- `availableBalance`
- `aggregatedPnl`
- `capitalInUse`

Referencia:
- [PacificaAccountStateGateway.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts)

Isso e importante porque a feature proposta pode reutilizar:
- `availableBalance` para sizing
- `capitalInUse` para diagnostico
- snapshot atual da conta como base da pre-validacao

## Proposta de Feature

## Nome Conceitual
`Start bot readiness check`

## Objetivo Funcional
Ao clicar em `Start bot`, o sistema deve validar se o tamanho real configurado para o preset consegue gerar uma ordem aceitavel pela Pacifica naquele momento, sem corrigir silenciosamente uma configuracao abaixo do minimo.

## O Que Esse Check Deve Validar
- conta segue operacional
- assinatura da `Agent Wallet` segue valida
- simbolo escolhido no preset existe
- leverage configurado para o par existe e respeita o limite real da Pacifica
- `positionSize` configurado gera um notional alvo valido
- `minOrderSize` do mercado nao e violado pelo valor calculado
- arredondamento por `tickSize` e `lotSize` continua valido
- `margin mode` e `leverage` atuais da conta para esse simbolo
- leverage padrao implicito quando `account/settings` vier vazio
- margem/saldo disponivel suportam o notional efetivo
- Pacifica aceita criar e cancelar essa ordem tecnica

## Onde Esse Check Deve Acontecer

### Opcao recomendada
Executar exatamente no `Start bot`.

Motivo:
- e o momento em que o usuario explicitamente pede para operar
- usa saldo e configuracao mais atuais possiveis
- evita side effect operacional repetido durante simples edicoes do preset
- permite bloquear a entrada em `botStatus = active` se a conta nao estiver pronta para aquele sizing real

## Desenho Tecnico Recomendado

### Passo 1. Ler configuracao operacional real da conta
No `Start bot`, o backend deve buscar:
- `GET /api/v1/account`
- `GET /api/v1/account/settings`
- `GET /api/v1/info`
- preco atual do simbolo

O objetivo e descobrir:
- `availableBalance`
- configuracao atual de `margin mode`
- configuracao atual de `leverage`
- `max_leverage`
- `min_order_size`
- `tick_size`
- `lot_size`

### Passo 2. Definir a formula de sizing do produto
Aqui precisamos fechar semanticamente o que significa "operar com 5% da margem".

Se a regra de produto for "5% da margem inicial da conta":
- `initialMarginTargetUsd = availableBalance * 0.05`
- `notionalTargetUsd = initialMarginTargetUsd * leverage`

Exemplo:
- saldo disponivel = `2 USD`
- leverage = `50x`
- percentual = `5%`
- margem inicial alvo = `0.10 USD`
- notional alvo = `5 USD`

Se esse for o significado desejado, o codigo atual nao implementa isso ainda.

### Regra para `fixed_amount`
`fixed_amount` deve representar o notional final da posicao.

Exemplo:
- "quero operar sempre com 20 USD"
- isso significa posicao final de `20 USD`
- a margem necessaria dependera do leverage efetivo

### Passo 3. Validar antes de criar a ordem tecnica
Antes do probe:
- se `notionalTargetUsd < min_order_size`, o check falha
- a UI informa ao usuario que o valor calculado esta abaixo do minimo da Pacifica
- o `Start bot` nao prossegue

Pela direcao refinada, aqui nao devemos subir silenciosamente para `10 USD`.

### Passo 4. Fazer probe contextual no `Start bot`
Se a configuracao passar na pre-validacao:
- criar uma `limit order`
- no simbolo do preset ativo
- com o `amount` real calculado para aquela conta
- com preco `20%` abaixo do preco atual para compra, ou equivalente seguro para o lado aplicavel
- usando `TIF = ALO` para reduzir risco de execucao imediata, quando compativel
- cancelar logo em seguida

### Passo 4.1. Configuracao de leverage por par
O produto deve permitir configurar leverage por par, respeitando a disponibilidade real da Pacifica.

Regra:
- nao hardcodar valores como `BTC 50x`, `ETH 50x` ou `SOL 20x`
- consultar sempre a fonte real da Pacifica para o `max_leverage` do simbolo
- limitar a escolha do usuario a esse teto

Decisao:
- essa configuracao nao deve morar no preset
- leverage deve ser uma configuracao operacional separada por simbolo

### Passo 5. Persistir o resultado
Registrar um evento audital com:
- `marginMode`
- `leverage`
- percentual configurado
- `availableBalance` usado no calculo
- `targetInitialMarginUsd`
- `targetNotionalUsd`
- `minOrderSize`
- simbolo
- sucesso ou causa da falha

## Decisao Importante Sobre Semantica
Precisamos decidir qual pergunta a feature responde.

### Opcao A. "Sua configuracao exata passa sem ajustes?"
Nesse modelo:
- se `5%` gera `3.46 USD`
- e a exchange exige `10 USD`
- o check falha

Vantagem:
- transparente para o usuario

Desvantagem:
- exige alterar o comportamento atual do worker, que hoje sobe para o minimo do mercado

### Opcao B. "Sua configuracao pode ser auto-ajustada para operar?"
Nesse modelo:
- se `5%` gera `3.46 USD`
- o sistema sobe para `10 USD`
- o check pode passar

Problema:
- contradiz a direcao de produto refinada
- esconde que o bot vai operar acima do sizing esperado pelo usuario

## Recomendacao de Produto
Seguir a Opcao A.

Mensagem conceitual:
- "Com o saldo atual, leverage atual e configuracao deste preset, o valor calculado para a ordem e 5 USD. A Pacifica exige minimo de 10 USD para este mercado. Ajuste o percentual, saldo disponivel ou leverage antes de iniciar o bot."

Assim:
- nao escondemos o minimo da exchange
- nao escondemos o impacto do leverage
- bloqueamos o bot antes da primeira falha real

## Processo Proposto da Feature

1. Usuario seleciona preset e ajusta configuracao.
2. Usuario clica em `Start bot`.
3. Sistema busca snapshot de conta mais recente.
4. Sistema busca `account/settings` para o simbolo ativo.
5. Sistema busca `marketInfo` do simbolo do preset.
6. Sistema resolve `marginMode` e `leverage` efetivos, inclusive default implicito.
7. Sistema calcula o tamanho real da ordem conforme a semantica de margem definida pelo produto.
8. Se o valor calculado ficar abaixo do minimo do mercado, o check falha sem criar ordem.
9. Se passar na pre-validacao, o sistema executa ordem tecnica controlada e cancela em seguida.
10. Sistema mostra resultado detalhado para o usuario.
11. Bot so pode iniciar se esse check estiver `passed`.

## Observacao sobre Persistencia do Check
Esse readiness check nao precisa ser salvo nem ter TTL proprio.

Decisao refinada:
- o check sera executado sempre no `Start bot`
- se passar, o fluxo segue imediatamente para iniciar o bot
- se falhar, o bot nao inicia
- nao precisamos manter estado persistido do readiness nesta etapa

## Contrato de Resultado Recomendado
O resultado nao deve ser apenas `ok/erro`.

Ele deve devolver algo como:
- `availableBalanceUsed`
- `marginMode`
- `leverageUsed`
- `positionSizeType`
- `positionSizeValue`
- `targetInitialMarginUsd`
- `targetNotionalUsd`
- `marketMinOrderSizeUsd`
- `normalizedAmount`
- `symbol`
- `readinessStatus`
- `failureReason`
- `exchangeMessage`

## Checklist de Validacao Ponto a Ponto

### Produto
- [x] o check deve acontecer no `Start bot`
- [ ] passar no check vira prerequisito obrigatorio para iniciar o bot?
- [ ] o usuario pode iniciar mesmo com warning, ou deve ficar bloqueado?
- [x] nao queremos elevar silenciosamente a ordem para o minimo da exchange no readiness check

### Regra de Negocio
- [x] contas pequenas devem falhar quando o valor calculado ficar abaixo do minimo
- [ ] precisamos fechar a formula exata de "x% da margem"
- [ ] o percentual deve ser interpretado sobre margem inicial ou sobre saldo disponivel bruto?
- [ ] se `availableBalance` variar, o check expira e precisa ser refeito?

### Alavancagem
- [ ] precisamos ler `GET /api/v1/account/settings` no `Start bot`
- [ ] precisamos decidir se vamos apenas ler o leverage atual ou tambem seta-lo
- [ ] se `account/settings` vier vazio, vamos assumir default oficial da Pacifica: `cross` + `max leverage`
- [ ] vamos modelar leverage no contrato do produto ou somente refletir o estado atual da exchange?

### Tecnico
- [ ] extrair a formula final de sizing para modulo compartilhado entre `api` e `worker`
- [ ] parar de depender de `normalizeMarketOrderInput` como regra de floor silencioso no readiness check
- [ ] criar endpoint backend dedicado para `start bot readiness check`
- [ ] registrar evento audital especifico
- [ ] mapear erros da Pacifica para mensagens de produto melhores
- [ ] impedir `resumeBot` de promover o runtime para `active` antes desse check passar

### UX
- [ ] exibir calculo detalhado antes da confirmacao final
- [ ] deixar claro que sera criada e cancelada uma ordem tecnica
- [ ] diferenciar falha por minimo, leverage, margem, assinatura e indisponibilidade
- [ ] informar quando o saldo atual mudou e invalida o check anterior

## Recomendacao de Escopo Inicial

### Fase 1
Implementar validacao de readiness no `Start bot`, lendo leverage e margin mode reais da Pacifica, sem ainda permitir editar leverage no produto.

Escopo:
- usar `availableBalance` atual
- usar `positionSize` atual do preset
- ler `account/settings` para o simbolo ativo
- usar `marketInfo` real
- aplicar a formula final de sizing alinhada com produto
- falhar explicitamente quando o valor calculado ficar abaixo do minimo
- executar probe tecnico contextual
- devolver diagnostico detalhado

### Fase 2
Refinar a semantica de sizing e a integracao com leverage.

Escopo:
- decidir se leverage sera apenas leitura ou tambem parte editavel do produto
- decidir se o produto deve permitir sincronizar o leverage da exchange a partir do app

### Fase 3
Avaliar se vale modelar alavancagem explicitamente no produto.

Escopo:
- adicionar `leverage` ao contrato apenas se houver necessidade real de produto
- evitar antecipar complexidade sem uma decisao clara

## Recomendacao Final
Faz sentido implementar essa feature.

O refinamento mais consistente agora e:
- manter o `operational check` do onboarding como readiness geral da conta
- adicionar um `Start bot readiness check` contextual ao preset e ao saldo atual
- nao subir silenciosamente a ordem para o minimo no fluxo de readiness
- bloquear o bot e informar o usuario quando o valor calculado estiver abaixo do minimo da Pacifica
- ler leverage e margin mode reais da exchange antes do probe

A principal conclusao tecnica aqui e:
- hoje o `Start bot` nao verifica sizing real nem leverage
- a Pacifica tem `cross` como default e leverage default no maximo do mercado
- a formula oficial de margem inicial depende de leverage
- nosso codigo atual nao modela isso
- por isso o check ideal precisa acontecer no `Start bot`, usando estado real da conta e regras oficiais da exchange

## Fontes Oficiais da Pacifica
- Margin & Leverage: https://pacifica.gitbook.io/docs/trading-on-pacifica/margin-and-leverage
- Get account info: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-account-info
- Get account settings: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-account-settings
- Update leverage: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/update-leverage
- Update margin mode: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/update-margin-mode
- Get market info: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-market-info
- Create limit order: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/create-limit-order
- Cancel order: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/cancel-order
- Tick and lot size: https://pacifica.gitbook.io/docs/api-documentation/api/tick-and-lot-size

## Proximo Passo Sugerido
Se validarmos esta direcao, o proximo documento/entrega pode ser um tech design curto com:
- formula oficial de sizing que vamos adotar no produto
- endpoint proposto de `start bot readiness check`
- payload de request/response
- estados de UI
- regra de expiração do check
- mudança no `resumeBot` para nao ativar o runtime antes da validacao
