# Plano de Acao UX Operacional - 2026-04-11

## Objetivo
Transformar os achados da revisao de UX em um plano executavel, separado por:
- pontos gerais
- pontos por aba
- ajustes simples de copy/label/estrutura
- itens mais complexos de fluxo, contrato ou investigacao de bug

## Direcao Base Recomendada
- `loading` deve ser visual, com spinner, e nao depender de banners textuais persistentes
- feedback temporario de acao e erro nao-bloqueante deve virar `toast` com auto-dismiss
- a origem de trade, evento e acao precisa ficar explicita como `CALLYDUS` ou `PACIFICA`
- o Dashboard deve voltar a ser tela de overview; logs, alertas e atividade operacional devem sair do centro da home

## Sequencia Recomendada
1. Fundacao transversal de feedback e nomenclatura
2. Quick wins de copy, labels e remocao de ruido visual
3. Reestruturacao das abas `Presets -> Strategy` e `Current Trades -> Open trades`
4. Nova aba de operacao/logs para absorver `System alerts` e `Operational activity`
5. Investigacao dos bugs de PnL e `close reason`

## Pontos Gerais

### Simples
- trocar mensagens de loading por spinner consistente em pagina, panel e botao
- mover erros temporarios de execucao para `toast` temporario
- trocar a nomenclatura ambigua `Platform trade` / `External trade` por `CALLYDUS trade` / `PACIFICA trade`

### Estruturais
- separar no estado de runtime o que e:
  - erro bloqueante de carregamento de pagina
  - feedback temporario de acao do usuario
  - status operacional continuo
- padronizar um componente de feedback compartilhado:
  - `spinner`
  - `toast`
  - banner persistente apenas para indisponibilidade real ou degradacao relevante
- mapear explicitamente a origem em contratos e apresentacao, para nao depender apenas de copy sobre `isPlatformTrade`

### Complexos / Investigacao
- hoje `lastRuntimeMessage` esta sendo usado como banner persistente em multiplas telas; isso mistura erro temporario com estado permanente e tende a poluir Dashboard, Trades e History
- revisar se o contrato atual com `isPlatformTrade: boolean` continua suficiente ou se ja vale promover um campo de origem explicito no contrato compartilhado

## Menu Lateral

### Simples
- ajustar o card do preset ativo para refletir a nova terminologia da experiencia, caso a tela vire `Strategy`

### Estruturais
- quando existir preset/strategy ativa, adicionar um sinal visual de atividade no menu lateral
- recomendacao: animacao discreta e continua, ligada ao estado ativo do bot, sem parecer loading travado

### Complexos / Investigacao
- garantir que a animacao represente estado real:
  - ativa quando houver strategy ativa e bot em `active` ou `syncing`
  - neutra quando houver strategy configurada, mas bot pausado

## Dashboard

### Simples
- remover o banner neutro de `Runtime idle` da tela principal
- remover os cards `System alerts` e `Operational activity` do Dashboard
- manter o Dashboard focado em metricas, strategy ativa e visao rapida de trades
- adicionar uma nova metrica de volume/exposicao no `metric-grid`

### Estruturais
- criar uma aba dedicada para logs e problemas operacionais
- recomendacao de nome: `Operations` ou `Runtime`
- mover para essa nova aba:
  - `System alerts`
  - `Operational activity`
  - estados de sincronizacao e erros operacionais que hoje entram como banner informativo
- simplificar o Dashboard para responder apenas:
  - saldo total
  - PnL da conta
  - volume/exposicao
  - open trades
  - fechados do dia
  - strategy ativa

### Complexos / Investigacao
- `Account PnL` hoje ja e lido de `state.runtime.balance.aggregatedPnl`; se continua em `+$0.00`, a investigacao precisa cobrir:
  - normalizacao do payload em `apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts`
  - persistencia do balance snapshot em `apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts`
  - mapeamento do snapshot para a app em `apps/app/src/features/account/apply-operational-page-sessions.ts`
- o item `volume` precisa de definicao de produto antes da implementacao:
  - se significa exposicao da conta, o campo mais coerente ja existente e `capitalInUse`
  - se significa volume de mercado, a origem muda e nao pertence ao mesmo bloco conceitual do saldo da conta

## Strategy (atual Presets)

### Simples
- renomear navegacao e titulos de `Presets` para `Strategy`
- revisar copies antigas que ainda assumem comparacao entre presets prontos

### Estruturais
- a tela deve deixar de ser catalogo de presets e virar um hub de estrategia
- mover o conteudo principal do modal de `YOUR Strategy` para a pagina
- tratar a pagina como fluxo principal de criacao/edicao/preview/ativacao da estrategia
- os presets antigos podem sair da experiencia principal ou virar bloco secundario/de legado, conforme decisao de produto

### Complexos / Investigacao
- essa mudanca exige reconciliar UI nova com backend que ainda fala fortemente em `preset`
- antes de remover os presets da experiencia principal, decidir:
  - se eles continuam ativaveis mas escondidos
  - se viram somente seed para a strategy
  - se a navegacao e os contratos mantem o termo `preset` internamente por enquanto

## Open Trades (atual Current Trades)

### Simples
- renomear a aba para `Open trades`
- substituir o copy do topo por algo mais direto
- sugestao: `Manage your open trades and close positions manually when needed.`
- remover a badge `Sorted by urgency`
- remover a nota `Manual intervention`

### Estruturais
- separar a listagem em dois grupos:
  - `CALLYDUS trades`
  - `PACIFICA trades`
- manter ambos visiveis na mesma tela, mas com agrupamento claro
- no detalhe de `position size`, mostrar percentual e valor monetario
- adicionar paginacao para `Open positions`

### Complexos / Investigacao
- o PnL da listagem hoje usa `trade.unrealizedPnl`; se continua em zero, a investigacao precisa cobrir:
  - leitura de posicoes externas em `PacificaAccountStateGateway.normalizePositions()`
  - persistencia e reconciliacao em `PrismaPacificaCredentialRepository.applyPacificaExternalSnapshot()`
  - risco de overwrite por snapshot externo mais pobre que o estado local
- o agrupamento por origem hoje depende de `isPlatformTrade`; isso resolve `CALLYDUS` vs `PACIFICA` no curto prazo, mas precisa ficar explicitado na apresentacao e nos testes

## History

### Simples
- melhorar o copy do topo para deixar claro o valor da tela
- sugestao: `Review closed trades, results and exit reasons without digging through dense analytics.`
- deixar explicito em cada item se o trade e `CALLYDUS` ou `PACIFICA`
- adicionar paginacao

### Estruturais
- destacar melhor `resultado` e `motivo de fechamento` como informacoes primarias
- manter a tela mais documental e menos parecida com `Open trades`

### Complexos / Investigacao
- a divergencia `Closed by system` vs `Closed by stop` / `Closed by target` parece ter uma causa tecnica forte:
  - a inferencia em `PrismaPacificaCredentialRepository.ts` ainda depende de `clientOrderId` com sufixo `:tp` e `:sl`
  - esse fluxo conflita com a correcao recente de 2026-04-11, quando os `client_order_id` internos de TP/SL foram removidos
- isso faz desse item uma investigacao prioritaria de regressao, nao um ajuste simples de label
- decidir tambem a politica para historico antigo:
  - corrigir apenas trades novos
  - ou rodar backfill/migracao para registros ja persistidos com `system`

## Nova Aba Recomendada: Operations

### Objetivo
Criar uma tela para concentrar ruido operacional que hoje desvia o Dashboard da funcao principal.

### Conteudo Inicial
- `System alerts`
- `Operational activity`
- status de sincronizacao do runtime
- erros recentes da Pacifica
- possivel trilha cronologica de eventos e comandos

### Beneficio
- limpa o Dashboard
- deixa problemas reais mais faceis de diagnosticar
- cria um lugar natural para logs, reconcilicao e alertas sem misturar isso com metricas de conta

## Arquivos Provavelmente Impactados
- `apps/app/src/ui/layout/AppLayout.tsx`
- `apps/app/src/ui/layout/navigation.ts`
- `apps/app/src/shared/i18n/messages.ts`
- `apps/app/src/ui/pages/DashboardPage.tsx`
- `apps/app/src/ui/pages/TradesPage.tsx`
- `apps/app/src/ui/pages/HistoryPage.tsx`
- `apps/app/src/ui/pages/PresetsPage.tsx`
- `apps/app/src/features/account/apply-operational-page-sessions.ts`
- `packages/contracts/src/index.ts`
- `apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts`
- `apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts`

## Prioridade Recomendada

### P0
- separar feedback temporario de erro/acao do estado persistente de tela
- investigar `Account PnL` sempre zero
- investigar `Closed by system` para fechamentos por TP/SL

### P1
- renomear `Presets -> Strategy`
- renomear `Current Trades -> Open trades`
- limpar Dashboard removendo logs e alertas centrais
- agrupar trades por `CALLYDUS` e `PACIFICA`

### P2
- criar aba `Operations`
- adicionar paginacao em `Open trades` e `History`
- animacao de strategy ativa no menu lateral

## Observacao Final
Os itens de copy, labels e remocao de ruido podem entrar imediatamente.

Os bugs de PnL e `close reason` nao devem ser tratados como acabamento visual. Eles afetam confianca operacional e precisam de validacao ponta a ponta com snapshot Pacifica real.
