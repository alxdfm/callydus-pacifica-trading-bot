# Estudo de Validacao Operacional da Agent Wallet na Pacifica

## Objetivo
Mapear se a Pacifica expoe algum endpoint de "check" dedicado para provar que uma `Agent Wallet` esta operacional, sem disparar acao real de trading ou alteracao de conta.

## Fontes Primarias Utilizadas
- API Agent Keys: https://docs.pacifica.fi/api-documentation/api/signing/agent-wallet
- Signing Implementation: https://docs.pacifica.fi/api-documentation/api/signing/implementation
- Builder Program: https://docs.pacifica.fi/builder-program
- Get account info: https://docs.pacifica.fi/api-documentation/api/rest-api/account/get-account-info
- Get positions: https://docs.pacifica.fi/api-documentation/api/rest-api/account/get-positions
- Create limit order: https://docs.pacifica.fi/api-documentation/api/rest-api/orders/create-limit-order
- Create stop order: https://docs.pacifica.fi/api-documentation/api/rest-api/orders/create-stop-order
- Cancel order: https://docs.pacifica.fi/api-documentation/api/rest-api/orders/cancel-order
- Cancel all orders: https://docs.pacifica.fi/api-documentation/api/rest-api/orders/cancel-all-orders
- Cancel stop order: https://docs.pacifica.fi/api-documentation/api/rest-api/orders/cancel-stop-order
- Edit order: https://docs.pacifica.fi/api-documentation/api/rest-api/orders/edit-order
- Update margin mode: https://docs.pacifica.fi/api-documentation/api/rest-api/account/update-margin-mode

## Pergunta
Existe na doc da Pacifica algum "check" explicito para validar que a `Agent Wallet` esta funcionando, sem produzir efeito operacional?

## Resposta Curta
Nao encontrei na documentacao da Pacifica nenhum endpoint dedicado de `health check`, `validate agent wallet` ou `test credentials`.

O que a doc oferece e:
- endpoints `GET` de leitura por `account`
- endpoints `POST` assinados, nos quais a `Agent Wallet` pode ser usada

Isso significa que a Pacifica nao documenta hoje um "check" neutro e sem efeito para provar que a `Agent Wallet` esta operacional.

## O Que a Doc Afirma Explicitamente

### 1. Agent Wallet serve para assinar `POST`s
A doc de `API Agent Keys` diz que:
- para todos os `POST requests`
- deve-se usar a wallet original em `account`
- assinar com a `API Agent Private Key`
- enviar `agent_wallet`

Isso implica que a prova operacional da `Agent Wallet` depende de algum `POST` real aceito pela Pacifica.

### 2. Endpoints de leitura nao provam uso da Agent Wallet
Os endpoints de conta e leitura encontrados usam apenas `GET` com `account`:
- `GET /api/v1/account`
- `GET /api/v1/positions`
- `GET /api/v1/orders`
- `GET /api/v1/orders/history`
- `GET /api/v1/trades/history`

Esses endpoints leem estado da conta, mas nao demonstram que a `Agent Wallet` conseguiu assinar nada.

## O Que Nao Existe na Doc
Nao encontrei endpoint documentado para:
- validar Agent Wallet
- testar assinatura sem side effect
- ping autenticado por Agent Wallet
- obter saldo via `POST` assinado so para teste

## Mapa dos POSTs Encontrados

### POSTs claramente operacionais
- `POST /api/v1/orders/create_market`
- `POST /api/v1/orders/create`
- `POST /api/v1/orders/stop/create`
- `POST /api/v1/positions/tpsl`
- `POST /api/v1/orders/cancel`
- `POST /api/v1/orders/cancel_all`
- `POST /api/v1/orders/stop/cancel`
- `POST /api/v1/orders/edit`
- `POST /api/v1/account/margin`

Todos aceitam `agent_wallet` na doc, mas todos tem efeito operacional real ou potencial.

### POSTs de conta relacionados ao builder
- `POST /api/v1/account/builder_codes/approve`
- `POST /api/v1/account/builder_codes/revoke`

Esses tambem sao `POST`s assinados, mas tratam autorizacao de builder, nao saude operacional neutra da `Agent Wallet`.

## Avaliacao das Opcoes

### Opcao A: usar `GET /account` ou `GET /positions` como check
Conclusao:
- nao serve como prova da `Agent Wallet`

Motivo:
- nao exige assinatura com a `Agent Wallet`
- so prova que a conta existe e pode ser consultada

### Opcao B: usar `approve_builder_code` como check
Conclusao:
- nao serve para esse papel no nosso produto

Motivo:
- nos testes reais do projeto, esse endpoint falhou com `Agent Wallet` e respondeu `200` com assinatura da conta principal
- ele virou gate separado de autorizacao da conta

### Opcao C: usar um `POST` de cancelamento
Conclusao:
- e operacionalmente menos arriscado do que criar ordem
- mas continua exigindo estado previo

Problemas:
- precisa existir ordem ou stop order para cancelar
- falha por "ordem inexistente" nao prova necessariamente que a assinatura foi aceita
- pode conflitar com estado real do usuario

### Opcao D: usar criacao de ordem minima so para teste
Conclusao:
- prova melhor a `Agent Wallet`
- mas tem risco e side effect real

Problemas:
- pode criar ordem real
- pode consumir margem, fees, rate limit ou gerar efeito de mercado
- piora muito a UX e aumenta risco operacional

### Opcao E: tratar a primeira acao real assinada pela Agent Wallet como prova operacional
Conclusao:
- e a opcao mais pragmatica com a doc atual

Como funciona:
- onboarding fecha dois gates:
  - `builder approved`
  - `agent wallet cryptographically validated`
- a `Agent Wallet` passa a status `operationally_verified` somente apos o primeiro `POST` real aceito pela Pacifica no runtime

Vantagens:
- nao inventa probe artificial
- nao precisa side effect extra so para teste
- alinha a prova operacional ao proprio uso real do produto

Desvantagem:
- o onboarding nao garante 100% de operabilidade antes do primeiro comando real

## Recomendacao

### Recomendacao Principal
Adotar dois niveis de validade para a `Agent Wallet`:

1. `validated`
- parse valido
- keypair coerente
- segredo cifrado e persistido

2. `operationally_verified`
- primeiro `POST` real aceito pela Pacifica com `agent_wallet`

Essa recomendacao e a mais segura e honesta com o que a doc da Pacifica realmente oferece hoje.

### Recomendacao Secundaria
Se o produto exigir prova operacional antes do primeiro trade, a unica direcao documentada hoje e escolher um `POST` real de menor impacto e usa-lo como probe. Mas isso deve ser tratado como decisao de produto/risco, nao como comportamento neutro documentado pela Pacifica.

## Decisao Tecnica Recomendada
- nao tratar `GET /account`, `GET /positions` ou saldo como prova da `Agent Wallet`
- nao fingir que existe endpoint oficial de `check` quando a doc nao oferece isso
- manter o onboarding com:
  - `builder approval`
  - `Agent Wallet validation` criptografica/backend
- adicionar no backend um conceito posterior de `operational verification` baseado no primeiro `POST` real aceito

## Impacto no Projeto
- o `/validate` atual pode continuar como gate de credencial
- ele nao deve prometer ainda "credencial operacionalmente comprovada"
- o runtime/trading backend deve passar a marcar a credencial como `operationally_verified` quando a Pacifica aceitar a primeira acao assinada pela `Agent Wallet`

## Gaps Ainda Abertos
- precisamos decidir se o MVP aceita essa validacao em dois niveis
- se o PO exigir prova operacional pre-trade, sera necessario escolher conscientemente um `POST` com side effect como probe
- vale validar depois se a Pacifica adiciona algum endpoint de teste/health check para Agent Wallet
