# Referencia de Trades e Historico

## Objetivo
Consolidar a estrutura, os componentes, os estados críticos e o handoff visual das telas de `Current trades` e `History` das Sprint 4.

## Current Trades

### Estrutura da Tela
Ordem dos blocos:
1. header da tela
2. lista principal de trades abertos
3. painel lateral do trade selecionado

### Trade Aberto
Campos mínimos:
- símbolo
- direção
- preço de entrada
- preço atual
- PnL
- horário de abertura
- identificação de origem
- ação `Close trade`

### Regras Visuais
- direção `Long` e `Short` têm marcadores distintos
- origem do trade precisa ser reconhecível sem texto longo
- PnL positivo, negativo e neutro seguem tratamento consistente com dashboard e history
- a ação `Close trade` é sempre visível e semanticamente destrutiva

### Encerramento Manual
Fluxo visual:
1. usuário identifica o trade
2. usuário aciona `Close trade`
3. confirmação curta reforça que a ação afeta apenas aquele trade
4. estado de loading deixa claro que a ordem está em processamento
5. sucesso ou erro aparecem como retorno inequívoco

## History

### Estrutura da Tela
Ordem dos blocos:
1. header da tela
2. lista de trades encerrados
3. painel lateral do registro selecionado

### Trade Encerrado
Campos mínimos:
- símbolo
- direção
- resultado final
- motivo de encerramento
- horário de abertura
- horário de encerramento
- identificação de origem

### Regras Visuais
- histórico deve parecer mais documental que `Current trades`
- resultado positivo e negativo são imediatos
- motivo de encerramento usa linguagem de produto:
  - `Closed by target`
  - `Closed by stop`
  - `Closed manually`

## Comportamento Mobile
- listas viram cartões ou linhas compactas em coluna única
- o painel lateral colapsa para leitura vertical abaixo da lista
- o CTA de encerramento continua visível sem exigir scroll lateral
- history mantém leitura cronológica simples em telas estreitas

## Orientação de i18n
- separar grupos de mensagem para:
  - current trades
  - trade detail
  - close trade flow
  - history list
  - history detail
- labels devem ser curtas e estáveis
- motivos de encerramento devem permanecer auto-contidos

## Referencias
- [preview/trades.html](./preview/trades.html)
- [preview/history.html](./preview/history.html)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
