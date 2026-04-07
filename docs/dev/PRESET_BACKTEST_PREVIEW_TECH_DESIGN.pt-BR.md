# Preset Backtest Preview — Tech Design

## Objetivo

Documentar a implementação do preview de backtest exibido abaixo do `preset-showcase` na tela de presets.

O escopo desta feature é:
- calcular a simulação sob demanda
- não persistir resultado em banco
- reutilizar a mesma engine de sinal do bot
- comparar estratégia vs `buy and hold`
- devolver métricas simples para UI

## Visão Geral

Ao selecionar ou editar um preset na tela de presets, o app dispara `POST /api/presets/backtest-preview`.

A API:
- resolve o contrato técnico base do preset
- materializa o contrato efetivo com `symbol`, `positionSizeValue`, `longEnabled` e `shortEnabled`
- busca candles recentes na Pacifica
- roda uma simulação candle a candle em memória
- devolve métricas, curvas e trades simulados

O resultado não é armazenado.

## Range Atual

O preview usa período fixo de:
- últimos `7 dias`

Essa decisão foi tomada para:
- simplificar a primeira entrega
- manter custo previsível por seleção de preset
- evitar superfície extra de estado na UI

## Arquitetura

### Contratos

Os contratos ficam em:
- [packages/contracts/src/index.ts](/home/dev/Projects/callydus-pacifica-trading-bot/packages/contracts/src/index.ts)

Principais schemas/tipos:
- `presetBacktestPreviewRequestSchema`
- `presetBacktestPreviewResponseSchema`
- `presetBacktestSummarySchema`
- `presetBacktestTradeSchema`

### Engine

O motor de simulação fica em:
- [packages/preset-engine/src/index.ts](/home/dev/Projects/callydus-pacifica-trading-bot/packages/preset-engine/src/index.ts)

Principais funções:
- `materializeEffectivePresetContract`
- `simulatePresetBacktest`
- `evaluatePresetSignal`
- `buildPresetRiskPlans`

### API

Caso de uso:
- [apps/api/src/application/preview-preset-backtest/PreviewPresetBacktest.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/application/preview-preset-backtest/PreviewPresetBacktest.ts)

Rota HTTP:
- [apps/api/src/ui/http/routes/createPreviewPresetBacktestRoute.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/ui/http/routes/createPreviewPresetBacktestRoute.ts)

Wiring:
- [apps/api/src/createApiModule.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/createApiModule.ts)
- [apps/api/src/ui/http/createApiRouter.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/ui/http/createApiRouter.ts)
- [apps/api/src/server.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/api/src/server.ts)

### Frontend

Backend adapter:
- [apps/app/src/features/presets/backend-backtest-preview.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/app/src/features/presets/backend-backtest-preview.ts)

Tela:
- [apps/app/src/ui/pages/PresetsPage.tsx](/home/dev/Projects/callydus-pacifica-trading-bot/apps/app/src/ui/pages/PresetsPage.tsx)

Mensagens:
- [apps/app/src/shared/i18n/messages.ts](/home/dev/Projects/callydus-pacifica-trading-bot/apps/app/src/shared/i18n/messages.ts)

Estilos:
- [apps/app/src/styles/app.css](/home/dev/Projects/callydus-pacifica-trading-bot/apps/app/src/styles/app.css)

## Fidelidade com o Runtime

O preview foi desenhado para ser o mais fiel possível às regras já usadas pelo bot.

Pontos importantes:
- usa o mesmo `PresetTechnicalContract`
- usa o mesmo `effectiveContract` derivado do draft editável
- usa a mesma `evaluatePresetSignal(...)`
- usa o mesmo `buildPresetRiskPlans(...)`
- respeita `onePositionPerSymbol`

Também foi corrigido um ponto de divergência anterior:
- `ActivatePreset` e `EvaluatePresetSignal` passaram a usar `materializeEffectivePresetContract(...)`

Com isso, `longEnabled`, `shortEnabled`, `symbol` e `positionSizeValue` ficam alinhados entre ativação, avaliação e backtest.

## Modelo de Execução da Simulação

Assunções do MVP atual:
- o sinal é avaliado no fechamento do candle
- a entrada simulada ocorre na abertura do próximo candle
- `stop loss` e `take profit` são monitorados nos candles seguintes
- se `SL` e `TP` forem tocados no mesmo candle, o `SL` vence
- existe no máximo uma posição aberta por símbolo
- a posição aberta no último candle é encerrada com `signal_end_of_period`

Custos padrão atuais enviados pelo frontend:
- `feePercent = 0.06`
- `slippagePercent = 0.03`

Capital inicial atual:
- `availableBalance`
- fallback para `totalBalance`
- fallback final para `1000`

Leverage atual:
- `symbolOperationalConfigs.leverage`
- fallback para `marketInfo.maxLeverage`
- fallback final para `1`

## Resposta para a UI

O endpoint devolve:
- `summary`
- `equityCurve`
- `holdCurve`
- `drawdownCurve`
- `trades`
- `assumptions`

Principais métricas exibidas:
- retorno da estratégia
- retorno do hold
- alpha vs hold
- max drawdown
- win rate
- número de trades

## Tratamento de Erro

O preview não deve explodir como falha inesperada por falta de candle ou falha de cálculo do replay.

Regras atuais:
- `preset_not_found` para preset inválido
- `unsupported_symbol` para símbolo fora do mapeamento Pacifica
- `invalid_period` para range inválido
- `insufficient_market_data` quando não há candles suficientes ou a simulação não consegue prosseguir
- `provider_unavailable` ou `internal_error` quando o problema vem do provider/infra

## Observações de Frontend

O preview é recalculado quando muda:
- preset selecionado
- símbolo
- position size
- long enabled
- short enabled
- leverage
- capital inicial inferido

Para evitar loop de requests, a tela usa uma chave estável derivada desses valores, em vez de depender diretamente de objetos recriados a cada render.

## Limitações Conhecidas

Ainda não faz parte deste corte:
- seletor manual de período
- cache dedicado no backend
- persistência de relatórios
- comparação entre múltiplos presets lado a lado
- marker de entrada/saída sobre candle chart real
- sincronização integral com todas as nuances da execução real de ordem

Mesmo assim, esta versão já cobre o objetivo principal do produto:
- mostrar rapidamente como o preset teria evoluído
- comparar com hold
- expor drawdown e resultado de forma legível
