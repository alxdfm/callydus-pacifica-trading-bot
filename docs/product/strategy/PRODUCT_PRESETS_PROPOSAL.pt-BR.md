# Proposta Inicial de Presets

## Objetivo
Definir uma primeira família de presets simples, com nomes claros e comportamento previsível, para que o usuário consiga iniciar uma estratégia sem montar a lógica do zero.

## Direção de Produto
Os presets devem esconder a complexidade dos indicadores e expor apenas o essencial:
- perfil de risco
- indicadores base
- parâmetros editáveis
- explicação curta do comportamento esperado

O usuário escolhe um preset com base no estilo de operação e ajusta apenas o necessário.

## Premissas
- `stop loss` e `take profit` são obrigatórios em todos os presets
- presets são sugestões de estratégia, não garantia de retorno
- validações manuais anteriores podem ser usadas como referência de desenho
- a primeira versão deve priorizar simplicidade e clareza

## Estrutura Padrão de Cada Preset
- nome
- nível de risco
- objetivo de uso
- lógica base
- parâmetros editáveis
- observação de validação

## Preset 1: Safer
### Objetivo
Buscar entradas mais seletivas, com menor frequência e maior proteção.

### Perfil
- risco: baixo
- foco: proteção e confirmação forte

### Lógica Base Sugerida
- filtro de tendência com média móvel
- confirmação com RSI
- filtro de volatilidade com ATR

### Ideia de Entrada
- operar apenas quando a tendência estiver favorável
- exigir confirmação de força antes de entrar
- evitar mercados laterais ou muito instáveis

### Parâmetros Editáveis
- período da média móvel
- janela do RSI
- limite de RSI
- multiplicador de ATR para stop
- relação risco/retorno

### Quando Faz Sentido
- quando o usuário quer menos operações
- quando a prioridade é proteção
- quando o produto precisa de uma narrativa mais segura

## Preset 2: Balanced
### Objetivo
Equilibrar frequência de operações e filtragem de sinais.

### Perfil
- risco: médio
- foco: equilíbrio entre oportunidade e proteção

### Lógica Base Sugerida
- médias móveis para direção
- RSI para timing
- volume e `volumeSma` para confirmação de movimento

### Ideia de Entrada
- entrar quando houver alinhamento entre tendência e impulso
- aceitar mais sinais do que no conservador
- manter filtro suficiente para evitar ruído excessivo

### Parâmetros Editáveis
- período das médias móveis
- janela do RSI
- período da média de volume
- multiplicador de volume
- stop baseado em ATR ou percentual
- relação risco/retorno

### Quando Faz Sentido
- quando o usuário quer um meio-termo
- quando a demo precisa mostrar mais atividade
- quando queremos um preset com bom equilíbrio narrativo

## Preset 3: More active
### Objetivo
Aumentar a frequência de oportunidades com regras mais abertas, sem prometer agressividade.

### Perfil
- risco: médio-alto em frequência
- foco: mais volume de trades

### Lógica Base Sugerida
- volume como gatilho principal
- confirmação por RSI ou cruzamento de médias
- ATR para ajustar o stop conforme a volatilidade

### Ideia de Entrada
- permitir mais entradas quando houver movimento claro
- usar menos filtros do que os outros presets
- priorizar oportunidade em vez de seletividade máxima

### Parâmetros Editáveis
- janela do RSI ou médias
- período da média de volume
- multiplicador de volume
- multiplicador de ATR
- relação risco/retorno
- nível de sensibilidade do gatilho

### Quando Faz Sentido
- quando o usuário quer mais operações
- quando a estratégia precisa de maior recorrência
- quando a narrativa do produto pede maior atividade na interface

## Critério de Diferenciação Entre Presets
Os três presets devem ser diferentes em:
- frequência de entradas
- nível de filtragem
- sensibilidade ao mercado
- perfil de risco percebido

Eles não devem ser apenas variações cosméticas dos mesmos parâmetros.

## Validação Manual
Se houver validação manual anterior, ela deve ser usada apenas para orientar o desenho do preset.

Exemplo:
- recriar a lógica em Pine Script no TradingView
- observar comportamento histórico
- refinar os parâmetros do preset

Isso serve como:
- apoio de produto
- referência de comportamento
- não como garantia de performance futura

## Próximas Decisões
- quais parâmetros o usuário poderá editar no MVP
- como os presets serão explicados na interface web
