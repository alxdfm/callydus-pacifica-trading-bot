# BG-032 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P1`
- owner: `Dev`
- area: `presets / strategy builder`
- ultima atualizacao: `2026-04-11`

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
- [x] o save nao exige backtest obrigatorio
- [x] a ativacao exige backtest obrigatorio
- [x] a ativacao segue o mesmo fluxo operacional dos presets padrao
- [x] edicao fica bloqueada com bot rodando

## Proximo Passo Recomendado
Dev mapear primeiro o modelo do registro custom e o contrato gerado, antes de entrar forte na UI do wizard.

## Proximos Tickets Tecnicos
- `P0`: fechado
- `P1`: revisao final das mensagens de erro e blockers do wizard
- `P2`: limite estrutural de grupos `AND/OR`
- `P2`: endurecimento adicional de complexidade do builder, se o UX pedir
- `P2`: decidir se modos adicionais de `take profit` entram na V1

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
- `2026-04-09`: terceiro corte backend implementado com ativacao dedicada de `YOUR Strategy`, exigindo backtest previo por fingerprint do draft salvo e reutilizando o fluxo operacional de ativacao de preset.
- `2026-04-10`: primeiro corte frontend implementado na pagina de presets com quarto card fixo de `YOUR Strategy`, editor do draft salvo via JSON validado em contrato, acoes de `save`, `reload`, `backtest preview` e `activate`, sem quebrar os 3 presets padrao.
- `2026-04-10`: follow-up de validacao manual identificou gaps no wizard inicial e levou a uma segunda rodada de frontend: `YOUR Strategy` foi movida para modal dedicado, o wizard passou a fechar `preview/activation` apenas no ultimo passo, o builder ganhou configuracao real de `stop loss`, step proprio de `take profit`, naming consistente de indicadores e suporte automatico a `ATR` no contrato materializado para evitar falha de preview.
- `2026-04-10`: segunda rodada de refinamento resolveu inconsistencias de contexto entre preco/volume/RSI/ATR, removeu o raw JSON da experiencia final, adicionou resumo legivel da estrategia e passou a expor mensagens de correcao objetivas para o usuario dentro do wizard.
- `2026-04-10`: terceira rodada de refinamento fechou o gate de `long/short` no passo inicial, tornou os passos de entrada condicionais aos lados ativos e ampliou o contrato das regras para suportar referencia `PRICE`, threshold com referencia e cross numerico de RSI sem misturar contextos de calculo.
- `2026-04-10`: validacao ponta a ponta com Pacifica real revelou uma trilha de bugs operacionais fora do wizard. Foram corrigidos o fluxo de abertura + protecao, a observabilidade de falha do client, a atualizacao automatica de `currentTrades`, a delegacao correta de `Close trade` para o worker, o processamento de fechamento manual com bot pausado, o mapeamento de `bid/ask` para `long/short` no snapshot externo e a preservacao de `close_requested` durante a reconciliacao.
- `2026-04-10`: ficou documentado que `YOUR Strategy` segue a mesma separacao de fluxo dos presets padrao: ativacao do preset nao roda readiness; o `startBotReadinessCheck` continua sendo executado no `Resume bot`, imediatamente antes do bot voltar a operar.
- `2026-04-10`: `P0` foi considerado fechado apos validacao de draft, persistencia, preview, ativacao e runtime real sem branch especial. O item de limite estrutural de grupos `AND/OR` foi rebaixado para `P2`, por nao ser bloqueador operacional neste momento.
- `2026-04-10`: mensagens e blockers do wizard foram revisados para devolver instrucoes mais objetivas sobre o que corrigir em cada inconsistencia.
