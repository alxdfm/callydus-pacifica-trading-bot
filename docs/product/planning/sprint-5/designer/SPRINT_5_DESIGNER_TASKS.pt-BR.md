# Sprint 5: Tasks do Designer

## Objetivo da Sprint
Fechar a consistencia visual e de interacao do MVP inteiro, cobrindo estados transversais, refinamentos finais e handoff consolidado para demo.

## Escopo
- consistencia visual entre todas as telas
- estados vazios
- estados de loading
- estados de erro
- microinteracoes criticas
- responsividade do fluxo completo
- revisao final para handoff
- copy base em inglês e labels preparados para i18n

## Definition of Ready
- o MVP Scope Lock está aprovado
- o MVP Handoff Pack está disponível
- as telas principais já estão definidas no planejamento
- a linguagem base é inglês e a interface precisa aceitar tradução
- nenhuma task deve expor JSON ou lógica técnica ao usuário final

## Entregaveis finais da Sprint
- revisao visual consolidada do MVP
- biblioteca minima de estados vazios
- biblioteca minima de estados de loading
- biblioteca minima de estados de erro
- revisao responsiva do fluxo completo
- pacote final de handoff de design para demo

## Task D5.1: Revisar consistencia visual entre todas as telas

### Objetivo
Garantir que onboarding, presets, dashboard, trades atuais e historico compartilhem a mesma linguagem visual e a mesma hierarquia de produto.

### Prioridade
P0

### Escopo
- tipografia
- espacamento
- componentes repetidos
- linguagem de status
- CTAs principais e secundarios

### Atividades
- revisar consistencia dos componentes entre telas
- ajustar variacoes desnecessarias de layout e estilo
- validar padrao de titulo, subtitulo e blocos principais
- revisar consistencia visual de tags, badges e status
- alinhar pesos visuais dos CTAs mais importantes
- manter as telas compatíveis com copy em inglês primeiro e localizada

### Entregaveis
- revisao consolidada de consistencia visual

### Dependencias
- outputs das Sprint 1, 2, 3 e 4

### Criterio de pronto
- o produto parece uma unica experiencia e nao um conjunto de telas isoladas
- o sistema de layout tolera strings traduzidas mais longas

## Task D5.2: Definir e revisar estados vazios do MVP

### Objetivo
Garantir que o produto continue claro e usavel quando ainda nao houver dados operacionais.

### Prioridade
P0

### Escopo
- sem trades atuais
- sem historico
- sem preset ativo, quando aplicavel
- sem dados temporarios da conta

### Atividades
- definir mensagens e composicao dos estados vazios
- definir se cada estado vazio precisa de CTA orientativo
- validar tom de comunicacao simples e direto
- revisar consistencia entre estados vazios de telas diferentes
- alinhar os estados com as regras de produto e QA

### Entregaveis
- biblioteca minima de estados vazios

### Dependencias
- D5.1

### Criterio de pronto
- estados vazios orientam o usuario sem parecer erro de sistema
- as mensagens de estado vazio podem ser traduzidas sem redesenho

## Task D5.3: Definir e revisar estados de loading

### Objetivo
Padronizar como a interface comunica carregamento e processamento ao longo do fluxo principal.

### Prioridade
P0

### Escopo
- carregamento de onboarding
- carregamento de dashboard
- carregamento de listas de trades
- processamento de acoes como ativacao e encerramento manual

### Atividades
- definir padrao de skeleton, spinner ou loading inline por contexto
- revisar consistencia de carregamento entre componentes e paginas
- diferenciar loading de pagina, loading de bloco e loading de acao
- validar percepcao de progresso nas acoes mais criticas
- alinhar o comportamento com as limitacoes do MVP

### Entregaveis
- biblioteca minima de estados de loading

### Dependencias
- D5.1

### Criterio de pronto
- o usuario entende quando o sistema esta carregando ou processando algo
- a copy de loading permanece compativel com i18n

## Task D5.4: Definir e revisar estados de erro

### Objetivo
Padronizar a comunicacao visual de falhas operacionais e falhas de carregamento.

### Prioridade
P0

### Escopo
- erro de credencial
- erro de carregamento de dados
- erro ao ativar preset
- erro ao encerrar trade
- indisponibilidade temporaria da Pacifica

### Atividades
- definir severidade e tratamento visual dos erros principais
- revisar quando erro deve ser inline, banner ou modal
- definir mensagens claras e acao sugerida quando houver recuperacao possivel
- validar consistencia com os alertas ja definidos no dashboard
- alinhar erros criticos com criterios de aceite

### Entregaveis
- biblioteca minima de estados de erro

### Dependencias
- D5.1

### Criterio de pronto
- erros sao compreensiveis e acionaveis sem excesso de dramatizacao
- a copy de erro suporta inglês primeiro e versões localizadas

## Task D5.5: Revisar microinteracoes criticas do MVP

### Objetivo
Refinar interacoes que afetam diretamente a confianca do usuario no produto.

### Prioridade
P0

### Escopo
- conectar wallet
- validar credenciais
- ativar preset
- pausar ou retomar bot
- encerrar trade manualmente

### Atividades
- revisar feedback visual de hover, pressed e disabled
- revisar clareza dos passos de confirmacao
- revisar se as acoes destrutivas ou sensiveis parecem seguras
- validar consistencia entre sucesso, erro e processamento
- ajustar detalhes de timing e transicao, se necessario

### Entregaveis
- revisao final das microinteracoes criticas

### Dependencias
- D5.2
- D5.3
- D5.4

### Criterio de pronto
- as interacoes principais parecem confiaveis e intencionais
- a copy de confirmação permanece traduzível

## Task D5.6: Validar responsividade do fluxo completo

### Objetivo
Garantir que o MVP seja demonstravel de ponta a ponta em desktop e mobile.

### Prioridade
P1

### Escopo
- onboarding
- presets
- dashboard
- trades atuais
- historico

### Atividades
- revisar fluxo completo no desktop
- revisar fluxo completo no mobile
- validar ordem de blocos e prioridade visual em cada tela
- validar acessibilidade minima de leitura e toque
- ajustar pontos de ruptura que prejudiquem a demonstracao

### Entregaveis
- revisao responsiva consolidada do MVP

### Dependencias
- D5.5

### Criterio de pronto
- o fluxo principal continua usavel e coerente em desktop e mobile
- o fluxo completo tolera strings traduzidas mais longas no mobile

## Task D5.7: Preparar handoff final de design para demo

### Objetivo
Consolidar o material final que o Dev precisa para fechar o MVP sem ambiguidades restantes.

### Prioridade
P1

### Escopo
- componentes finais
- estados transversais
- regras de interacao
- ajustes responsivos
- observacoes finais de design
- orientação de chaves de i18n para a copy da demo

### Atividades
- organizar os artefatos finais do MVP
- consolidar variaveis, componentes e estados aprovados
- documentar excecoes e limitacoes de design do MVP
- registrar prioridades de polimento caso sobrem ajustes
- revisar consistencia do handoff com produto e QA

### Entregaveis
- handoff final de design da Sprint 5

### Dependencias
- D5.1
- D5.2
- D5.3
- D5.4
- D5.5
- D5.6

### Criterio de pronto
- Dev consegue fechar o MVP para demo sem duvidas relevantes de design
- Dev consegue fechar o MVP com copy em inglês primeiro e traduzida
