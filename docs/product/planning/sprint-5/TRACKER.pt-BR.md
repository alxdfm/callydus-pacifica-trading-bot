# Sprint 5 Tracker

## Objetivo
Centralizar o acompanhamento operacional da Sprint 5 no nivel de task individual, com status, bloqueios, responsaveis e proximo passo.

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
- foco principal: integracao transversal do MVP entregue em codigo e aguardando walkthrough funcional final
- bloqueios principais: nenhum bloqueio aberto; fechamento depende apenas da validacao manual do fluxo completo

## Owners de Fechamento Cedo
- `PO`: owner por proteger o escopo final do MVP, arbitrar backlog residual e sustentar o criterio de prontidao para demo
- `Dev`: owner por integrar navegacao, guards, estados transversais e consistencia funcional do MVP
- `Designer`: owner por consolidar consistencia visual, estados transversais e handoff final para demo
- `QA`: owner por validar usabilidade ponta a ponta, regras de negocio, guards e prontidao para demonstracao

## Dev
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| V5.1 | IN_REVIEW | P0 | Dev | outputs das Sprint 1, 2, 3 e 4 | nenhum | Validar navegacao integrada entre as telas |
| V5.2 | IN_REVIEW | P0 | Dev | V5.1 | nenhum | Validar guards e redirecionamentos do fluxo principal |
| V5.3 | IN_REVIEW | P0 | Dev | V5.1, outputs de design da Sprint 5 | nenhum | Validar estados vazios do MVP |
| V5.4 | IN_REVIEW | P0 | Dev | V5.1, outputs de design da Sprint 5 | nenhum | Validar loadings e feedback de processamento |
| V5.5 | IN_REVIEW | P0 | Dev | V5.1, outputs de design da Sprint 5 | nenhum | Validar banners e tratamento minimo de erro |
| V5.6 | IN_REVIEW | P0 | Dev | V5.2, V5.3, V5.4, V5.5 | nenhum | Validar propagacao de preset ativo e estado do bot |
| V5.7 | IN_REVIEW | P1 | Dev | V5.6 | nenhum | Revisar friccoes do fluxo ponta a ponta |
| V5.8 | IN_REVIEW | P1 | Dev | V5.7 | nenhum | Executar walkthrough completo do fluxo principal |

## Designer
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| D5.1 | DONE | P0 | Designer | outputs das Sprint 1, 2, 3 e 4 | nenhum | Revisar consistencia dos componentes entre telas |
| D5.2 | DONE | P0 | Designer | D5.1 | nenhum | Definir mensagens e composicao dos estados vazios |
| D5.3 | DONE | P0 | Designer | D5.1 | nenhum | Definir padrao de skeleton, spinner ou loading inline por contexto |
| D5.4 | DONE | P0 | Designer | D5.1 | nenhum | Definir severidade e tratamento visual dos erros principais |
| D5.5 | DONE | P0 | Designer | D5.2, D5.3, D5.4 | nenhum | Revisar feedback visual de hover, pressed e disabled |
| D5.6 | DONE | P1 | Designer | D5.5 | nenhum | Revisar fluxo completo no desktop |
| D5.7 | DONE | P1 | Designer | D5.1, D5.2, D5.3, D5.4, D5.5, D5.6 | nenhum | Organizar os artefatos finais do MVP |

## QA
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| Q5.1 | TODO | P0 | QA | D5.1 concluida, D5.5 concluida, D5.6 concluida, V5.1 concluida, V5.7 concluida | nenhum | validar usabilidade do fluxo completo do MVP |
| Q5.2 | TODO | P0 | QA | V5.2 concluida, V5.6 concluida | nenhum | validar regras de negocio, guards e sincronizacao do MVP |
| Q5.3 | TODO | P0 | QA | D5.2 concluida, D5.3 concluida, D5.4 concluida, V5.3 concluida, V5.4 concluida, V5.5 concluida | nenhum | validar estados vazios, loading, erro e recuperacao do MVP |
| Q5.4 | TODO | P1 | QA | Q5.1 concluida, Q5.2 concluida, Q5.3 concluida | nenhum | consolidar o relatorio final de QA da Sprint 5 |

## Regra de Controle
Uma task so pode mudar para `DONE` quando:
- [ ] o card da task estiver com checklist de entrega real concluido
- [ ] os bloqueios estiverem resolvidos ou explicitamente descartados
- [ ] os criterios de aceite da task estiverem marcados
- [ ] nao houver expansao indevida de escopo do MVP

## Cards Individuais
### Dev
- [V5.1 Card](./cards/dev/V5.1_CARD.pt-BR.md)
- [V5.2 Card](./cards/dev/V5.2_CARD.pt-BR.md)
- [V5.3 Card](./cards/dev/V5.3_CARD.pt-BR.md)
- [V5.4 Card](./cards/dev/V5.4_CARD.pt-BR.md)
- [V5.5 Card](./cards/dev/V5.5_CARD.pt-BR.md)
- [V5.6 Card](./cards/dev/V5.6_CARD.pt-BR.md)
- [V5.7 Card](./cards/dev/V5.7_CARD.pt-BR.md)
- [V5.8 Card](./cards/dev/V5.8_CARD.pt-BR.md)

### Designer
- [D5.1 Card](./cards/designer/D5.1_CARD.pt-BR.md)
- [D5.2 Card](./cards/designer/D5.2_CARD.pt-BR.md)
- [D5.3 Card](./cards/designer/D5.3_CARD.pt-BR.md)
- [D5.4 Card](./cards/designer/D5.4_CARD.pt-BR.md)
- [D5.5 Card](./cards/designer/D5.5_CARD.pt-BR.md)
- [D5.6 Card](./cards/designer/D5.6_CARD.pt-BR.md)
- [D5.7 Card](./cards/designer/D5.7_CARD.pt-BR.md)

### QA
- [Q5.1 Card](./cards/qa/Q5.1_CARD.pt-BR.md)
- [Q5.2 Card](./cards/qa/Q5.2_CARD.pt-BR.md)
- [Q5.3 Card](./cards/qa/Q5.3_CARD.pt-BR.md)
- [Q5.4 Card](./cards/qa/Q5.4_CARD.pt-BR.md)
