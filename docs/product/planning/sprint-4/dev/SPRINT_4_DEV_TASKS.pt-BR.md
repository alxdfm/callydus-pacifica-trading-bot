# Sprint 4: Tasks do Dev

## Objetivo da Sprint
Entregar as telas funcionais de Trades Atuais e Historico, com capacidade de intervencao manual por trade, sincronizacao com o dashboard e leitura clara dos resultados encerrados.

## Escopo
- rota de trades atuais
- lista de trades abertos
- acao de encerramento manual via `market order`
- atualizacao de estado apos encerramento
- rota de historico
- lista de trades encerrados
- motivo de encerramento
- identificacao de trade da plataforma
- estados de loading, vazio e erro

## Entregaveis finais da Sprint
- tela funcional de Trades Atuais
- lista funcional de trades abertos
- acao funcional de encerramento manual
- atualizacao do dashboard apos encerramento
- tela funcional de Historico
- lista funcional de trades encerrados
- exibicao do motivo de encerramento
- exibicao da origem do trade
- tratamento minimo de estados operacionais das duas telas

## Task V4.1: Implementar estrutura base da tela de Trades Atuais

### Objetivo
Construir a rota e a estrutura principal da tela de Trades Atuais usando o layout compartilhado da aplicacao.

### Escopo
- rota da tela
- header
- resumo curto, se previsto
- lista principal
- estados base da tela

### Atividades
- criar rota de Trades Atuais
- implementar estrutura visual principal da tela
- alinhar os blocos com a hierarquia definida em produto e design
- garantir responsividade base da pagina
- preparar pontos de integracao para lista e acao por trade

### Entregaveis
- estrutura funcional da tela de Trades Atuais

### Dependencias
- outputs das Sprint 1, 2 e 3

### Criterio de pronto
- a tela existe como rota funcional e responsiva
- a lista de trades pode ser integrada sem retrabalho estrutural

## Task V4.2: Integrar lista de trades abertos

### Objetivo
Exibir os trades atualmente abertos com os campos necessarios para monitoramento e intervencao.

### Escopo
- simbolo
- direcao
- preco de entrada
- preco atual
- PnL
- horario de abertura
- origem do trade

### Atividades
- consumir fonte de trades abertos
- mapear os campos obrigatorios para a interface
- renderizar a lista com ordenacao coerente para operacao
- destacar direcao, PnL e origem do trade
- tratar ausencia de dados, loading e erro

### Entregaveis
- lista funcional de trades abertos

### Dependencias
- V4.1

### Criterio de pronto
- usuario consegue entender quais trades estao abertos e seu estado basico

## Task V4.3: Implementar acao de encerramento manual por trade

### Objetivo
Permitir que o usuario encerre um trade especifico sem pausar o bot inteiro.

### Escopo
- CTA `Encerrar`
- confirmacao da acao
- envio da ordem de mercado
- tratamento de sucesso e erro

### Atividades
- adicionar acao `Encerrar` em cada trade elegivel
- implementar etapa de confirmacao antes do envio
- integrar chamada de encerramento via `market order`
- refletir estado de processamento durante a requisicao
- tratar falha operacional e exibir feedback minimo ao usuario

### Entregaveis
- fluxo funcional de encerramento manual por trade

### Dependencias
- V4.2

### Criterio de pronto
- usuario consegue encerrar um trade individualmente
- a acao nao interfere no estado global do bot alem do trade selecionado

## Task V4.4: Sincronizar atualizacao apos encerramento manual

### Objetivo
Garantir consistencia entre Trades Atuais, Dashboard e Historico apos o encerramento de um trade.

### Escopo
- remocao da lista de trades abertos
- atualizacao de contadores
- atualizacao de bloco de trades atuais no dashboard
- entrada no historico

### Atividades
- remover ou atualizar o trade na lista apos encerramento bem-sucedido
- atualizar contadores e resumos dependentes
- propagar o novo estado para o dashboard
- garantir que o trade apareca no historico com motivo correto
- validar sincronizacao sem necessidade de refresh manual

### Entregaveis
- sincronizacao funcional pos-encerramento

### Dependencias
- V4.3
- outputs da Sprint 3

### Criterio de pronto
- o estado da aplicacao permanece consistente depois da acao manual

## Task V4.5: Implementar estrutura base da tela de Historico

### Objetivo
Construir a rota e a estrutura principal da tela de Historico.

### Escopo
- rota da tela
- header
- lista de trades encerrados
- estados base da tela

### Atividades
- criar rota de Historico
- implementar estrutura principal da tela
- alinhar blocos com produto e design
- garantir responsividade base da pagina
- preparar pontos de integracao para lista e filtros minimos, se existirem

### Entregaveis
- estrutura funcional da tela de Historico

### Dependencias
- outputs das Sprint 1 e 3

### Criterio de pronto
- a tela existe como rota funcional e responsiva

## Task V4.6: Integrar lista de trades encerrados

### Objetivo
Exibir os trades encerrados com os campos necessarios para revisao operacional.

### Escopo
- simbolo
- direcao
- resultado
- motivo de encerramento
- horario de abertura
- horario de encerramento
- origem do trade

### Atividades
- consumir fonte de trades encerrados
- mapear e renderizar os campos necessarios
- destacar resultado positivo e negativo
- exibir motivo de encerramento com terminologia consistente
- tratar estados vazios, loading e erro

### Entregaveis
- lista funcional de trades encerrados

### Dependencias
- V4.5

### Criterio de pronto
- usuario consegue revisar rapidamente o que ocorreu nos trades encerrados

## Task V4.7: Exibir identificacao da origem do trade e motivo de encerramento

### Objetivo
Dar contexto suficiente para o usuario distinguir trades da plataforma e entender por que cada trade foi encerrado.

### Escopo
- trade criado pela plataforma
- trade nao criado pela plataforma
- encerrado por alvo
- encerrado por stop
- encerrado manualmente
- erro de execucao, quando aplicavel

### Atividades
- implementar marcador visual ou textual de origem do trade
- implementar exibicao padronizada do motivo de encerramento
- alinhar os textos com o contrato de produto e QA
- validar exibicao desses campos em dashboard e historico, quando necessario
- garantir consistencia entre os dois contextos de leitura

### Entregaveis
- origem do trade e motivo de encerramento exibidos com consistencia

### Dependencias
- V4.2
- V4.6

### Criterio de pronto
- o usuario entende se o trade veio da plataforma e como ele terminou

## Task V4.8: Implementar estados de loading, vazio e erro das telas da Sprint 4

### Objetivo
Evitar ambiguidade quando as telas ainda nao tiverem dados ou enfrentarem falhas.

### Escopo
- trades atuais
- historico
- acao de encerramento manual

### Atividades
- implementar loading para lista de trades abertos
- implementar loading para lista de historico
- implementar estado vazio para ausencia de trades abertos
- implementar estado vazio para historico sem registros
- implementar erro de carregamento e erro de acao manual

### Entregaveis
- tratamento minimo de estados das telas de Sprint 4

### Dependencias
- V4.2
- V4.3
- V4.6
- V4.7

### Criterio de pronto
- nenhuma tela parece quebrada durante carregamento, ausencia de dados ou falha

## Task V4.9: Validar fluxo completo da Sprint 4

### Objetivo
Garantir que o usuario consiga acompanhar trades abertos, encerrar manualmente quando necessario e revisar o resultado no historico.

### Escopo
- carregamento de trades atuais
- encerramento manual
- sincronizacao com dashboard
- visualizacao no historico
- navegacao entre telas

### Atividades
- validar fluxo de abertura da tela de Trades Atuais
- validar fluxo de encerramento com confirmacao
- validar refletancia da mudanca no dashboard
- validar aparicao do trade no historico
- validar navegacao entre Dashboard, Trades Atuais e Historico

### Entregaveis
- fluxo validado ponta a ponta da Sprint 4

### Dependencias
- V4.4
- V4.8

### Criterio de pronto
- o fluxo principal da sprint funciona sem inconsistencias relevantes
- a sprint pode ser demonstrada como capacidade real de monitoramento e intervencao
