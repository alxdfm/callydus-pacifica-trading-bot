# FM-008 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Substituir demo-runtime por leituras reais do backend para saldo, bot status, trades abertos, trades fechados e alertas.

## Escopo Fechado
- [x] eliminar dependencias centrais de demo-runtime para leitura operacional
- [x] alimentar dashboard com read model real
- [x] alimentar current trades com fonte real
- [x] alimentar history com fonte real
- [x] refletir estados de loading, vazio, erro e sync real

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [x] dashboard, trades e history usam dados reais de backend
- [x] o usuario enxerga o mesmo estado operacional em todas as telas sem divergencia simulada

## Dependencias
- [ ] FM-002 concluida
- [ ] FM-003 concluida
- [ ] FM-006 concluida
- [ ] FM-007 concluida

## Critérios de Aceite da Task
- [x] dashboard, trades e history usam dados reais de backend
- [x] o usuario enxerga o mesmo estado operacional em todas as telas sem divergencia simulada

## Proximo Passo Recomendado
Definir read models finais e substituir progressivamente os pontos de leitura local.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-28`: `demo-runtime` foi removido do app como dependencia operacional; a aplicacao agora usa apenas `RuntimeState` vazio canonico em `runtime-state.ts`, sem helpers de comportamento fake como `toggleBotState`, `closeTradeInRuntime` ou `createRuntimeFromPresetActivation`.
- `2026-03-28`: `AppState` e `SolanaWalletStateBridge` deixaram de importar o runtime mockado; a inicializacao/limpeza de sessao usa somente estado vazio e a reidratacao operacional continua vindo de `POST /api/account/session`.
- `2026-03-29`: seed utilitario criado em `apps/api/scripts/seed-fm-008-session.ts` para popular `OperatorAccount`, credencial ativa, preset ativo, runtime, balance, open trades, closed trades e alerts diretamente no banco e facilitar o walkthrough manual do slice.
- `2026-03-29`: `Dashboard`, `Current Trades` e `History` foram consolidados como consumidores de fonte real via sessao operacional do backend; o item residual do card ficou restrito a explicitar melhor `syncStatus` na UX, alem de `loading`, `empty` e `error`.
- `2026-03-29`: decisao operacional atual mantida: sem polling nem websocket nesta fase. O app continua atualizando a sessao operacional principalmente em acoes explicitas do usuario e na hidratacao inicial; a estrategia hibrida futura ficou registrada em `AR-005`.
- `2026-03-29`: camada de apresentacao de `syncStatus` implementada no frontend; `Dashboard` agora exibe banner sutil de `idle/syncing/degraded/error`, enquanto `Trades` e `History` herdam apenas casos `degraded/error`, mantendo `screenStatus` reservado para acoes locais/transitorias.
