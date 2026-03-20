# Tasks e Entregáveis de Desenvolvimento do MVP

## Objetivo
Detalhar o escopo de Desenvolvimento do MVP em entregáveis concretos, tarefas acionáveis e definição de pronto para validação funcional.

## Escopo de Desenvolvimento
O trabalho de Desenvolvimento cobre:
- onboarding
- navegação principal
- presets
- dashboard
- trades atuais
- histórico
- estados de loading, vazio e erro
- integração entre telas e fluxos

## Ordem Recomendada
1. Fundamentos técnicos do frontend
2. Onboarding
3. Presets
4. Dashboard
5. Trades Atuais
6. Histórico
7. Integração e prontidão do MVP

## Bloco 1: Fundamentos Técnicos do Frontend

### Entregáveis
- estrutura base da aplicação web
- roteamento principal
- layout base compartilhado
- camada inicial de estado e serviços

### Tasks
- definir estrutura base de páginas e layout
- implementar shell da aplicação com navegação principal
- implementar topbar compartilhada
- implementar sidebar desktop e navegação mobile
- definir padrão de consumo de dados da Pacifica
- definir padrão de tratamento de estado global do bot
- preparar componentes base reutilizáveis

### Critério de pronto
- a aplicação navega entre telas principais
- existe uma estrutura única para layout compartilhado
- componentes base podem ser reutilizados entre páginas

## Bloco 2: Onboarding

### Entregáveis
- fluxo funcional de onboarding
- conexão de wallet Solana
- captura de credenciais Pacifica
- validação de credenciais
- bloqueio de acesso ao app principal

### Tasks
- implementar tela de onboarding
- integrar conexão de wallet Solana
- implementar formulário de credenciais Pacifica
- validar credenciais com feedback de sucesso e erro
- implementar estado de progresso do onboarding
- bloquear navegação para o Dashboard até onboarding completo
- persistir estado mínimo da sessão

### Critério de pronto
- o usuário só acessa o app principal após onboarding válido
- wallet e credenciais têm estados funcionais claros
- erros impedem avanço e são exibidos corretamente

## Bloco 3: Presets

### Entregáveis
- tela funcional de presets
- catálogo renderizado com 3 presets
- seleção de preset
- revisão de campos editáveis
- ativação do preset

### Tasks
- implementar listagem dos 3 presets
- implementar estado de seleção do preset
- implementar painel de comparação curta
- implementar painel de revisão do preset selecionado
- implementar edição dos campos permitidos:
  - `symbol`
  - `position size`
  - `long`
  - `short`
- montar payload final de ativação
- persistir preset ativo e parâmetros editados

### Critério de pronto
- o usuário consegue selecionar um preset
- o usuário consegue revisar os campos editáveis
- o usuário consegue ativar o preset sem acessar lógica técnica

## Bloco 4: Dashboard

### Entregáveis
- dashboard funcional com dados da conta
- cards de resumo
- bloco de preset ativo
- bloco de trades atuais
- bloco de trades recentes
- bloco de alertas

### Tasks
- implementar header operacional do dashboard
- integrar saldo da conta
- integrar PnL agregado
- integrar contagem de trades ativos
- exibir preset ativo
- exibir status do bot
- renderizar trades atuais no dashboard
- renderizar trades recentes
- renderizar alertas operacionais
- implementar ação de pausar ou retomar o bot

### Critério de pronto
- o dashboard responde ao estado atual da conta e do bot
- os blocos principais carregam corretamente
- ações globais ficam acessíveis e consistentes

## Bloco 5: Trades Atuais

### Entregáveis
- tela funcional de trades atuais
- lista de trades abertos
- detalhe ou seleção de trade
- ação de encerramento manual

### Tasks
- implementar tela dedicada de trades atuais
- integrar lista de trades abertos
- exibir direção, símbolo, entrada, preço atual, PnL e status
- implementar destaque do trade selecionado
- implementar ação `Encerrar` via `market order`
- atualizar estado local após encerramento
- refletir atualização no dashboard

### Critério de pronto
- a lista de trades reflete o estado atual do produto
- o encerramento manual funciona sem parar o bot
- as alterações aparecem nas telas relacionadas

## Bloco 6: Histórico

### Entregáveis
- tela funcional de histórico
- lista de trades encerrados
- motivo de encerramento
- identificação de trade da plataforma

### Tasks
- implementar tela de histórico
- integrar dados de trades encerrados
- exibir entrada, saída, resultado e motivo de encerramento
- exibir identificação de trade gerado pela plataforma
- implementar leitura cronológica simples
- implementar filtros simples, se incluídos no escopo

### Critério de pronto
- histórico exibe dados suficientes para revisão simples
- motivos de encerramento aparecem corretamente
- a tela se mantém funcional em desktop e mobile

## Bloco 7: Integração e Prontidão do MVP

### Entregáveis
- fluxo completo entre onboarding, presets, dashboard, trades e histórico
- guards de navegação
- estados vazios, loading e erro
- sincronização entre telas
- MVP pronto para demo

### Tasks
- integrar navegação entre todas as telas
- implementar guards de onboarding
- implementar estados vazios principais
- implementar estados de loading principais
- implementar estados de erro principais
- garantir consistência entre preset ativo, estado do bot e dados exibidos
- revisar fluxo completo de ativação do preset
- revisar fluxo completo de encerramento manual do trade
- corrigir pontos de fricção para demo

### Critério de pronto
- o fluxo principal funciona sem bloqueios indevidos
- os estados de erro e loading são tratáveis
- a aplicação está pronta para demonstração controlada

## Entregáveis Finais Esperados do Dev
- 1 app web navegável
- 1 fluxo completo de onboarding
- 1 fluxo completo de seleção e ativação de preset
- 1 dashboard operacional
- 1 tela de trades atuais com encerramento manual
- 1 tela de histórico
- 1 conjunto mínimo de estados vazios/loading/erro
- 1 MVP integrado pronto para demo

## Definição de Pronto para Validação
O trabalho de Desenvolvimento está pronto para validação quando:
- onboarding bloqueia acesso indevido
- presets podem ser escolhidos e ativados
- dashboard reflete o estado da conta e do bot
- trades atuais podem ser monitorados e encerrados
- histórico mostra o resultado das operações
- navegação entre telas é consistente
