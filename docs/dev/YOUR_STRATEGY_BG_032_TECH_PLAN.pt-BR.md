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
- [ ] encaixar `YOUR Strategy` como quarto card fixo
- [ ] bloquear edicao com bot rodando
- [ ] suportar limpar builder sem persistencia automatica
- [ ] mostrar preview/backtest antes da ativacao
- [ ] exigir backtest antes da ativacao

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

O que ainda nao entrou neste corte:
- wizard/UX no frontend
- limite estrutural de grupos `AND/OR`

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
