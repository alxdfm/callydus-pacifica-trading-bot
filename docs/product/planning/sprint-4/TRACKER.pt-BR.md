# Sprint 4 Tracker

## Objetivo
Centralizar o acompanhamento operacional da Sprint 4 no nivel de task individual, com status, bloqueios, responsaveis e proximo passo.

## Como Usar
- atualizar `status`, `owner`, `ultima atualizacao` e `proximo passo` sempre que uma task mudar de estado
- marcar os checklists dentro de cada card individual conforme a entrega evoluir
- registrar bloqueios reais no card da task e refletir o resumo neste tracker
- usar este arquivo como visao executiva da sprint

## Legenda de Status
- `TODO`: task ainda nao iniciada
- `IN_PROGRESS`: task em execucao
- `IN_REVIEW`: task pronta para validacao
- `BLOCKED`: task impedida por dependencia ou decisao externa
- `PARTIAL`: task pode avancar parcialmente, mas nao fechar
- `DONE`: task concluida e validada

## Resumo Atual
- sprint status: `GO`
- foco principal: telas operacionais de trades e historico entregues em codigo e aguardando validacao manual
- bloqueios principais: nenhum bloqueio aberto; fechamento depende da revisao manual da sincronizacao entre dashboard, trades e historico

## Owners de Fechamento Cedo
- `PO`: owner por proteger o escopo de intervencao manual segura e manter terminologia consistente entre telas
- `Dev`: owner por implementar trades atuais, historico, encerramento manual e sincronizacao entre views
- `Designer`: owner por consolidar leitura rapida, acao de encerramento e handoff das telas operacionais
- `QA`: owner por validar usabilidade, regras de negocio e sincronizacao entre dashboard, trades e historico

## Dev
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| V4.1 | IN_REVIEW | P0 | Dev | outputs das Sprint 1, 2 e 3 | nenhum | Validar rota e estrutura de Trades Atuais |
| V4.2 | IN_REVIEW | P0 | Dev | V4.1 | nenhum | Validar lista de trades abertos |
| V4.3 | IN_REVIEW | P0 | Dev | V4.2 | nenhum | Validar acao de encerramento manual |
| V4.4 | IN_REVIEW | P0 | Dev | V4.3, outputs da Sprint 3 | nenhum | Validar sincronizacao apos encerramento |
| V4.5 | IN_REVIEW | P0 | Dev | outputs das Sprint 1 e 3 | nenhum | Validar rota e estrutura do Historico |
| V4.6 | IN_REVIEW | P0 | Dev | V4.5 | nenhum | Validar lista de trades encerrados |
| V4.7 | IN_REVIEW | P0 | Dev | V4.2, V4.6 | nenhum | Validar origem do trade e motivo de encerramento |
| V4.8 | IN_REVIEW | P1 | Dev | V4.2, V4.3, V4.6, V4.7 | nenhum | Validar loading e feedback de processamento |
| V4.9 | IN_REVIEW | P1 | Dev | V4.4, V4.8 | nenhum | Validar fluxo completo de Trades Atuais |

## Designer
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| D4.1 | DONE | P0 | Designer | outputs das Sprint 1, 2 e 3 | nenhum | Definir ordem dos blocos da tela |
| D4.2 | DONE | P0 | Designer | D4.1 | nenhum | Definir hierarquia interna do item |
| D4.3 | DONE | P0 | Designer | D4.2 | nenhum | Definir marcadores de direcao |
| D4.4 | DONE | P0 | Designer | D4.2 | nenhum | Definir visual do CTA de encerramento |
| D4.5 | DONE | P0 | Designer | outputs de Sprint 3 | nenhum | Definir composicao principal da tela |
| D4.6 | DONE | P0 | Designer | D4.5 | nenhum | Definir hierarquia interna do item de historico |
| D4.7 | DONE | P0 | Designer | D4.6 | nenhum | Definir marcadores visuais de resultado |
| D4.8 | DONE | P1 | Designer | D4.3, D4.4, D4.7 | nenhum | Revisar adaptacao da lista de trades atuais para cartoes ou linhas compactas |
| D4.9 | DONE | P1 | Designer | D4.1, D4.2, D4.3, D4.4, D4.5, D4.6, D4.7, D4.8 | nenhum | Organizar componentes finais da sprint |

## QA
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| Q4.1 | TODO | P0 | QA | D4.2 concluida, D4.4 concluida, D4.6 concluida, V4.2 concluida, V4.3 concluida, V4.6 concluida | nenhum | validar usabilidade de Trades Atuais e Historico |
| Q4.2 | TODO | P0 | QA | V4.3 concluida, V4.4 concluida, V4.7 concluida | nenhum | validar regras de negocio e sincronizacao de trades |
| Q4.3 | TODO | P0 | QA | D4.4 concluida, V4.8 concluida, V4.9 concluida | nenhum | validar mensagens, estados e recuperacao das telas da Sprint 4 |
| Q4.4 | TODO | P1 | QA | Q4.1 concluida, Q4.2 concluida, Q4.3 concluida | nenhum | consolidar o relatorio de QA da Sprint 4 |

## Regra de Controle
Uma task so pode mudar para `DONE` quando:
- [ ] o card da task estiver com checklist de entrega real concluido
- [ ] os bloqueios estiverem resolvidos ou explicitamente descartados
- [ ] os criterios de aceite da task estiverem marcados
- [ ] nao houver expansao indevida de escopo do MVP

## Cards Individuais
### Dev
- [V4.1 Card](./cards/dev/V4.1_CARD.pt-BR.md)
- [V4.2 Card](./cards/dev/V4.2_CARD.pt-BR.md)
- [V4.3 Card](./cards/dev/V4.3_CARD.pt-BR.md)
- [V4.4 Card](./cards/dev/V4.4_CARD.pt-BR.md)
- [V4.5 Card](./cards/dev/V4.5_CARD.pt-BR.md)
- [V4.6 Card](./cards/dev/V4.6_CARD.pt-BR.md)
- [V4.7 Card](./cards/dev/V4.7_CARD.pt-BR.md)
- [V4.8 Card](./cards/dev/V4.8_CARD.pt-BR.md)
- [V4.9 Card](./cards/dev/V4.9_CARD.pt-BR.md)

### Designer
- [D4.1 Card](./cards/designer/D4.1_CARD.pt-BR.md)
- [D4.2 Card](./cards/designer/D4.2_CARD.pt-BR.md)
- [D4.3 Card](./cards/designer/D4.3_CARD.pt-BR.md)
- [D4.4 Card](./cards/designer/D4.4_CARD.pt-BR.md)
- [D4.5 Card](./cards/designer/D4.5_CARD.pt-BR.md)
- [D4.6 Card](./cards/designer/D4.6_CARD.pt-BR.md)
- [D4.7 Card](./cards/designer/D4.7_CARD.pt-BR.md)
- [D4.8 Card](./cards/designer/D4.8_CARD.pt-BR.md)
- [D4.9 Card](./cards/designer/D4.9_CARD.pt-BR.md)

### QA
- [Q4.1 Card](./cards/qa/Q4.1_CARD.pt-BR.md)
- [Q4.2 Card](./cards/qa/Q4.2_CARD.pt-BR.md)
- [Q4.3 Card](./cards/qa/Q4.3_CARD.pt-BR.md)
- [Q4.4 Card](./cards/qa/Q4.4_CARD.pt-BR.md)
