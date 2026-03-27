# Backlog Pos-MVP

## Objetivo
Centralizar melhorias, ajustes de UX e mudancas de escopo identificadas apos o fechamento do MVP demonstravel, sem perder rastreabilidade por item.

## Como Usar
- registrar cada novo item como card individual
- classificar o item entre `bug`, `melhoria`, `ajuste de UX` ou `mudanca de escopo`
- manter prioridade e racional explicitos
- usar este backlog como fila de refinamento do proximo slice

## Itens Abertos
| ID | Status | Tipo | Prioridade | Area | Resumo | Proximo passo |
|----|--------|------|------------|------|--------|---------------|
| BG-001 | DONE | ajuste de UX | P1 | shell | fixar a lateral esquerda e deixar o scroll apenas no conteudo principal | concluido na shell compartilhada e assumido como baseline da navegacao |
| BG-002 | DONE | melhoria | P1 | branding | trocar bloco textual da lateral por logo + nome `callydus` | concluido no app e sincronizado com a shell atual |
| BG-003 | DONE | ajuste de UX | P1 | navegacao | remover `Onboarding` da navegacao depois da conclusao do setup | concluido com regra de exibicao por estado da conta |
| BG-004 | DONE | mudanca de escopo | P1 | conta | criar pagina `Profile` para edicao posterior de dados da conta | concluido com rota dedicada e recorte minimo de manutencao definido |
| BG-005 | DONE | ajuste de UX | P1 | presets | aumentar transparencia das estrategias com gatilhos detalhados via disclosure informativo | concluido com disclosure aplicado no fluxo de presets |
| BG-006 | DONE | melhoria | P2 | design system | aplicar cursor default em todos os textos nao interativos | concluido como regra transversal de UI |
| BG-007 | DONE | ajuste de UX | P1 | presets | trocar `Symbol` de campo livre para `select` com symbols predefinidos | concluido com seletor guiado no fluxo de presets |
| BG-008 | DONE | ajuste de UX | P1 | trades/history | reforcar estado visual de item selecionado e vinculo com painel lateral | concluido com feedback mestre-detalhe nas telas operacionais |
| BG-009 | DONE | ajuste de UX | P0 | interacoes | substituir `alert` do navegador por modal de confirmacao nas acoes | concluido nas acoes sensiveis mapeadas no app |
| BG-010 | DONE | mudanca de escopo | P1 | integracao pacifica | refinar e fechar o formato canonico de assinatura dos endpoints assinados da Pacifica | decisao absorvida como baseline tecnica atual da integracao Pacifica |
| BG-011 | DONE | decisao em aberto | P0 | integracao pacifica | expor `operationally_verified` no onboarding como gate visivel de prontidao operacional | decisao fechada: onboarding usa probe controlado e gate final unico de readiness |
| BG-012 | DONE | implementacao | P0 | onboarding | implementar `operational verification` da Agent Wallet no onboarding com gate `operationally_verified` | concluido e validado manualmente no fluxo completo |
| BG-013 | DONE | ajuste de UX | P0 | onboarding | revisar UX, copy e estados do onboarding para o gate `operationally_verified` | handoff aplicado e validado no onboarding real |

## Cards
- [BG-001 Card](./cards/BG-001_CARD.pt-BR.md)
- [BG-002 Card](./cards/BG-002_CARD.pt-BR.md)
- [BG-003 Card](./cards/BG-003_CARD.pt-BR.md)
- [BG-004 Card](./cards/BG-004_CARD.pt-BR.md)
- [BG-005 Card](./cards/BG-005_CARD.pt-BR.md)
- [BG-006 Card](./cards/BG-006_CARD.pt-BR.md)
- [BG-007 Card](./cards/BG-007_CARD.pt-BR.md)
- [BG-008 Card](./cards/BG-008_CARD.pt-BR.md)
- [BG-009 Card](./cards/BG-009_CARD.pt-BR.md)
- [BG-010 Card](./cards/BG-010_CARD.pt-BR.md)
- [BG-011 Card](./cards/BG-011_CARD.pt-BR.md)
- [BG-012 Card](./cards/BG-012_CARD.pt-BR.md)
- [BG-013 Card](./cards/BG-013_CARD.pt-BR.md)
