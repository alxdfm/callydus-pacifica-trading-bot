# Product Finalization PO Guide

## Objetivo
Consolidar, do ponto de vista de desenvolvimento, o que ainda precisa ser fechado para o produto chegar ao estado final desejado:
- `worker` rodando continuamente
- integracao total com a Pacifica
- ordens reais sendo criadas
- mercado analisado em tempo real
- gatilhos ocorrendo conforme os presets

Este documento serve para o PO:
- entender o que ja existe
- decidir o que ainda falta no produto final
- responder pontos de produto que destravam a implementacao
- sugerir os proximos passos com criterio claro

## Estado Atual
Hoje o produto ja possui a base funcional principal:
- onboarding operacional real
- validacao e readiness da `Agent Wallet`
- preset activation persistida
- comandos reais de `pause`, `resume` e `close trade`
- sessao operacional reidratada do backend
- market data real da Pacifica
- avaliacao backend dos presets com indicadores e `risk plan`
- reconciliacao minima interna do runtime
- trilha minima de auditoria com `OperationalEvent`

O que ainda nao esta completo para o produto final:
- `worker` operacional continuo
- loop real de analise de mercado
- execucao real de ordens na Pacifica
- acompanhamento real do ciclo de vida das ordens/posicoes
- reconciliacao real entre nosso estado e o estado da exchange
- fechamento automatico por `stop loss` e `take profit`

## O Que Falta do Ponto de Vista de Desenvolvimento

### 1. Worker operacional continuo
Precisamos transformar o `worker` em consumidor principal do runtime.

Isso inclui:
- loop continuo por conta/preset ativo
- `heartbeat` real recorrente
- controle para evitar dupla execucao da mesma conta
- retomada segura apos restart
- estrategia de retry e backoff

Sem isso, o produto ainda depende de comandos pontuais e nao opera como bot continuo.

### 2. Analise de mercado em tempo real
Ja temos a base de `prices` e `candles`, mas ainda falta a execucao continua.

Isso inclui:
- definir como o worker consome mercado em producao
- manter janela de candles por simbolo e timeframe
- recalcular indicadores continuamente
- decidir quando um candle/estado e valido para disparar regra

Sem isso, os gatilhos existem no backend, mas nao sao executados continuamente.

### 3. Engine real de sinais e decisao
Ja temos avaliacao de preset sob demanda. Falta a versao de producao.

Isso inclui:
- avaliar presets em loop
- evitar disparos duplicados no mesmo candle
- decidir reentrada, cooldown e repeticao de sinal
- transformar o resultado da avaliacao em decisao operacional

Sem isso, o preset ainda nao governa o bot de ponta a ponta.

### 4. Execucao real de ordens na Pacifica
Hoje ainda nao fechamos o ciclo completo de execucao real.

Isso inclui:
- criar ordens reais via adapter Pacifica
- persistir request, resposta e status de execucao
- tratar rejeicao, slippage, saldo insuficiente e falhas parciais
- garantir idempotencia para nao duplicar ordens

Sem isso, o bot nao entra no mercado de verdade.

### 5. Lifecycle real de ordens, trades e posicoes
Depois de criar ordem, precisamos acompanhar a vida real dela.

Isso inclui:
- saber se a ordem abriu, falhou, foi cancelada ou ficou pendente
- refletir execucao parcial ou total
- abrir `OpenTrade` a partir da execucao real
- fechar `ClosedTrade` por evento real, `stop loss`, `take profit` ou comando manual

Sem isso, o dashboard nao representa a operacao real da exchange.

### 6. Risk real aplicado na execucao
Ja existe `risk plan` calculado. Falta transforma-lo em acao real.

Isso inclui:
- converter `stop loss` e `take profit` em niveis executaveis
- definir como esses niveis viram ordens ou regras de saida
- garantir sizing coerente com saldo real
- respeitar limites e restricoes da Pacifica

Sem isso, o bot pode ate gerar sinal, mas ainda nao fecha o ciclo de protecao operacional.

### 7. Reconciliacao real com a Pacifica
Hoje a reconciliacao e interna ao nosso banco. Isso nao basta para operacao final.

Precisamos:
- consultar estado real de ordens/posicoes/saldo na Pacifica
- detectar drift entre exchange e banco
- corrigir runtime apos falhas, restart ou divergencia externa
- recuperar a verdade operacional mesmo quando nosso estado local estiver incompleto

Sem isso, o produto pode divergir da exchange e perder confiabilidade.

### 8. Observabilidade e operacao
Para operar em ambiente real, precisamos endurecer a parte operacional.

Isso inclui:
- logs estruturados do worker e da integracao Pacifica
- alertas acionaveis
- erros separando causa tecnica e causa de negocio
- metricas minimas de runtime, sinais, ordens e falhas

Sem isso, fica dificil operar e diagnosticar o bot em producao.

## Decisoes de Produto Consolidadas para o Fechamento Final

## Decisoes de PO Ja Fechadas

### Fechadas em `2026-03-30`
- o MVP final suporta `apenas 1 preset ativo por conta`
- cada preset opera `1 simbolo por vez`
- o fechamento inicial deve suportar `BTC`, `SOL` e `ETH`
- `reentrada no mesmo candle` e permitida
- `nao existe cooldown artificial entre sinais` no MVP final
- so pode existir `1 posicao aberta por simbolo`
- a `ordem de entrada real` do bot no MVP final sera `market order`
- `bot active` na UX significa: ha `algum preset ativado aguardando gatilho de entrada`
- a analise recorrente do `worker` pode operar em janela de `1 minuto` no MVP final
- erros de `criacao de ordens` devem pausar automaticamente o bot
- erros ao `buscar indicadores / mercado` devem pausar automaticamente o bot
- em divergencia entre nosso banco/runtime e a Pacifica, a `Pacifica` vence como fonte visivel de verdade

### Observacoes de PO para Interpretacao
- `sinal` aqui significa a decisao operacional final gerada pela avaliacao do preset, nao um indicador isolado
- `BTC`, `SOL` e `ETH` devem ser tratados como mercados habilitados no fechamento inicial do produto final, com detalhamento tecnico de pares/formatos ficando do lado de dev/integracao
- `market order` foi escolhida como politica de entrada do MVP final para reduzir ambiguidade de fill e simplificar o primeiro fechamento operacional real; qualquer politica hibrida futura deve virar nova decisao de produto
- a Pacifica so nao vence visualmente quando estiver indisponivel; nesse caso o produto deve deixar explicito que esta exibindo o ultimo snapshot local conhecido e que a verdade externa nao pode ser confirmada naquele momento

## Perguntas Historicas Que Ja Foram Respondidas
- quantos presets ativos por conta o produto final precisa suportar
- se o produto final opera um unico simbolo por preset ou varios
- quais mercados entram no fechamento inicial
- se pode haver reentrada no mesmo candle
- se pode haver mais de uma posicao aberta por simbolo
- se `stop loss` e `take profit` seguem obrigatorios em todas as entradas
- o que oficialmente significa `bot active` na UX
- qual atraso maximo de analise ainda e aceitavel para o MVP final
- em caso de divergencia entre banco e Pacifica, qual fonte deve ser tratada como verdade visivel ao usuario
- que tipos de erro devem pausar o bot automaticamente

## Riscos de Produto e Engenharia
- sem reconciliacao real com a Pacifica, o app pode divergir da exchange
- sem idempotencia, o worker pode disparar ordem duplicada
- sem regra clara de candle/gatilho, o comportamento do bot pode parecer imprevisivel
- sem definicao de `bot active`, a UX pode comunicar um estado enganoso
- sem observabilidade minima, qualquer incidente de producao fica caro para diagnosticar

## Sugestao de Proximos Steps

### Step 1. Usar as decisoes de produto ja fechadas como baseline
O PO ja respondeu:
- escopo operacional do MVP final
- regras de entrada
- regras de saida
- definicao oficial de `bot active`
- latencia/frequencia aceitavel de analise

### Step 2. Transformar respostas em backlog executavel
Com as decisoes fechadas, Dev quebra a entrega final em cards objetivos para:
- worker continuo
- signal loop real
- execucao real Pacifica
- reconciliacao real exchange x banco
- risk execution
- observabilidade minima

### Step 3. Implementar por trilhas
Ordem recomendada:
1. worker operacional continuo
2. execucao real de ordens Pacifica
3. lifecycle real de ordem/trade/posicao
4. risk real em producao
5. reconciliacao real com a exchange
6. endurecimento operacional

## Perguntas Objetivas Ja Respondidas Pelo PO
1. Quantos presets ativos por conta o produto final precisa suportar?
2. O produto final vai operar um unico simbolo por preset ou varios?
3. Quais mercados entram no fechamento inicial?
4. Pode haver reentrada no mesmo candle?
5. Pode haver mais de uma posicao aberta por simbolo?
6. `Stop loss` e `take profit` serao sempre obrigatorios?
7. O que oficialmente significa `bot active` na UX?
8. Qual atraso maximo de analise ainda e aceitavel para o MVP final?
9. Em caso de divergencia entre banco e Pacifica, qual fonte deve ser tratada como verdade visivel ao usuario?
10. Que tipos de erro devem pausar o bot automaticamente?

## Respostas Consolidadas de PO
1. `1 preset ativo por conta` no MVP final.
2. `1 simbolo por preset`.
3. `BTC`, `SOL` e `ETH`.
4. Sim, pode haver `reentrada no mesmo candle`.
5. So pode existir `1 posicao aberta por simbolo`.
6. Sim, `stop loss` e `take profit` continuam obrigatorios em todas as entradas.
7. `Bot active` significa: o bot esta com algum preset ativado aguardando gatilho de entrada.
8. Atraso aceitavel no MVP final: ate `60s`, com baseline operacional de analise recorrente do `worker` em `1 minuto`.
9. A `Pacifica` deve ser tratada como fonte visivel de verdade.
10. Pausam automaticamente: erros operacionais de `criacao de ordens` e erros de `busca de indicadores/mercado`. Os demais erros, por padrao, entram como `warning` ate nova classificacao.

## Direcoes de Implementacao Fechadas para Dev
- a entrada real do bot no MVP final deve usar `market order`
- a operacao segue com `1 preset ativo por conta`
- cada preset opera `1 simbolo por vez`
- so pode existir `1 posicao aberta por simbolo`
- `reentrada no mesmo candle` e permitida, desde que a protecao tecnica evite duplicacao operacional indevida

## Resultado Esperado
Depois que o PO responder este documento, o time de desenvolvimento deve conseguir:
- abrir os proximos cards finais sem ambiguidade
- implementar o worker real e a execucao Pacifica com menos retrabalho
- alinhar UX, backend e runtime em cima da mesma definicao de produto final
