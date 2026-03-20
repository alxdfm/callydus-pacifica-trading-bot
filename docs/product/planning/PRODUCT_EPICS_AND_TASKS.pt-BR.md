# Epicos e Tasks do MVP

## Objetivo
Transformar a documentação atual em um plano de execução orientado a entregáveis, separado entre trabalho de Designer e trabalho de Desenvolvimento.

## Premissa
O escopo abaixo considera apenas o MVP já definido em produto:
- onboarding obrigatório
- dashboard operacional
- tela de presets
- trades atuais
- histórico
- ativação do bot com presets fechados

## Ordem Recomendada de Execução
1. Onboarding
2. Presets
3. Dashboard
4. Trades Atuais
5. Histórico
6. Integração e polimento do MVP

## Epico 1: Onboarding

### Objetivo
Permitir que o usuário conecte wallet Solana e credenciais Pacifica antes de usar o produto.

### Entregáveis
- tela de onboarding funcional
- conexão de wallet Solana
- formulário de credenciais Pacifica
- validação de credenciais
- bloqueio do acesso ao Dashboard até onboarding válido

### Tasks do Designer
- definir layout final da tela de onboarding
- definir estados visuais de wallet: desconectada, conectando, conectada, erro
- definir estados visuais de credenciais: vazia, validando, válida, inválida
- definir mensagens curtas de erro e sucesso
- definir comportamento mobile da tela

### Tasks do Dev
- implementar tela de onboarding
- integrar conexão de wallet Solana
- implementar formulário de credenciais Pacifica
- validar credenciais no backend ou camada apropriada
- bloquear navegação para o app principal enquanto onboarding estiver incompleto
- persistir estado mínimo de onboarding da sessão

## Epico 2: Seleção e Ativação de Presets

### Objetivo
Permitir que o usuário escolha um preset, revise os campos editáveis e ative o bot.

### Entregáveis
- tela de presets funcional
- 3 cards de preset
- painel de comparação curta
- painel de revisão do preset selecionado
- ativação do preset

### Tasks do Designer
- desenhar cards finais de `Mais seguro`, `Equilibrado` e `Mais ativo`
- definir visual de risco e frequência
- definir painel de comparação curta
- definir painel de revisão com campos editáveis
- definir CTA e estados de ativação

### Tasks do Dev
- implementar tela de presets
- renderizar os 3 presets do catálogo final
- implementar seleção do preset
- implementar edição apenas dos campos permitidos
- implementar payload final de ativação do bot
- persistir preset ativo

## Epico 3: Dashboard Operacional

### Objetivo
Dar visibilidade imediata ao estado da conta, do bot e dos trades em andamento.

### Entregáveis
- dashboard funcional
- cards de saldo e PnL
- bloco de preset ativo
- lista de trades atuais
- lista de trades recentes
- faixa de alertas

### Tasks do Designer
- desenhar layout final do dashboard desktop
- desenhar versão mobile
- definir hierarquia visual dos cards de resumo
- definir componente visual do preset ativo
- definir tratamento visual de alertas e estados críticos

### Tasks do Dev
- implementar estrutura do dashboard
- integrar saldo da conta
- integrar PnL agregado
- exibir preset ativo
- listar trades atuais
- listar trades recentes
- implementar ação global de pausar/retomar bot

## Epico 4: Trades Atuais

### Objetivo
Permitir monitoramento e encerramento manual de trades abertos sem parar o bot.

### Entregáveis
- tela de trades atuais
- lista de trades abertos
- detalhe ou seleção de trade
- ação de encerramento via `market order`

### Tasks do Designer
- desenhar lista de trades atuais
- definir estados visuais por direção e status
- definir botão de encerramento com baixo risco de clique acidental
- definir painel de detalhe ou expansão do trade

### Tasks do Dev
- implementar tela de trades atuais
- integrar lista de trades abertos
- implementar atualização de status do trade
- implementar encerramento manual por `market order`
- atualizar dashboard após encerramento

## Epico 5: Histórico

### Objetivo
Permitir consulta simples ao resultado das operações encerradas.

### Entregáveis
- tela de histórico
- lista cronológica de trades encerrados
- motivo de encerramento
- identificação de trades da plataforma

### Tasks do Designer
- desenhar lista de histórico
- definir formato compacto de cada item
- definir tratamento visual de resultado positivo e negativo
- definir filtros simples, se incluídos

### Tasks do Dev
- implementar tela de histórico
- integrar dados de trades encerrados
- exibir motivo de encerramento
- exibir identificação de trade da plataforma

## Epico 6: Integração e Prontidão do MVP

### Objetivo
Amarrar os fluxos principais e garantir consistência mínima para demo e uso inicial.

### Entregáveis
- fluxo completo do onboarding ao dashboard
- fluxo completo da seleção de preset à ativação
- sincronização entre dashboard, trades atuais e histórico
- tratamento de erros principais

### Tasks do Designer
- revisar consistência visual entre telas
- revisar estados vazios, loading e erro
- revisar responsividade mínima do MVP

### Tasks do Dev
- integrar navegação entre telas
- implementar guards de onboarding
- implementar estados de loading, erro e vazio
- validar consistência entre preset ativo, bot ativo e dados exibidos
- corrigir fluxos quebrados para demo

## Recomendação de Entregas

### Entrega 1
- onboarding
- estrutura de navegação
- tela de presets estática

### Entrega 2
- ativação de preset
- dashboard com dados conectados
- preset ativo no dashboard

### Entrega 3
- trades atuais com encerramento manual
- histórico
- polimento do fluxo completo

## Critério de Pronto para Demo
- usuário conclui onboarding
- usuário seleciona e ativa um preset
- dashboard mostra estado da conta e do bot
- usuário vê trades abertos
- usuário encerra um trade manualmente
- histórico registra o encerramento
