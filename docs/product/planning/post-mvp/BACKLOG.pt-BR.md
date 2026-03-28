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
| BG-014 | DONE | ajuste de UX | P0 | onboarding | melhorar a condução sequencial do onboarding com barra de progresso, steps bloqueados e revalidacao ao editar | concluido com refinamento final do fluxo focado por step, navegacao lateral e fechamento de UX do onboarding |
| BG-015 | DONE | ajuste de UX | P0 | onboarding | ramificar o step 1 por `walletAddress`: conta existente vai direto ao dashboard; conta nova revela os proximos steps | decisao absorvida no onboarding real com bifurcacao logo apos conectar a wallet |
| BG-016 | DONE | implementacao | P0 | onboarding | implementar lookup de `OperationalAccount` por `walletAddress` e redirecionamento condicional apos conectar a wallet | concluido com lookup backend, bifurcacao do step 1 e supressao do modal para conta existente |
| BG-017 | DONE | ajuste de UX | P0 | onboarding | revisar o onboarding para mostrar apenas o step 1 inicialmente e revelar os proximos apenas para conta nova | concluido com menu lateral progressivo e ausencia de boas-vindas para conta existente |
| BG-018 | DONE | ajuste de UX | P0 | profile | remapear `Profile` sequencialmente para logout, bloqueio de edicao critica e revalidacao operacional da `Agent Wallet` | direcao absorvida no `Profile` real por meio de `BG-020` e `BG-021` |
| BG-019 | TODO | ajuste de UX | P1 | navegacao | redirecionar o `deslogar` para a pagina inicial quando ela existir | manter aberto ate a existencia da pagina inicial e ligar o redirect no fluxo de logout |
| BG-020 | DONE | implementacao | P0 | profile | implementar remapeamento funcional do `Profile` para logout, bloqueio de edicao critica e revalidacao operacional da `Agent Wallet` | concluido no app; backlog residual segue separado em `BG-019` e `BG-022` |
| BG-021 | DONE | ajuste de UX | P0 | profile | revisar UX do `Profile` para refletir manutencao recorrente, impacto de bloqueio e revalidacao critica da `Agent Wallet` | concluido com copy, estados e fluxo final aplicados no `Profile` real |
| BG-022 | TODO | bug | P1 | profile | corrigir alias desatualizado ao reutilizar credencial antiga `replaced` no fluxo de `Replace Agent Wallet` | refinar regra de produto para alias em credencial reaproveitada antes de ajustar `/validate` ou persistencia |

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
- [BG-014 Card](./cards/BG-014_CARD.pt-BR.md)
- [BG-015 Card](./cards/BG-015_CARD.pt-BR.md)
- [BG-016 Card](./cards/BG-016_CARD.pt-BR.md)
- [BG-017 Card](./cards/BG-017_CARD.pt-BR.md)
- [BG-018 Card](./cards/BG-018_CARD.pt-BR.md)
- [BG-019 Card](./cards/BG-019_CARD.pt-BR.md)
- [BG-020 Card](./cards/BG-020_CARD.pt-BR.md)
- [BG-021 Card](./cards/BG-021_CARD.pt-BR.md)
- [BG-022 Card](./cards/BG-022_CARD.pt-BR.md)

## Debt Arquitetural
Trilha separada para refatoracoes estruturais, consolidacao de fluxo, fortalecimento de boundaries e cobertura automatizada. Esses itens nao competem diretamente com backlog funcional/UX e devem ser puxados quando o slice correspondente estiver funcionalmente estavel.

| ID | Status | Tipo | Prioridade | Area | Resumo | Proximo passo |
|----|--------|------|------------|------|--------|---------------|
| AR-001 | TODO | architectural refactoring | P1 | frontend / seguranca | remover `agentWalletPrivateKey` do estado global em memoria | executar depois que onboarding/profile estiverem estabilizados e com testes minimos |
| AR-002 | TODO | architectural refactoring | P1 | frontend / fluxo | consolidar fluxo compartilhado de validacao e readiness entre onboarding e profile | extrair maquina de estados/hook compartilhado de `validate + readiness` |
| AR-003 | TODO | architectural refactoring | P2 | frontend / onboarding | decompor `OnboardingPage` por dominio e passo | quebrar renderizacao, handlers e transicoes em modulos menores |
| AR-004 | TODO | architectural refactoring | P1 | testes | criar cobertura automatizada para onboarding e profile nos fluxos de credencial | adicionar testes de contrato e fluxo antes das refatoracoes maiores |

## Cards de Debt Arquitetural
- [AR-001 Card](./cards/dev/ar/AR-001_CARD.pt-BR.md)
- [AR-002 Card](./cards/dev/ar/AR-002_CARD.pt-BR.md)
- [AR-003 Card](./cards/dev/ar/AR-003_CARD.pt-BR.md)
- [AR-004 Card](./cards/dev/ar/AR-004_CARD.pt-BR.md)
