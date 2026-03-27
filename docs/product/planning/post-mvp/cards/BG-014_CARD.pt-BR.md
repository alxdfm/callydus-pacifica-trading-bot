# BG-014 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `PO`
- area: `onboarding`
- ultima atualizacao: `2026-03-27`

## Objetivo
Melhorar o design do onboarding para deixar a sequencia de steps, a progressao e as dependencias entre etapas claramente perceptiveis para o usuario.

## Contexto
O onboarding atual nao deixa suficientemente evidente quais passos ja foram concluídos, quais ainda estao bloqueados e qual e a proxima acao esperada. Isso reduz clareza operacional justamente na etapa mais sensivel da jornada.

## Escopo Fechado
- adicionar barra de progresso ou elemento equivalente de progressao
- deixar steps futuros visiveis, mas desabilitados ate a conclusao do passo anterior
- reforcar visualmente qual step esta ativo, qual esta bloqueado e qual esta concluido
- congelar inputs de steps validados como `done`
- permitir liberar novamente um step validado por meio de acao explicita de editar
- ao editar um step concluido, voltar o fluxo para esse step especifico e exigir revalidacao das etapas dependentes

## Fora de Escopo
- redesenho estrutural completo do onboarding fora do problema de progressao
- mudanca do contrato de integracao Pacifica ou da logica de validacao em si

## Racional de Produto
- melhora a clareza do passo a passo
- reduz ambiguidade sobre o que falta fazer
- aumenta previsibilidade ao editar dados sensiveis depois de um step concluido
- protege a consistencia do fluxo quando uma etapa ja validada e alterada

## Dependencias
- alinhamento com design sobre hierarquia visual de progresso, bloqueio e conclusao
- alinhamento com dev sobre reabertura parcial de steps e invalidacao de dependencias seguintes

## Critérios de Aceite Iniciais
- existe indicacao visual clara de progresso no onboarding
- steps futuros aparecem como bloqueados ate serem liberados
- steps concluidos ficam congelados visualmente e funcionalmente
- existe acao explicita para editar um step concluido
- editar um step concluido invalida e reabre corretamente os steps dependentes
- o usuario entende sem ambiguidade qual e a proxima acao necessaria

## Proximo Passo Recomendado
Dev mapear a maquina de estados para `done/current/locked`, congelamento de steps concluídos e reabertura com invalidação de dependências conforme o handoff.

## Refinamento de Design
- barra de progresso obrigatória acima da área principal
- steps futuros visíveis, porém bloqueados
- step ativo com maior contraste visual
- step concluído congelado com ação explícita de `Edit`
- editar step concluído reabre esse ponto e invalida os passos dependentes

## Evidencia de Design
- [ONBOARDING_PROGRESS_REFERENCE.pt-BR.md](../../../../design/ONBOARDING_PROGRESS_REFERENCE.pt-BR.md)
- [SCREEN_HANDOFF.pt-BR.md](../../../../design/SCREEN_HANDOFF.pt-BR.md)
- [DESIGN_HANDOFF.pt-BR.md](../../../../design/DESIGN_HANDOFF.pt-BR.md)
- [onboarding.html](../../../../design/preview/onboarding.html)

## Log de Acompanhamento
- `2026-03-26`: card criado a partir de feedback de UX sobre baixa perceptibilidade da progressao sequencial do onboarding e necessidade de revalidacao ao editar steps concluidos.
- `2026-03-26`: handoff de design fechado com barra de progresso, estados `done/current/locked`, congelamento de steps concluídos e regra de reabertura por `Edit`.
- `2026-03-26`: implementado no app com barra de progresso lateral, steps `done/current/locked`, cards separados para wallet, builder, Agent Wallet e readiness check, inputs congelados em steps concluídos e ação explícita de `Edit` invalidando dependências seguintes conforme o handoff.
- `2026-03-26`: validacao tecnica concluida com `pnpm --filter @pacifica/app typecheck` e `pnpm --filter @pacifica/app build`; pendente apenas walkthrough funcional manual para fechamento de aceite.
- `2026-03-27`: refinamentos finais de UX absorvidos no proprio `BG-014`, sem criar novos cards: onboarding passou a usar shell dedicada sem sidebar global, foco em um step por vez, navegacao lateral com highlight e scroll, remocao de blocos redundantes de bloqueio/CTA, copy reconciliada com o handoff e modal de boas-vindas no dashboard apenas na primeira entrada apos onboarding aprovado.
- `2026-03-27`: aceite consolidado como `DONE` para registro do backlog, com as iteracoes finais de UX tratadas como fechamento da mesma task e nao como expansao de escopo.
- `2026-03-27`: refinamentos finais adicionais absorvidos no mesmo card: responsividade do onboarding revisada para tablet/mobile, navegacao lateral corrigida para permitir retorno manual ao step 1 e avancar automaticamente apenas quando o fluxo realmente progride, e modal de boas-vindas sem badge de confirmacao incongruente.
