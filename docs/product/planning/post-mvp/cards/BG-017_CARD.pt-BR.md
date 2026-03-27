# BG-017 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `Designer`
- area: `onboarding`
- ultima atualizacao: `2026-03-27`

## Objetivo
Revisar o comportamento visual do onboarding para mostrar apenas o `step 1` inicialmente e revelar os proximos passos apenas quando a wallet conectada nao tiver conta existente.

## Contexto
PO definiu que a jornada deve se adaptar ao resultado do lookup da wallet: usuario recorrente nao deve rever o fluxo de onboarding, enquanto usuario novo deve enxergar os proximos passos somente depois da confirmacao de que precisa continuar.

## Escopo Fechado
- mostrar apenas o `step 1` no menu lateral ao abrir o onboarding
- definir o reveal progressivo dos demais steps para conta nova
- definir como o loading de descoberta de conta aparece apos conectar wallet
- remover qualquer tom de boas-vindas ou onboarding completo para conta existente
- alinhar handoff para dev e QA sobre os dois caminhos de jornada

## Fora de Escopo
- redesenho estrutural completo do onboarding
- mudanca de copy fora do problema de descoberta da conta

## Dependencias
- [x] BG-015 decidido do ponto de vista de produto
- [x] proposta tecnica inicial de dev para lookup e desvio de jornada

## Critérios de Aceite Iniciais
- [x] usuario entende que o primeiro passo e apenas conectar a wallet
- [x] conta nova passa a enxergar os proximos steps no momento correto
- [x] conta existente nao recebe sinais visuais de onboarding que nao precisara executar
- [x] os dois caminhos ficam claros e consistentes para dev e QA

## Proximo Passo Recomendado
Manter o onboarding atual como baseline visual para a bifurcacao entre conta existente e conta nova.

## Log de Acompanhamento
- `2026-03-27`: card criado a partir do refinamento de PO para adaptar o onboarding a conta existente versus conta nova logo apos a conexao da wallet.
- `2026-03-27`: comportamento visual aplicado no onboarding real. O menu lateral mostra apenas o step 1 inicialmente e revela os demais apenas para conta nova.
