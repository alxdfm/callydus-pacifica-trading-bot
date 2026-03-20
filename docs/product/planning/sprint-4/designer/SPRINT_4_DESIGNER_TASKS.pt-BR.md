# Sprint 4: Tasks do Designer

## Objetivo da Sprint
Entregar as telas de Trades Atuais e Historico com foco em intervencao manual segura, leitura rapida de estado e revisao clara de resultados operacionais.

## Escopo
- tela desktop de trades atuais
- tela mobile de trades atuais
- estados visuais por direcao e status
- acao de encerramento manual
- tela desktop de historico
- tela mobile de historico
- leitura de resultado e motivo de encerramento
- identificacao de trades da plataforma

## Entregaveis finais da Sprint
- tela final de Trades Atuais desktop
- tela final de Trades Atuais mobile
- componente de linha/cartao de trade aberto
- fluxo visual de encerramento manual
- tela final de Historico desktop
- tela final de Historico mobile
- componente de linha/cartao de trade encerrado
- regras visuais de estado e variacao
- handoff minimo da Sprint 4

## Task D4.1: Fechar arquitetura visual da tela de Trades Atuais

### Objetivo
Definir a organizacao macro da tela de Trades Atuais para desktop e mobile, priorizando a intervencao por trade sem poluir a leitura.

### Escopo
- header da tela
- resumo operacional
- lista principal de trades abertos
- filtros ou segmentacoes minimas, se necessarios
- area de acao por trade

### Atividades
- definir ordem dos blocos da tela
- definir relacao entre header, resumo e lista
- validar se a tela responde rapido a pergunta "em qual trade eu atuo agora?"
- ajustar a densidade de informacao para nao competir com o dashboard
- definir adaptacao da estrutura para mobile

### Entregaveis
- estrutura visual final da tela de Trades Atuais

### Dependencias
- outputs das Sprint 1, 2 e 3

### Criterio de pronto
- a tela tem foco operacional claro
- a acao por trade aparece como prioridade primaria

## Task D4.2: Desenhar item base de trade aberto

### Objetivo
Definir o componente principal que representa um trade aberto na lista.

### Escopo
- simbolo
- direcao `long` ou `short`
- preco de entrada
- preco atual
- PnL
- horario de abertura
- identificacao de trade da plataforma
- acao de encerramento

### Atividades
- definir hierarquia interna do item
- destacar visualmente direcao do trade
- definir tratamento visual de PnL positivo, negativo e neutro
- definir prioridade dos campos obrigatorios
- validar leitura do item em lista densa e em cartao mobile

### Entregaveis
- componente final de trade aberto

### Dependencias
- D4.1

### Criterio de pronto
- cada item pode ser escaneado rapidamente
- o usuario entende o estado do trade sem abrir detalhes

## Task D4.3: Definir sistema visual de status e direcao para trades abertos

### Objetivo
Criar uma linguagem visual consistente para diferenciar direcao, estado operacional e origem do trade.

### Escopo
- `long`
- `short`
- trade criado pela plataforma
- trade nao criado pela plataforma
- estados de execucao ou alerta visiveis na lista

### Atividades
- definir marcadores de direcao
- definir marcadores de origem do trade
- definir tratamento visual para estado normal e estado de atencao
- validar acessibilidade minima de contraste e distincoes visuais
- alinhar o sistema com os componentes do dashboard

### Entregaveis
- regras visuais de status e direcao para trades abertos

### Dependencias
- D4.2

### Criterio de pronto
- o usuario diferencia direcao e origem em poucos segundos
- a tela nao depende apenas de texto para comunicar estado

## Task D4.4: Desenhar fluxo visual de encerramento manual

### Objetivo
Definir uma acao de encerramento manual clara e segura, evitando cliques acidentais.

### Escopo
- botao `Encerrar`
- confirmacao
- estado de processamento
- estado de sucesso
- estado de erro

### Atividades
- definir visual do CTA de encerramento
- definir passo de confirmacao antes da ordem de mercado
- definir mensagem de risco e efeito esperado da acao
- definir tratamento visual para loading, sucesso e falha
- validar a acao em desktop e mobile

### Entregaveis
- fluxo visual final de encerramento manual

### Dependencias
- D4.2

### Criterio de pronto
- o encerramento manual parece seguro e intencional
- o usuario entende que a acao nao pausa o bot inteiro

## Task D4.5: Fechar arquitetura visual da tela de Historico

### Objetivo
Definir a organizacao macro da tela de Historico para leitura rapida de resultados e revisao de encerramentos.

### Escopo
- header da tela
- resumo curto opcional
- lista de trades encerrados
- filtros minimos, se previstos
- estados vazios e erros

### Atividades
- definir composicao principal da tela
- validar separacao visual entre historico e trades atuais
- definir profundidade de informacao por item
- ajustar a tela para nao parecer um relatorio analitico complexo
- adaptar estrutura para mobile

### Entregaveis
- estrutura visual final da tela de Historico

### Dependencias
- outputs de Sprint 3

### Criterio de pronto
- a tela responde rapidamente a pergunta "o que aconteceu?"
- o historico tem leitura clara sem excesso de detalhes

## Task D4.6: Desenhar item base de trade encerrado

### Objetivo
Definir o componente principal que representa um trade encerrado no historico.

### Escopo
- simbolo
- direcao
- resultado final
- motivo de encerramento
- horario de abertura e encerramento
- identificacao de trade da plataforma

### Atividades
- definir hierarquia interna do item de historico
- destacar resultado positivo e negativo
- definir formato de exibicao do motivo de encerramento
- validar legibilidade dos horarios
- ajustar a densidade do componente para listas longas

### Entregaveis
- componente final de trade encerrado

### Dependencias
- D4.5

### Criterio de pronto
- o item mostra resultado e motivo com clareza imediata
- a leitura do historico continua compacta

## Task D4.7: Definir sistema visual de resultados e motivos de encerramento

### Objetivo
Padronizar como o historico comunica lucro/prejuizo e razao de saida.

### Escopo
- positivo
- negativo
- encerrado por alvo
- encerrado por stop
- encerrado manualmente
- erro ou falha de execucao, quando aplicavel

### Atividades
- definir marcadores visuais de resultado
- definir linguagem visual dos motivos de encerramento
- alinhar terminologia com criterios de aceite de produto
- validar contraste e compreensao rapida dos estados
- garantir consistencia com dashboard e trades atuais

### Entregaveis
- regras visuais de resultado e motivo de encerramento

### Dependencias
- D4.6

### Criterio de pronto
- motivos de encerramento sao distintos entre si
- lucro e prejuizo sao percebidos de forma imediata

## Task D4.8: Validar comportamento mobile das telas de Sprint 4

### Objetivo
Garantir que Trades Atuais e Historico mantenham utilidade operacional em telas pequenas.

### Escopo
- ordem dos blocos
- leitura dos itens
- CTA de encerramento
- estados vazios
- confirmacao da acao manual

### Atividades
- revisar adaptacao da lista de trades atuais para cartoes ou linhas compactas
- revisar adaptacao do historico para leitura vertical
- validar visibilidade do CTA principal no mobile
- validar confirmacao do encerramento sem atrito excessivo
- validar densidade de dados em telas estreitas

### Entregaveis
- versoes mobile validadas das telas de Trades Atuais e Historico

### Dependencias
- D4.3
- D4.4
- D4.7

### Criterio de pronto
- as duas telas continuam usaveis e escaneaveis no mobile

## Task D4.9: Preparar handoff da Sprint 4 para Dev

### Objetivo
Entregar o pacote de design necessario para implementacao fiel das telas e interacoes da sprint.

### Escopo
- componentes
- estados
- regras visuais
- interacoes de encerramento
- comportamento responsivo

### Atividades
- organizar componentes finais da sprint
- documentar estados de cada item e tela
- documentar regras de acao e confirmacao do encerramento manual
- documentar responsividade e adaptacoes mobile
- validar consistencia entre telas, dashboard e navegacao

### Entregaveis
- handoff consolidado da Sprint 4

### Dependencias
- D4.1
- D4.2
- D4.3
- D4.4
- D4.5
- D4.6
- D4.7
- D4.8

### Criterio de pronto
- Dev consegue implementar as telas sem ambiguidade relevante
- os estados principais e a interacao critica de encerramento estao documentados
