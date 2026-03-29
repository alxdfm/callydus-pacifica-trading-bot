# FM-007 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Trocar as acoes locais de pausa, retomada e encerramento por comandos reais, assíncronos e rastreáveis.

## Escopo Fechado
- [x] criar comandos de pause, resume e close trade
- [x] usar idempotencia e status de comando
- [x] refletir processamento, sucesso e falha na UI
- [x] registrar origem e efeito de cada comando

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] acoes sensiveis do app nao dependem mais de alteracao local de estado
- [ ] cada comando relevante possui status rastreavel e feedback consistente

## Dependencias
- [ ] FM-001 concluida
- [ ] FM-006 concluida

## Critérios de Aceite da Task
- [ ] acoes sensiveis do app nao dependem mais de alteracao local de estado
- [ ] cada comando relevante possui status rastreavel e feedback consistente

## Proximo Passo Recomendado
Conectar esses comandos ao worker/runtime real da Pacifica quando a trilha de execucao efetiva avancar.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-28`: command layer backend implementada com `POST /api/runtime/pause`, `POST /api/runtime/resume` e `POST /api/trades/:id/close`, todos persistindo `BotCommand` com `idempotencyKey`, `commandStatus` e rastreabilidade minima.
- `2026-03-28`: frontend atualizado para deixar de usar `toggleBotState` e `closeTradeInRuntime`; `Dashboard` e `Trades` agora chamam a API real e reidratam o estado pela sessao operacional do backend.
- `2026-03-28`: `Profile` deixou de pausar o bot apenas no estado local; o CTA `Stop bot` agora usa o mesmo `POST /api/runtime/pause` do `Dashboard` e reidrata a sessao operacional antes de liberar a substituicao da `Agent Wallet`.
- `2026-03-28`: labels e CTAs de estado do bot no `Dashboard` e no `Profile` passaram a derivar diretamente do `botStatus` vindo do backend (`active`, `paused`, `inactive`, `syncing`, `error`), sem colapsar tudo em estados locais simplificados como `running/idle`.
- `2026-03-28`: validacao manual local concluida com sucesso para `pause_bot`, `resume_bot` e `close_trade`, incluindo persistencia do `BotCommand` e reflexo do fechamento no `POST /api/account/session`.
