# FM-016 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-31`

## Objetivo
Fechar o lifecycle real de ordens, trades e posicoes, com a regra formal de `1 posicao aberta por simbolo`, transformando `stop loss` e `take profit` obrigatorios em acao operacional real.

## Escopo Fechado
- [x] acompanhar status real de ordens abertas, preenchidas, canceladas ou falhas
- [x] abrir `OpenTrade` a partir de execucao real
- [x] fechar `ClosedTrade` por evento real, `stop loss`, `take profit` ou comando manual
- [x] transformar `risk plan` em niveis executaveis reais
- [x] respeitar a regra formal de `1 posicao aberta por simbolo`
- [x] garantir `stop loss` e `take profit` obrigatorios em todas as entradas
- [x] manter fechamento manual como comando explicito com precedencia de usuario

## Fora de Escopo
- [ ] flexibilizar risk execution fora do contrato atual de presets
- [ ] expor complexidade tecnica desnecessaria na UX antes de precisar

## Checklist de Entrega Real
- [x] dashboard, current trades e history refletem lifecycle real
- [x] `stop loss` e `take profit` deixam de ser apenas calculo e passam a proteger a operacao real
- [x] o produto explica por que uma posicao foi encerrada
- [ ] manual close continua coerente com o ciclo real da exchange

## Dependencias
- [x] FM-005 concluida
- [x] FM-015 concluida

## Critérios de Aceite da Task
- [x] `OpenTrade` e `ClosedTrade` nascem de eventos reais da operacao
- [x] a regra de `1 posicao aberta por simbolo` esta protegida no lifecycle real
- [x] toda entrada real tem `stop loss` e `take profit`
- [x] o lifecycle operacional fica refletido de forma rastreavel no backend e nas telas

## Proximo Passo Recomendado
Fechar a reconciliacao externa com a Pacifica em `FM-017` para garantir que o estado exibido e o estado real da exchange.

## Log de Acompanhamento
- `2026-03-30`: card criado para fechar o ciclo real de ordens/trades/posicoes e transformar o `risk plan` calculado no backend em protecao operacional efetiva.
- `2026-03-30`: decisao de PO congelada: `1 posicao aberta por simbolo` deixa de ser apenas direcao herdada dos presets e passa a ser regra formal do lifecycle real.
- `2026-03-31`: `FM-016` entrou em `IN_REVIEW` com o primeiro lifecycle local real no `worker`: `OpenTrade` nasce da ordem enviada, o `risk plan` vira `stop loss` e `take profit` anexados ao request e o loop passa a atualizar `currentPrice/unrealizedPnl`, fechar `ClosedTrade` por `take_profit`/`stop_loss` e cancelar sinais novos quando ja existe posicao aberta para o mesmo simbolo.
- `2026-03-31`: o fechamento manual continua disponivel como comando explicito do produto, mas a congruencia final com o ciclo confirmado pela exchange permanece dependente da reconciliacao externa de `FM-017`.
