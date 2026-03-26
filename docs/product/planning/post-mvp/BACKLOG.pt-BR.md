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
| BG-001 | IN_REVIEW | ajuste de UX | P1 | shell | fixar a lateral esquerda e deixar o scroll apenas no conteudo principal | validar comportamento manualmente nas telas principais |
| BG-002 | IN_REVIEW | melhoria | P1 | branding | trocar bloco textual da lateral por logo + nome `callydus` | validar lockup final da marca implementado na shell |
| BG-003 | IN_REVIEW | ajuste de UX | P1 | navegacao | remover `Onboarding` da navegacao depois da conclusao do setup | validar regra de exibicao por estado da conta |
| BG-004 | IN_REVIEW | mudanca de escopo | P1 | conta | criar pagina `Profile` para edicao posterior de dados da conta | validar manualmente a nova rota e o recorte minimo de manutencao |
| BG-005 | IN_REVIEW | ajuste de UX | P1 | presets | aumentar transparencia das estrategias com gatilhos detalhados via disclosure informativo | validar copy atual e decidir se precisa refinamento com design |
| BG-006 | IN_REVIEW | melhoria | P2 | design system | aplicar cursor default em todos os textos nao interativos | validar como regra transversal de UI |
| BG-007 | IN_REVIEW | ajuste de UX | P1 | presets | trocar `Symbol` de campo livre para `select` com symbols predefinidos | validar lista inicial de symbols usada no MVP |
| BG-008 | IN_REVIEW | ajuste de UX | P1 | trades/history | reforcar estado visual de item selecionado e vinculo com painel lateral | validar feedback mestre-detalhe em trades e history |
| BG-009 | IN_REVIEW | ajuste de UX | P0 | interacoes | substituir `alert` do navegador por modal de confirmacao nas acoes | validar modal de confirmacao nas acoes sensiveis |
| BG-010 | TODO | mudanca de escopo | P1 | integracao pacifica | refinar e fechar o formato canonico de assinatura dos endpoints assinados da Pacifica | PO decidir com dev se o fallback atual vira regra temporaria, definitiva ou se exige alinhamento externo com a Pacifica |
| BG-011 | TODO | mudanca de escopo | P0 | integracao pacifica | refinar estrategia de `operational verification` da `Agent Wallet` antes de liberar o bot | PO decidir se o produto aceita probe com side effect controlado e em que momento isso acontece |

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
