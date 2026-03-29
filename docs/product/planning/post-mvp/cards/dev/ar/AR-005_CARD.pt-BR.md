# AR-005 — Consolidar estrategia de refresh da sessao operacional

## Tipo
Architectural Refactoring

## Status
TODO

## Prioridade
P2

## Area
frontend / read models / runtime

## Contexto
No estado atual do `Functional MVP`, a sessao operacional do backend e reidratada em momentos pontuais:
- entrada inicial da conta existente
- acoes sensiveis do usuario como `pause`, `resume`, `close trade` e ativacao de preset

Essa estrategia foi mantida de proposito por simplicidade, previsibilidade e custo baixo de integracao.

## Problema
- mudancas assíncronas do backend/worker podem nao aparecer imediatamente sem nova acao do usuario
- `syncStatus`, novos trades, novos alerts e erros de runtime podem ficar defasados entre telas
- a semantica atual funciona bem para MVP, mas nao fecha o problema completo de atualizacao operacional continua

## Impacto
- baixo impacto imediato no MVP funcional
- medio impacto futuro quando o worker/runtime real passar a mutar estado sem acao direta do usuario

## Direcao Recomendada
- manter agora a estrategia atual de `refresh on action`
- registrar explicitamente que nao ha polling/websocket nesta fase
- revisitar depois com uma estrategia hibrida, por exemplo:
  - refresh ao entrar em telas operacionais
  - refresh on focus
  - polling leve
  - websocket/event stream, se o runtime real justificar

## Criterio de Pronto
- a estrategia de refresh da sessao operacional deixa de depender apenas de acoes do usuario
- `Dashboard`, `Trades`, `History` e estados de runtime refletem mudancas assíncronas relevantes com politica explicita e consistente
- a politica final fica documentada em contrato tecnico e aplicada transversalmente nas telas operacionais

## Referencias
- [FM-008_CARD.pt-BR.md](../../fm/FM-008_CARD.pt-BR.md)
- [FUNCTIONAL_MVP_TRACKER.pt-BR.md](../../../FUNCTIONAL_MVP_TRACKER.pt-BR.md)
