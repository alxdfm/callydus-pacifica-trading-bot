# Layout Detalhado da Tela de Presets

## Objetivo
Definir a organização visual detalhada da tela de Presets para o MVP, com foco em comparação rápida, entendimento do risco, edição mínima e ativação clara da estratégia.

## Função da Tela
A tela de Presets deve responder a três perguntas:
- qual preset faz mais sentido para mim?
- o que esse preset faz de forma simples?
- o que eu posso ajustar antes de ativar?

## Princípio de Layout
A tela de Presets não deve parecer um formulário técnico.

Ela deve funcionar como:
- comparação
- escolha
- revisão
- ativação

## Estrutura Desktop

### Faixa 1: Header da Tela
Conteúdo:
- título: `Presets`
- subtítulo curto explicando que presets já trazem lógica pronta
- nota breve: `stop loss` e `take profit` são obrigatórios em todos

Objetivo:
- reduzir medo de configuração
- explicar que o usuário não precisa montar a estratégia do zero

### Faixa 2: Cards dos Presets
Bloco central e mais importante da tela.

Cards:
- Mais seguro
- Equilibrado
- Mais ativo

Cada card deve mostrar:
- nome do preset
- nível de risco
- frequência esperada
- timeframe padrão
- descrição curta do comportamento
- lista curta do que ele prioriza
- botão `Selecionar`

Objetivo:
- permitir comparação imediata
- transformar a escolha em uma decisão simples

### Faixa 3: Painel de Comparação Curta
Bloco abaixo ou ao lado dos cards.

Conteúdo:
- tabela simples comparando:
  - risco
  - frequência
  - estilo de entrada
  - tipo de stop
  - tipo de take profit

Objetivo:
- evitar que o usuário precise abrir cada card para entender a diferença

### Faixa 4: Painel de Revisão do Preset Selecionado
Aparece quando o usuário seleciona um preset.

Conteúdo:
- nome do preset ativo na seleção
- resumo textual da lógica em linguagem simples
- campos editáveis do MVP
- observação de que a estratégia é sugestão, não garantia de retorno

Campos editáveis:
- símbolo
- tamanho da posição
- habilitar `long`
- habilitar `short`

Objetivo:
- revisar sem sobrecarregar
- reforçar que a edição é mínima e segura

### Faixa 5: Bloco de Ativação
Bloco final com CTA principal.

Conteúdo:
- resumo final do que será ativado
- botão principal: `Ativar preset`
- ação secundária: `Cancelar`

Objetivo:
- encerrar a decisão de forma clara
- evitar ambiguidade sobre qual preset será ativado

## Estrutura Visual Recomendada

### Grid Desktop
- 12 colunas
- header ocupa largura total
- cards ocupam largura total em 3 colunas equivalentes
- comparação curta ocupa largura total
- revisão do preset ocupa 8 colunas
- bloco de ativação ocupa 4 colunas ou largura total abaixo, dependendo da implementação

### Hierarquia de Destaque
- cards são o foco principal da página
- preset selecionado ganha contorno, cor e selo visual
- revisão fica abaixo da comparação
- ativação fica isolada visualmente para evitar clique acidental

## Comportamento Mobile

### Ordem dos blocos
1. Header
2. Cards dos presets
3. Comparação curta em formato empilhado
4. Revisão do preset selecionado
5. Ativação

### Regras
- um card por linha
- preset selecionado expandível
- comparação em formato de lista, não tabela
- CTA fixo na parte inferior quando houver preset selecionado

## Componentes Principais

### 1. Card de Preset
Uso:
- comparação rápida
- entrada principal de decisão

### 2. Comparador Resumido
Uso:
- mostrar diferenças sem linguagem técnica

### 3. Painel de Revisão
Uso:
- concentrar os campos editáveis
- mostrar o que será ativado

### 4. Bloco de Ativação
Uso:
- confirmação final

## Regras de Prioridade Visual
- a escolha do preset vem antes da edição
- a edição vem antes da ativação
- o risco precisa ser visível antes do clique final
- o usuário não deve ver JSON, indicadores ou lógica bruta nessa tela

## O que não incluir na Tela de Presets do MVP
- edição de indicadores
- edição de timeframe
- visual builder de condições
- múltiplos níveis de configuração
- detalhes técnicos do contrato JSON

## Sugestão de Conteúdo por Card

### Mais seguro
- risco: baixo
- frequência: menor
- foco: proteção e seletividade

### Equilibrado
- risco: médio
- frequência: equilibrada
- foco: equilíbrio entre oportunidade e proteção

### Mais ativo
- risco: médio
- frequência: maior
- foco: mais oportunidades com regras mais abertas

## Critérios de Aceite
- um usuário entende a diferença entre os 3 presets sem abrir documentação externa
- um usuário consegue selecionar um preset em poucos segundos
- um usuário consegue revisar os campos editáveis sem confusão
- um usuário entende qual preset será ativado antes de confirmar
- a tela funciona bem em desktop e mobile

## Recomendação Final
A tela de Presets deve parecer uma escolha assistida de estratégia, não uma tela de parametrização técnica.

O foco precisa estar em:
- comparação simples
- confiança na escolha
- revisão mínima
- ativação clara
