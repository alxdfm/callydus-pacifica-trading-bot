# BG-028 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P1`
- owner: `Dev`
- area: `presets / strategy preview`
- ultima atualizacao: `2026-04-07`

## Objetivo
Exibir um preview de backtest abaixo do `preset-showcase`, permitindo ao usuario entender rapidamente como o preset teria evoluido no periodo recente e como ele se compara a `buy and hold`.

## Contexto
O fluxo de presets ja mostrava explicacao de gatilhos e revisao dos campos editaveis, mas ainda faltava uma camada de validacao historica visivel. A direcao de produto fechada foi:
- calcular tudo sob demanda
- nao persistir resultado em banco
- manter fidelidade maxima com a engine real do bot
- comparar estrategia vs hold
- expor `drawdown` como metrica de leitura rapida

## Escopo Fechado
- endpoint efemero `POST /api/presets/backtest-preview`
- contrato compartilhado de request/response para preview de backtest
- simulacao candle a candle no `preset-engine`
- materializacao do `effectiveContract` compartilhada entre ativacao, avaliacao e backtest
- comparacao `strategy vs hold`
- metricas de `strategy return`, `hold return`, `alpha vs hold`, `max drawdown`, `win rate` e `total trades`
- lista resumida de trades simulados na tela de presets
- bloco visual abaixo do `preset-showcase`
- periodo fixo de `ultimos 7 dias`
- documentacao tecnica dedicada do slice

## Fora de Escopo
- persistencia de relatorios de backtest
- seletor manual de periodo
- cache dedicado no backend
- comparacao lado a lado entre multiplos presets
- candle chart completo com markers de entrada/saida
- total paridade com todas as nuances da execucao real de ordem na Pacifica

## Dependencias
- [x] FM-004 concluido
- [x] FM-005 concluido
- [x] FM-006 concluido
- [x] FM-014 concluido
- [x] BG-023 concluido para consumo local-first de candles/snapshots

## Critérios de Aceite Iniciais
- [x] ao selecionar um preset, a tela dispara simulacao sob demanda
- [x] o resultado nao e persistido em banco
- [x] a simulacao reutiliza a mesma engine de sinal do bot
- [x] o preview compara estrategia vs `buy and hold`
- [x] `max drawdown` e exibido no resumo
- [x] a tela de presets passa a mostrar trades simulados abaixo do showcase
- [x] o periodo atual fica fixo em `ultimos 7 dias`

## Proximo Passo Recomendado
Adicionar configuracao de periodo, fees/slippage e capital inicial direto na UI apenas depois de validar a utilidade do preview fixo no fluxo real de selecao de preset.

## Log de Acompanhamento
- `2026-04-07`: card criado para consolidar a entrega do preview de backtest na tela de presets.
- `2026-04-07`: frontend passou a exibir um bloco abaixo do `preset-showcase` com `strategy vs hold`, metricas e trades simulados.
- `2026-04-07`: API ganhou o endpoint efemero `POST /api/presets/backtest-preview`, sem persistencia de resultado.
- `2026-04-07`: `preset-engine` passou a expor simulacao candle a candle e materializacao compartilhada do `effectiveContract`.
- `2026-04-07`: `ActivatePreset` e `EvaluatePresetSignal` foram alinhados para usar o mesmo `effectiveContract`, reduzindo divergencia entre preview e runtime.
- `2026-04-07`: o periodo do preview foi fechado em `ultimos 7 dias` e o loop de requests no frontend foi corrigido com dependencias estaveis no efeito de carregamento.
- `2026-04-07`: documentacao tecnica complementar registrada em `docs/dev/PRESET_BACKTEST_PREVIEW_TECH_DESIGN.pt-BR.md`.
