# Start Bot Readiness Check - Design Tecnico

## Objetivo
Definir o desenho tecnico minimo para impedir que o bot entre em estado `active` sem validar, no momento do `Start bot`, se o preset ativo consegue operar com o saldo atual, o mercado atual e a configuracao real de `margin mode` e `leverage` da conta na Pacifica.

## Contexto
Hoje existem dois comportamentos diferentes:
- o onboarding ja executa um `operational check` generico da conta
- o runtime do bot pode ser retomado sem um check contextual ao preset ativo

Isso deixa um gap:
- a conta pode estar operacional em termos gerais
- mas o preset ativo pode falhar no primeiro sinal real por sizing insuficiente, `min_order_size`, margem ou leverage

## Fontes Primarias
- Pacifica Margin & Leverage: https://pacifica.gitbook.io/docs/trading-on-pacifica/margin-and-leverage
- Pacifica Get account info: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-account-info
- Pacifica Get account settings: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-account-settings
- Pacifica Update leverage: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/update-leverage
- Pacifica Update margin mode: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/update-margin-mode
- Pacifica Get market info: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-market-info
- Pacifica Get prices: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-prices
- Pacifica Create limit order: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/create-limit-order
- Pacifica Cancel order: https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/cancel-order
- Pacifica Tick and lot size: https://pacifica.gitbook.io/docs/api-documentation/api/tick-and-lot-size

## Contexto Interno
- [PRESET_PRE_TRADE_READINESS_CHECK_PROPOSAL.pt-BR.md](./PRESET_PRE_TRADE_READINESS_CHECK_PROPOSAL.pt-BR.md)
- [PACIFICA_AGENT_WALLET_PRE_RUN_VERIFICATION_PROPOSAL.pt-BR.md](./PACIFICA_AGENT_WALLET_PRE_RUN_VERIFICATION_PROPOSAL.pt-BR.md)
- [ResumeBot.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/application/resume-bot/ResumeBot.ts)
- [PrismaPacificaCredentialRepository.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts)
- [createOperationalWorker.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/worker/src/application/createOperationalWorker.ts)
- [PacificaOperationalVerificationGateway.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/infrastructure/pacifica/PacificaOperationalVerificationGateway.ts)
- [index.ts](/home/dev/Projects/callydus-pacifica-trading-bot/packages/pacifica-trading/src/index.ts)

## Conclusao Executiva
- o `Start bot` deve deixar de ser apenas `resume runtime`
- antes de promover `botStatus` para `active`, a API deve executar um `start bot readiness check`
- esse check deve usar:
  - preset ativo
  - saldo atual
  - simbolo atual
  - `margin mode` real
  - `leverage` real
  - `min_order_size`, `tick_size`, `lot_size` e `max_leverage` do mercado
- se o sizing calculado ficar abaixo do minimo da Pacifica, o bot deve ser bloqueado com mensagem explicita
- o readiness check nao deve subir silenciosamente a ordem para o minimo da exchange
- se a pre-validacao passar, o backend executa `limit order + cancel order` com preco protegido e `amount` real calculado
- o readiness check nao precisa de TTL nem persistencia propria: ele sera executado sempre no `Start bot`

## Escopo Fechado
- criar check contextual no `Start bot`
- definir formula inicial de sizing para o produto
- definir semantica de `fixed_amount`
- adicionar suporte a configuracao de leverage por par no produto
- definir endpoint backend proprio
- definir resposta estruturada para UI
- impedir `resumeBot` de ativar o runtime sem esse check
- registrar auditoria minima

## Fora de Escopo
- alterar automaticamente leverage ou margin mode na Pacifica
- redesign completo da UX do dashboard
- reabrir o onboarding atual
- refatorar todo o worker nesta etapa

## Estado Atual

### Runtime
Hoje `resumeBot`:
- valida apenas presença de wallet
- delega para o repository
- promove `botStatus` para `active`
- nao executa check de sizing, leverage ou mercado

### Sizing
Hoje o sizing real do trade:
- so e calculado no worker
- usa `availableBalance` e `positionSizeValue`
- nao considera leverage explicitamente

### Floor silencioso
Hoje a normalizacao de ordem usa:
- `effectiveNotionalUsd = max(minOrderSize, targetNotionalUsd)`

Esse comportamento e aceitavel como detalhe tecnico de execucao do worker atual, mas nao deve ser a semantica do `Start bot readiness check`.

## Direcao de Produto Fechada
- o usuario deve ser informado quando o sizing calculado ficar abaixo do minimo da Pacifica
- o bot nao deve iniciar nesse caso
- o readiness check deve acontecer no clique de `Start bot`
- o probe deve usar o mercado do preset ativo
- o probe deve usar o valor real calculado com base no saldo atual da conta
- o sistema deve considerar a configuracao real de leverage da conta na exchange
- o produto deve expor configuracao de leverage por par, respeitando o limite real retornado pela Pacifica

## Semantica de Sizing

## Pergunta que o produto quer responder
"Com a configuracao atual da conta e do preset, e possivel operar esse bot agora?"

## Formula proposta para o produto
Precisamos alinhar a semantica de `positionSizeValue` para o caso `balance_percent`.

### Definicao adotada neste design
Enquanto o label de produto continuar descrevendo percentual sobre margem, o significado operacional proposto passa a ser:

```text
target_initial_margin_usd = available_balance * (position_size_percent / 100)
target_notional_usd = target_initial_margin_usd * effective_leverage
```

Onde:
- `available_balance` vem de `GET /api/v1/account`
- `effective_leverage` vem de `GET /api/v1/account/settings`
- se `account/settings` nao trouxer valor para o simbolo, assumir default oficial da Pacifica:
  - `margin_mode = cross`
  - `leverage = max_leverage` do mercado

### Exemplo
- `availableBalance = 2`
- `positionSizeValue = 5`
- `effectiveLeverage = 50`

Entao:
- `targetInitialMarginUsd = 0.10`
- `targetNotionalUsd = 5`

Se o mercado exigir `min_order_size = 10`, o readiness check falha.

## Semantica de `fixed_amount`
Decisao de produto:
- `fixed_amount` representa o notional final desejado da posicao
- ele ja considera leverage implicitamente

Exemplo:
- usuario quer operar sempre com `20 USD`
- esse `20 USD` e o tamanho final da posicao
- a margem necessaria sera:

```text
required_initial_margin_usd = fixed_amount_usd / effective_leverage
```

Exemplo pratico:
- `fixedAmountUsd = 20`
- `effectiveLeverage = 10`
- `requiredInitialMarginUsd = 2`

Se a conta tiver apenas `3 USD`, a posicao pode ser possivel.

Se a conta tiver leverage menor e a margem resultante nao couber:
- o readiness check falha
- ou o usuario precisa aumentar o leverage, dentro do limite do par

## Regra consolidada de sizing

### `balance_percent`
```text
target_initial_margin_usd = available_balance * (position_size_percent / 100)
target_notional_usd = target_initial_margin_usd * effective_leverage
```

### `fixed_amount`
```text
target_notional_usd = fixed_amount_usd
target_initial_margin_usd = fixed_amount_usd / effective_leverage
```

## Observacao Importante
Essa formula diverge do codigo atual do worker.

Hoje o worker usa:

```text
target_notional_usd = available_balance * (position_size_percent / 100)
```

Entao, para implementar este design, precisamos extrair a regra de sizing para modulo compartilhado e atualizar o worker para a mesma formula.

## Decisao de Compatibilidade
Nao devemos ter duas formulas diferentes:
- uma no `Start bot`
- outra no worker

Decisao:
- o readiness check e o worker devem compartilhar exatamente a mesma regra de sizing

## Design de API Proposto

### Fluxo integrado ao endpoint existente
Nao criar endpoint dedicado de readiness.

Decisao:
- o readiness check deve rodar como step interno do `POST /api/runtime/resume`
- o app continua usando apenas os endpoints operacionais ja existentes

### Responsabilidade do `resume`
Antes de promover `botStatus = active`, o `resume` deve:
- validar se a conta e o preset ativo estao prontos para operar naquele instante
- executar o probe tecnico `limit + cancel` quando a pre-validacao passar
- bloquear o `resume` quando a readiness falhar

### Contrato externo do app
O app continua chamando:

```text
POST /api/runtime/resume
```

Em caso de sucesso:
- o comando de `resume` e concluido normalmente

Em caso de falha de readiness:
- o `resume` responde erro
- com mensagem detalhada suficiente para a UI

Observacao:
- o diagnostico interno do readiness continua existindo no backend
- mas nao e exposto como endpoint publico separado

## Mapeamento Inicial de Erros
- `wallet_not_connected`
- `account_not_ready`
- `active_preset_not_found`
- `market_not_found`
- `account_settings_unavailable`
- `invalid_leverage_configuration`
- `trade_below_market_minimum`
- `trade_above_market_maximum`
- `leverage_above_market_maximum`
- `leverage_not_configured`
- `insufficient_margin`
- `signature_rejected`
- `agent_wallet_unauthorized_for_account`
- `provider_unavailable`
- `rate_limited`
- `internal_error`

## Fluxo Proposto

### Passo 1. Resolver conta e preset ativo
A API deve:
- localizar `OperatorAccount`
- validar que existe credencial ativa
- validar que existe `PresetActivation` ativa

Sem isso:
- o readiness check falha antes de qualquer chamada externa

### Passo 2. Ler estado atual da Pacifica
Chamar:
- `GET /api/v1/account`
- `GET /api/v1/account/settings`
- `GET /api/v1/info`
- `GET /api/v1/info/prices`

Objetivo:
- `availableBalance`
- `margin mode`
- `leverage`
- `max_leverage`
- `min_order_size`
- `tick_size`
- `lot_size`
- preco atual do simbolo

### Passo 2.1. Resolver leverage configuravel por par
O produto deve passar a expor leverage por simbolo suportado.

Regra:
- as opcoes de leverage devem ser limitadas pelo `max_leverage` retornado em `GET /api/v1/info`
- nao devemos hardcodar `BTC = 50`, `ETH = 50`, `SOL = 20`
- esses valores devem sempre ser lidos da Pacifica

Direcao de implementacao:
- ao abrir ou revisar o preset, o app busca os limites reais do simbolo
- o usuario escolhe o leverage desejado dentro desse intervalo
- esse leverage passa a fazer parte da configuracao ativa do preset ou do runtime configuravel da conta

Observacao:
- a documentacao oficial confirma que `max_leverage` e exposto por mercado
- exemplos estaticos na doc nao devem ser tratados como fonte canonica para valores atuais

### Passo 3. Resolver configuracao efetiva de margin/leverage
Regra:
- se o produto tiver leverage configurado pelo usuario para o simbolo:
  - validar que esse valor e `<= max_leverage`
  - se a conta na Pacifica ainda nao estiver com esse leverage, o bot nao deve iniciar
  - o readiness check deve informar divergencia de configuracao
- se nao houver leverage configurado no produto e `account/settings` trouxer valor para o simbolo, usar esse valor
- se nao houver leverage configurado no produto e `account/settings` nao trouxer valor, assumir o default oficial da Pacifica

Default oficial assumido:
- `marginMode = cross`
- `leverage = market.max_leverage`

### Decisao de coerencia
O readiness check nao deve alterar leverage automaticamente na Pacifica.

Se houver divergencia entre:
- leverage desejado no produto
- leverage atual da conta na exchange

o resultado deve ser:
- `blocked`
- com mensagem explicita para o usuario

### Passo 4. Calcular sizing
Para `fixed_amount`:

```text
target_notional_usd = fixed_amount
target_initial_margin_usd = target_notional_usd / effective_leverage
```

Para `balance_percent`:

```text
target_initial_margin_usd = available_balance * (position_size_percent / 100)
target_notional_usd = target_initial_margin_usd * effective_leverage
```

### Passo 5. Rodar pre-validacao sem side effect
Bloquear sem criar ordem se:
- `target_notional_usd < min_order_size`
- `target_notional_usd > max_order_size`, se o mercado expuser esse valor
- `effective_leverage > max_leverage`
- `leverage_configured_by_user` divergir do leverage efetivo da conta
- `target_initial_margin_usd <= 0`
- `target_initial_margin_usd > available_balance`

### Passo 6. Montar probe tecnico
Se a pre-validacao passar:
- usar o simbolo do preset
- buscar o lado do probe
- calcular `probeLimitPrice`

Regra de preco do probe:
- para `bid`, usar `current_price * 0.8`
- arredondar para `tick_size`

Primeiro corte:
- usar sempre `bid`
- objetivo e readiness operacional, nao simulacao fiel de direcao do sinal

### Passo 7. Criar e cancelar a ordem
Criar `limit order`:
- com `TIF = ALO`
- com `clientOrderId` proprio
- com `amount` calculado a partir do `targetNotionalUsd` real

Depois:
- cancelar imediatamente

### Passo 8. Persistir evento
Registrar `OperationalEvent` com:
- `eventType = bot_command`
- `title = Start bot readiness check`
- payload com todos os campos relevantes do calculo

## Contrato de Dominio Proposto

### Novo caso de uso
`createStartBotReadinessCheck`

Entrada:
- `walletAddress`

Saida:
- `status`
- `readinessStatus`
- `code`
- `message`
- `result`

### Novo gateway Pacifica
`PacificaStartBotReadinessGateway`

Responsabilidades:
- ler `account`, `account/settings`, `market info` e `prices`
- resolver `marginMode` e `leverage`
- calcular sizing
- executar `limit order + cancel`
- mapear erros da Pacifica

### Contrato de configuracao pro produto
Precisaremos adicionar leverage configuravel em um contrato operacional separado por simbolo.

Decisao:
- nao adicionar `leverage` ao `PresetEditableConfig`
- modelar `leverage` como configuracao operacional separada por simbolo

Motivo:
- leverage e uma configuracao de execucao da conta/mercado, nao da estrategia em si
- multiplos presets podem operar o mesmo simbolo
- evita acoplar comportamento de mercado ao contrato semantico do preset
- facilita reconciliar divergencias entre produto e exchange por simbolo

## Integracao com `resumeBot`

## Regra nova
`resumeBot` nao pode mais promover `botStatus = active` diretamente.

Fluxo novo:
1. usuario clica em `Start bot` ou `Resume bot`
2. app chama `POST /api/runtime/resume`
3. o backend executa o readiness check internamente
4. se o readiness passar, o backend conclui o `resume`
5. se o readiness falhar, o backend bloqueia o `resume`

## Regra de seguranca
O readiness check e um processo sincrono do fluxo de `Start bot`.

Decisao:
- nao salvar readiness check
- nao usar TTL
- nao criar estado persistido de readiness

Isso significa:
- toda tentativa de entrada em operacao executa o readiness check do zero
- se o check passar, o proprio `resume` segue
- se o check falhar, o proprio `resume` falha

Observacao:
- a protecao principal fica no backend do `resume`
- nesta etapa, nao vamos adicionar armazenamento proprio de readiness

## UI Proposta

### Dashboard
Ao clicar em `Start bot`:
- mostrar estado `loading`
- chamar `resume`
- se o backend bloquear por readiness, mostrar mensagem detalhada
- se passar, o bot entra em operacao

### Mensagem recomendada para minimo
Exemplo:

```text
Com o saldo atual, leverage atual e configuracao deste preset, o valor calculado para a ordem e 5 USD. A Pacifica exige minimo de 10 USD para este mercado.
```

### Mensagem recomendada para leverage
Exemplo:

```text
O bot esta configurado para 20x neste mercado. A Pacifica atualmente esta com 10x. Ajuste o leverage antes de iniciar.
```

## Mudancas de Codigo Esperadas

### `packages/contracts`
- novo schema de request/response do readiness check
- novos `error codes`
- adicionar contrato de configuracao operacional por simbolo

### `apps/api`
- novo use case `createStartBotReadinessCheck`
- novo gateway Pacifica para `account/settings` e `prices`
- readiness embutido no `resumeBot`

### `apps/app`
- ajuste no `DashboardPage` para continuar chamando apenas `resume`
- exibir mensagem estruturada quando `blocked`
- exibir seletor de leverage por par usando limite real da Pacifica

### `apps/worker`
- extrair formula de sizing para modulo compartilhado
- alinhar o worker com a formula final aprovada
- usar leverage vindo da configuracao ativa

## Riscos
- `account/settings` pode vir vazio e exigir fallback correto para defaults da Pacifica
- o produto hoje pode comunicar `position size` como percentual sem deixar claro se e margem ou notional
- se nao alinharmos worker e readiness check, teremos inconsistencias
- `ALO` reduz risco de execucao, mas nao elimina 100% se houver comportamento inesperado de venue ou latencia extrema
- se algum cliente chamar `resumeBot` isoladamente sem passar pelo readiness, esse bypass continua possivel ate endurecermos a API de `resume`
- adicionar leverage ao produto sem definir bem a ownership da configuracao entre app e exchange pode gerar drift frequente

## Decisoes Tecnicas Recomendadas
- tratar o readiness check como gate obrigatorio do `Start bot`
- tratar o readiness check como gate interno do `resume`
- nao ajustar silenciosamente sizing abaixo do minimo
- usar leverage configurado por par no produto, validado contra a Pacifica
- assumir default oficial quando `account/settings` vier vazio
- executar readiness sempre no `Start bot`, sem TTL
- unificar formula de sizing entre API e worker

## Open Questions
- o readiness deve ser refeito se o usuario trocar de preset ou apenas se o saldo mudar materialmente?

## Proximo Passo Recomendado
Se este design for aprovado, o proximo passo e endurecer ainda mais o `resume` como unico gateway de entrada em operacao e limpar qualquer resquicio de fluxo paralelo no app.
