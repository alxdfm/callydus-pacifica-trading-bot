# FM-016 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-30`

## Objetivo
Fechar o lifecycle real de ordens, trades e posicoes, com a regra formal de `1 posicao aberta por simbolo`, transformando `stop loss` e `take profit` obrigatorios em acao operacional real.

## Escopo Fechado
- [ ] acompanhar status real de ordens abertas, preenchidas, canceladas ou falhas
- [ ] abrir `OpenTrade` a partir de execucao real
- [ ] fechar `ClosedTrade` por evento real, `stop loss`, `take profit` ou comando manual
- [ ] transformar `risk plan` em niveis executaveis reais
- [ ] respeitar a regra formal de `1 posicao aberta por simbolo`
- [ ] garantir `stop loss` e `take profit` obrigatorios em todas as entradas
- [ ] manter fechamento manual como comando explicito com precedencia de usuario

## Fora de Escopo
- [ ] flexibilizar risk execution fora do contrato atual de presets
- [ ] expor complexidade tecnica desnecessaria na UX antes de precisar

## Checklist de Entrega Real
- [ ] dashboard, current trades e history refletem lifecycle real
- [ ] `stop loss` e `take profit` deixam de ser apenas calculo e passam a proteger a operacao real
- [ ] o produto explica por que uma posicao foi encerrada
- [ ] manual close continua coerente com o ciclo real da exchange

## Dependencias
- [ ] FM-005 concluida
- [ ] FM-015 concluida

## Critérios de Aceite da Task
- [ ] `OpenTrade` e `ClosedTrade` nascem de eventos reais da operacao
- [ ] a regra de `1 posicao aberta por simbolo` esta protegida no lifecycle real
- [ ] toda entrada real tem `stop loss` e `take profit`
- [ ] o lifecycle operacional fica refletido de forma rastreavel no backend e nas telas

## Proximo Passo Recomendado
Fechar a reconciliacao externa com a Pacifica em `FM-017` para garantir que o estado exibido e o estado real da exchange.

## Log de Acompanhamento
- `2026-03-30`: card criado para fechar o ciclo real de ordens/trades/posicoes e transformar o `risk plan` calculado no backend em protecao operacional efetiva.
- `2026-03-30`: decisao de PO congelada: `1 posicao aberta por simbolo` deixa de ser apenas direcao herdada dos presets e passa a ser regra formal do lifecycle real.
