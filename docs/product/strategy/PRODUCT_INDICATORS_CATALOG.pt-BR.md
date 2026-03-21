# Catálogo Final de Indicadores

## Objetivo
Fechar o conjunto de indicadores permitidos no MVP para que os presets tenham leitura simples, consistência de contrato e tradução direta para o motor do bot.

## Catálogo Final

### 1. `emaFast`
- tipo: média móvel exponencial
- uso: detectar aceleração e cruzamento de curto prazo
- padrão sugerido: período menor

### 2. `emaSlow`
- tipo: média móvel exponencial
- uso: detectar direção de fundo e cruzamento de tendência
- padrão sugerido: período maior

### 3. `rsi`
- tipo: oscilador de força
- uso: confirmação de sobrecompra, sobrevenda e timing de entrada
- padrão sugerido: 14

### 4. `atr`
- tipo: volatilidade
- uso: calcular distância de stop loss dinâmica
- padrão sugerido: 14

### 5. `volume`
- tipo: volume bruto do candle
- uso: medir atividade do mercado
- observação: pode ser usado como entrada ou confirmação

### 6. `volumeSma`
- tipo: média móvel simples do volume
- uso: criar uma referência objetiva para confirmar aumento de atividade
- observação: resolve a leitura genérica de volume no preset

## Regras de Produto
- o catálogo deve ficar pequeno no MVP
- cada indicador precisa ter um papel claro
- os presets devem usar apenas esse conjunto
- a interface futura pode esconder detalhes, mas não mudar o vocabulário base

## Relação com os Presets
- Safer: `emaFast`, `emaSlow`, `rsi`, `atr`
- Balanced: `emaFast`, `emaSlow`, `rsi`, `volume`, `volumeSma`, `atr`
- More active: `volume`, `volumeSma`, `rsi`, `emaFast`, `emaSlow`, `atr`

## Fora do MVP
- MACD
- Bollinger Bands
- ADX
- Ichimoku
- qualquer indicador adicional sem necessidade clara de produto

## Resultado
O catálogo final fecha o vocabulário de configuração do MVP e evita expansão prematura de complexidade.
