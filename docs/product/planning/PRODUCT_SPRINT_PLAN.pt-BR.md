# Plano de Sprints do MVP

## Objetivo
Organizar o trabalho de Designer e Dev por sprint, com foco em entregáveis concretos e demonstráveis ao final de cada ciclo.

## Premissas
- cada sprint precisa terminar com um entregável verificável
- o plano prioriza o que aumenta a capacidade de demo mais cedo
- o Design trabalha um pouco à frente do Dev, mas sem excesso de antecipação

## Estrutura de Sprints
- Sprint 1: Fundamentos + Onboarding
- Sprint 2: Presets + Ativação
- Sprint 3: Dashboard
- Sprint 4: Trades Atuais + Histórico
- Sprint 5: Integração + Polimento

## Sprint 1: Fundamentos + Onboarding

### Objetivo
Criar a base visual e técnica do MVP e entregar o fluxo de onboarding funcional.

### Entregáveis da Sprint
- shell inicial da aplicação
- navegação principal
- onboarding desktop e mobile
- conexão de wallet Solana
- captura e validação de credenciais Pacifica
- bloqueio de acesso ao produto sem onboarding

### Tasks do Designer
- definir mini sistema visual do MVP
- fechar layout desktop e mobile do onboarding
- definir estados de wallet
- definir estados de credenciais Pacifica
- definir mensagens de erro e sucesso do onboarding

### Tasks do Dev
- implementar estrutura base da aplicação
- implementar layout compartilhado com topbar e navegação
- implementar tela de onboarding
- integrar wallet Solana
- implementar formulário de credenciais Pacifica
- validar credenciais
- bloquear acesso ao dashboard até conclusão do onboarding

### Definição de pronto
- usuário conclui onboarding e só então acessa o produto
- fluxo funciona em desktop e mobile
- erros principais aparecem corretamente

## Sprint 2: Presets + Ativação

### Objetivo
Permitir escolha, revisão e ativação do preset.

### Entregáveis da Sprint
- tela de presets funcional
- cards finais de `Mais seguro`, `Equilibrado` e `Mais ativo`
- comparação curta entre presets
- painel de revisão do preset selecionado
- ativação do preset

### Tasks do Designer
- fechar visual final dos 3 cards de preset
- fechar painel de comparação
- fechar painel de revisão do preset
- definir CTA de ativação e seus estados
- validar mobile da tela de presets

### Tasks do Dev
- implementar tela de presets
- renderizar os 3 presets finais
- implementar seleção de preset
- implementar edição apenas dos campos permitidos
- montar e persistir payload final de ativação
- refletir preset ativo no estado da aplicação

### Definição de pronto
- usuário escolhe e ativa um preset sem acessar detalhes técnicos
- preset ativo fica persistido
- fluxo é demonstrável ponta a ponta

## Sprint 3: Dashboard

### Objetivo
Entregar o centro operacional do MVP com dados principais da conta e do bot.

### Entregáveis da Sprint
- dashboard funcional
- cards de saldo, PnL e contadores
- bloco de preset ativo
- trades atuais no dashboard
- trades recentes no dashboard
- alertas principais

### Tasks do Designer
- fechar layout final do dashboard desktop
- fechar layout final do dashboard mobile
- definir hierarquia visual de cards de resumo
- definir visual do bloco de preset ativo
- definir visual da faixa de alertas

### Tasks do Dev
- implementar estrutura do dashboard
- integrar saldo da conta
- integrar PnL agregado
- exibir preset ativo
- exibir status geral do bot
- listar trades atuais e recentes no dashboard
- implementar ação global de pausar ou retomar bot

### Definição de pronto
- dashboard responde ao estado atual da conta e do bot
- o usuário entende o estado do sistema em poucos segundos
- a tela é demonstrável como centro operacional

## Sprint 4: Trades Atuais + Histórico

### Objetivo
Entregar monitoramento operacional e leitura básica do histórico.

### Entregáveis da Sprint
- tela de trades atuais
- encerramento manual de trade via `market order`
- tela de histórico
- identificação de motivo de encerramento

### Tasks do Designer
- fechar tela de trades atuais desktop e mobile
- definir estados visuais por direção e status
- definir ação de encerramento com segurança visual
- fechar tela de histórico desktop e mobile
- definir visual de resultado positivo e negativo

### Tasks do Dev
- implementar tela de trades atuais
- integrar lista de trades abertos
- implementar ação de encerramento manual
- propagar atualização para dashboard
- implementar tela de histórico
- integrar trades encerrados
- exibir motivo de encerramento e identificação de trade da plataforma

### Definição de pronto
- usuário consegue monitorar trades abertos
- usuário consegue encerrar um trade manualmente
- histórico registra o encerramento e mostra o resultado

## Sprint 5: Integração + Polimento

### Objetivo
Fechar o fluxo completo do MVP e corrigir fricções para demo.

### Entregáveis da Sprint
- fluxo completo do onboarding ao histórico
- estados vazios, loading e erro
- consistência visual e funcional entre telas
- MVP pronto para demonstração

### Tasks do Designer
- revisar consistência visual entre todas as telas
- definir e revisar estados vazios
- definir e revisar estados de loading
- definir e revisar estados de erro
- revisar responsividade mínima do fluxo completo

### Tasks do Dev
- integrar navegação entre todas as telas
- implementar estados vazios, loading e erro
- revisar guards e bloqueios indevidos
- validar consistência entre preset ativo, bot e telas
- corrigir bugs e fricções do fluxo principal

### Definição de pronto
- o fluxo principal funciona sem interrupções indevidas
- o MVP está pronto para demo controlada
- os estados críticos estão cobertos

## Resumo por Papel

### Designer
- Sprint 1: foundations + onboarding
- Sprint 2: presets
- Sprint 3: dashboard
- Sprint 4: trades atuais + histórico
- Sprint 5: revisão sistêmica e handoff final

### Dev
- Sprint 1: base técnica + onboarding
- Sprint 2: presets + ativação
- Sprint 3: dashboard
- Sprint 4: trades atuais + histórico
- Sprint 5: integração e correções

## Critério Final do Plano
O plano está bem estruturado quando cada sprint termina com algo que pode ser:
- revisado por produto
- validado por QA
- demonstrado para stakeholders
