# Tasks e Entregáveis de Design do MVP

## Objetivo
Detalhar o escopo de Design do MVP em entregáveis concretos, tarefas acionáveis e critério de pronto para handoff ao time de desenvolvimento.

## Escopo de Design
O trabalho de Design cobre:
- onboarding
- dashboard
- presets
- trades atuais
- histórico
- consistência visual entre telas
- estados vazios, loading e erro
- comportamento mobile

## Ordem Recomendada
1. Fundamentos visuais
2. Onboarding
3. Presets
4. Dashboard
5. Trades Atuais
6. Histórico
7. Consolidação e handoff

## Bloco 1: Fundamentos Visuais

### Entregáveis
- direção visual do MVP
- tokens básicos de UI
- definição de componentes-base

### Tasks
- definir paleta principal de interface
- definir escala tipográfica
- definir espaçamento base
- definir padrão de botões primário, secundário e destrutivo
- definir padrão de cards
- definir padrão de badges de status
- definir padrão de cores para risco, erro, sucesso, ativo e pausado

### Critério de pronto
- existe um mini kit visual reutilizável
- as decisões de cor e tipografia suportam desktop e mobile
- ações destrutivas e estados críticos são distinguíveis

## Bloco 2: Onboarding

### Entregáveis
- layout final desktop do onboarding
- layout final mobile do onboarding
- estados de wallet
- estados de credenciais Pacifica
- mensagens de erro e sucesso

### Tasks
- desenhar header do onboarding com progresso em 2 etapas
- desenhar card de conexão da wallet
- desenhar card de API keys da Pacifica
- desenhar painel de estado da conta
- desenhar botão final de continuação
- desenhar estados: vazio, conectando, validando, sucesso e erro
- definir mensagens curtas para falhas mais comuns

### Critério de pronto
- o fluxo de onboarding pode ser entendido só olhando a tela
- os estados de wallet e credenciais estão completos
- existe versão desktop e mobile

## Bloco 3: Presets

### Entregáveis
- tela final de presets desktop
- tela final de presets mobile
- cards finais dos 3 presets
- painel de comparação curta
- painel de revisão do preset selecionado

### Tasks
- desenhar card final do preset `Safer`
- desenhar card final do preset `Balanced`
- desenhar card final do preset `More active`
- definir visual de risco e frequência
- definir comparador resumido entre presets
- desenhar painel com campos editáveis do MVP
- definir bloco de ativação do preset
- definir estado visual de preset selecionado

### Critério de pronto
- diferenças entre presets são visíveis sem texto externo
- o usuário entende o risco antes de ativar
- os campos editáveis estão claros e mínimos

## Bloco 4: Dashboard

### Entregáveis
- layout final desktop do dashboard
- layout final mobile do dashboard
- cards de resumo
- card de preset ativo
- bloco de trades atuais
- bloco de trades recentes
- bloco de alertas

### Tasks
- desenhar header operacional
- desenhar cards de saldo, PnL e contadores
- desenhar card de preset ativo
- desenhar lista de trades atuais no dashboard
- desenhar lista de trades recentes
- desenhar faixa de alertas
- definir hierarquia visual da tela

### Critério de pronto
- o dashboard responde visualmente ao estado do sistema
- trades atuais têm prioridade clara sobre histórico
- estado do bot e preset ativo aparecem acima da dobra

## Bloco 5: Trades Atuais

### Entregáveis
- tela final de trades atuais desktop
- tela final de trades atuais mobile
- lista de trades com detalhe
- ação visual de encerramento manual

### Tasks
- desenhar lista/tabela de trades atuais
- definir diferenciação visual entre `long` e `short`
- definir badges de status do trade
- desenhar ação destrutiva `Encerrar`
- desenhar detalhe do trade selecionado ou expandido
- definir estado vazio da tela

### Critério de pronto
- a ação de encerrar está visível e segura
- direção e status do trade são reconhecíveis rapidamente
- a tela não se confunde com histórico

## Bloco 6: Histórico

### Entregáveis
- tela final de histórico desktop
- tela final de histórico mobile
- item padrão de trade encerrado
- tratamento visual de resultado

### Tasks
- desenhar lista cronológica do histórico
- definir item de trade encerrado
- definir visual de resultado positivo e negativo
- definir apresentação do motivo de encerramento
- nao incluir filtros na tela de historico do MVP
- definir estado vazio do histórico

### Critério de pronto
- resultado e motivo do encerramento são legíveis rapidamente
- a tela é mais discreta que trades atuais
- o histórico é facilmente escaneável

## Bloco 7: Consolidação e Handoff

### Entregáveis
- pacote final de telas
- pacote de componentes reutilizáveis
- estados vazios, loading e erro
- especificação de comportamento responsivo
- handoff para desenvolvimento

### Tasks
- revisar consistência visual entre telas
- revisar consistência de labels e CTAs
- definir estados vazios principais
- definir estados de loading principais
- definir estados de erro principais
- revisar fluxo completo do onboarding ao dashboard
- organizar handoff com nomeação de componentes e observações de uso

### Critério de pronto
- dev consegue implementar sem adivinhar comportamento visual
- estados principais do MVP estão cobertos
- responsividade mínima está documentada

## Entregáveis Finais Esperados do Designer
- 1 kit visual base
- 1 fluxo completo de onboarding
- 1 tela de presets completa
- 1 dashboard completo
- 1 tela de trades atuais
- 1 tela de histórico
- 1 pacote de estados vazios/loading/erro
- 1 handoff final para desenvolvimento

## Definição de Pronto para Handoff
O trabalho de Design está pronto para desenvolvimento quando:
- existe versão desktop e mobile das telas principais
- componentes repetidos estão padronizados
- estados críticos foram desenhados
- ações principais estão inequívocas
- a hierarquia visual está consistente em todo o MVP
