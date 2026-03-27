# Referencia de Progressao do Onboarding

## Objetivo
Congelar a hierarquia visual de progresso, bloqueio, conclusao e reabertura parcial dos steps do onboarding.

## Estrutura de Progresso
- o onboarding expõe todos os steps futuros desde o início
- apenas um step fica `current` por vez
- steps futuros ficam visíveis, mas `locked`
- steps concluídos ficam `done` e congelados visualmente
- steps independentes devem aparecer em cards próprios quando forem ações distintas; não colapsar `Step 1` e `Step 2` no mesmo bloco principal
- quando a clareza sequencial for prioridade, preferir disposição vertical direta `1 > 2 > 3 > 4`
- no fluxo implementado, a lateral funciona como seletor de step e a área principal mostra um único step ativo por vez

## Estados de Step

### `Locked`
- aparece antes da liberação do step anterior
- card visível, porém desabilitado
- inputs indisponíveis
- CTA principal desabilitado
- microcopy curta explica o que falta liberar

### `Current`
- step ativo da vez
- maior contraste visual
- inputs habilitados
- CTA primário disponível conforme os pré-requisitos locais
- helper text e feedback de validação aparecem neste step

### `Done`
- step validado com sucesso
- inputs ficam congelados
- status de sucesso fica visível sem depender só de cor
- existe ação explícita de `Edit` para reabrir o step

## Barra de Progresso
- usar barra ou indicador equivalente no topo da experiência
- a barra reflete progresso concluído, não apenas step atual
- o texto ao lado deve combinar índice e clareza de jornada:
  - exemplo: `2 of 4 steps completed`

## Cadeia de Dependência
1. `Connect wallet`
2. `Approve builder code`
3. `Validate Agent Wallet`
4. `Run readiness check`

Regra:
- nenhum step posterior pode parecer disponível antes de o step anterior concluir

## Regra de Reabertura por Edição

### Editar `Connect wallet`
- reabre o step 1
- invalida steps 2, 3 e 4

### Editar `Approve builder code`
- reabre o step 2
- invalida steps 3 e 4

### Editar `Agent Wallet`
- reabre o step 3
- invalida step 4

### Editar `Run readiness check`
- reabre apenas o step 4
- não invalida os steps anteriores

## Regras de UX
- a ação `Edit` precisa ser explícita, nunca implícita por clique acidental no card
- reabrir um step concluído deve avisar que etapas dependentes precisarão ser validadas novamente
- steps `done` devem parecer estáveis, não editáveis por padrão
- steps `locked` devem orientar o próximo desbloqueio, não apenas parecer indisponíveis
- o CTA final só aparece como liberado quando o step 4 estiver `done`
- cada card principal do grid deve deixar claro qual step representa, com label e título do próprio step
- quando houver step selector lateral, o item selecionado precisa ter destaque inequívoco e o conteúdo principal não deve misturar múltiplos steps

## Naming Recomendado
- `Connect wallet`
- `Approve builder code`
- `Validate Agent Wallet`
- `Run readiness check`
- ação secundária para reabrir step concluído: `Edit`

## QA
- validar se o usuário identifica rapidamente `done`, `current` e `locked`
- validar se o step ativo é sempre inequívoco
- validar se steps futuros desabilitados não parecem quebrados
- validar se editar um step concluído reabre e invalida corretamente as dependências visuais
- validar se o CTA final permanece bloqueado até o último step concluir

## Referencias
- [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
- [DESIGN_HANDOFF.pt-BR.md](./DESIGN_HANDOFF.pt-BR.md)
- [preview/onboarding.html](./preview/onboarding.html)
