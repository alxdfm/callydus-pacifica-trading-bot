# FM-015 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-30`

## Objetivo
Executar ordens reais na Pacifica a partir das decisoes do loop, usando `market order` como politica de entrada do MVP final, com idempotencia, persistencia e politica de erro alinhada ao produto.

## Escopo Fechado
- [ ] criar ordens reais via adapter Pacifica usando `market order` para entrada
- [ ] persistir request, resposta e status da ordem
- [ ] garantir idempotencia para nao duplicar ordem
- [ ] tratar slippage, saldo insuficiente, rejeicao e falha parcial
- [ ] pausar automaticamente o bot em erro de criacao de ordem

## Fora de Escopo
- [ ] suporte a varios presets ativos por conta
- [ ] qualquer politica de erro que contradiga o fechamento de PO sem novo alinhamento

## Checklist de Entrega Real
- [ ] o produto abre ordem real na Pacifica a partir do loop
- [ ] cada tentativa fica registrada para auditoria
- [ ] erro critico de execucao pausa o bot e gera feedback consistente
- [ ] a idempotencia evita duplicacao de ordem por retry ou repeticao do worker

## Dependencias
- [ ] FM-001 concluida
- [ ] FM-013 concluida
- [ ] FM-014 concluida

## Critérios de Aceite da Task
- [ ] existe create order real com adapter Pacifica usando `market order` como politica de entrada
- [ ] falhas criticas de execucao pausar automaticamente o bot
- [ ] falhas recuperaveis ficam separadas de falhas bloqueantes

## Proximo Passo Recomendado
Fechar em seguida o lifecycle real e a transformacao do `risk plan` em protecao operacional em `FM-016`.

## Log de Acompanhamento
- `2026-03-30`: card criado para fechar a execucao real de ordens na Pacifica com base no contrato tecnico ja estudado em `FM-001` e nas politicas de auto-pausa respondidas pelo PO.
- `2026-03-30`: decisao de PO congelada: a entrada real do bot no MVP final usara `market order`, para reduzir ambiguidade de fill no primeiro fechamento operacional real.
