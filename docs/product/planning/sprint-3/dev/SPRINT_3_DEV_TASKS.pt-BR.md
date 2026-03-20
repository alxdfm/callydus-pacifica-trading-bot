# Sprint 3: Tasks do Dev

## Objetivo da Sprint
Entregar o Dashboard funcional como centro operacional do MVP, refletindo estado da conta, estado do bot, preset ativo e contexto operacional principal.

## Escopo
- rota do dashboard
- cards de resumo
- preset ativo
- trades atuais no dashboard
- trades recentes no dashboard
- alertas principais
- ação global de pausar/retomar bot

## Entregáveis finais da Sprint
- dashboard funcional
- cards de saldo, PnL e contadores
- bloco do preset ativo
- bloco de trades atuais
- bloco de trades recentes
- bloco de alertas
- ação global do bot

## Task V3.1: Implementar estrutura base do Dashboard

### Objetivo
Construir a página principal do dashboard usando o layout compartilhado do app.

### Escopo
- header
- cards de resumo
- preset ativo
- trades atuais
- trades recentes
- alertas

### Atividades
- criar rota do dashboard
- implementar estrutura visual principal da tela
- organizar blocos segundo a hierarquia definida em produto
- garantir responsividade base do dashboard

### Entregáveis
- estrutura funcional do dashboard

### Dependências
- outputs das Sprint 1 e 2

### Critério de pronto
- o dashboard existe como tela funcional e responsiva

## Task V3.2: Integrar saldo e PnL agregado

### Objetivo
Exibir leitura financeira básica da conta no dashboard.

### Escopo
- saldo atual
- PnL agregado

### Atividades
- integrar fonte de saldo da conta
- integrar fonte de PnL agregado
- renderizar valores nos cards corretos
- tratar ausência de dados, loading e erro

### Entregáveis
- card de saldo funcional
- card de PnL funcional

### Dependências
- V3.1

### Critério de pronto
- saldo e PnL aparecem com consistência e tratamento mínimo de estado

## Task V3.3: Integrar contadores operacionais

### Objetivo
Exibir indicadores rápidos de operação no dashboard.

### Escopo
- trades ativos
- trades encerrados hoje

### Atividades
- integrar contagem de trades ativos
- integrar contagem de trades encerrados hoje
- renderizar contadores nos cards
- tratar estados vazios e ausência de dados

### Entregáveis
- cards operacionais de contagem

### Dependências
- V3.1

### Critério de pronto
- contadores respondem ao estado atual da operação

## Task V3.4: Exibir preset ativo e status geral do bot

### Objetivo
Tornar visível no dashboard qual preset está rodando e qual o estado do bot.

### Escopo
- preset ativo
- risco
- símbolo
- timeframe
- long/short
- tamanho da posição
- status do bot

### Atividades
- consumir preset ativo persistido na Sprint 2
- renderizar informações do preset ativo
- renderizar status geral do bot
- ligar botões:
  - `Revisar preset`
  - `Trocar preset`
  se estiverem no escopo navegacional da sprint

### Entregáveis
- bloco funcional do preset ativo
- status geral do bot visível

### Dependências
- V3.1
- outputs da Sprint 2

### Critério de pronto
- usuário entende rapidamente qual automação está ativa

## Task V3.5: Renderizar trades atuais no dashboard

### Objetivo
Mostrar os trades abertos diretamente no dashboard com prioridade operacional.

### Escopo
- lista resumida
- direção
- entrada
- preço atual
- PnL
- status
- ação de encerramento

### Atividades
- integrar lista resumida de trades abertos
- renderizar os campos principais de cada item
- destacar visualmente direção e status
- implementar botão `Encerrar` no contexto do dashboard, se já suportado
- tratar estados vazios e loading

### Entregáveis
- bloco funcional de trades atuais no dashboard

### Dependências
- V3.1

### Critério de pronto
- trades atuais são visíveis e priorizados
- ação principal por trade fica acessível quando disponível

## Task V3.6: Renderizar trades recentes no dashboard

### Objetivo
Mostrar contexto rápido de operação encerrada sem transformar o dashboard em tela histórica.

### Escopo
- resultado
- motivo de encerramento
- horário

### Atividades
- integrar lista curta de trades recentes
- renderizar resultado resumido
- renderizar motivo de encerramento
- renderizar horário
- tratar estados vazios e loading

### Entregáveis
- bloco funcional de trades recentes

### Dependências
- V3.1

### Critério de pronto
- histórico recente aparece como apoio e não como foco principal

## Task V3.7: Implementar alertas principais e ação global do bot

### Objetivo
Dar controle global e visibilidade para problemas principais diretamente no dashboard.

### Escopo
- alertas
- reconciliação
- ação de pausar/retomar

### Atividades
- renderizar alertas operacionais principais
- renderizar estado de reconciliação quando existir
- implementar ação global de pausar ou retomar bot
- refletir mudança de estado do bot no dashboard

### Entregáveis
- bloco de alertas funcional
- ação global do bot funcional

### Dependências
- V3.1
- V3.4

### Critério de pronto
- usuário vê alertas principais
- usuário consegue pausar ou retomar o bot a partir do dashboard

## Task V3.8: Implementar estados de loading, vazio e erro do Dashboard

### Objetivo
Evitar ambiguidade quando os blocos do dashboard ainda não tiverem dados ou estiverem falhando.

### Escopo
- resumo
- preset ativo
- trades atuais
- trades recentes
- alertas

### Atividades
- implementar loading dos blocos
- implementar estado vazio para ausência de trades
- implementar estado de erro para dados da conta
- implementar estado de erro para dados operacionais

### Entregáveis
- tratamento mínimo de estados do dashboard

### Dependências
- V3.2
- V3.3
- V3.4
- V3.5
- V3.6
- V3.7

### Critério de pronto
- dashboard não parece quebrado durante carregamento ou falha

## Task V3.9: Validar fluxo completo da Sprint 3

### Objetivo
Garantir que o dashboard funcione ponta a ponta como centro operacional.

### Escopo
- carregamento
- exibição de dados
- interação principal
- consistência com preset ativo

### Atividades
- validar acesso ao dashboard após onboarding
- validar exibição de saldo e PnL
- validar preset ativo
- validar trades atuais e recentes
- validar alertas
- validar pausa/retomada do bot
- corrigir inconsistências evidentes

### Entregáveis
- Sprint 3 estável para revisão interna

### Dependências
- V3.1
- V3.2
- V3.3
- V3.4
- V3.5
- V3.6
- V3.7
- V3.8

### Critério de pronto
- o dashboard é demonstrável como centro operacional do MVP
- os principais blocos funcionam com consistência

## Definição de pronto da Sprint do Dev
- dashboard está funcional em desktop e mobile
- saldo, PnL e contadores aparecem corretamente
- preset ativo e status do bot são exibidos
- trades atuais e recentes aparecem com consistência
- alertas e ação global do bot estão operacionais
