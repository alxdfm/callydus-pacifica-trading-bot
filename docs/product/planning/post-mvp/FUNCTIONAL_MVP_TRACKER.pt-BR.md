# Functional MVP Tracker

## Objetivo
Organizar a transicao do MVP demonstravel/mockado para um MVP funcional real, com integracao Pacifica, leitura real de mercado e fluxo operacional persistido.

## Diagnostico Atual
- wallet Phantom ja tem integracao real no frontend
- validacao de credenciais ainda e local/simulada
- ativacao de preset ainda e local/simulada
- runtime operacional ainda precisa consolidar leitura real em todas as telas, mas o `demo-runtime` ja foi removido como dependencia comportamental do app
- API ainda nao implementa integracao funcional com Pacifica
- contratos e esquema de banco ja existem como base para a proxima fase

## Resumo de Prioridade
- foco principal: fechar integracao Pacifica + analise real dos presets + read models reais do produto
- bloqueio principal: falta contrato tecnico real da Pacifica e runtime de mercado/indicadores

## Nota Operacional
- `FM-003` a `FM-010` continuam em `IN_REVIEW` por sincronizacao e validacao manual final, mas ja formam a baseline implementada que destrava a trilha `FM-013` a `FM-017`
- portanto, o status `IN_REVIEW` desses slices nao deve ser lido como bloqueio tecnico para iniciar `FM-013` e `FM-014`

## Dev
| Task | Status | Tipo | Prioridade | Resumo | Proximo passo |
|------|--------|------|------------|--------|---------------|
| FM-001 | DONE | estudo + definicao tecnica | P0 | Contrato tecnico Pacifica fechado com fontes primarias, limites e delimitacao clara entre integracao direta e adaptadores internos | Iniciar FM-002 sobre o contrato fechado e o ambiente local de banco via `docker compose`. |
| FM-002 | DONE | implementacao | P0 | Validacao real de credenciais Pacifica mediada por backend, com cifragem e persistencia, agora separada do `builder approval` da conta | Slice funcional fechado; backlog residual nao bloqueante segue em `BG-022`. |
| FM-003 | IN_REVIEW | arquitetura + implementacao | P0 | Substituir persistencia local por estado operacional de backend | Expandir a reidratacao backend ja implementada para tambem cobrir escrita/persistencia real de preset e runtime nos proximos slices. |
| FM-004 | IN_REVIEW | estudo + implementacao | P0 | Criar pipeline real de mercado e candles | Conectar o motor de indicadores (`FM-005`) aos endpoints reais de market data ja expostos no backend. |
| FM-005 | IN_REVIEW | implementacao | P0 | Implementar motor de indicadores e avaliacao de gatilhos dos presets | Conectar a avaliacao real dos presets ao fluxo de ativacao/runtime e substituir progressivamente o `demo-runtime`. |
| FM-006 | IN_REVIEW | implementacao | P0 | Ligar ativacao de preset ao runtime operacional real | Usar a ativacao persistida como entrada canonica dos proximos comandos reais de bot/trade em `FM-007`. |
| FM-007 | IN_REVIEW | implementacao | P0 | Implementar comandos reais de bot e trade via backend | Conectar os comandos persistidos ao runtime/worker real quando a trilha de execucao Pacifica avancar. |
| FM-008 | IN_REVIEW | implementacao | P0 | Sincronizar dashboard, current trades e history com dados reais | Validar funcionalmente o slice com seed/read model real e decidir se o card ja pode ser promovido a `DONE`. |
| FM-009 | IN_REVIEW | implementacao | P1 | Implementar reconciliacao, heartbeat e recuperacao basica | Validar manualmente os caminhos de `heartbeat`, `reconcile` e `account/session` com runtime ausente, stale e saudavel. |
| FM-010 | IN_REVIEW | implementacao | P1 | Instrumentar logs, alertas e auditoria minima do fluxo funcional | Validar manualmente a trilha de `OperationalEvent` e decidir se o card ja pode ser promovido a `DONE`. |
| FM-011 | DONE | implementacao | P0 | Modelar lifecycle minimo de credenciais Pacifica com `active/replaced` | Concluida para garantir uma unica `Agent Wallet` ativa por conta e preservar historico sem ambiguidade. |
| FM-012 | DONE | arquitetura + implementacao | P0 | Endurecer a arquitetura do fluxo de credenciais no frontend e alinhar o backend ao lifecycle `active` | Concluida com saneamento do storage local, modularizacao do `Profile` e correcao de `findActiveCredential`. |
| FM-013 | IN_REVIEW | implementacao | P0 | Transformar o `worker` em loop operacional continuo por conta/preset ativo | Validar em ambiente local o loop continuo com lease persistida, restart seguro e `heartbeat` real por conta. |
| FM-014 | TODO | implementacao | P0 | Levar a avaliacao de sinais para loop real com regras finais de produto | Aplicar no worker a cadencia de `1 minuto`, sem `cooldown` artificial e com `reentrada no mesmo candle` permitida. |
| FM-015 | TODO | implementacao | P0 | Executar ordens reais na Pacifica com `market order`, idempotencia e auto-pausa em erro critico | Fechar a camada de order execution usando os contratos reais ja mapeados em `FM-001`. |
| FM-016 | TODO | implementacao | P0 | Fechar lifecycle real de ordens/trades/posicoes com `1 posicao por simbolo`, `stop loss` e `take profit` obrigatorios | Transformar execucao e risk plan em estado operacional real refletido no produto. |
| FM-017 | TODO | implementacao | P0 | Reconciliar banco/runtime com a Pacifica e tratar a exchange como fonte visivel de verdade | Fechar a estrategia de verdade externa, snapshot local degradado e recuperacao apos drift. |

## Ordem Recomendada
1. FM-001
2. FM-002
3. FM-003
4. FM-004
5. FM-005
6. FM-006
7. FM-007
8. FM-008
9. FM-009
10. FM-010
11. FM-013
12. FM-014
13. FM-015
14. FM-016
15. FM-017

## Cards
- [FM-001 Card](./cards/dev/fm/FM-001_CARD.pt-BR.md)
- [FM-002 Card](./cards/dev/fm/FM-002_CARD.pt-BR.md)
- [FM-003 Card](./cards/dev/fm/FM-003_CARD.pt-BR.md)
- [FM-004 Card](./cards/dev/fm/FM-004_CARD.pt-BR.md)
- [FM-005 Card](./cards/dev/fm/FM-005_CARD.pt-BR.md)
- [FM-006 Card](./cards/dev/fm/FM-006_CARD.pt-BR.md)
- [FM-007 Card](./cards/dev/fm/FM-007_CARD.pt-BR.md)
- [FM-008 Card](./cards/dev/fm/FM-008_CARD.pt-BR.md)
- [FM-009 Card](./cards/dev/fm/FM-009_CARD.pt-BR.md)
- [FM-010 Card](./cards/dev/fm/FM-010_CARD.pt-BR.md)
- [FM-011 Card](./cards/dev/fm/FM-011_CARD.pt-BR.md)
- [FM-012 Card](./cards/dev/fm/FM-012_CARD.pt-BR.md)
- [FM-013 Card](./cards/dev/fm/FM-013_CARD.pt-BR.md)
- [FM-014 Card](./cards/dev/fm/FM-014_CARD.pt-BR.md)
- [FM-015 Card](./cards/dev/fm/FM-015_CARD.pt-BR.md)
- [FM-016 Card](./cards/dev/fm/FM-016_CARD.pt-BR.md)
- [FM-017 Card](./cards/dev/fm/FM-017_CARD.pt-BR.md)

## Atualizacoes Recentes
- `2026-03-25`: `FM-001` fechado com o documento [PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md](../../../dev/PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md) e o ambiente local de banco padronizado com `docker compose`.
- `2026-03-25`: `FM-002` ganhou design tecnico inicial em [FM_002_CREDENTIAL_VALIDATION_TECH_DESIGN.pt-BR.md](../../../dev/FM_002_CREDENTIAL_VALIDATION_TECH_DESIGN.pt-BR.md).
- `2026-03-25`: `FM-002` foi inicialmente refinado para usar o approval do `builder code` como validacao operacional oficial da credencial, reaproveitando a logica ja provada na POC anterior.
- `2026-03-25`: `apps/api` deixou de ser placeholder e ganhou esqueleto em camadas `domain`, `application`, `infrastructure` e `ui/http` para suportar `FM-002` sem acoplamento precoce.
- `2026-03-25`: `FM-002` entregue em codigo e movido para `IN_REVIEW`, com backend local, approval do builder code via Pacifica, cifragem de segredo e persistencia via Prisma/PostgreSQL.
- `2026-03-25`: mudanca de direcao confirmada por teste real: `approve_builder_code` respondeu `Verification failed` com `Agent Wallet` e `200` com assinatura da conta principal em modo diagnostico local; o fluxo oficial passa a separar `builder approval` da conta no frontend e `Agent Wallet validation` no backend.
- `2026-03-25`: implementacao ajustada ao novo desenho: o app agora assina `approve_builder_code` com a wallet principal no onboarding, a API faz o forward para a Pacifica e a validacao backend da `Agent Wallet` foi desacoplada desse endpoint.
- `2026-03-25`: estudo adicional da doc da Pacifica confirmou que nao existe endpoint dedicado de `check` para `Agent Wallet`; o projeto deve considerar validacao em dois niveis (`validated` e `operationally_verified`) ou assumir conscientemente um `POST` com side effect como probe.
- `2026-03-25`: proposta tecnica de `operational verification pre-run` documentada para refinamento com PO, devido ao risco de o bot falhar apenas na primeira oportunidade real de trade.
- `2026-03-26`: `BG-012` entrou em implementacao tecnica parcial sem depender da UX final: a API ganhou `POST /api/onboarding/credentials/verify-operational`, a persistencia de `PacificaCredential` passou a registrar estado e auditoria de verificacao operacional, e o probe backend foi preparado para `create limit order + cancel order` com parametros de mercado vindos de `GET /api/v1/info`.
- `2026-03-26`: com o handoff do `BG-013` fechado, o onboarding do app passou a expor `Run readiness check` como quarto passo visivel e o acesso ao dashboard agora depende explicitamente de `operationally_verified`, mantendo o probe tecnico `create + cancel` transparente para o usuario.
- `2026-03-26`: `BG-012` foi validado manualmente com sucesso; o fluxo completo de onboarding concluiu `builder approval`, validacao da `Agent Wallet` e `operational verification`, liberando a conta como operacionalmente pronta.
- `2026-03-28`: `FM-011` concluida para introduzir lifecycle minimo `pending/active/replaced` em `PacificaCredential`, garantindo historico de `Agent Wallet` sem ambiguidade sobre qual credencial esta operacionalmente ativa e evitando que uma nova credencial validada seja promovida cedo demais.
- `2026-03-28`: `FM-012` concluida para remover a persistencia da private key do frontend, modularizar o fluxo de `Replace Agent Wallet` e corrigir `findActiveCredential` para respeitar apenas credenciais `active`.
- `2026-03-28`: `FM-002` consolidada como `DONE`; o residual de alias ao reaproveitar credencial `replaced` foi explicitamente desmembrado para `BG-022` e nao bloqueia mais o fechamento do slice funcional.
- `2026-03-28`: `FM-003` entrou em `IN_REVIEW` com o primeiro read model operacional real por `walletAddress`; o backend agora expoe snapshot de sessao operacional e o frontend reidrata conta existente, preset ativo, runtime, saldo, trades, history e alertas a partir da API em vez de depender apenas do `localStorage`.
- `2026-03-28`: `FM-004` entrou em `IN_REVIEW` com a base real de market data da Pacifica no backend: contratos compartilhados de prices/candles, gateway para `GET /api/v1/info/prices`, `GET /api/v1/kline` e `GET /api/v1/kline/mark`, alem de endpoints locais `GET /api/market/prices` e `POST /api/market/candles`.
- `2026-03-28`: `FM-005` entrou em `IN_REVIEW` com o contrato tecnico compartilhado dos presets movido para `packages/contracts`, motor backend proprio para `EMA`, `RSI`, `ATR`, `volume` e `SMA(volume)`, e endpoint `POST /api/presets/evaluate-signal` que devolve sinal, explicacao auditavel e niveis sugeridos de risco sobre candles reais da Pacifica.
- `2026-03-28`: `FM-005` ganhou validacao manual local: `POST /api/presets/evaluate-signal` respondeu `success` para o preset `Safer`, com `BTC/USDC` traduzido para `BTC` na borda Pacifica e snapshots coerentes de indicadores/rules, alem de `entryReferencePrice`, `longRiskPlan` e `shortRiskPlan`.
- `2026-03-28`: `FM-006` entrou em `IN_REVIEW` com ativacao real de preset via `POST /api/presets/activate`; o backend agora persiste `PresetActivation`, gera `effectiveContractJson`, desativa o preset ativo anterior e vincula `BotRuntimeState.activePresetActivationId` ao preset recem-ativado.
- `2026-03-28`: `FM-006` foi validado manualmente em ambiente local: a ativacao real respondeu `success` e o snapshot de sessao por `walletAddress` passou a refletir o `activePreset` e o `activePresetActivationId` persistidos.
- `2026-03-28`: `FM-007` entrou em `IN_REVIEW` com command layer backend para `pause_bot`, `resume_bot` e `close_trade`, todos persistindo `BotCommand` com status rastreavel e deixando o frontend depender da API em vez de mutacao local de estado.
- `2026-03-28`: `FM-007` ganhou validacao manual local: `POST /api/runtime/pause`, `POST /api/runtime/resume` e `POST /api/trades/:id/close` responderam `success`; o fechamento de trade foi refletido no `POST /api/account/session` com remocao de `OpenTrade` e criacao de `ClosedTrade`.
- `2026-03-28`: `FM-008` entrou em `IN_REVIEW` com a remocao do `demo-runtime` como dependencia operacional do app; `AppState` e `SolanaWalletStateBridge` agora usam apenas um `RuntimeState` vazio canonico, sem helpers de mutacao fake, enquanto a leitura real continua centralizada na sessao operacional do backend.
- `2026-03-29`: `FM-008` fechou o residual de UX de runtime; `syncStatus` ganhou camada propria de apresentacao no `Dashboard`, enquanto `Trades` e `History` passaram a herdar apenas os casos `degraded/error`, preservando `screenStatus` para acoes locais e transitórias.
- `2026-03-29`: `FM-009` entrou em `IN_REVIEW` com manutencao minima de runtime no backend: `POST /api/runtime/heartbeat`, `POST /api/runtime/reconcile`, recuperacao basica de runtime ausente, degradacao/erro por heartbeat stale e reconciliacao automatica antes do `POST /api/account/session`. O escopo deste slice e congruencia entre os dados persistidos do proprio produto, e nao reconciliacao completa com a Pacifica.
- `2026-03-29`: `FM-010` entrou em `IN_REVIEW` com a introducao de `OperationalEvent` como trilha minima de auditoria do fluxo real. Validacao de credencial, readiness operacional, ativacao de preset, comandos do bot/trade e reconciliacao de runtime agora registram eventos persistidos, e o `POST /api/account/session` passou a devolver `recentEvents` para o dashboard.
- `2026-03-30`: com o `PRODUCT_FINALIZATION_PO_GUIDE` respondido pelo PO, a trilha final foi desdobrada em `FM-013` a `FM-017` para fechar worker continuo, loop real de sinais, execucao real de ordens, lifecycle/risk execution e reconciliacao externa com a Pacifica.
- `2026-03-30`: `FM-013` entrou em `IN_REVIEW` com a base do `worker` operacional continuo: loop por conta/preset ativo, `heartbeat` real, lease persistida em `BotRuntimeState` (`workerOwnerId`, `workerLeaseExpiresAt`, `workerLoopStartedAt`), retry/backoff tecnico e best-effort release de ownership em shutdown.
