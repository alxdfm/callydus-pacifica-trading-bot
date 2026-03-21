# Sprint 1: Tasks do Designer

## Objetivo da Sprint
Entregar a base visual do MVP e o fluxo completo de onboarding em nível de design, já pronto para handoff ao desenvolvimento.

## Escopo
- mini sistema visual do MVP
- onboarding desktop
- onboarding mobile
- estados de wallet
- estados de credenciais Pacifica
- mensagens de erro e sucesso
- copy base em inglês e labels preparadas para i18n

## Definition of Ready
- o MVP Scope Lock está aprovado
- o MVP Handoff Pack está disponível
- o onboarding é a prioridade da Sprint 1
- o idioma base é inglês e a experiência deve aceitar tradução sem redesenho
- nenhum layout deve expor JSON ou lógica técnica ao usuário final

## Entregáveis finais da Sprint
- kit visual base do MVP
- tela de onboarding desktop
- tela de onboarding mobile
- estados de wallet
- estados de credenciais
- textos curtos de apoio e erro
- handoff mínimo de Sprint 1

## Task D1.1: Definir mini sistema visual do MVP

### Objetivo
Criar a base visual mínima para que onboarding e telas seguintes não sejam desenhados de forma inconsistente.

### Prioridade
P0

### Escopo
- cores
- tipografia
- espaçamento
- botões
- campos
- cards
- badges de status
- tratamento de copy compatível com i18n

### Atividades
- definir paleta principal da interface
- definir paleta semântica:
  - sucesso
  - erro
  - alerta
  - ativo
  - pausado
- definir escala tipográfica:
  - título principal
  - título de seção
  - subtítulo
  - texto padrão
  - texto auxiliar
- definir escala de espaçamento base
- definir padrão de botão:
  - primário
  - secundário
  - destrutivo
  - desabilitado
- definir padrão de campo de entrada:
  - normal
  - foco
  - erro
  - desabilitado
- definir padrão de card
- definir padrão de badge de status
- definir base tipográfica e de espaçamento que suporte textos em inglês e traduzidos
- definir padrão de texto para labels curtas e helper copy baseada em chave

### Entregáveis
- tabela de cores
- escala tipográfica
- escala de espaçamento
- biblioteca mínima de componentes-base

### Dependências
- nenhuma

### Critério de pronto
- existe uma base visual única
- os componentes definidos são suficientes para construir onboarding
- estados críticos e destrutivos são claramente distinguíveis
- o sistema visual suporta inglês primeiro e futuras traduções sem quebrar layout

## Task D1.2: Desenhar estrutura desktop do onboarding

### Objetivo
Definir a experiência principal de onboarding para desktop.

### Prioridade
P0

### Escopo
- header da tela
- progresso em 2 etapas
- card de wallet
- card de credenciais Pacifica
- painel de estado da conta
- CTA final

### Atividades
- desenhar header com:
  - título
  - subtítulo
  - indicador de progresso
- desenhar card de wallet com:
  - título
  - descrição curta
  - status
  - botão de conexão
- desenhar card de credenciais com:
  - campo de API key
  - campo de secret/credencial
  - estado de validação
  - botão de validação
- desenhar painel de estado da conta
- desenhar área de CTA final
- definir hierarquia visual entre cards e painel de estado

### Entregáveis
- layout desktop completo do onboarding
- especificação de ordem visual dos blocos

### Dependências
- D1.1

### Critério de pronto
- a tela pode ser entendida visualmente sem explicação externa
- o fluxo da esquerda para a direita ou de cima para baixo é claro
- a ação final só ganha protagonismo quando faz sentido
- o layout continua legível com copy em inglês e labels traduzidas

## Task D1.3: Desenhar estrutura mobile do onboarding

### Objetivo
Garantir que o onboarding continue curto e claro em telas pequenas.

### Prioridade
P0

### Escopo
- versão mobile completa do onboarding
- ordem dos blocos
- CTA final
- leitura dos estados

### Atividades
- adaptar header para mobile
- empilhar card de wallet e card de credenciais
- ajustar painel de estado da conta para leitura vertical
- definir CTA final fixo ou visualmente persistente
- validar área útil de toque para ações principais

### Entregáveis
- layout mobile completo do onboarding
- regras de adaptação de desktop para mobile

### Dependências
- D1.1
- D1.2

### Critério de pronto
- a tela funciona em coluna única
- a leitura do progresso continua clara
- CTA e mensagens continuam legíveis sem atrito
- o mobile tolera strings maiores sem sobreposição

## Task D1.4: Definir estados visuais da wallet

### Objetivo
Especificar todos os estados de conexão da wallet Solana de forma inequívoca.

### Prioridade
P0

### Escopo
- não conectada
- conectando
- conectada
- erro

### Atividades
- desenhar estado inicial sem conexão
- desenhar estado de loading/conectando
- desenhar estado de sucesso
- desenhar estado de erro
- definir texto curto para cada estado
- definir ícone, badge ou marcador visual de cada estado

### Entregáveis
- matriz visual de estados da wallet
- cópia curta por estado

### Dependências
- D1.1
- D1.2

### Critério de pronto
- os estados são distinguíveis em menos de alguns segundos
- sucesso e erro não podem ser confundidos
- loading não parece estado travado
- os rótulos dos estados funcionam em inglês e em idiomas localizados

## Task D1.5: Definir estados visuais das credenciais Pacifica

### Objetivo
Especificar o comportamento visual dos campos e da validação de credenciais.

### Prioridade
P0

### Escopo
- vazia
- preenchida
- validando
- válida
- inválida

### Atividades
- desenhar estado inicial dos campos
- desenhar estado preenchido antes da validação
- desenhar estado de validação em andamento
- desenhar estado válido
- desenhar estado inválido
- definir mensagens curtas de erro e sucesso
- definir posição visual das mensagens

### Entregáveis
- matriz visual de estados das credenciais
- mensagens padrão de validação

### Dependências
- D1.1
- D1.2

### Critério de pronto
- o usuário entende quando precisa agir
- erro fica próximo do problema
- validação bem-sucedida é inequívoca
- as labels e helper texts podem ser internacionalizadas

## Task D1.6: Definir mensagens de erro e sucesso do onboarding

### Objetivo
Padronizar a microcopy principal da Sprint 1 para reduzir ambiguidade.

### Prioridade
P0

### Escopo
- wallet
- credenciais
- estado final de conta pronta
- bloqueio de continuação

### Atividades
- definir a copy base em inglês para todos os estados do onboarding
- definir mensagem para wallet não conectada
- definir mensagem para falha de conexão da wallet
- definir mensagem para credencial inválida
- definir mensagem para validação em andamento
- definir mensagem para conta pronta
- definir mensagem para impossibilidade de continuar

### Entregáveis
- tabela de microcopy de onboarding

### Dependências
- D1.4
- D1.5

### Critério de pronto
- todas as mensagens são curtas, acionáveis e consistentes
- não há linguagem excessivamente técnica
- a mesma estrutura de mensagem pode ser traduzida sem mexer no layout

## Task D1.7: Preparar handoff de Sprint 1 para Dev

### Objetivo
Garantir que o time de desenvolvimento consiga implementar Sprint 1 sem adivinhação visual.

### Prioridade
P1

### Escopo
- organização dos artefatos
- nomeação dos componentes
- estados
- observações responsivas
- orientação de chaves de i18n para onboarding

### Atividades
- nomear componentes principais
- organizar telas em ordem de fluxo
- anexar estados de wallet e credenciais
- anexar microcopy validada
- registrar comportamento desktop e mobile
- registrar observações de botão desabilitado e estado bloqueado

### Entregáveis
- pacote de handoff de Sprint 1

### Dependências
- D1.1
- D1.2
- D1.3
- D1.4
- D1.5
- D1.6

### Critério de pronto
- dev consegue implementar onboarding e base visual sem precisar interpretar intenção de design

## Definição de pronto da Sprint do Designer
- kit visual base existe
- onboarding desktop e mobile estão completos
- estados de wallet e credenciais estão cobertos
- microcopy principal está definida
- handoff está pronto para desenvolvimento
