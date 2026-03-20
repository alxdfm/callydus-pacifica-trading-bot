# Sprint 1: Tasks do Dev

## Objetivo da Sprint
Entregar a base técnica da aplicação e o fluxo funcional de onboarding, bloqueando acesso ao produto até que wallet e credenciais Pacifica estejam válidas.

## Escopo
- shell inicial do app
- navegação principal
- topbar compartilhada
- onboarding funcional
- integração com wallet Solana
- captura e validação de credenciais Pacifica
- guarda de acesso ao dashboard

## Entregáveis finais da Sprint
- app web navegável com layout base
- fluxo de onboarding funcional
- integração de wallet Solana
- formulário de credenciais Pacifica com validação
- acesso ao produto bloqueado até configuração válida

## Task V1.1: Estruturar shell base da aplicação

### Objetivo
Criar a base técnica que sustentará as telas do MVP.

### Escopo
- estrutura de páginas
- layout compartilhado
- roteamento principal
- placeholders das rotas principais

### Atividades
- definir estrutura de diretórios do frontend
- definir layout compartilhado do app
- implementar topbar compartilhada
- implementar navegação lateral desktop
- implementar navegação mobile
- criar rotas para:
  - onboarding
  - dashboard
  - presets
  - trades atuais
  - histórico
- garantir que o app inicia em um fluxo coerente

### Entregáveis
- app shell funcional
- rotas principais criadas
- layout base reutilizável

### Dependências
- nenhuma

### Critério de pronto
- usuário consegue navegar pela estrutura básica
- telas principais existem ao menos como placeholders
- layout compartilhado funciona em desktop e mobile

## Task V1.2: Implementar estado global mínimo da aplicação

### Objetivo
Criar a camada mínima de estado necessária para Sprint 1.

### Escopo
- estado do onboarding
- estado da wallet
- estado das credenciais
- estado de bloqueio/liberação do produto

### Atividades
- definir modelo de estado de onboarding
- definir modelo de estado da wallet
- definir modelo de estado das credenciais
- definir modelo de status geral do app
- implementar persistência mínima de sessão
- expor utilitários de leitura do estado para guardas de rota

### Entregáveis
- camada mínima de estado global
- persistência básica da sessão

### Dependências
- V1.1

### Critério de pronto
- o estado pode ser consumido entre onboarding e app principal
- recarregamento não destrói o fluxo de Sprint 1 indevidamente

## Task V1.3: Implementar tela de onboarding

### Objetivo
Construir a tela principal de onboarding de acordo com o fluxo definido em produto.

### Escopo
- header
- progresso
- card de wallet
- card de credenciais
- painel de estado da conta
- CTA final

### Atividades
- implementar estrutura visual da tela
- implementar progresso em 2 etapas
- implementar card de wallet
- implementar card de credenciais
- implementar painel de estado da conta
- implementar botão `Continue to Dashboard`
- implementar versão responsiva

### Entregáveis
- tela de onboarding renderizada
- layout responsivo funcional

### Dependências
- V1.1
- V1.2

### Critério de pronto
- todos os blocos principais do onboarding existem
- a tela funciona em desktop e mobile
- o CTA final responde ao estado do fluxo

## Task V1.4: Integrar conexão de wallet Solana

### Objetivo
Permitir que o usuário conecte sua wallet Solana dentro do onboarding.

### Escopo
- ação de conexão
- estados visuais e funcionais
- persistência do estado conectado

### Atividades
- integrar provider ou adapter de wallet escolhido
- implementar ação `Connect wallet`
- atualizar estado para:
  - não conectada
  - conectando
  - conectada
  - erro
- refletir mudança no painel de estado da conta
- persistir estado mínimo da sessão conectada, quando aplicável

### Entregáveis
- wallet Solana conectável pelo onboarding
- estados de conexão funcionais

### Dependências
- V1.2
- V1.3

### Critério de pronto
- usuário conecta wallet com sucesso
- erro de conexão é tratado
- estado conectado desbloqueia a próxima etapa

## Task V1.5: Implementar formulário de credenciais Pacifica

### Objetivo
Permitir que o usuário informe as credenciais necessárias para operar o bot.

### Escopo
- campos
- validação básica de preenchimento
- submissão de credenciais

### Atividades
- implementar campo de API key
- implementar campo de secret ou credencial equivalente
- implementar validação de preenchimento
- implementar estados do formulário:
  - vazio
  - preenchido
  - validando
  - válido
  - inválido
- conectar o formulário ao estado global de onboarding

### Entregáveis
- formulário funcional de credenciais
- estados principais do formulário

### Dependências
- V1.2
- V1.3

### Critério de pronto
- usuário consegue preencher e submeter credenciais
- estados do formulário ficam visíveis corretamente

## Task V1.6: Validar credenciais Pacifica

### Objetivo
Garantir que apenas credenciais válidas liberem o acesso ao produto.

### Escopo
- chamada de validação
- estados de sucesso e erro
- atualização do estado da conta

### Atividades
- implementar ação `Validate credentials`
- integrar a camada técnica responsável pela validação
- capturar retorno de sucesso
- capturar retorno de erro
- atualizar estado do onboarding
- refletir status no painel de estado da conta
- bloquear continuação em caso de falha

### Entregáveis
- validação funcional de credenciais
- tratamento mínimo de erro e sucesso

### Dependências
- V1.5

### Critério de pronto
- credenciais válidas liberam progresso
- credenciais inválidas bloqueiam avanço
- mensagens de retorno aparecem corretamente

## Task V1.7: Implementar guardas de acesso ao produto

### Objetivo
Bloquear acesso ao dashboard e ao restante do app quando o onboarding não estiver completo.

### Escopo
- guardas de rota
- redirecionamento
- bloqueio do CTA final

### Atividades
- implementar guarda de rota para telas principais
- redirecionar para onboarding quando necessário
- bloquear `Continue to Dashboard` até estados válidos
- impedir acesso manual a rotas protegidas
- garantir liberação após onboarding concluído

### Entregáveis
- fluxo protegido de acesso
- navegação condicionada ao onboarding

### Dependências
- V1.2
- V1.3
- V1.4
- V1.6

### Critério de pronto
- usuário não entra no produto sem onboarding válido
- acesso manual a rotas protegidas é interceptado

## Task V1.8: Ajustar estados de loading, vazio e erro da Sprint 1

### Objetivo
Evitar que o onboarding pareça quebrado durante transições e falhas.

### Escopo
- loading da wallet
- loading de validação
- erros de conexão
- erros de credenciais

### Atividades
- implementar loading de conexão da wallet
- implementar loading de validação das credenciais
- implementar mensagens de erro de wallet
- implementar mensagens de erro de credenciais
- validar estados desabilitados do CTA final

### Entregáveis
- tratamento mínimo de estados críticos da Sprint 1

### Dependências
- V1.4
- V1.5
- V1.6
- V1.7

### Critério de pronto
- o usuário entende quando o sistema está processando
- erros não deixam a tela ambígua
- CTA final responde corretamente ao estado

## Task V1.9: Validar fluxo completo da Sprint 1

### Objetivo
Garantir que o entregável da Sprint 1 funcione ponta a ponta.

### Escopo
- fluxo completo
- navegação
- persistência básica
- comportamento após sucesso e falha

### Atividades
- validar fluxo:
  - abrir app
  - conectar wallet
  - informar credenciais
  - validar credenciais
  - acessar dashboard
- validar fluxo de erro de wallet
- validar fluxo de erro de credenciais
- validar recarregamento básico da sessão
- corrigir inconsistências evidentes

### Entregáveis
- Sprint 1 estável para revisão interna

### Dependências
- V1.1
- V1.2
- V1.3
- V1.4
- V1.5
- V1.6
- V1.7
- V1.8

### Critério de pronto
- fluxo principal da Sprint 1 funciona ponta a ponta
- principais falhas estão cobertas
- produto pode seguir para Sprint 2 sem bloqueio estrutural

## Definição de pronto da Sprint do Dev
- aplicação base está navegável
- onboarding está funcional
- wallet Solana conecta
- credenciais Pacifica são validadas
- acesso ao produto é bloqueado até conclusão válida
- fluxo principal está revisado ponta a ponta
