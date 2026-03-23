# Sprint 1 Tracker

## Objetivo
Centralizar o acompanhamento operacional da Sprint 1 no nivel de task individual, com status, bloqueios, responsaveis e proximo passo.

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
- foco principal: onboarding funcional, aderencia ao handoff visual e validacao manual
- bloqueios principais: nenhum bloqueio aberto de contrato; foco atual e reconciliacao do app com `docs/design/preview` e validacao funcional real

## Fluxo Operacional Aprovado
- design deve fechar primeiro todo o onboarding, incluindo estados criticos, microcopy e revisao mobile
- dev deve implementar em paralelo foundations, shell, i18n, estado global minimo e estrutura do onboarding com mocks e adapters locais
- implementacao funcional final de wallet e validacao Pacifica nao deve esperar o fim da UI, mas so pode fechar depois do congelamento dos contratos
- prioridade da sprint continua sendo fechar bem o onboarding sem ampliar escopo

## Owners de Fechamento Cedo
- `PO`: owner por proteger o escopo do MVP, validar clareza do onboarding e arbitrar qualquer conflito novo de produto
- `Dev`: owner por executar o contrato tecnico fechado de wallet, `Agent Wallet`, persistencia e validacao Pacifica
- `Designer`: owner por ajustar onboarding, estados, microcopy e handoff ao contrato final aprovado
- `QA`: owner por validar usabilidade, regras de negocio, estados criticos e evidencias acionaveis da Sprint 1

## Checkpoint Obrigatorio do Inicio da Sprint
- [x] fechar provider ou adapter da wallet Solana
- [x] fechar persistencia minima da sessao de wallet
- [x] fechar comportamento de erro da wallet
- [x] fechar campos obrigatorios das credenciais Pacifica
- [x] fechar acao que dispara a validacao
- [x] fechar payload de sucesso
- [x] fechar payload de erro
- [x] fechar regra de retry versus falha bloqueante

## Dev
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| V1.1 | DONE | P0 | Dev | nenhuma | nenhum | seguir para V1.2 com estado global minimo e guards |
| V1.2 | DONE | P0 | Dev | V1.1 | nenhum | seguir para V1.3 com a UI de onboarding consumindo a store global |
| V1.3 | DONE | P0 | Dev | V1.1, V1.2 | nenhum | seguir para V1.4 integrando o adapter de wallet na UI ja estruturada |
| V1.4 | IN_REVIEW | P0 | Dev | V1.2, V1.3 | nenhum | executar teste funcional manual com Phantom no onboarding ja alinhado ao preview |
| V1.5 | IN_REVIEW | P0 | Dev | V1.2, V1.3 | nenhum | executar teste funcional manual do formulario de `Agent Wallet` no layout final da sprint |
| V1.6 | IN_REVIEW | P0 | Dev | V1.5 | nenhum | executar teste funcional completo de validacao e liberacao do dashboard no fluxo final de onboarding |

## Designer
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| D1.1 | DONE | P0 | Designer | nenhuma | nenhum | usar o sistema visual como base de implementacao e QA |
| D1.2 | DONE | P0 | Designer | D1.1 | nenhum | usar o onboarding desktop consolidado como base de implementacao |
| D1.3 | DONE | P0 | Designer | D1.1, D1.2 | nenhum | acompanhar aderencia mobile na implementacao real |
| D1.4 | DONE | P0 | Designer | D1.1, D1.2 | nenhum | usar matriz de estados da wallet como referencia de implementacao e QA |
| D1.5 | DONE | P0 | Designer | D1.1, D1.2 | nenhum | usar estados e campos de `Agent Wallet` como referencia operacional |
| D1.6 | DONE | P0 | Designer | D1.4, D1.5 | nenhum | usar microcopy consolidada como base de i18n do onboarding |
| D1.7 | DONE | P1 | Designer | D1.1, D1.2, D1.3, D1.4, D1.5, D1.6 | nenhum | manter handoff como fonte de verdade para dev e QA |

## QA
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| Q1.1 | TODO | P0 | QA | D1.5, D1.6, V1.3, V1.5 | nenhum | validar usabilidade e confianca do onboarding |
| Q1.2 | TODO | P0 | QA | V1.4, V1.5, V1.6 | nenhum | validar regras de bloqueio e liberacao do produto |
| Q1.3 | TODO | P0 | QA | D1.4, D1.5, D1.6, V1.4, V1.5, V1.6 | nenhum | validar estados, mensagens e recuperacao |
| Q1.4 | TODO | P1 | QA | Q1.1, Q1.2, Q1.3 | nenhum | consolidar relatorio de QA da Sprint 1 |

## Decisao de Produto Fechada
- [x] `Agent Wallet` aprovado como contrato oficial de credenciais do MVP

## Decisoes Externas em Aberto
- [x] congelar provider ou adapter da wallet Solana
- [x] congelar persistencia minima da wallet
- [x] congelar campos obrigatorios das credenciais Pacifica
- [x] congelar payload de sucesso e erro da validacao Pacifica
- [x] congelar regra de retry e falha bloqueante da validacao Pacifica

## Regra de Controle
Uma task so pode mudar para `DONE` quando:
- [ ] o card da task estiver com checklist de entrega real concluido
- [ ] os bloqueios estiverem resolvidos ou explicitamente descartados
- [ ] os criterios de aceite da task estiverem marcados
- [ ] nao houver expansao indevida de escopo do MVP

## Cards Individuais
### Dev
- [V1.1 Card](./cards/dev/V1.1_CARD.pt-BR.md)
- [V1.2 Card](./cards/dev/V1.2_CARD.pt-BR.md)
- [V1.3 Card](./cards/dev/V1.3_CARD.pt-BR.md)
- [V1.4 Card](./cards/dev/V1.4_CARD.pt-BR.md)
- [V1.5 Card](./cards/dev/V1.5_CARD.pt-BR.md)
- [V1.6 Card](./cards/dev/V1.6_CARD.pt-BR.md)

### Designer
- [D1.1 Card](./cards/designer/D1.1_CARD.pt-BR.md)
- [D1.2 Card](./cards/designer/D1.2_CARD.pt-BR.md)
- [D1.3 Card](./cards/designer/D1.3_CARD.pt-BR.md)
- [D1.4 Card](./cards/designer/D1.4_CARD.pt-BR.md)
- [D1.5 Card](./cards/designer/D1.5_CARD.pt-BR.md)
- [D1.6 Card](./cards/designer/D1.6_CARD.pt-BR.md)
- [D1.7 Card](./cards/designer/D1.7_CARD.pt-BR.md)

### QA
- [Q1.1 Card](./cards/qa/Q1.1_CARD.pt-BR.md)
- [Q1.2 Card](./cards/qa/Q1.2_CARD.pt-BR.md)
- [Q1.3 Card](./cards/qa/Q1.3_CARD.pt-BR.md)
- [Q1.4 Card](./cards/qa/Q1.4_CARD.pt-BR.md)
