# FM-005 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Executar EMA, RSI, ATR, volume e SMA de volume de forma real sobre candles para avaliar os gatilhos dos presets, incluindo niveis sugeridos de `stop loss` e `take profit`.

## Escopo Fechado
- [x] calcular indicadores do contrato atual dos presets
- [x] avaliar regras de cross e threshold
- [x] respeitar timeframe e symbol do preset ativo
- [x] expor resultado de sinal de forma auditavel para runtime e UI
- [x] derivar `stop loss` e `take profit` sugeridos a partir do contrato de risco do preset

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] o preset ativo deixa de ser apenas configuracao e passa a gerar sinal real de entrada e saida
- [ ] o sistema consegue explicar quais regras dispararam o sinal
- [ ] o sistema devolve niveis sugeridos de risco coerentes com o contrato do preset

## Dependencias
- [ ] FM-004 concluida

## Critérios de Aceite da Task
- [ ] o preset ativo deixa de ser apenas configuracao e passa a gerar sinal real de entrada e saida
- [ ] o sistema consegue explicar quais regras dispararam o sinal
- [ ] o sistema devolve niveis sugeridos de risco coerentes com o contrato do preset

## Proximo Passo Recomendado
Conectar a avaliacao real do preset ao fluxo de ativacao/runtime dos proximos `FM-*`, substituindo progressivamente o `demo-runtime`.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-28`: primeiro corte entregue com contrato tecnico compartilhado dos presets no `packages/contracts`, motor backend proprio para `EMA`, `RSI`, `ATR`, `volume` e `SMA(volume)`, avaliacao real de regras `cross`/`threshold` e endpoint `POST /api/presets/evaluate-signal` para resultado auditavel sobre candles Pacifica.
- `2026-03-28`: validacao manual local do endpoint `POST /api/presets/evaluate-signal` concluida com retorno `success` para o preset `Safer`, usando `BTC/USDC` normalizado para `BTC` na borda Pacifica e devolvendo snapshots de indicadores + regra a regra avaliada.
- `2026-03-28`: escopo do card corrigido para aderir ao contrato do preset: o endpoint de avaliacao passou a devolver tambem `entryReferencePrice`, `longRiskPlan` e `shortRiskPlan`, incluindo `stopLossPrice`, `takeProfitPrice` e `riskDistance` calculados a partir de `stopLoss`/`takeProfit` do preset.
