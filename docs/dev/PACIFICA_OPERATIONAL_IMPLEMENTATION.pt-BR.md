# Pacifica - Implementacao Operacional Canonica

## Objetivo
Registrar a implementacao validada em producao local para os fluxos operacionais principais da Pacifica neste projeto:
- readiness check
- abertura de ordem
- protecao de posicao
- fechamento manual
- reconciliacao de posicoes e trades

## 1. Readiness Check

### Objetivo
Validar assinatura, credencial operacional, agent wallet e builder setup antes do bot poder voltar a rodar.

### Implementacao correta
- usar `POST /api/v1/orders/create`
- abrir uma ordem limite minima de teste
- assinar o payload com:
  - serializacao JSON compacta
  - ordenacao recursiva de chaves
  - assinatura em `base58`
- incluir `builder_code` quando configurado
- cancelar a ordem logo em seguida

### Observacoes
- readiness check valida o trilho basico de signing e execucao
- ele nao substitui o teste real de `create_market_order`

## 2. Abertura de Ordem de Mercado

### Objetivo
Abrir a posicao real na Pacifica com protecao embutida.

### Implementacao correta
- usar `POST /api/v1/orders/create_market`
- enviar:
  - `symbol`
  - `side`
  - `amount`
  - `slippage_percent`
  - `reduce_only = false`
  - `client_order_id` raiz como UUID valido
- embutir `take_profit` e `stop_loss` no mesmo payload
- incluir `builder_code` quando configurado

### Mapeamento de lado
- `long -> bid`
- `short -> ask`

### Formato validado de protecao embutida
- `take_profit`
  - `stop_price`
  - `limit_price`
- `stop_loss`
  - `stop_price`
  - `limit_price`

### Regra importante
- nao enviar `client_order_id` dentro de `take_profit` e `stop_loss`, a menos que seja um UUID valido e explicitamente necessario
- o campo raiz `client_order_id` da ordem principal continua obrigatorio para rastreio

## 3. Validacao de TP/SL Antes do Envio

### Long
- `stop loss < entry`
- `take profit > entry`

### Short
- `stop loss > entry`
- `take profit < entry`

### Motivo
- impedir envio de ordem operacionalmente invalida antes de chegar na Pacifica

## 4. Fechamento Manual de Trade

### Objetivo
Fechar a posicao real na Pacifica sem duplicar a logica operacional na API.

### Implementacao correta
- o frontend pede `Close trade`
- a API registra apenas a intencao persistida:
  - `closeRequestedAt`
  - `closeReasonPending = manual`
- o worker executa o fechamento real

### Chamada real na Pacifica
- usar `POST /api/v1/orders/create_market`
- enviar:
  - `symbol`
  - `side` oposto ao da posicao
  - `amount`
  - `slippage_percent`
  - `client_order_id` UUID valido
  - `reduce_only = true`
- nao enviar `take_profit` ou `stop_loss` no fechamento manual

### Mapeamento de lado para close
- trade local `long -> ask`
- trade local `short -> bid`

## 5. Reconciliacao de Posicoes

### Objetivo
Refletir corretamente o estado real da Pacifica no read model local.

### Regras corretas
- `bid -> long`
- `ask -> short`

### Observacao
- nao inferir lado apenas pelo sinal de `amount`
- a Pacifica pode retornar `amount` positivo com `side = ask`

## 6. Regras de Lifecycle Local

### Abertura
- ordem enviada com sucesso
- tentativa persistida
- `OpenTrade` criado com:
  - `entryPrice`
  - `quantity`
  - `stopLossPrice`
  - `takeProfitPrice`
  - `pacificaOrderId`

### Fechamento manual
- a API nao deve fechar localmente de imediato
- o worker submete o `reduce_only`
- o trade local entra em `closing`
- a reconciliacao fecha o lifecycle local com base no estado real da exchange

## 7. Builder Code

### Regra
- `builder_code` deve ser enviado quando configurado em:
  - `create_order`
  - `create_market_order`
  - `set_position_tpsl`, se esse endpoint voltar a ser usado

### Motivo
- manter aderencia ao builder program da Pacifica

## 8. Observabilidade Minima Obrigatoria

### Em falhas operacionais
- persistir:
  - `marketInfoPayload`
  - `normalizedOrder`
  - `requestPayload`
  - `responseBody`

### Motivo
- erro `400` da Pacifica pode ser opaco
- sem payload real persistido, o diagnostico vira tentativa cega

## 9. Estado Atual Validado
- readiness check funcional com assinatura canonica + `base58`
- `create_market_order` funcional com TP/SL embutidos
- fechamento manual funcional via worker com `reduce_only`
- reconciliacao correta de `bid/ask`
- read model exibindo `stopLossPrice` e `takeProfitPrice` reais
