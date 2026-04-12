# BG-027 Card

## Status
- status: `DROPPED`
- tipo: `implementacao`
- prioridade: `P1`
- owner: `Dev`
- area: `market data / operacao`
- ultima atualizacao: `2026-04-07`

## Objetivo
Automatizar a politica de retencao e cleanup de market data fora do uso manual local.

## Contexto
Hoje existe politica inicial de retencao e script manual de cleanup. Isso cobre o ciclo local de desenvolvimento, mas ainda nao garante operacao continua sem inflar o banco em ambientes persistentes.

## Escopo Fechado
- transformar cleanup em rotina recorrente
- garantir retencao para `MarketCandleSnapshot`
- garantir retencao para `MarketRefreshLog`
- validar que cleanup nao afeta snapshots correntes

## Fora de Escopo
- migracao para storage frio
- particionamento avancado

## Dependencias
- [x] BG-023 concluido
- [ ] BG-024 preferencialmente avancado para definir o runtime final da rotina

## Critérios de Aceite Iniciais
- [ ] cleanup recorrente nao depende de execucao manual
- [ ] retencao fica alinhada ao desenho documentado
- [ ] o banco nao cresce sem controle no uso normal
- [ ] logs de cleanup continuam disponiveis para troubleshooting

## Proximo Passo Recomendado
Executar essa rotina no mesmo modo de execucao final do refresher para evitar duplicacao de mecanismos operacionais.

## Log de Acompanhamento
- `2026-04-07`: card criado como backlog residual da politica de retencao introduzida no slice local-first.
