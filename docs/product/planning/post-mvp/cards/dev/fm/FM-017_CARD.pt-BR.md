# FM-017 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-30`

## Objetivo
Implementar reconciliacao externa com a Pacifica e consolidar a exchange como fonte visivel de verdade no produto final.

## Escopo Fechado
- [ ] consultar ordens, posicoes e saldo reais na Pacifica
- [ ] detectar drift entre banco/runtime e exchange
- [ ] corrigir runtime apos restart, falha ou divergencia externa
- [ ] tratar a Pacifica como fonte visivel de verdade
- [ ] quando a Pacifica estiver indisponivel, mostrar explicitamente o `ultimo snapshot conhecido`

## Fora de Escopo
- [ ] esconder degradacao de sincronizacao do usuario
- [ ] vender estado local como verdade quando a exchange nao puder ser consultada

## Checklist de Entrega Real
- [ ] divergencias relevantes deixam de ficar silenciosas
- [ ] a Pacifica vence como estado principal visivel
- [ ] indisponibilidade da exchange gera fallback explicito, nao ambiguidade
- [ ] restart ou drift externo nao deixam runtime/trades permanentemente inconsistentes

## Dependencias
- [ ] FM-015 concluida
- [ ] FM-016 concluida
- [ ] FM-009 concluida

## Critérios de Aceite da Task
- [ ] reconciliacao externa existe e corrige estado relevante
- [ ] a UI distingue estado confirmado pela Pacifica de snapshot local degradado
- [ ] a verdade operacional visivel do produto final esta alinhada ao fechamento de PO

## Proximo Passo Recomendado
Revisitar `AR-005` para consolidar a estrategia final de refresh da sessao operacional quando o worker real estiver mutando estado continuamente.

## Log de Acompanhamento
- `2026-03-30`: card criado a partir da decisao de PO de que a Pacifica vence como fonte visivel de verdade, com fallback explicito para `ultimo snapshot conhecido` quando a exchange estiver indisponivel.
