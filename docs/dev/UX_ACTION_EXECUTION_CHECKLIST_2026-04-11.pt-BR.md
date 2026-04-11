# UX Action Execution Checklist - 2026-04-11

## Objetivo
Desdobrar o documento [UX_ACTION_PLAN_2026-04-11.pt-BR.md](/home/alxdfm/Projects/callydus/trading-bot-pacifica/docs/dev/UX_ACTION_PLAN_2026-04-11.pt-BR.md) em tasks executaveis, com checklist claro por item.

## Como Ler Este Documento
- cada task tem um `ID`
- cada task tem escopo objetivo
- cada task separa dependencia, execucao e criterio de saida
- a ordem sugerida segue risco tecnico e impacto de UX

## Sequencia Recomendada de Execucao
1. `UX-001` a `UX-004`
2. `UX-005` a `UX-009`
3. `UX-010` a `UX-013`
4. `UX-014` a `UX-016`
5. `UX-017` e `UX-018`

## Status Atual do P0
- `UX-001`: concluida
  - `toast` global iniciado no layout
  - feedback temporario removido dos banners principais de `Dashboard`, `Trades`, `History` e ativacao de `Presets`
  - aplicacao de snapshot passou a usar helper unico para erro persistente de runtime
- `UX-002`: parcial
  - componente reutilizavel de loading com spinner criado
  - loading de `Dashboard`, `Trades`, `History`, `Presets`, `Profile` e `AppLayout` migrado para spinner visual
  - validacao tecnica executada com `typecheck`
- `UX-003`: parcialmente concluida
  - shape minimo de `toast` criado no runtime
  - host global com auto-dismiss implementado
  - fluxos principais migrados:
    - `pause bot`
    - `resume bot`
    - `close trade`
    - `activate strategy/preset`
- `UX-017`: primeira correcao aplicada
  - normalizacao de `aggregatedPnl` endurecida para priorizar campos especificos da Pacifica antes do fallback generico
  - leitura de `unrealizedPnl/currentPrice` em posicoes tambem foi ampliada
  - cobertura automatizada adicionada
- `UX-018`: primeira correcao aplicada
  - inferencia de `closeReason` passou a priorizar `cause` vindo da Pacifica
  - compatibilidade com `clientOrderId` legado preservada
  - cobertura automatizada adicionada
- validacao executada:
  - `pnpm vitest run apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.test.ts apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.test.ts apps/app/src/features/runtime/runtime-state.test.ts apps/app/src/features/account/apply-account-session.test.ts`
  - `pnpm -r typecheck`
  - `pnpm vitest run apps/app/src/ui/layout/navigation.test.ts`

## UX-001 - Separar feedback temporario do estado persistente

### Objetivo
Parar de usar `lastRuntimeMessage` como banner persistente multiuso e criar base para `toast` temporario e erro bloqueante de tela.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/app/src/features/runtime/runtime-state.ts`
- `apps/app/src/features/account/apply-operational-page-sessions.ts`
- `apps/app/src/ui/pages/DashboardPage.tsx`
- `apps/app/src/ui/pages/TradesPage.tsx`
- `apps/app/src/ui/pages/HistoryPage.tsx`
- `apps/app/src/ui/pages/PresetsPage.tsx`

### Checklist de execucao
- [x] mapear onde `lastRuntimeMessage` esta sendo lido como banner persistente
- [x] definir separacao de estado entre:
  - erro de carregamento de pagina
  - status persistente de runtime
  - feedback temporario de acao
- [x] ajustar `runtime-state` para refletir essa separacao
- [x] adaptar `applyOperationalPageSessionSnapshot` para nao sobrescrever feedback temporario com erro antigo de backend
- [x] revisar as paginas para mostrar banner apenas quando existir erro persistente real
- [x] preservar mensagens de sync/degradacao apenas quando fizerem sentido como estado continuo

### Criterio de saida
- acao temporaria bem-sucedida ou erro temporario nao fica preso como banner em multiplas telas

### Status
- concluido
- entregue:
  - novo estado `actionToast`
  - banners de erro persistente separados dos feedbacks temporarios
  - helper unico para aplicar feedback persistente vindo do backend
  - limpeza de `lastRuntimeMessage` ao iniciar acoes em `loading`

## UX-002 - Padronizar `spinner` de loading

### Objetivo
Trocar feedback textual de loading por representacao visual consistente.

### Dependencias
- recomendavel fazer depois de `UX-001`

### Arquivos provaveis
- `apps/app/src/ui/components/*`
- `apps/app/src/ui/pages/DashboardPage.tsx`
- `apps/app/src/ui/pages/TradesPage.tsx`
- `apps/app/src/ui/pages/HistoryPage.tsx`
- `apps/app/src/ui/pages/PresetsPage.tsx`
- `apps/app/src/styles/app.css`

### Checklist de execucao
- [x] localizar todos os estados de loading de pagina, painel e botao
- [x] definir um componente reutilizavel de spinner/loading state
- [x] substituir banners de loading textual onde o estado nao exige copy explicativa
- [x] manter copy apenas em estados realmente ambiguos ou demorados
- [ ] validar loading em desktop e mobile

### Criterio de saida
- telas deixam de depender de blocos textuais tipo `Loading operational data...` como experiencia principal de loading

### Status
- parcial
- concluido:
  - componente `LoadingPanel` criado
  - `AppLayout`, `Dashboard`, `Trades`, `History`, `Presets` e `Profile` migrados para loading com spinner
- pendente:
  - validacao visual manual em desktop e mobile

## UX-003 - Implementar sistema de `toast` temporario

### Objetivo
Centralizar feedback temporario de sucesso, erro de acao e aviso nao-bloqueante.

### Dependencias
- `UX-001`

### Arquivos provaveis
- `apps/app/src/state/app-state.tsx`
- `apps/app/src/ui/components/*`
- `apps/app/src/ui/layout/AppLayout.tsx`
- `apps/app/src/features/runtime/backend-bot-commands.ts`
- paginas que hoje setam `lastRuntimeMessage`

### Checklist de execucao
- [x] definir shape de toast global:
  - `id`
  - `tone`
  - `title` opcional
  - `message`
  - `autoDismissMs`
- [x] criar host global de toast no layout
- [x] mapear fluxos que hoje escrevem mensagem temporaria no runtime:
  - pause bot
  - resume bot
  - close trade
  - save/activate strategy
- [x] migrar esses fluxos para toast
- [x] garantir auto-dismiss e opcao de dismiss manual
- [x] validar que erro de backend em refresh inicial nao vira toast, e sim estado de tela

### Criterio de saida
- erro operacional temporario desaparece sozinho e nao contamina Dashboard, Trades e History

### Status
- parcial
- observacao:
  - o shape atual implementado e minimo, sem `title` explicito nem configuracao custom por tela
  - a base funcional ja entrou e cobre os fluxos principais do `P0`

## UX-004 - Padronizar origem `CALLYDUS` vs `PACIFICA`

### Objetivo
Eliminar copy ambigua de origem de trade e preparar base para origem explicita em UI e contrato.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/app/src/shared/i18n/messages.ts`
- `apps/app/src/ui/pages/DashboardPage.tsx`
- `apps/app/src/ui/pages/TradesPage.tsx`
- `apps/app/src/ui/pages/HistoryPage.tsx`
- possivelmente `packages/contracts/src/index.ts`

### Checklist de execucao
- [x] trocar copy `Platform trade` / `External trade`
- [x] padronizar labels `CALLYDUS trade` / `PACIFICA trade`
- [x] revisar onde `isPlatformTrade` impacta apresentacao
- [x] decidir se o boolean atual continua suficiente ou se precisa evoluir para `origin`
- [x] se evoluir contrato, atualizar schemas, mapeamentos e testes

### Criterio de saida
- usuario consegue identificar a origem do trade sem inferencia

### Status
- concluido
- observacao:
  - o boolean `isPlatformTrade` permaneceu suficiente no curto prazo
  - a origem agora ficou explicita na UI sem exigir mudanca de contrato

## UX-005 - Limpar o Dashboard

### Objetivo
Remover ruido operacional do Dashboard e manter a tela focada em overview.

### Dependencias
- recomendavel executar junto de `UX-014`

### Arquivos provaveis
- `apps/app/src/ui/pages/DashboardPage.tsx`
- `apps/app/src/shared/i18n/messages.ts`

### Checklist de execucao
- [x] remover banner neutro `Runtime idle`
- [x] remover card `System alerts`
- [x] remover card `Operational activity`
- [x] revisar se o banner de sync/degradacao deve permanecer no Dashboard ou migrar para `Operations`
- [x] manter somente blocos de overview:
  - metricas
  - strategy ativa
  - preview de open trades
  - recent history

### Criterio de saida
- Dashboard responde rapidamente o estado da conta sem parecer uma tela de log

### Status
- concluido

## UX-006 - Ajustar `metric-grid` do Dashboard

### Objetivo
Corrigir semantica das metricas e adicionar volume/exposicao.

### Dependencias
- `UX-017` para fechar o bug de PnL
- decisao de produto sobre `volume`

### Arquivos provaveis
- `apps/app/src/ui/pages/DashboardPage.tsx`
- `apps/app/src/shared/i18n/messages.ts`
- `packages/contracts/src/index.ts` se houver novo campo

### Checklist de execucao
- [x] validar a definicao de `volume`
- [x] preferir `capitalInUse` se o objetivo for exposicao da conta
- [x] revisar labels e hints do `metric-grid`
- [x] manter `Account PnL` vinculado ao dado correto de conta
- [x] revisar responsividade do grid com a nova metrica

### Criterio de saida
- `metric-grid` exibe apenas metricas coerentes com conta operacional real

### Status
- concluido
- observacao:
  - a definicao adotada foi `exposure = capitalInUse`

## UX-007 - Renomear `Presets` para `Strategy`

### Objetivo
Alinhar a navegacao com a decisao atual de produto.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/app/src/ui/layout/navigation.ts`
- `apps/app/src/shared/i18n/messages.ts`
- `apps/app/src/ui/pages/PresetsPage.tsx`

### Checklist de execucao
- [x] renomear item de navegacao
- [x] renomear titulos e subtitulos da tela
- [x] revisar copies que ainda falam em comparacao de presets
- [x] revisar impacto em testes de navegacao

### Criterio de saida
- o produto deixa de comunicar `Presets` como experiencia principal para o usuario final

### Status
- concluido

## UX-008 - Transformar a pagina atual em hub de `Strategy`

### Objetivo
Mover a experiencia principal de `YOUR Strategy` do modal para a pagina.

### Dependencias
- `UX-007`
- decisao de produto sobre o destino dos presets antigos

### Arquivos provaveis
- `apps/app/src/ui/pages/PresetsPage.tsx`
- `apps/app/src/shared/i18n/messages.ts`
- `apps/app/src/styles/app.css`

### Checklist de execucao
- [x] decidir papel dos presets antigos:
  - ocultar
  - legado
  - seed inicial
- [x] remover dependencia de modal como container principal
- [x] promover builder/preview/activation para o fluxo principal da pagina
- [x] reorganizar estrutura visual em formato de hub de estrategia
- [x] revisar estados bloqueados com bot ativo
- [x] revisar loading, save, preview e activation no novo fluxo

### Criterio de saida
- tela de `Strategy` funciona como hub principal de criacao e ativacao da estrategia

### Status
- concluido
- observacao:
  - os presets antigos ficaram como bloco secundario de `legacy templates`

## UX-009 - Renomear `Current Trades` para `Open trades`

### Objetivo
Deixar a navegacao e o topo da tela mais objetivos.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/app/src/ui/layout/navigation.ts`
- `apps/app/src/shared/i18n/messages.ts`
- `apps/app/src/ui/pages/TradesPage.tsx`

### Checklist de execucao
- [x] renomear item de navegacao
- [x] renomear titulos da pagina
- [x] substituir copy principal pela versao nova
- [x] remover badge `Sorted by urgency`
- [x] remover label `Platform trades only`
- [x] remover nota `Manual intervention`

### Criterio de saida
- a tela comunica claramente que o foco sao trades abertos e acao manual direta

### Status
- concluido

## UX-010 - Agrupar `Open trades` por origem

### Objetivo
Mostrar `CALLYDUS` e `PACIFICA` em grupos separados dentro da mesma tela.

### Dependencias
- `UX-004`

### Arquivos provaveis
- `apps/app/src/ui/pages/TradesPage.tsx`
- `apps/app/src/shared/i18n/messages.ts`

### Checklist de execucao
- [x] separar trades em dois grupos a partir da origem
- [x] definir ordem de exibicao recomendada
- [x] mostrar contagem por grupo
- [x] revisar estado vazio por grupo e estado vazio global
- [x] validar o detalhe quando existir apenas um trade de origem `CALLYDUS`

### Criterio de saida
- usuario diferencia rapidamente trade da plataforma e posicao externa da exchange

### Status
- concluido
- observacao:
  - a ordem adotada foi `CALLYDUS` primeiro e `PACIFICA` depois

## UX-011 - Melhorar detalhe de `position size`

### Objetivo
Exibir percentual e valor monetario no detalhe do trade aberto.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/app/src/ui/pages/TradesPage.tsx`

### Checklist de execucao
- [x] manter percentual atual
- [x] adicionar valor monetario de `capitalAllocated`
- [x] revisar fallback quando `balance.totalBalance` estiver ausente
- [x] revisar formatacao monetaria

### Criterio de saida
- `position size` informa proporcao e valor real de forma legivel

### Status
- concluido

## UX-012 - Adicionar paginacao em `Open trades`

### Objetivo
Suportar crescimento da lista sem degradar leitura.

### Dependencias
- `UX-010` se a paginacao for por grupo

### Arquivos provaveis
- `apps/app/src/ui/pages/TradesPage.tsx`
- possivelmente backend se a paginacao deixar de ser apenas client-side

### Checklist de execucao
- [x] decidir paginacao client-side ou backend-driven
- [x] decidir se a paginacao e global ou por grupo
- [x] implementar controles de pagina
- [x] revisar persistencia da selecao ao trocar de pagina
- [ ] validar performance e UX em mobile

### Criterio de saida
- lista de trades abertos permanece navegavel com volume maior de itens

### Status
- parcial
- observacao:
  - a implementacao entrou como paginacao client-side por grupo
  - falta apenas validacao visual manual em mobile

## UX-013 - Refinar tela de `History`

### Objetivo
Melhorar clareza textual e leitura documental do historico.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/app/src/ui/pages/HistoryPage.tsx`
- `apps/app/src/shared/i18n/messages.ts`

### Checklist de execucao
- [x] trocar o copy principal por uma frase mais clara
- [x] explicitar origem `CALLYDUS` / `PACIFICA` em cada item
- [x] reforcar visualmente `result` e `close reason`
- [x] manter a tela menos operacional e mais documental que `Open trades`

### Criterio de saida
- historico fica mais facil de escanear sem depender de leitura detalhada de cada card

### Status
- concluido

## UX-014 - Criar aba `Operations`

### Objetivo
Centralizar alertas, atividade operacional e status de runtime fora do Dashboard.

### Dependencias
- nenhuma, mas dialoga com `UX-005`

### Arquivos provaveis
- `apps/app/src/ui/layout/navigation.ts`
- `apps/app/src/router.tsx`
- `apps/app/src/ui/pages/*`
- `apps/app/src/shared/i18n/messages.ts`

### Checklist de execucao
- [x] definir nome final da aba
- [x] criar nova rota e pagina
- [x] mover para ela:
  - `System alerts`
  - `Operational activity`
  - status de sincronizacao
  - erros recentes
- [x] decidir se `recentEvents` e `alerts` continuam vindo do snapshot atual ou se precisam de endpoint dedicado no futuro
- [ ] validar navegacao desktop e mobile

### Criterio de saida
- existe um lugar proprio para diagnostico operacional sem poluir o Dashboard

### Status
- parcial
- observacao:
  - a primeira versao reutiliza o snapshot atual do Dashboard
  - falta validacao visual manual de navegacao desktop e mobile

## UX-015 - Adicionar paginacao em `History`

### Objetivo
Escalar o historico sem sobrecarregar a tela.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/app/src/ui/pages/HistoryPage.tsx`
- possivelmente backend se a paginacao nao for client-side

### Checklist de execucao
- [x] definir paginacao local ou backend-driven
- [x] implementar controles de pagina
- [x] manter selecao consistente ao trocar de pagina
- [x] revisar empty state e fim de lista

### Criterio de saida
- usuario consegue navegar historico maior sem perder contexto

### Status
- concluido

## UX-016 - Adicionar sinal visual de strategy ativa no menu lateral

### Objetivo
Deixar perceptivel quando existe strategy ativa em operacao.

### Dependencias
- `UX-007`

### Arquivos provaveis
- `apps/app/src/ui/layout/AppLayout.tsx`
- `apps/app/src/styles/app.css`
- `apps/app/src/shared/i18n/messages.ts`

### Checklist de execucao
- [x] definir linguagem visual da animacao
- [x] ativar animacao apenas para `botStatus = active|syncing`
- [x] manter estado neutro para strategy configurada e bot pausado
- [x] validar que a animacao nao parece loading infinito
- [x] validar acessibilidade e reducao de movimento, se aplicavel

### Criterio de saida
- menu lateral comunica operacao ativa de forma discreta e confiavel

### Status
- concluido

## UX-017 - Investigar e corrigir `Account PnL` sempre zero

### Objetivo
Fechar o bug do PnL agregado da conta no Dashboard.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/api/src/infrastructure/pacifica/PacificaAccountStateGateway.ts`
- `apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts`
- `apps/app/src/features/account/apply-operational-page-sessions.ts`
- `apps/app/src/ui/pages/DashboardPage.tsx`
- `docs/dev/MAPPED_PROBLEMS.pt-BR.md`

### Checklist de execucao
- [x] reproduzir o bug com snapshot real ou fixture equivalente
- [x] inspecionar como `aggregatedPnl` esta sendo extraido do payload da Pacifica
- [ ] verificar se o valor chega corretamente ao banco
- [ ] verificar se o valor e lido corretamente no dashboard snapshot
- [x] validar se o fallback de normalizacao esta mascarando `null` como `0`
- [x] corrigir a origem do problema
- [x] adicionar cobertura automatizada do caso
- [x] documentar a causa em `MAPPED_PROBLEMS` se for bug real de integracao

### Criterio de saida
- `Account PnL` deixa de ficar travado em `+$0.00` quando a conta possui PnL agregado valido

### Status
- parcial
- concluido:
  - normalizacao de balance snapshot reforcada no gateway da Pacifica
  - prioridade para campos especificos de PnL antes do `pnl` generico
  - testes adicionados
- pendente:
  - confirmar ponta a ponta com snapshot real persistido
  - verificar persistencia ponta a ponta no banco com snapshot real

## UX-018 - Investigar e corrigir `Closed by system` em TP/SL

### Objetivo
Fechar a regressao de motivo de fechamento no historico.

### Dependencias
- nenhuma

### Arquivos provaveis
- `apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts`
- `apps/worker/src/application/createOperationalWorker.ts`
- possivelmente `packages/pacifica-trading/src/index.ts`
- `docs/dev/MAPPED_PROBLEMS.pt-BR.md`

### Checklist de execucao
- [x] reproduzir o caso com fechamento por `take profit` e `stop loss`
- [x] verificar como `findMatchingExternalCloseEvent()` infere `closeReason`
- [x] confirmar impacto da remocao recente dos `client_order_id` internos de TP/SL
- [x] definir nova estrategia canonica de inferencia de `closeReason`
- [ ] validar comportamento para trades novos
- [ ] decidir politica para historico ja persistido:
  - sem backfill
  - backfill parcial
  - migracao completa
- [x] adicionar testes cobrindo TP, SL e fallback real
- [x] documentar a causa em `MAPPED_PROBLEMS`

### Criterio de saida
- historico passa a refletir corretamente fechamentos por `take profit` e `stop loss`

### Status
- parcial
- concluido:
  - inferencia passou a priorizar `cause` retornado pela Pacifica
  - fallback legado por `clientOrderId` foi mantido
  - testes adicionados
- pendente:
  - validar em trades novos reais
  - decidir politica para historico antigo

## Observacao de Backlog
Se for transformar isso em cards, a quebra mais segura e:
- 1 card para cada task `UX-001` a `UX-018`
- ou consolidar os quick wins de copy em um unico card apenas se nao houver conflito de arquivo e de PR

## Observacao de Risco
Os itens `UX-017` e `UX-018` nao sao refinamento cosmetico. Eles precisam de validacao ponta a ponta com snapshot Pacifica real ou fixture fiel, porque impactam confianca operacional.
