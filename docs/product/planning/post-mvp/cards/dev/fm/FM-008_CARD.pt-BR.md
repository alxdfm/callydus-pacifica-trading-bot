# FM-008 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Substituir demo-runtime por leituras reais do backend para saldo, bot status, trades abertos, trades fechados e alertas.

## Escopo Fechado
- [ ] eliminar dependencias centrais de demo-runtime para leitura operacional
- [ ] alimentar dashboard com read model real
- [ ] alimentar current trades com fonte real
- [ ] alimentar history com fonte real
- [ ] refletir estados de loading, vazio, erro e sync real

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] dashboard, trades e history usam dados reais de backend
- [ ] o usuario enxerga o mesmo estado operacional em todas as telas sem divergencia simulada

## Dependencias
- [ ] FM-002 concluida
- [ ] FM-003 concluida
- [ ] FM-006 concluida
- [ ] FM-007 concluida

## Critérios de Aceite da Task
- [ ] dashboard, trades e history usam dados reais de backend
- [ ] o usuario enxerga o mesmo estado operacional em todas as telas sem divergencia simulada

## Proximo Passo Recomendado
Definir read models finais e substituir progressivamente os pontos de leitura local.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
