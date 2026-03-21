# Presets do Produto

## Objetivo
Definir presets simples e claros para que o usuário possa iniciar uma estratégia sem precisar montar tudo do zero.

## Papel no Produto
Os presets são o coração da primeira experiência do produto.

Eles precisam:
- reduzir complexidade
- acelerar configuração
- aumentar confiança do usuário
- permitir demonstração rápida no hackathon

## Princípios de Design
- poucos presets no início
- nomes fáceis de entender
- parâmetros obrigatórios sempre visíveis
- defaults seguros
- explicação curta do comportamento esperado
- cada preset deve ter uma origem de validação manual anterior, quando aplicável, como referência de comportamento
- deixar explícito que o preset é uma sugestão de estratégia e não garantia de retorno

## Estrutura do Preset
Cada preset deve ter pelo menos os seguintes atributos:
- nome
- objetivo de uso
- nível de risco
- lógica base de indicadores
- parâmetros editáveis
- descrição curta
- observação de que é uma sugestão e não garantia

## Níveis de Risco
Sugestão inicial de catálogo:
- Safer
- Balanced
- More active

Observação:
- o nível de risco deve ajudar o usuário a entender o perfil do preset
- ele não deve ser vendido como previsão de resultado
- ele precisa ser consistente com o comportamento real da estratégia

## Direção Inicial dos 3 Presets
- Safer: menor frequência, foco em proteção e seletividade
- Balanced: equilíbrio entre frequência e proteção
- More active: foco em volume de oportunidades com regras mais abertas

## Regras Gerais
- `stop loss` e `take profit` são obrigatórios em todos os presets
- presets podem combinar indicadores simples
- o usuário pode ajustar alguns valores, mas não deve precisar entender a lógica completa para operar
- a primeira versão deve evitar excesso de flexibilidade
- se houver validação manual anterior, ela deve ser usada apenas como referência de produto

## Validação Manual de Referência
Uma opção é usar validações manuais anteriores, por exemplo recriando a mesma lógica em um editor como Pine Script no TradingView, para observar o comportamento histórico e ajudar a desenhar o preset.

Isso deve ser tratado como:
- evidência de apoio para desenho do preset
- referência de comportamento
- não como garantia de performance futura

## Questões A Definir
- quais indicadores compõem cada preset
- quais parâmetros serão editáveis em cada nível de risco
- como o produto vai mostrar o nível de risco de forma simples
- como comunicar a validação manual sem induzir promessa de retorno
