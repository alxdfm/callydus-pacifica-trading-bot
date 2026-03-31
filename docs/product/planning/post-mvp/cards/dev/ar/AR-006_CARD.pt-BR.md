# AR-006 — Estruturar testabilidade isolada por camadas para `api` e `worker`

## Tipo
Architectural Refactoring

## Status
TODO

## Prioridade
P1

## Area
testes / arquitetura / worker / backend

## Contexto
Com a trilha funcional avancando para `worker` continuo, avaliacao recorrente de sinais e criacao de ordens reais na Pacifica, o projeto passa a depender mais de integracoes externas e de orquestracao distribuida entre `api`, `worker`, banco e adapters de mercado/trading.

Hoje ja existe boa parte da separacao por camadas, mas ainda ha risco de algumas features ficarem validaveis apenas por walkthrough integrado ou teste manual ponta a ponta.

## Problema
- regras de negocio e orquestracao ainda podem ficar acopladas demais a banco, Pacifica ou loop do worker
- testar cada feature isoladamente tende a ficar caro e pouco previsivel se depender sempre de ambiente integrado
- sem boundaries mais explicitas para testabilidade, a evolucao de `worker`, `signal engine`, `execution` e `reconciliation` fica mais arriscada

## Impacto
- medio impacto imediato na velocidade e confiabilidade das proximas FMs operacionais
- alto impacto futuro quando o produto depender mais de runtime continuo, ordens reais e reconciliacao com a exchange

## Direcao Recomendada
- fortalecer regras puras em packages compartilhados sempre que fizer sentido:
  - indicadores
  - avaliacao de sinais
  - sizing
  - classificacao de falhas
- empurrar integracoes externas para `ports` explicitas:
  - `market data`
  - `trading`
  - `credential crypto`
  - persistencia
- manter adapters reais finos e com testes de contrato proprios
- decompor a orquestracao do `worker` em blocos menores e testaveis sem precisar subir o runtime inteiro
- criar estrategia de testes em camadas:
  - unitarios para dominio puro
  - application tests com fakes
  - contract tests para adapters reais
  - integration tests para `api + worker + banco`

## Criterio de Pronto
- features centrais do backend e do worker podem ser validadas isoladamente sem depender sempre de walkthrough integrado
- casos de uso criticos executam sobre `ports` e fakes com previsibilidade
- adapters Pacifica e Prisma possuem testes de contrato dedicados
- a orquestracao do `worker` fica particionada o suficiente para testes dirigidos por cenario
- a estrategia final de testes fica documentada como baseline de engenharia do produto

## Referencias
- [FM-013_CARD.pt-BR.md](../../fm/FM-013_CARD.pt-BR.md)
- [FM-014_CARD.pt-BR.md](../../fm/FM-014_CARD.pt-BR.md)
- [FM-015_CARD.pt-BR.md](../../fm/FM-015_CARD.pt-BR.md)
- [FUNCTIONAL_MVP_TRACKER.pt-BR.md](../../../FUNCTIONAL_MVP_TRACKER.pt-BR.md)
