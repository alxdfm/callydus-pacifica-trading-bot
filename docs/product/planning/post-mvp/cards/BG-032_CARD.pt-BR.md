# BG-032 Card

## Status
- status: `IN_PROGRESS`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- area: `presets / strategy builder`
- ultima atualizacao: `2026-04-09`

## Objetivo
Implementar a trilha funcional de `YOUR Strategy`, incluindo persistencia do registro custom por conta, builder guiado, geracao de contrato compatível, backtest preview e ativacao real.

## Escopo Fechado
- criar suporte a `1 YOUR Strategy` por conta
- persistir ownership do registro custom
- permitir edicao do mesmo registro custom existente
- suportar `long`, `short` ou ambos
- suportar regras separadas por lado
- suportar builder para `entry`, `stop loss` e `take profit`
- gerar contrato compatível com o formato atual de preset/estrategia
- limitar `symbols` a `BTC/USDC`, `ETH/USDC`, `SOL/USDC`
- limitar `timeframes` a `3m`, `5m`, `15m`
- integrar ao backtest preview existente
- exigir backtest antes da ativacao
- reutilizar o mesmo fluxo de ativacao e `Start bot readiness check`
- bloquear edicao com bot rodando

## Fora de Escopo
- multiplas estrategias customizadas por conta
- leverage configuravel no builder
- parcial
- multiplos alvos
- multiplas entradas
- `break even`
- `pyramiding`

## Dependencias
- [ ] BG-031 validado
- [ ] BG-029 refinado para handoff final
- [ ] BG-028 concluido
- [ ] FM-013 a FM-017 em baseline utilizavel

## Critérios de Aceite Iniciais
- [x] existe registro custom unico por conta
- [x] o builder gera contrato compativel com o motor atual
- [ ] o save nao exige backtest obrigatorio
- [ ] a ativacao exige backtest obrigatorio
- [ ] a ativacao segue o mesmo fluxo operacional dos presets padrao
- [ ] edicao fica bloqueada com bot rodando

## Proximo Passo Recomendado
Dev mapear primeiro o modelo do registro custom e o contrato gerado, antes de entrar forte na UI do wizard.

## Analise Tecnica Inicial
O repositorio ja possui uma base forte que reduz retrabalho para `BG-032`:
- o contrato tecnico de preset/estrategia ja existe em `packages/contracts`
- o motor de estrategia, materializacao de contrato e simulacao/backtest ja existem em `packages/preset-engine`
- o preview de backtest ja existe na API e na pagina de presets
- o fluxo de ativacao real, readiness check e runtime operacional ja existe para os presets padrao

Isso significa que `BG-032` nao precisa criar um motor novo. O gap principal e:
- persistir `1 YOUR Strategy` por conta
- gerar um `PresetTechnicalContract` custom compativel com o motor atual
- conectar esse contrato custom ao preview e ao fluxo de ativacao

### Primeiro Corte Recomendado
Antes da UI completa do wizard, implementar:
- modelo persistido do registro custom por conta
- casos de uso de `get/save`
- materializacao do builder em `PresetTechnicalContract`
- integracao desse contrato com o backtest preview existente

### Riscos Principais
- tentar acoplar `YOUR Strategy` ao `PresetEditableConfig` atual, que hoje e simples demais para representar `entry`, `stop loss` e `take profit` custom
- espalhar a semantica do builder entre `app`, `api` e `worker` sem um contrato canonico unico
- entrar cedo demais na UX sem fechar antes o shape persistido e o contrato tecnico gerado

## Log de Acompanhamento
- `2026-04-09`: card criado a partir do fechamento de produto da feature `YOUR Strategy`.
- `2026-04-09`: analise inicial de dev concluiu que o caminho correto e reaproveitar `contracts + preset-engine + preview existente`, focando primeiro em persistencia do registro custom, ownership por conta e geracao do `PresetTechnicalContract` custom antes de fechar a UI do wizard.
- `2026-04-09`: primeiro corte backend implementado com tabela `YourStrategy`, schema de draft em `packages/contracts`, materializacao para `PresetTechnicalContract`, casos de uso `get/save` e rotas HTTP dedicadas.
- `2026-04-09`: segundo corte backend implementado com preview/backtest dedicado de `YOUR Strategy`, aceitando `draft` inline ou strategy salva por wallet, sem alterar o contrato de preview dos presets padrao.
