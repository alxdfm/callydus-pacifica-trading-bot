# Validação dos Presets contra o Contrato

## Objetivo
Verificar se a proposta inicial de presets atende ao contrato de triggers, risco e execução que foi fechado para o MVP.

## Resumo Executivo
A proposta inicial **atende ao contrato**.

O ponto de volume foi resolvido ao adotar `volumeSma` como indicador derivado no catálogo final. Isso mantém o contrato principal intacto e deixa os presets Equilibrado e Mais ativo objetivos.

## Conclusão por Preset

### 1. Mais seguro
**Status:** atende diretamente.

**Por que encaixa**
- usa `cross` para o gatilho principal
- usa `threshold` para confirmação com RSI
- usa `atr` no stop loss
- usa `rr` no take profit
- é simples de explicar e executar

**Leitura de contrato**
- `long`: EMA rápida cruza acima da EMA lenta + RSI abaixo de 30
- `short`: EMA rápida cruza abaixo da EMA lenta + RSI acima de 70

**Ajuste necessário**
- nenhum ajuste estrutural

### 2. Equilibrado
**Status:** atende diretamente.

**Por que encaixa**
- usa `cross` para direção
- usa `threshold` para RSI
- mantém lógica simples e legível

**Ponto de atenção**
- a confirmação de volume usa `volume` contra `volumeSma`

**Leitura de contrato**
- `long`: EMA rápida cruza acima da EMA lenta + RSI de timing + confirmação de volume
- `short`: espelho do lado long

**Ajuste necessário**
- nenhum ajuste estrutural

### 3. Mais ativo
**Status:** atende diretamente.

**Por que encaixa**
- usa os mesmos operadores já fechados
- prioriza frequência de oportunidade
- pode manter RSI e cruzamento como filtros simples

**Ponto de atenção**
- o volume precisa entrar como gatilho explícito, não como noção genérica

**Leitura de contrato**
- mais sinais que o Mais seguro
- menos filtragem que o Mais seguro
- mais atividade visual na interface

**Ajuste necessário**
- nenhum ajuste estrutural

## Veredito de Produto
- **Mais seguro:** pronto
- **Equilibrado:** pronto
- **Mais ativo:** pronto

## Recomendação
Manter o contrato como está e fechar `volumeSma` no catálogo final de indicadores.

### Sugestão prática
Adicionar um indicador derivado:
- `volumeSma`: média móvel simples do volume

Isso permite:
- confirmação de volume
- maior clareza de leitura
- compatibilidade com o contrato atual

## Risco de Produto
- se o volume ficar genérico demais, o usuário não entende o que está sendo medido
- se o preset pedir muita interpretação, a simplicidade do produto cai

## Próxima Decisão
Catálogo final a ser publicado em documento próprio.
