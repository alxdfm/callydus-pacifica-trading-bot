# FM-017 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-31`

## Objetivo
Implementar reconciliacao externa com a Pacifica e consolidar a exchange como fonte visivel de verdade no produto final.

## Escopo Fechado
- [x] consultar ordens, posicoes e saldo reais na Pacifica
- [x] detectar drift entre banco/runtime e exchange
- [x] corrigir runtime apos restart, falha ou divergencia externa
- [x] tratar a Pacifica como fonte visivel de verdade
- [x] quando a Pacifica estiver indisponivel, mostrar explicitamente o `ultimo snapshot conhecido`

## Fora de Escopo
- [ ] esconder degradacao de sincronizacao do usuario
- [ ] vender estado local como verdade quando a exchange nao puder ser consultada

## Checklist de Entrega Real
- [x] divergencias relevantes deixam de ficar silenciosas
- [x] a Pacifica vence como estado principal visivel
- [x] indisponibilidade da exchange gera fallback explicito, nao ambiguidade
- [x] restart ou drift externo nao deixam runtime/trades permanentemente inconsistentes

## Dependencias
- [x] baseline implementada em `FM-015`
- [x] baseline implementada em `FM-016`
- [x] baseline implementada em `FM-009`

## Critérios de Aceite da Task
- [x] reconciliacao externa existe e corrige estado relevante
- [x] a UI distingue estado confirmado pela Pacifica de snapshot local degradado
- [x] a verdade operacional visivel do produto final esta alinhada ao fechamento de PO

## Proximo Passo Recomendado
Revisitar `AR-005` para consolidar a estrategia final de refresh da sessao operacional quando o worker real estiver mutando estado continuamente.

## Log de Acompanhamento
- `2026-03-30`: card criado a partir da decisao de PO de que a Pacifica vence como fonte visivel de verdade, com fallback explicito para `ultimo snapshot conhecido` quando a exchange estiver indisponivel.
- `2026-03-31`: `FM-017` entrou em `IN_REVIEW` com sincronizacao externa no `POST /api/account/session`. A API agora tenta consultar saldo, posicoes, ordens e trades recentes na Pacifica antes de devolver a sessao; quando consegue, promove o runtime para `exchangeSnapshotStatus = confirmed` e corrige drift relevante de `OpenTrade/ClosedTrade`. Quando a Pacifica falha, o backend preserva o ultimo estado local conhecido, marca `exchangeSnapshotStatus = last_known`, registra mensagem explicita de fallback e a UI passa a distinguir esse estado de snapshot degradado de um estado confirmado pela exchange.
