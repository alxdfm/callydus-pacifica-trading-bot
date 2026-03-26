# Tasks de Dev para MVP Funcional Real

## Objetivo
Transformar o estado atual do produto, hoje majoritariamente local/mockado, em um fluxo funcional real com Pacifica, analise de indicadores e runtime operacional persistido.

## O que ja existe
- integracao real com wallet Phantom no frontend
- contratos compartilhados em `packages/contracts`
- schema inicial de persistencia em `packages/database/prisma/schema.prisma`
- catalogo de presets com contrato tecnico fechado
- telas e UX do MVP ja consolidadas

## O que ainda nao existe
- validacao real de credenciais Pacifica via backend
- fonte real de mercado/candles para analise
- motor real de indicadores e gatilhos
- ativacao real de preset ligada ao runtime
- comandos reais de pause, resume e close trade
- dashboard, trades e history alimentados por backend
- reconciliacao minima e recuperacao apos falha

## Tasks

## FM-001: Fechar contrato tecnico real de integracao com Pacifica

- Tipo: `estudo + definicao tecnica`
- Prioridade: `P0`
- Objetivo: Mapear os endpoints, autenticacao, limites, payloads e respostas reais da Pacifica necessarios para sair do modo local/mockado.

### Escopo
- descobrir fluxo real de validacao de credenciais
- descobrir fluxo real de ativacao de estrategia ou bot
- descobrir leitura real de saldo, trades abertos, historico e status
- descobrir acao real de pausa, retomada e encerramento manual
- registrar limitacoes, rate limit e erros conhecidos da API

### Critérios de Aceite Iniciais
- existe um contrato tecnico claro para a Pacifica, sem lacunas criticas para implementacao
- PO, dev e QA sabem quais partes do fluxo dependem da Pacifica e quais precisam de adaptador local temporario

### Proximo Passo
- Produzir documento tecnico com endpoints, auth, payloads, erros e riscos da integracao Pacifica.

## FM-002: Implementar validacao real de credenciais Pacifica no backend

- Tipo: `implementacao`
- Prioridade: `P0`
- Objetivo: Substituir a validacao local da Agent Wallet por uma validacao real mediada pelo backend, sem expor segredo no frontend.

### Escopo
- criar endpoint backend para validar credenciais
- parar de tratar validacao como simulacao local no frontend
- receber resposta real da Pacifica ou adaptador homologado
- persistir somente referencias seguras e nunca segredo bruto no frontend
- alinhar mensagens de erro com o contrato do app

### Critérios de Aceite Iniciais
- frontend nao valida credencial apenas por formato
- o resultado de validacao vem de integracao real ou adapter backend alinhado com contrato oficial

### Proximo Passo
- Desenhar endpoint de backend e fluxo seguro de envio e armazenamento de credenciais.

## FM-003: Substituir persistencia local por estado operacional de backend

- Tipo: `arquitetura + implementacao`
- Prioridade: `P0`
- Objetivo: Remover o acoplamento central ao localStorage para dados operacionais e passar a ler estado da conta, preset e runtime de read models do backend.

### Escopo
- separar estado puramente de UI de estado operacional
- definir read models reais para onboarding, dashboard, presets e history
- usar banco e API como fonte de verdade para conta, bot e trades
- manter apenas preferencia de UI em storage local quando fizer sentido

### Critérios de Aceite Iniciais
- saldo, preset ativo, trades e historico nao dependem mais de localStorage como fonte de verdade
- reiniciar o app nao apaga o estado operacional real do usuario

### Proximo Passo
- Definir fronteira entre estado de sessao local e estado operacional persistido.

## FM-004: Criar pipeline real de mercado e candles

- Tipo: `estudo + implementacao`
- Prioridade: `P0`
- Objetivo: Obter dados reais de mercado por symbol e timeframe para alimentar indicadores e sinais das estrategias.

### Escopo
- definir fonte de candles e ticker
- garantir suporte aos symbols permitidos no MVP
- garantir timeframe compativel com os presets atuais
- normalizar dados para motor de indicadores
- registrar estrategia de polling ou streaming

### Critérios de Aceite Iniciais
- existe fonte real de dados de mercado para os symbols do MVP
- o sistema consegue alimentar analise dos presets com candles consistentes

### Proximo Passo
- Escolher a fonte real de mercado e fechar o formato canonico de candle/price feed.

## FM-005: Implementar motor de indicadores e avaliacao de gatilhos dos presets

- Tipo: `implementacao`
- Prioridade: `P0`
- Objetivo: Executar EMA, RSI, ATR, volume e SMA de volume de forma real sobre candles para avaliar os gatilhos dos presets.

### Escopo
- calcular indicadores do contrato atual dos presets
- avaliar regras de cross e threshold
- respeitar timeframe e symbol do preset ativo
- expor resultado de sinal de forma auditavel para runtime e UI

### Critérios de Aceite Iniciais
- o preset ativo deixa de ser apenas configuracao e passa a gerar sinal real de entrada e saida
- o sistema consegue explicar quais regras dispararam o sinal

### Proximo Passo
- Definir se o motor sera proprio ou apoiado em biblioteca validada, com testes dos indicadores obrigatorios.

## FM-006: Ligar ativacao de preset ao runtime operacional real

- Tipo: `implementacao`
- Prioridade: `P0`
- Objetivo: Fazer com que ativar um preset realmente registre uma estrategia ativa para execucao e monitoramento, em vez de apenas atualizar estado local.

### Escopo
- persistir ativacao real no backend
- gerar contrato efetivo da estrategia ativa
- vincular preset ativo ao runtime do bot
- refletir estado real de ativacao, pausa e parada

### Critérios de Aceite Iniciais
- ativar preset cria estado operacional real e persistido
- dashboard reflete preset ativo de fonte real e nao simulada

### Proximo Passo
- Fechar o fluxo de comando de ativacao e o modelo de persistencia do contrato efetivo.

## FM-007: Implementar comandos reais de bot e trade via backend

- Tipo: `implementacao`
- Prioridade: `P0`
- Objetivo: Trocar as acoes locais de pausa, retomada e encerramento por comandos reais, assíncronos e rastreáveis.

### Escopo
- criar comandos de pause, resume e close trade
- usar idempotencia e status de comando
- refletir processamento, sucesso e falha na UI
- registrar origem e efeito de cada comando

### Critérios de Aceite Iniciais
- acoes sensiveis do app nao dependem mais de alteracao local de estado
- cada comando relevante possui status rastreavel e feedback consistente

### Proximo Passo
- Implementar command layer no backend e alinhar contratos de resposta com o frontend.

## FM-008: Sincronizar dashboard, current trades e history com dados reais

- Tipo: `implementacao`
- Prioridade: `P0`
- Objetivo: Substituir demo-runtime por leituras reais do backend para saldo, bot status, trades abertos, trades fechados e alertas.

### Escopo
- eliminar dependencias centrais de demo-runtime para leitura operacional
- alimentar dashboard com read model real
- alimentar current trades com fonte real
- alimentar history com fonte real
- refletir estados de loading, vazio, erro e sync real

### Critérios de Aceite Iniciais
- dashboard, trades e history usam dados reais de backend
- o usuario enxerga o mesmo estado operacional em todas as telas sem divergencia simulada

### Proximo Passo
- Definir read models finais e substituir progressivamente os pontos de leitura local.

## FM-009: Implementar reconciliacao, heartbeat e recuperacao basica

- Tipo: `implementacao`
- Prioridade: `P1`
- Objetivo: Dar robustez minima para que o runtime recupere estado, detecte divergencia e nao duplique operacoes apos falha ou reinicio.

### Escopo
- heartbeat do runtime
- reconciliacao de estado com Pacifica
- recuperacao basica apos restart
- tratamento de sync degraded e sync error

### Critérios de Aceite Iniciais
- reinicios nao causam perda silenciosa de estado operacional
- divergencias relevantes aparecem como alerta e podem ser investigadas

### Proximo Passo
- Definir rotina minima de reconciliacao e o que constitui divergencia critica no MVP funcional.

## FM-010: Instrumentar logs, alertas e auditoria minima do fluxo funcional

- Tipo: `implementacao`
- Prioridade: `P1`
- Objetivo: Registrar sinais, comandos, erros e mudancas de estado para que o produto explique o que aconteceu no fluxo real.

### Escopo
- logs de validacao de credencial
- logs de ativacao de preset e comandos do bot
- eventos de sinal e execucao
- alertas operacionais de falha ou degradacao

### Critérios de Aceite Iniciais
- o time consegue investigar porque uma acao falhou ou porque uma operacao aconteceu
- o usuario recebe contexto minimo compreensivel no dashboard e nas telas operacionais

### Proximo Passo
- Definir eventos minimos obrigatorios de auditoria e alerta antes da demo funcional real.
