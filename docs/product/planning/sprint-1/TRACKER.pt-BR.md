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
- foco principal: foundations, onboarding e i18n
- bloqueios principais: decisao de wallet Solana e contrato final das credenciais Pacifica

## Fluxo Operacional Aprovado
- design deve fechar primeiro todo o onboarding, incluindo estados criticos, microcopy e revisao mobile
- dev deve implementar em paralelo foundations, shell, i18n, estado global minimo e estrutura do onboarding com mocks e adapters locais
- implementacao funcional final de wallet e validacao Pacifica nao deve esperar o fim da UI, mas so pode fechar depois do congelamento dos contratos
- prioridade da sprint continua sendo fechar bem o onboarding sem ampliar escopo

## Owners de Fechamento Cedo
- `PO`: owner por fechar cedo as decisoes de produto e contrato necessarias para a sprint seguir sem retrabalho
- `Dev`: owner por propor rapidamente as opcoes tecnicas de wallet, persistencia e contrato de validacao para decisao
- `Designer`: owner por manter onboarding, estados e handoff prontos para execucao paralela sem depender do contrato final

## Checkpoint Obrigatorio do Inicio da Sprint
- [ ] fechar provider ou adapter da wallet Solana
- [ ] fechar persistencia minima da sessao de wallet
- [ ] fechar comportamento de erro da wallet
- [ ] fechar campos obrigatorios das credenciais Pacifica
- [ ] fechar acao que dispara a validacao
- [ ] fechar payload de sucesso
- [ ] fechar payload de erro
- [ ] fechar regra de retry versus falha bloqueante

## Dev
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| V1.1 | TODO | P0 | - | nenhuma | nenhum | iniciar shell base e rotas |
| V1.2 | TODO | P0 | - | V1.1 | nenhum | definir modelo minimo de estado global |
| V1.3 | TODO | P0 | - | V1.1, V1.2 | nenhum | montar tela de onboarding com i18n |
| V1.4 | PARTIAL | P0 | - | V1.2, V1.3 | decisao de wallet Solana | iniciar abstracao e estados de conexao |
| V1.5 | PARTIAL | P0 | - | V1.2, V1.3 | contrato final dos campos Pacifica | montar formulario com contrato provisório |
| V1.6 | BLOCKED | P0 | - | V1.5 | payload e regra de validacao Pacifica | fechar contrato tecnico antes da integracao real |

## Designer
| Task | Status | Prioridade | Owner | Dependencias | Bloqueio atual | Proximo passo |
|------|--------|------------|-------|--------------|----------------|---------------|
| D1.1 | TODO | P0 | - | nenhuma | nenhum | fechar mini sistema visual |
| D1.2 | TODO | P0 | - | D1.1 | nenhum | desenhar onboarding desktop |
| D1.3 | TODO | P0 | - | D1.1, D1.2 | nenhum | adaptar onboarding para mobile |
| D1.4 | TODO | P0 | - | D1.1, D1.2 | nenhum | fechar matriz visual da wallet |
| D1.5 | TODO | P0 | - | D1.1, D1.2 | nenhum | fechar matriz visual das credenciais |
| D1.6 | TODO | P0 | - | D1.4, D1.5 | nenhum | padronizar microcopy do onboarding |
| D1.7 | TODO | P1 | - | D1.1, D1.2, D1.3, D1.4, D1.5, D1.6 | nenhum | preparar pacote final de handoff |

## Decisoes Externas em Aberto
- [ ] congelar provider ou adapter da wallet Solana
- [ ] congelar persistencia minima da wallet
- [ ] congelar campos obrigatorios das credenciais Pacifica
- [ ] congelar payload de sucesso e erro da validacao Pacifica
- [ ] congelar regra de retry e falha bloqueante da validacao Pacifica

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
