# YOUR Strategy - BG-032 Tech Plan

## Objetivo
Registrar o plano tecnico inicial de implementacao da feature `YOUR Strategy`, reduzindo retrabalho e deixando explicitas as decisoes arquiteturais necessarias antes da execucao forte da UI.

## Base Ja Existente
O projeto ja possui componentes reutilizaveis importantes:
- `packages/contracts`
  - contrato tecnico de preset/estrategia
  - tipos de regras, indicadores, risco e execution
- `packages/preset-engine`
  - materializacao de contrato efetivo
  - avaliacao de sinal
  - geracao de risk plan
  - simulacao de backtest
- `apps/api`
  - preview de backtest
  - ativacao real de preset
  - readiness operacional
  - runtime operacional
- `apps/app`
  - pagina de presets com preview/backtest
  - baseline de ativacao e consumo de sessao operacional

## Leitura Tecnica
`YOUR Strategy` nao exige um motor novo. O requisito novo real e permitir que um usuario gere e persista um contrato custom que continue compativel com o motor e com o fluxo operacional atual.

O sistema atual sabe trabalhar bem com:
- `PresetDefinition` de catalogo
- `PresetEditableConfig` simples para simbolo, size e toggle de `long/short`

O sistema atual ainda nao sabe representar, por conta/usuario:
- regras custom de `entry`
- regras custom de `stop loss`
- regras custom de `take profit`
- ownership do preset custom
- estado draft vs salvo de uma strategy personalizada

## Decisoes Arquiteturais
### 1. `YOUR Strategy` deve continuar no universo de contrato tecnico atual
- decisao: `YOUR Strategy` deve gerar `PresetTechnicalContract` compativel com o motor existente
- motivo: evita fork de engine e mantem preview, avaliacao e runtime no mesmo trilho

### 2. Nao usar apenas `PresetEditableConfig` para modelar a feature
- decisao: criar um modelo proprio de draft/custom strategy, em vez de tentar encaixar tudo no `PresetEditableConfig`
- motivo: `PresetEditableConfig` atual nao representa regras complexas de `entry`, `stop loss` e `take profit`

### 3. Persistencia canonica por conta
- decisao: existir apenas `1 YOUR Strategy` persistida por conta
- motivo: essa e a regra de produto fechada para a V1

### 4. Separar draft editavel de contrato salvo
- decisao: o builder deve ter um shape proprio de draft, e o save deve materializar o contrato tecnico salvo
- motivo: o produto permite limpar o front sem persistir automaticamente

### 5. Preview e ativacao devem operar sobre contrato materializado
- decisao: preview/backtest e ativacao nao devem ler o estado bruto do wizard; devem consumir um contrato materializado e validado
- motivo: reduz divergencia entre UX, preview e runtime

### 6. Ativacao continua no fluxo operacional existente
- decisao: `YOUR Strategy` deve reutilizar o mesmo fluxo de ativacao/readiness/runtime dos presets padrao
- motivo: manter uma unica trilha operacional canonica

## Primeiro Corte Recomendado
Implementar nesta ordem:

1. Modelo persistido do registro custom por conta
- ownership por conta
- unicidade por conta
- estado draft/salvo
- metadata basica de atualizacao

2. Contrato do builder
- shape do draft do wizard
- validacoes estruturais
- limites de complexidade (`3 AND` / `3 OR`)

3. Materializacao
- funcao pura que converte o draft em `PresetTechnicalContract`
- validacoes de negocio antes de salvar

4. API de save/load
- `getYourStrategy`
- `saveYourStrategy`

5. Integracao com preview
- reutilizar o preview de backtest existente
- operar sobre contrato materializado

6. Integracao com ativacao
- exigir backtest antes de ativar
- reutilizar fluxo atual de ativacao/readiness

7. UI do wizard
- so depois de contrato + persistencia + preview estarem claros

## Checklist de Desenvolvimento
### Modelo e persistencia
- [x] definir entidade persistida de `YOUR Strategy`
- [x] garantir `1 YOUR Strategy` por conta
- [x] persistir ownership explicito
- [x] decidir campos de draft vs salvo
- [x] decidir se o contrato salvo fica normalizado em colunas ou em `Json`

### Contratos e validacao
- [x] definir schema do draft do wizard em `packages/contracts`
- [x] validar `long` ou `short` obrigatorio
- [x] validar `stop loss` obrigatorio
- [x] validar `take profit` opcional com warning/confirmacao
- [x] validar limites de `symbol` e `timeframe`
- [ ] validar limite estrutural de grupos `AND/OR`

### Materializacao e engine
- [x] criar funcao de materializacao `draft -> PresetTechnicalContract`
- [x] garantir compatibilidade com `evaluatePresetSignal`
- [x] garantir compatibilidade com `simulatePresetBacktest`
- [x] garantir compatibilidade com `buildPresetRiskPlans`

### API
- [x] criar `getYourStrategy`
- [x] criar `saveYourStrategy`
- [x] decidir se `preview` usa endpoint novo ou reaproveita o atual
- [x] decidir como a ativacao referencia a strategy custom no backend

### App / UX
- [x] encaixar `YOUR Strategy` como quarto card fixo
- [ ] bloquear edicao com bot rodando
- [x] suportar limpar builder sem persistencia automatica
- [x] mostrar preview/backtest antes da ativacao
- [x] exigir backtest antes da ativacao

### Runtime operacional
- [ ] garantir que a strategy custom ativa produz contrato consumivel pelo runtime
- [ ] garantir que `Start bot readiness check` continua igual
- [ ] garantir que worker/runtime nao precisem de branch especial para strategy custom

### Testes
- [x] testes unitarios da materializacao
- [ ] testes unitarios das validacoes do draft
- [ ] testes de persistencia por conta
- [ ] testes de preview usando contrato custom
- [ ] testes de ativacao com gate de backtest

## Estado Atual do Primeiro Corte
O primeiro corte entregue neste momento cobre:
- persistencia de `1 YOUR Strategy` por conta via tabela propria
- save/load backend com rotas HTTP dedicadas
- schema canonico do draft em `packages/contracts`
- materializacao do draft para `PresetTechnicalContract`
- blockers explicitos quando o draft ainda nao pode ser ativado
- preview/backtest dedicado de `YOUR Strategy` com `draft` inline opcional
- ativacao dedicada da `YOUR Strategy` com gate de backtest por fingerprint do draft salvo
- quarto card fixo de `YOUR Strategy` na pagina de presets
- editor frontend do draft salvo com validacao por schema
- acoes de `save`, `reload`, `reset`, `backtest preview` e `activate` no frontend

O que ainda nao entrou neste corte:
- wizard guiado final do handoff
- limite estrutural de grupos `AND/OR`

## Follow-up de UX e Bugs Encontrados em Validacao
Durante a validacao manual do primeiro corte frontend, surgiram ajustes obrigatorios para alinhar a feature com a decisao de produto:
- nomeacao inconsistente de indicadores ao trocar o tipo no builder
- necessidade de modal dedicado para nao poluir a tela base de presets
- `preview and activation` precisava virar o ultimo passo do wizard
- ausencia de sinal visual claro para `long` e `short`
- modelagem frouxa de `volume`, sem guardrail para comparacao com media de volume
- `stop loss` com modos selecionaveis, mas parametros ainda fixos no front
- `take profit` simplificado demais e sem step proprio
- erro de preview com `ATR` quando o draft nao carregava suporte suficiente no contrato materializado

Direcao aplicada nesta rodada:
- mover `YOUR Strategy` para uma experiencia em modal
- reorganizar o wizard para 7 passos, deixando preview e ativacao no final
- permitir configuracao real de `stop loss` estatico e `ATR`
- separar `take profit` em step proprio com configuracao do multiplo `RR`
- auto-injetar suporte `ATR` no contrato materializado quando necessario
- endurecer naming e referencias de indicadores para preservar coerencia do draft

### Segunda rodada resolvida em 2026-04-10
- corrigir toggle visual de `long` e `short` dentro do modal
- remover badge redundante dos cards de indicador e padronizar naming carregado de drafts antigos
- destacar a acao de remover indicador/regra com tom de `danger`
- tornar explicito no builder quando um indicador e derivado de `volume`
- remover o campo `source` editavel para indicadores derivados de volume
- impedir mistura de contextos de calculo em regras de `cross`
- impedir threshold numerico em `volume`, forçando comparacao com media de volume
- habilitar `EMA` derivada de `volume` no contrato e no motor
- remover duplicacao de `position size` no passo de risco
- corrigir alinhamento visual dos sufixos `%` e `R`
- trocar o raw JSON exposto ao usuario por resumo legivel da estrategia
- passar a listar inconsistencias com instrucao objetiva de correcao
- permitir preview com `take profit` desligado de forma apenas indicativa, mantendo o aviso explicito no frontend

### Terceira rodada resolvida em 2026-04-10
- bloquear o avancar do passo inicial quando `long` e `short` estiverem ambos desligados
- tornar os passos de `Long entry builder` e `Short entry builder` condicionais aos lados ativos
- adicionar `PRICE` como referencia explicita para regras de contexto de preco
- ampliar o contrato das regras para suportar:
  - `threshold` com referencia (`EMA12 above PRICE`, `EMA12 above EMA21`)
  - `cross` com valor numerico (`RSI crossesAbove 70`)
- fechar semanticamente os contextos:
  - preco/tendencia: `EMA`, `SMA`, `PRICE`
  - momentum: `RSI`
  - confirmacao: `Volume` contra `VOLUME_SMA` ou `VOLUME_EMA`
  - volatilidade: `ATR` restrito ao stop loss
- remover `ATR` das opcoes de indicador do builder de entrada
- impedir input fora do range `0..100` para `RSI`

## Descobertas Operacionais em Validacao Real
Durante os testes ponta a ponta com Pacifica real, surgiram problemas fora do builder que impactavam a execucao do runtime, a protecao de posicao e o fechamento manual.

### 1. Abertura da ordem funcionava, mas TP/SL embutido na market order falhava
- sintoma: `create_market_order` retornava `400` vazio quando o worker tentava enviar `takeProfit` e `stopLoss` junto da abertura
- causa mapeada: a Pacifica aceitava melhor o fluxo validado na POC antiga:
  1. abrir a posicao com `create_market_order`
  2. esperar a posicao aparecer em `/positions`
  3. aplicar protecao via `set_position_tpsl`
- correcao aplicada:
  - `createMarketOrder()` voltou a enviar apenas a abertura
  - o worker passou a aguardar a posicao ficar visivel antes de chamar `setPositionTpsl()`
  - a aplicacao de protecao ganhou retry controlado para o caso de `400` vazio logo apos a abertura

### 2. Observabilidade de erro da Pacifica estava fraca
- sintoma: `responseJson` e `responseBody` apareciam como `null` em falhas relevantes
- causa mapeada: o parser do client perdia o corpo cru em respostas nao-json ou malformadas
- correcao aplicada:
  - o client Pacifica passou a ler sempre o texto bruto primeiro
  - se o parse JSON falhar, o body passa a ser preservado como `{ raw }`
  - o worker passou a persistir `requestPayload`, `normalizedOrder`, `marketInfoPayload` e `responseBody` nas falhas

### 3. `currentTrades` nao aparecia automaticamente no app
- sintoma: havia trade aberto no backend, mas a UI permanecia stale
- causa mapeada: a sessao operacional no app nao era repuxada com frequencia suficiente apos abertura real feita pelo worker
- correcao aplicada:
  - a bridge de sessao da wallet passou a fazer polling leve de `/api/account/session`
  - o estado `currentTrades` passou a aparecer sozinho sem refresh manual

### 4. `Close trade` inicialmente fechava apenas localmente
- sintoma: clicar em `Close trade` removia o trade do produto sem fechar a posicao real na Pacifica
- causa mapeada: a API estava encerrando o trade no read model local sem delegar a execucao real ao worker
- correcao aplicada:
  - `Close trade` passou a significar apenas intencao persistida
  - a API marca `closeRequestedAt` + `closeReasonPending = manual`
  - o worker envia a ordem real de fechamento com `reduce_only`

### 5. Fechamento manual nao rodava com bot pausado
- sintoma: o trade ficava com `close requested`, mas nada acontecia
- causa mapeada: o worker ignorava contas pausadas e tambem largava o loop cedo demais
- correcao aplicada:
  - contas pausadas com fechamento manual pendente passaram a entrar como candidatas
  - o loop agora processa `manual close` mesmo com `botStatus = paused`

### 6. Reconciliacao da API invertia lado de posicao `ask/bid`
- sintoma: uma posicao short reportada pela Pacifica aparecia como long no produto
- causa mapeada: o gateway da conta Pacifica so entendia `long/short`; quando recebia `ask/bid`, ele inferia o lado pelo sinal de `amount`, mas a Pacifica retorna `amount` positivo com `side = ask`
- correcao aplicada:
  - `ask` passou a ser normalizado como `short`
  - `bid` passou a ser normalizado como `long`
  - o caso ficou coberto por teste automatizado

### 7. Reconciliacao limpava o estado de `close_requested`
- sintoma: o usuario pedia `Close trade`, mas a reconciliacao voltava o trade para `open`, fazendo o worker deixar de enxerga-lo como pendente
- causa mapeada: a sincronizacao do snapshot externo regravava `tradeStatus = open` sempre que a Pacifica ainda reportava a posicao aberta
- correcao aplicada:
  - a reconciliacao agora preserva `close_requested` quando o fechamento manual ja foi solicitado
  - o worker passou a detectar pendencia manual por `closeRequestedAt != null` + `closeReasonPending = manual`, sem depender so de `tradeStatus`

## Estado Resultante
A trilha operacional consolidada ficou assim:
- ordem abre via `create_market_order`
- posicao e aguardada em `/positions`
- protecao e aplicada separadamente via `set_position_tpsl`
- `Close trade` registra intencao e nao executa localmente
- worker executa o fechamento real com `reduce_only`
- API e UI reconciliam o lado correto da posicao (`bid/ask`)
- reconciliacao preserva pendencias de fechamento manual ate o worker consumir

## Checklist de Decisoes em Aberto
- [ ] onde persistir o draft do wizard: tabela propria ou JSON no registro custom
- [ ] como representar `trailing take profit` na V1 sem semantica aberta demais
- [ ] como a ativacao vai referenciar a strategy custom: novo tipo de `PresetDefinition`, definicao virtual, ou outra chave canonica
- [ ] qual e o shape minimo do contrato salvo para nao acoplar UI a runtime

## Recomendacao Final
O caminho com menor risco e:
- fechar primeiro persistencia + contrato + materializacao
- plugar depois preview e ativacao
- deixar a UI do wizard como ultima grande camada

Isso preserva o reaproveitamento do motor atual e evita construir uma UX rica sobre um modelo tecnico ainda ambiguo.
