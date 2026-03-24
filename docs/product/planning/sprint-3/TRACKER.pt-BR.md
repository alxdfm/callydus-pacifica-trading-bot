# Sprint 3 Tracker

## Objetivo
Centralizar o acompanhamento operacional da Sprint 3 no nivel de task individual, com status, bloqueios, responsaveis e proximo passo.

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
- foco principal: dashboard funcional entregue em codigo e aguardando validacao funcional manual
- bloqueios principais: nenhum bloqueio aberto; sprint depende apenas da revisao manual do dashboard

## Owners de Fechamento Cedo
- `PO`: owner por proteger o escopo do dashboard como centro operacional e arbitrar conflitos de produto
- `Dev`: owner por implementar a tela funcional, dados operacionais e acao global do bot
- `Designer`: owner por consolidar hierarquia, leitura rapida e handoff do dashboard sem ambiguidade
- `QA`: owner por validar usabilidade, regras de negocio e estados do dashboard

## Dev
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| V3.1 | IN_REVIEW | P0 | Dev | outputs das Sprint 1 e 2 | nenhum | Validar manualmente o dashboard |
| V3.2 | IN_REVIEW | P0 | Dev | V3.1 | nenhum | Validar saldo e PnL agregados |
| V3.3 | IN_REVIEW | P0 | Dev | V3.1 | nenhum | Validar contadores operacionais |
| V3.4 | IN_REVIEW | P0 | Dev | V3.1, outputs da Sprint 2 | nenhum | Validar preset ativo e estado do bot |
| V3.5 | IN_REVIEW | P0 | Dev | V3.1 | nenhum | Validar lista resumida de trades abertos |
| V3.6 | IN_REVIEW | P1 | Dev | V3.1 | nenhum | Validar lista curta de trades recentes |
| V3.7 | IN_REVIEW | P0 | Dev | V3.1, V3.4 | nenhum | Validar alertas e acao global do bot |
| V3.8 | IN_REVIEW | P1 | Dev | V3.2, V3.3, V3.4, V3.5, V3.6, V3.7 | nenhum | Validar estados operacionais do dashboard |
| V3.9 | IN_REVIEW | P1 | Dev | V3.1, V3.2, V3.3, V3.4, V3.5, V3.6, V3.7, V3.8 | nenhum | Validar acesso ao dashboard após onboarding |

## Designer
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| D3.1 | DONE | P0 | Designer | outputs de Sprint 1 e Sprint 2 | nenhum | Validar ordem dos blocos no desktop |
| D3.2 | DONE | P0 | Designer | D3.1 | nenhum | Definir composição do header |
| D3.3 | DONE | P0 | Designer | D3.1 | nenhum | Definir hierarquia visual dos 4 cards |
| D3.4 | DONE | P0 | Designer | D3.1 | nenhum | Organizar os dados do preset ativo |
| D3.5 | DONE | P0 | Designer | D3.1 | nenhum | Desenhar lista dos trades atuais |
| D3.6 | DONE | P1 | Designer | D3.1 | nenhum | Desenhar lista compacta de trades recentes |
| D3.7 | DONE | P0 | Designer | D3.1 | nenhum | Definir visual da faixa de alertas |
| D3.8 | DONE | P1 | Designer | D3.2, D3.3, D3.4, D3.5, D3.6, D3.7 | nenhum | Revisar ordem dos blocos em mobile |
| D3.9 | DONE | P1 | Designer | D3.1, D3.2, D3.3, D3.4, D3.5, D3.6, D3.7, D3.8 | nenhum | Nomear componentes do dashboard |

## QA
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| Q3.1 | TODO | P0 | QA | D3.2 concluida, D3.3 concluida, D3.4 concluida, D3.5 concluida, D3.7 concluida, V3.4 concluida, V3.5 concluida, V3.7 concluida | nenhum | validar usabilidade do Dashboard |
| Q3.2 | TODO | P0 | QA | V3.2 concluida, V3.3 concluida, V3.4 concluida, V3.7 concluida | nenhum | validar regras de negocio do Dashboard |
| Q3.3 | TODO | P0 | QA | D3.7 concluida, V3.8 concluida, V3.9 concluida | nenhum | validar mensagens, estados e recuperacao do Dashboard |
| Q3.4 | TODO | P1 | QA | Q3.1 concluida, Q3.2 concluida, Q3.3 concluida | nenhum | consolidar o relatorio de QA da Sprint 3 |

## Regra de Controle
Uma task so pode mudar para `DONE` quando:
- [ ] o card da task estiver com checklist de entrega real concluido
- [ ] os bloqueios estiverem resolvidos ou explicitamente descartados
- [ ] os criterios de aceite da task estiverem marcados
- [ ] nao houver expansao indevida de escopo do MVP

## Cards Individuais
### Dev
- [V3.1 Card](./cards/dev/V3.1_CARD.pt-BR.md)
- [V3.2 Card](./cards/dev/V3.2_CARD.pt-BR.md)
- [V3.3 Card](./cards/dev/V3.3_CARD.pt-BR.md)
- [V3.4 Card](./cards/dev/V3.4_CARD.pt-BR.md)
- [V3.5 Card](./cards/dev/V3.5_CARD.pt-BR.md)
- [V3.6 Card](./cards/dev/V3.6_CARD.pt-BR.md)
- [V3.7 Card](./cards/dev/V3.7_CARD.pt-BR.md)
- [V3.8 Card](./cards/dev/V3.8_CARD.pt-BR.md)
- [V3.9 Card](./cards/dev/V3.9_CARD.pt-BR.md)

### Designer
- [D3.1 Card](./cards/designer/D3.1_CARD.pt-BR.md)
- [D3.2 Card](./cards/designer/D3.2_CARD.pt-BR.md)
- [D3.3 Card](./cards/designer/D3.3_CARD.pt-BR.md)
- [D3.4 Card](./cards/designer/D3.4_CARD.pt-BR.md)
- [D3.5 Card](./cards/designer/D3.5_CARD.pt-BR.md)
- [D3.6 Card](./cards/designer/D3.6_CARD.pt-BR.md)
- [D3.7 Card](./cards/designer/D3.7_CARD.pt-BR.md)
- [D3.8 Card](./cards/designer/D3.8_CARD.pt-BR.md)
- [D3.9 Card](./cards/designer/D3.9_CARD.pt-BR.md)

### QA
- [Q3.1 Card](./cards/qa/Q3.1_CARD.pt-BR.md)
- [Q3.2 Card](./cards/qa/Q3.2_CARD.pt-BR.md)
- [Q3.3 Card](./cards/qa/Q3.3_CARD.pt-BR.md)
- [Q3.4 Card](./cards/qa/Q3.4_CARD.pt-BR.md)
