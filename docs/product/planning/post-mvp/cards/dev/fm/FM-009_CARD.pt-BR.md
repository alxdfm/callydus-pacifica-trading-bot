# FM-009 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P1`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-29`

## Objetivo
Dar robustez minima para que o runtime mantenha congruencia entre os dados persistidos do proprio produto, detecte divergencia e nao perca estado silenciosamente apos falha ou reinicio.

## Esclarecimento Importante
- esta task nao implementa reconciliacao completa com a Pacifica
- o escopo atual e uma reconciliacao minima entre os dados persistidos do proprio sistema
- isso inclui principalmente:
  - `OperatorAccount`
  - `PresetActivation`
  - `BotRuntimeState`
  - `OperationalAlert`
- portanto, "recuperar estado" aqui significa reconstruir ou corrigir o runtime a partir da nossa fonte de verdade persistida, e nao reconstruir trades/ordens/posicoes diretamente da exchange

## Escopo Fechado
- [x] heartbeat do runtime
- [x] reconciliacao minima de estado com runtime persistido
- [x] recuperacao basica apos restart
- [x] tratamento de sync degraded e sync error

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [x] reinicios nao causam perda silenciosa de estado operacional
- [x] divergencias relevantes aparecem como alerta e podem ser investigadas

## Dependencias
- [x] FM-007 concluida
- [x] FM-008 concluida

## Critérios de Aceite da Task
- [x] reinicios nao causam perda silenciosa de estado operacional
- [x] divergencias relevantes aparecem como alerta e podem ser investigadas

## Proximo Passo Recomendado
Validar manualmente os caminhos de `heartbeat`, `reconcile` e `account/session` com runtime ausente, stale e saudavel.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-29`: a API ganhou `POST /api/runtime/heartbeat` e `POST /api/runtime/reconcile`, ambos persistidos via `RuntimeMaintenanceRepository`.
- `2026-03-29`: o `POST /api/account/session` passou a executar reconciliacao minima antes de devolver o snapshot, para que leituras normais do app ja reflitam heartbeat stale, runtime ausente recuperado e divergencias de preset no runtime persistido.
- `2026-03-29`: a reconciliacao minima do MVP cobre tres casos principais: runtime ausente com preset ativo (recriacao pausada e degradada), referencia de preset divergente no runtime persistido e heartbeat stale acima dos thresholds de `degraded/error`, sempre com criacao ou resolucao de `OperationalAlert` do tipo `reconciliation`.
- `2026-03-29`: semantica consolidada do card: o `FM-009` e uma camada de sincronizacao e congruencia entre os dados persistidos do proprio produto. A reconciliacao com a Pacifica em nivel de posicoes/ordens/trades reais permanece fora deste slice.
