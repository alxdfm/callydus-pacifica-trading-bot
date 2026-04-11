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
Abrir a posicao real na Pacifica e aplicar protecao coerente com o `entryPrice` real.

### Implementacao correta
- usar `POST /api/v1/orders/create_market`
- enviar:
  - `symbol`
  - `side`
  - `amount`
  - `slippage_percent`
  - `reduce_only = false`
  - `client_order_id` raiz como UUID valido
- incluir `builder_code` quando configurado
- esperar a posicao aparecer em `/positions`
- ler o `entryPrice` real retornado pela Pacifica
- recalcular `stop loss` e `take profit` a partir do `entryPrice` real
- aplicar a protecao via `POST /api/v1/positions/tpsl`

### Mapeamento de lado
- `long -> bid`
- `short -> ask`

### Formato validado da protecao pos-abertura
- `take_profit`
  - `stop_price`
- `stop_loss`
  - `stop_price`

### Regra importante
- o campo raiz `client_order_id` da ordem principal continua obrigatorio para rastreio
- `TP/SL` nao deve ser derivado do preco de referencia do sinal quando a execucao real entrar com outro preco
- a protecao precisa usar o `entryPrice` real da posicao que a Pacifica abriu

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
- o worker primeiro consulta a posicao real em `/positions`
- se a posicao ainda existir, o worker submete o `reduce_only` usando o `amount` real da exchange
- se a posicao nao existir mais, o worker nao envia `reduce_only` cego
- o trade local entra em `closing`
- a reconciliacao fecha o lifecycle local com base no estado real da exchange

### UX do close manual
- `Close trade` e `Close selected trade` devem ficar desabilitados enquanto o trade estiver em `waiting` / `closing`
- isso evita clique repetido em um close que ja esta em processamento

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
- `create_market_order` funcional para abertura limpa da posicao
- `set_position_tpsl` funcional apos leitura do `entryPrice` real da posicao
- fechamento manual funcional via worker com `reduce_only`
- reconciliacao correta de `bid/ask`
- read model exibindo `stopLossPrice` e `takeProfitPrice` reais

## 10. Follow-up Explicitado
- atualizar `TP/SL` de posicoes ja protegidas depois que o trade estiver aberto continua fora do escopo imediato
- o foco atual e:
  - abrir a posicao corretamente
  - aplicar a protecao inicial correta
  - fechar manualmente com base no estado real da exchange
