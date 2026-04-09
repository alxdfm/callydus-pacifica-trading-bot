# YOUR Strategy - Decisao de Produto

## Objetivo
Formalizar o recorte funcional da feature `YOUR Strategy`, permitindo que qualquer usuario final crie sua propria estrategia do zero dentro de uma UX amigavel, com execucao real, backtest e validacoes operacionais compatíveis com o produto atual.

## Papel da Feature no Produto
- `YOUR Strategy` sera uma feature visivel para qualquer usuario final
- sera tratada como um dos maiores diferenciais do produto
- os presets padrao continuam existindo
- `YOUR Strategy` passa a ser a quarta opcao no grid de presets, com card proprio e destaque explicito em `YOUR`

## Direcao de UX
- entrada via `card fixo` ao lado dos 3 presets padrao
- o clique abre um fluxo guiado de criacao
- a experiencia deve priorizar clareza maxima, com linguagem amigavel para usuario intermediario/avancado
- direcao principal de UX: `wizard` por etapas
- ao final, a estrategia deve exibir preview com o backtest ja existente no produto

## Modelo de Produto
- a estrategia customizada continua no universo de `PresetDefinition`
- deve existir ownership por conta/usuario, por exemplo via campo `owner`
- cada conta pode ter `apenas 1 YOUR Strategy`
- se a conta ja possuir `YOUR Strategy`, o usuario edita esse mesmo registro
- o produto pode limpar o front para recomecar, mas o registro persistido so muda quando o usuario salva

## Escopo da V1
Entra na primeira versao:
- gatilho de entrada
- gatilho de `stop loss`
- gatilho de `take profit`
- direcao `long`, `short` ou ambos
- regras separadas para `long` e `short`
- `position sizing`
- `symbol`
- `timeframe`

Nao entra na V1:
- configuracao de `leverage` no builder
- multiplas entradas
- multiplos alvos
- parcial
- `break even`
- `pyramiding`
- multiplas estrategias customizadas por conta
- multiplos trades simultaneos

## Mercados e Timeframes
### Markets suportados na V1
- `BTC/USDC`
- `ETH/USDC`
- `SOL/USDC`

### Timeframes suportados na V1
- `3m`
- `5m`
- `15m`

### Timeframes mapeados para futuro
- `1h`
- `4h`
- `1d`

## Logica da Estrategia
### Estrutura logica suportada na V1
- grupos `AND`
- grupos `OR`
- aninhamento de grupos
- `cross`
- `threshold`
- comparacao entre indicadores
- comparacao entre indicador e preco

### Limite estrutural inicial
- ate `3 AND`
- ate `3 OR`

## Indicadores Suportados
Na V1, a feature deve suportar `apenas` os indicadores que ja existem no catalogo atual:
- referencia: `docs/product/strategy/PRODUCT_INDICATORS_CATALOG.en.md`
- essa restricao vale para:
  - entrada
  - `stop loss`
  - `take profit`

## Regras de Entrada
- o usuario deve obrigatoriamente habilitar:
  - `long`
  - ou `short`
  - ou ambos
- nunca e permitido salvar a estrategia com `long` e `short` desabilitados ao mesmo tempo

## Stop Loss
### Obrigatoriedade
- `stop loss` e obrigatorio na `YOUR Strategy`

### Modos suportados na V1
- percentual
- preco fixo
- condicao por indicador
- modos que usam os indicadores atuais do catalogo

### Fora da V1
- `candle structure`

## Take Profit
### Obrigatoriedade
- `take profit` pode ser opcional
- quando ausente, a UX deve mostrar `warning forte`
- o usuario deve confirmar explicitamente que esta salvando/ativando sem `take profit`

### Modos suportados na V1
- percentual
- `risk/reward`
- preco fixo
- condicao por indicador
- `trailing take profit`

### Restricao importante de produto
O `trailing take profit` nao pode ser modelado como um alvo que se renova infinitamente a cada micro-movimento do preco. Na V1, a semantica precisa ser controlada e ancorada em referencia valida de mercado, preservando possibilidade real de execucao.

### Fora da V1
- parcial

## Backtest e Validacao
### Para salvar
- o usuario pode salvar sem backtest obrigatorio

### Para ativar
- o backtest e obrigatorio antes da ativacao
- a `YOUR Strategy` segue o mesmo fluxo de ativacao dos outros presets
- a estrategia precisa passar pelas mesmas validacoes operacionais do produto

## Readiness Operacional
- o `Start bot readiness check` deve rodar sempre no `Start bot`
- isso inclui `start` inicial e novo `start` apos `pause`
- esse check nao depende do momento do save
- a estrategia customizada deve usar o mesmo readiness check do restante do produto

## Regras de Edicao
- a `YOUR Strategy` so pode ser editada com o bot pausado
- se o bot estiver rodando, a edicao deve ser bloqueada
- salvar a estrategia altera o registro custom atual da conta
- limpar o front nao deve persistir mudanca automaticamente

## Relacao com Presets Padrao
- `Safer`, `Balanced` e `More active` continuam existindo
- `YOUR Strategy` nao substitui os presets padrao
- o destaque de produto passa a incluir fortemente a criacao da propria estrategia

## Resultado Esperado
Ao final da primeira versao:
- o usuario consegue montar uma estrategia do zero em um fluxo guiado
- o resultado gera contrato compativel com o formato de estrategia atual do produto
- o usuario consegue salvar, testar via backtest e ativar a estrategia customizada
- o produto continua protegendo a operacao via regras de validacao, readiness e limites de escopo definidos nesta decisao
