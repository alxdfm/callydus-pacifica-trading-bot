# Sprint 2 Tracker

## Objetivo
Centralizar o acompanhamento operacional da Sprint 2 no nivel de task individual, com status, bloqueios, responsaveis e proximo passo.

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
- foco principal: revisao funcional do fluxo de presets e validacao do preset ativo persistido
- bloqueios principais: nenhum bloqueio aberto de produto ou design; implementacao base da Sprint 2 concluida em codigo

## Owners de Fechamento Cedo
- `PO`: owner por proteger o escopo do MVP, garantir que apenas campos permitidos sejam editaveis e arbitrar conflitos de produto
- `Dev`: owner por implementar a tela funcional, o payload de ativacao e a persistencia do preset ativo
- `Designer`: owner por consolidar comparacao, revisao, ativacao e handoff de presets sem ambiguidade
- `QA`: owner por validar usabilidade, regras de negocio e estados do fluxo de escolha e ativacao do preset

## Dev
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| V2.1 | IN_REVIEW | P0 | Dev | outputs da Sprint 1 | nenhum | validar manualmente a estrutura base da tela de presets |
| V2.2 | IN_REVIEW | P0 | Dev | V2.1 | nenhum | validar catalogo final dos 3 presets no browser |
| V2.3 | IN_REVIEW | P0 | Dev | V2.2 | nenhum | validar selecao funcional e destaque visual do preset |
| V2.4 | IN_REVIEW | P0 | Dev | V2.2 | nenhum | validar comparador resumido desktop e mobile |
| V2.5 | IN_REVIEW | P0 | Dev | V2.3 | nenhum | validar painel de revisao e campos permitidos |
| V2.6 | IN_REVIEW | P0 | Dev | V2.5 | nenhum | validar payload final de ativacao com overrides permitidos |
| V2.7 | IN_REVIEW | P0 | Dev | V2.6 | nenhum | validar estados de loading, sucesso e erro da ativacao |
| V2.8 | IN_REVIEW | P1 | Dev | V2.7 | nenhum | validar persistencia do preset ativo e reflexo no app |
| V2.9 | IN_REVIEW | P1 | Dev | V2.1, V2.2, V2.3, V2.4, V2.5, V2.6, V2.7, V2.8 | nenhum | executar validacao ponta a ponta da Sprint 2 |

## Designer
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| D2.1 | DONE | P0 | Designer | outputs da Sprint 1 | nenhum | usar a estrutura consolidada para destravar implementacao e QA |
| D2.2 | DONE | P0 | Designer | D2.1 | nenhum | usar o card `Safer` consolidado como referencia de implementacao |
| D2.3 | DONE | P0 | Designer | D2.1 | nenhum | usar o card `Balanced` consolidado como referencia central |
| D2.4 | DONE | P0 | Designer | D2.1 | nenhum | usar o card `More active` consolidado sem ambiguidade de risco |
| D2.5 | DONE | P0 | Designer | D2.2, D2.3, D2.4 | nenhum | usar o comparador consolidado como referencia de implementacao |
| D2.6 | DONE | P0 | Designer | D2.5 | nenhum | usar o painel de revisao consolidado como referencia de implementacao |
| D2.7 | DONE | P0 | Designer | D2.6 | nenhum | usar o bloco de ativacao e a matriz do CTA como referencia |
| D2.8 | DONE | P1 | Designer | D2.2, D2.3, D2.4, D2.5, D2.6, D2.7 | nenhum | acompanhar aderencia mobile na UI real |
| D2.9 | DONE | P1 | Designer | D2.1, D2.2, D2.3, D2.4, D2.5, D2.6, D2.7, D2.8 | nenhum | manter o handoff de presets como fonte de verdade para dev e QA |

## QA
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| Q2.1 | TODO | P0 | QA | D2.5, D2.6, D2.7, V2.4, V2.5, V2.7 | nenhum | validar usabilidade do fluxo de escolha, revisao e ativacao |
| Q2.2 | TODO | P0 | QA | V2.6, V2.7, V2.8 | nenhum | validar regras de negocio, payload e persistencia do preset ativo |
| Q2.3 | TODO | P0 | QA | D2.7, V2.7, V2.8, V2.9 | nenhum | validar estados, mensagens e recuperacao do fluxo |
| Q2.4 | TODO | P1 | QA | Q2.1, Q2.2, Q2.3 | nenhum | consolidar relatorio de QA da Sprint 2 |

## Regra de Controle
Uma task so pode mudar para `DONE` quando:
- [ ] o card da task estiver com checklist de entrega real concluido
- [ ] os bloqueios estiverem resolvidos ou explicitamente descartados
- [ ] os criterios de aceite da task estiverem marcados
- [ ] nao houver expansao indevida de escopo do MVP

## Cards Individuais
### Dev
- [V2.1 Card](./cards/dev/V2.1_CARD.pt-BR.md)
- [V2.2 Card](./cards/dev/V2.2_CARD.pt-BR.md)
- [V2.3 Card](./cards/dev/V2.3_CARD.pt-BR.md)
- [V2.4 Card](./cards/dev/V2.4_CARD.pt-BR.md)
- [V2.5 Card](./cards/dev/V2.5_CARD.pt-BR.md)
- [V2.6 Card](./cards/dev/V2.6_CARD.pt-BR.md)
- [V2.7 Card](./cards/dev/V2.7_CARD.pt-BR.md)
- [V2.8 Card](./cards/dev/V2.8_CARD.pt-BR.md)
- [V2.9 Card](./cards/dev/V2.9_CARD.pt-BR.md)

### Designer
- [D2.1 Card](./cards/designer/D2.1_CARD.pt-BR.md)
- [D2.2 Card](./cards/designer/D2.2_CARD.pt-BR.md)
- [D2.3 Card](./cards/designer/D2.3_CARD.pt-BR.md)
- [D2.4 Card](./cards/designer/D2.4_CARD.pt-BR.md)
- [D2.5 Card](./cards/designer/D2.5_CARD.pt-BR.md)
- [D2.6 Card](./cards/designer/D2.6_CARD.pt-BR.md)
- [D2.7 Card](./cards/designer/D2.7_CARD.pt-BR.md)
- [D2.8 Card](./cards/designer/D2.8_CARD.pt-BR.md)
- [D2.9 Card](./cards/designer/D2.9_CARD.pt-BR.md)

### QA
- [Q2.1 Card](./cards/qa/Q2.1_CARD.pt-BR.md)
- [Q2.2 Card](./cards/qa/Q2.2_CARD.pt-BR.md)
- [Q2.3 Card](./cards/qa/Q2.3_CARD.pt-BR.md)
- [Q2.4 Card](./cards/qa/Q2.4_CARD.pt-BR.md)
