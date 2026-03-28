# FM-005 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Executar EMA, RSI, ATR, volume e SMA de volume de forma real sobre candles para avaliar os gatilhos dos presets.

## Escopo Fechado
- [ ] calcular indicadores do contrato atual dos presets
- [ ] avaliar regras de cross e threshold
- [ ] respeitar timeframe e symbol do preset ativo
- [ ] expor resultado de sinal de forma auditavel para runtime e UI

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] o preset ativo deixa de ser apenas configuracao e passa a gerar sinal real de entrada e saida
- [ ] o sistema consegue explicar quais regras dispararam o sinal

## Dependencias
- [ ] FM-004 concluida

## Critérios de Aceite da Task
- [ ] o preset ativo deixa de ser apenas configuracao e passa a gerar sinal real de entrada e saida
- [ ] o sistema consegue explicar quais regras dispararam o sinal

## Proximo Passo Recomendado
Definir se o motor sera proprio ou apoiado em biblioteca validada, com testes dos indicadores obrigatorios.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
