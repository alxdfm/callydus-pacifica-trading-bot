# Sprint 3: Tasks do Designer

## Objetivo da Sprint
Entregar o Dashboard completo em nível de design, com hierarquia visual clara, leitura rápida de estado e foco operacional.

## Escopo
- layout desktop do dashboard
- layout mobile do dashboard
- cards de resumo
- bloco de preset ativo
- bloco de trades atuais
- bloco de trades recentes
- faixa de alertas

## Entregáveis finais da Sprint
- dashboard desktop completo
- dashboard mobile completo
- componentes dos cards de resumo
- componente do preset ativo
- bloco de trades atuais no dashboard
- bloco de trades recentes
- faixa de alertas
- handoff mínimo da Sprint 3

## Task D3.1: Fechar arquitetura visual do Dashboard

### Objetivo
Definir a organização macro da tela do Dashboard para desktop e mobile.

### Escopo
- header operacional
- cards de resumo
- preset ativo
- trades atuais
- trades recentes
- alertas

### Atividades
- validar ordem dos blocos no desktop
- validar ordem dos blocos no mobile
- definir grid principal da tela
- garantir que o dashboard responde às perguntas centrais do produto
- ajustar equilíbrio entre blocos principais e blocos secundários

### Entregáveis
- estrutura visual final do Dashboard

### Dependências
- outputs de Sprint 1 e Sprint 2

### Critério de pronto
- a tela tem hierarquia clara
- o dashboard parece um centro operacional e não um terminal analítico

## Task D3.2: Desenhar header operacional do Dashboard

### Objetivo
Definir o bloco superior que resume o estado global da conta e do bot.

### Escopo
- título
- subtítulo
- status da Pacifica
- status do bot
- CTA de pausar/retomar

### Atividades
- definir composição do header
- definir visual de selos de status
- definir CTA principal da tela
- definir comportamento visual de estado ativo e pausado

### Entregáveis
- header operacional final

### Dependências
- D3.1

### Critério de pronto
- o usuário entende rapidamente se o sistema está pronto e operando

## Task D3.3: Desenhar cards de resumo

### Objetivo
Definir os cards de leitura imediata da conta.

### Escopo
- saldo atual
- PnL agregado
- trades ativos
- trades encerrados hoje

### Atividades
- definir hierarquia visual dos 4 cards
- definir peso visual para saldo e PnL
- definir tratamento visual de variação positiva e negativa
- definir formato de número e rótulos
- validar leitura em desktop e mobile

### Entregáveis
- conjunto de cards de resumo final

### Dependências
- D3.1

### Critério de pronto
- os cards podem ser escaneados rapidamente
- o PnL tem leitura clara sem dominar toda a interface

## Task D3.4: Desenhar bloco de preset ativo

### Objetivo
Definir o componente que mostra qual automação está rodando no momento.

### Escopo
- nome do preset
- risco
- símbolo
- timeframe
- long/short
- tamanho da posição
- ações secundárias

### Atividades
- organizar os dados do preset ativo
- definir destaque de risco
- definir visual de long e short habilitado/desabilitado
- definir visual dos botões `Revisar preset` e `Trocar preset`

### Entregáveis
- componente final do preset ativo

### Dependências
- D3.1

### Critério de pronto
- o usuário entende rapidamente qual estratégia está ativa

## Task D3.5: Desenhar bloco de trades atuais no Dashboard

### Objetivo
Definir a apresentação resumida dos trades abertos dentro do Dashboard.

### Escopo
- lista resumida
- contador
- ação de encerramento

### Atividades
- desenhar lista dos trades atuais
- definir densidade de informação por item
- definir visual de direção do trade
- definir visual de status
- definir botão `Encerrar` dentro do dashboard

### Entregáveis
- bloco de trades atuais no dashboard

### Dependências
- D3.1

### Critério de pronto
- os trades atuais têm prioridade visual sobre o histórico
- a ação principal por trade é visível

## Task D3.6: Desenhar bloco de trades recentes

### Objetivo
Definir o contexto rápido de histórico recente dentro do Dashboard.

### Escopo
- resultado
- motivo de encerramento
- horário

### Atividades
- desenhar lista compacta de trades recentes
- definir visual de resultado positivo e negativo
- definir apresentação compacta de motivo de encerramento
- validar separação clara entre bloco atual e bloco recente

### Entregáveis
- bloco de trades recentes no dashboard

### Dependências
- D3.1

### Critério de pronto
- histórico recente aparece como contexto, não como foco principal

## Task D3.7: Desenhar faixa de alertas e estados críticos

### Objetivo
Definir como erros, alertas e reconciliação aparecem no Dashboard.

### Escopo
- erro
- alerta
- reconciliação
- aviso operacional

### Atividades
- definir visual da faixa de alertas
- definir ícones ou marcadores de severidade
- definir tratamento visual para estado crítico
- definir tratamento visual para estado informativo

### Entregáveis
- componente de alertas final

### Dependências
- D3.1

### Critério de pronto
- problemas aparecem de forma visível sem poluir a tela

## Task D3.8: Validar comportamento mobile do Dashboard

### Objetivo
Garantir que o dashboard continue útil e legível em telas pequenas.

### Escopo
- ordem dos blocos
- cards empilhados
- trades atuais
- alertas

### Atividades
- revisar ordem dos blocos em mobile
- adaptar cards para coluna única
- validar visibilidade do preset ativo acima da dobra
- validar ação de encerrar trade no mobile
- validar legibilidade de alertas

### Entregáveis
- versão mobile validada do dashboard

### Dependências
- D3.2
- D3.3
- D3.4
- D3.5
- D3.6
- D3.7

### Critério de pronto
- a tela continua escaneável e operacional no mobile

## Task D3.9: Preparar handoff da Sprint 3 para Dev

### Objetivo
Entregar o pacote necessário para implementação fiel do Dashboard.

### Escopo
- componentes
- estados
- regras de hierarquia
- comportamento responsivo

### Atividades
- nomear componentes do dashboard
- organizar estados críticos
- anexar rótulos e textos curtos
- anexar regras de prioridade visual
- registrar comportamento desktop e mobile

### Entregáveis
- pacote de handoff da Sprint 3

### Dependências
- D3.1
- D3.2
- D3.3
- D3.4
- D3.5
- D3.6
- D3.7
- D3.8

### Critério de pronto
- o time de desenvolvimento consegue implementar o dashboard sem adivinhar intenção visual

## Definição de pronto da Sprint do Designer
- dashboard desktop e mobile estão fechados
- cards, preset ativo, trades e alertas estão definidos
- a hierarquia visual está consistente
- handoff da Sprint 3 está pronto
