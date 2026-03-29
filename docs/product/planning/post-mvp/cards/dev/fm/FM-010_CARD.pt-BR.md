# FM-010 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P1`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-29`

## Objetivo
Registrar sinais, comandos, erros e mudancas de estado para que o produto explique o que aconteceu no fluxo real.

## Escopo Fechado
- [x] logs de validacao de credencial
- [x] logs de ativacao de preset e comandos do bot
- [x] eventos minimos de sinal e execucao
- [x] alertas operacionais de falha ou degradacao

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [x] o time consegue investigar porque uma acao falhou ou porque uma operacao aconteceu
- [x] o usuario recebe contexto minimo compreensivel no dashboard e nas telas operacionais

## Dependencias
- [x] FM-002 concluida
- [x] FM-006 concluida
- [x] FM-007 concluida
- [x] FM-008 concluida

## Critérios de Aceite da Task
- [x] o time consegue investigar porque uma acao falhou ou porque uma operacao aconteceu
- [x] o usuario recebe contexto minimo compreensivel no dashboard e nas telas operacionais

## Proximo Passo Recomendado
Validar manualmente o fluxo com a nova tabela `OperationalEvent` e decidir se o card ja pode ser promovido a `DONE`.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-29`: o backend ganhou a tabela `OperationalEvent` para registrar trilha minima de auditoria por wallet/conta operacional.
- `2026-03-29`: validacao de credencial, verificacao operacional, ativacao de preset, comandos do bot/trade e reconciliacao de runtime passaram a escrever eventos auditaveis com `severity`, `title`, `message` e `payloadJson`.
- `2026-03-29`: `POST /api/account/session` passou a devolver `recentEvents` junto do snapshot operacional, permitindo que o dashboard mostre atividade recente real da conta sem depender de mock ou texto local.
- `2026-03-29`: eventos de avaliacao de sinal tambem passaram a ser registrados no backend; como essa avaliacao ainda nao e vinculada a uma wallet especifica, esses eventos sao auditaveis para o time mas nao aparecem na superficie por conta do dashboard.
