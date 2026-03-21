# Sprint 5: Tasks do Dev

## Objetivo da Sprint
Fechar o fluxo completo do MVP com integracao entre telas, cobertura de estados transversais, correcoes de friccao e prontidao para demo controlada.

## Escopo
- navegacao entre telas
- guards e bloqueios do fluxo principal
- estados vazios, loading e erro
- sincronizacao entre preset ativo, bot e dados operacionais
- correcoes de bugs e friccoes do fluxo principal
- validacao final do MVP
- inglês como locale padrão e copy pronta para i18n

## Definition of Ready
- o MVP Scope Lock está aprovado
- o MVP Handoff Pack está disponível
- as sprints anteriores definiram as telas e fluxos principais
- a linguagem base é inglês e chaves de tradução são esperadas
- nenhuma task deve introduzir lógica de estratégia fora do escopo travado

## Entregaveis finais da Sprint
- fluxo funcional do onboarding ao historico
- navegacao integrada entre todas as telas
- cobertura minima de estados vazios, loading e erro
- consistencia entre estado do bot, preset e operacao
- pacote final do MVP pronto para demonstracao

## Task V5.1: Integrar navegacao entre todas as telas do MVP

### Objetivo
Garantir que o usuario consiga percorrer o fluxo principal sem pontos mortos ou caminhos quebrados.

### Prioridade
P0

### Escopo
- onboarding
- dashboard
- presets
- trades atuais
- historico
- topbar e navegacao principal

### Atividades
- revisar e conectar as rotas principais
- validar navegacao por CTA e navegacao estrutural
- garantir que links e acoes levem para a tela correta
- revisar estados ativos da navegacao
- ajustar retornos e caminhos secundarios relevantes
- manter labels de navegação localizadas

### Entregaveis
- navegacao funcional integrada do MVP

### Dependencias
- outputs das Sprint 1, 2, 3 e 4

### Criterio de pronto
- o usuario consegue navegar pelo MVP sem links quebrados ou desvios incoerentes
- a copy de navegação permanece localizada pela mesma camada de i18n

## Task V5.2: Revisar guards e bloqueios do fluxo principal

### Objetivo
Garantir que o produto bloqueie apenas o que precisa ser bloqueado, no momento certo.

### Prioridade
P0

### Escopo
- bloqueio por onboarding incompleto
- acesso ao dashboard
- acesso a telas operacionais
- estado do bot versus permissoes de acao

### Atividades
- revisar guardas de autenticacao e prontidao operacional
- validar comportamento sem wallet conectada
- validar comportamento sem credenciais validas
- revisar se ha bloqueios indevidos apos onboarding concluido
- ajustar estados de redirecionamento e fallback

### Entregaveis
- regras de bloqueio revisadas e implementadas

### Dependencias
- V5.1

### Criterio de pronto
- o usuario e bloqueado apenas quando necessario e com comportamento previsivel
- mensagens de guard permanecem locale-aware

## Task V5.3: Implementar e consolidar estados vazios do MVP

### Objetivo
Cobrir os principais cenarios sem dados para que o fluxo nao pareca incompleto ou quebrado.

### Prioridade
P0

### Escopo
- sem trades atuais
- sem historico
- sem preset ativo, quando aplicavel
- ausencia temporaria de dados da conta

### Atividades
- implementar componentes e mensagens de estado vazio
- ligar CTAs orientativos onde fizer sentido
- validar consistencia visual e funcional entre telas
- garantir que estados vazios respeitem produto e design
- revisar navegacao a partir desses estados

### Entregaveis
- estados vazios implementados nas telas do MVP

### Dependencias
- V5.1
- outputs de design da Sprint 5

### Criterio de pronto
- ausencia de dados nao parece falha de sistema
- a copy de estado vazio vem da camada de i18n

## Task V5.4: Implementar e consolidar estados de loading

### Objetivo
Cobrir os principais cenarios de carregamento e processamento do fluxo principal.

### Prioridade
P0

### Escopo
- carregamento de pagina
- carregamento de bloco
- carregamento de lista
- processamento de acoes criticas

### Atividades
- implementar loading de onboarding, dashboard e listas
- implementar loading para ativacao de preset e encerramento manual
- diferenciar carregamento de tela e carregamento de acao
- revisar consistencia com os componentes do design
- validar que o usuario recebe feedback em acoes assincronas

### Entregaveis
- estados de loading implementados nas telas e acoes criticas

### Dependencias
- V5.1
- outputs de design da Sprint 5

### Criterio de pronto
- o sistema sempre comunica quando esta carregando ou processando algo relevante
- a copy de loading vem da camada de i18n

## Task V5.5: Implementar e consolidar estados de erro

### Objetivo
Cobrir falhas principais com mensagens claras e tratamento consistente.

### Prioridade
P0

### Escopo
- erro de credencial
- erro de carregamento
- erro de ativacao de preset
- erro de encerramento manual
- indisponibilidade temporaria de integracao

### Atividades
- implementar tratamento de erro inline, banner ou modal conforme definido
- padronizar mensagens e acoes de recuperacao
- revisar consistencia entre erros do dashboard e das telas operacionais
- validar que erros nao deixam a interface em estado ambiguo
- garantir que o usuario possa tentar novamente quando aplicavel

### Entregaveis
- estados de erro implementados e consistentes

### Dependencias
- V5.1
- outputs de design da Sprint 5

### Criterio de pronto
- falhas principais sao compreensiveis e tratadas sem quebrar o fluxo
- a copy de erro permanece traduzível

## Task V5.6: Validar consistencia entre preset ativo, bot e telas operacionais

### Objetivo
Garantir que o estado refletido nas telas corresponda ao estado real da operacao.

### Prioridade
P0

### Escopo
- preset ativo
- status do bot
- dashboard
- trades atuais
- historico

### Atividades
- validar propagacao do preset ativo entre telas
- validar propagacao de pausa e retomada do bot
- validar sincronizacao dos dados apos ativacao e encerramento manual
- revisar contadores e resumos dependentes
- corrigir divergencias de estado percebido versus estado real

### Entregaveis
- consistencia funcional revisada entre estado do bot e telas

### Dependencias
- V5.2
- V5.3
- V5.4
- V5.5

### Criterio de pronto
- o usuario nao encontra contradicoes relevantes entre telas
- labels de estado permanecem locale-agnostic enquanto a UI fica localizada

## Task V5.7: Corrigir bugs e friccoes do fluxo principal

### Objetivo
Reduzir atritos que prejudiquem a demonstracao do MVP.

### Prioridade
P1

### Escopo
- bugs funcionais
- bugs de navegacao
- friccoes de interacao
- incoerencias visuais com impacto funcional

### Atividades
- revisar o fluxo ponta a ponta em busca de quebras
- corrigir bugs identificados na navegacao e integracao
- corrigir friccoes de CTA, formularios e estados
- alinhar com feedback de produto, design e QA quando houver
- priorizar correcoes que afetam a demo

### Entregaveis
- lote principal de correcoes da Sprint 5

### Dependencias
- V5.6

### Criterio de pronto
- o fluxo principal pode ser demonstrado sem quebras ou atritos graves
- as correcoes preservam o comportamento em inglês primeiro e traduzido

## Task V5.8: Validar o fluxo completo do MVP para demo

### Objetivo
Confirmar que o produto esta pronto para uma demonstracao controlada do onboarding ao historico.

### Prioridade
P1

### Escopo
- onboarding completo
- ativacao de preset
- dashboard operacional
- trades atuais
- encerramento manual
- historico
- navegacao entre telas

### Atividades
- executar walkthrough completo do fluxo principal
- validar transicoes entre todas as telas chave
- validar estados criticos de loading, vazio e erro
- revisar pontos de fallback e recuperacao
- registrar ajustes finais estritamente necessarios para demo

### Entregaveis
- fluxo final validado para demonstracao do MVP

### Dependencias
- V5.7

### Criterio de pronto
- o MVP esta pronto para demo controlada com risco reduzido de falha no fluxo principal
- o fluxo de demo se comporta igual em inglês primeiro e traduzido
