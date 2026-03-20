# Layout Detalhado do Dashboard

## Objetivo
Definir a estrutura visual detalhada do Dashboard da conta para o MVP, com prioridade em leitura rápida de estado, controle operacional e visibilidade dos trades em andamento.

## Função do Dashboard
O Dashboard deve responder, em poucos segundos, a quatro perguntas:
- a conta está conectada?
- o bot está ativo ou parado?
- existe trade aberto agora?
- o que eu preciso fazer em seguida?

## Princípio de Layout
O Dashboard não é uma tela de análise profunda.

Ele é uma tela de:
- estado
- controle
- monitoramento
- ação rápida

## Estrutura Desktop

### Faixa 1: Header Operacional
Fica no topo da área principal.

Conteúdo:
- título da tela: `Dashboard`
- subtítulo curto: resumo do estado atual
- selo de conexão Pacifica
- selo de status do bot
- botão principal: `Pausar bot` ou `Retomar bot`

Objetivo:
- confirmar rapidamente se o sistema está operacional
- destacar a ação global mais importante

### Faixa 2: Cards de Resumo
Primeira linha de cards.

Cards:
- saldo atual
- PnL agregado
- trades ativos
- trades encerrados hoje

Regras visuais:
- cards com números grandes
- rótulo pequeno e claro
- variação positiva ou negativa no PnL com cor
- trades ativos com destaque superior aos demais

Objetivo:
- entregar leitura financeira imediata
- permitir escaneamento rápido

### Faixa 3: Preset Ativo e Estado da Estratégia
Bloco horizontal logo abaixo dos cards.

Conteúdo:
- nome do preset ativo
- nível de risco
- símbolo configurado
- timeframe
- `long` habilitado ou não
- `short` habilitado ou não
- tamanho da posição
- botão secundário: `Revisar preset`
- botão secundário: `Trocar preset`

Objetivo:
- deixar visível qual automação está rodando
- reduzir dúvida sobre configuração ativa

### Faixa 4: Trades Atuais
Bloco principal da tela.

Conteúdo:
- título: `Trades atuais`
- contador de trades abertos
- lista de trades com prioridade visual alta

Cada item deve mostrar:
- direção
- símbolo
- preço de entrada
- preço atual
- PnL do trade
- status
- botão `Encerrar`

Objetivo:
- concentrar a atenção no que está em risco agora
- permitir ação manual rápida

### Faixa 5: Trades Recentes
Bloco secundário abaixo ou ao lado de Trades Atuais, dependendo da largura.

Conteúdo:
- últimos trades encerrados
- resultado
- motivo de encerramento
- horário

Objetivo:
- oferecer contexto rápido sem competir com trades ativos

### Faixa 6: Estado e Alertas
Bloco menor, de apoio.

Conteúdo:
- mensagens de erro ou alerta
- status de reconciliação
- notificações operacionais simples

Objetivo:
- tornar problemas visíveis sem poluir a tela principal

## Estrutura Visual Recomendada

### Grid Desktop
- 12 colunas
- faixa 1 ocupa largura total
- faixa 2 ocupa largura total com 4 cards
- faixa 3 ocupa largura total
- faixa 4 ocupa 8 colunas
- faixa 5 ocupa 4 colunas
- faixa 6 pode ocupar largura total abaixo ou lateral do bloco secundário

### Hierarquia de Tamanho
- números de saldo e PnL são grandes
- preset ativo tem destaque médio
- trades atuais têm maior densidade visual
- histórico recente é mais compacto
- alertas usam cor e ícone, mas não devem dominar a interface

## Comportamento Mobile

### Ordem dos blocos
1. Header operacional
2. Saldo e PnL
3. Preset ativo
4. Trades atuais
5. Trades recentes
6. Alertas

### Regras
- cards em coluna única
- números continuam grandes
- lista de trades com swipe ou detalhe expandível
- botão de encerrar trade sempre visível
- ações globais no topo

## Componentes Principais

### 1. Card de Resumo
Uso:
- saldo
- PnL
- contadores

### 2. Card de Preset Ativo
Uso:
- explicar o estado atual da automação
- dar acesso rápido à revisão

### 3. Lista de Trades Atuais
Uso:
- ação e monitoramento

### 4. Lista de Trades Recentes
Uso:
- contexto de resultado

### 5. Faixa de Alerta
Uso:
- erro
- reconciliação
- aviso de execução

## Regras de Prioridade Visual
- trade aberto vale mais do que trade encerrado
- bot parado com erro vale mais do que PnL
- preset ativo vale mais do que histórico
- conexão e saúde da conta devem aparecer antes de detalhes secundários

## O que não incluir no Dashboard do MVP
- gráficos de candles como foco principal
- configuração técnica de indicadores
- histórico completo em tabela densa
- múltiplos painéis analíticos
- comparação avançada entre presets

## Critérios de Aceite
- um usuário entende se o bot está ativo ou parado em menos de 3 segundos
- um usuário encontra o preset ativo sem procurar em outra tela
- um usuário encontra trades atuais antes do histórico
- um usuário consegue encerrar um trade a partir do Dashboard
- o Dashboard continua legível em mobile

## Recomendação Final
O Dashboard deve parecer um centro de comando simples, não um terminal de trading avançado.

A tela precisa priorizar:
- estado global
- preset ativo
- trades atuais
- ação rápida
