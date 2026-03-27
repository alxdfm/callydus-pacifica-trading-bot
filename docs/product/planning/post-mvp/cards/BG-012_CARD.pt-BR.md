# BG-012 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- area: `onboarding`
- ultima atualizacao: `2026-03-26`

## Objetivo
Implementar a `operational verification` da `Agent Wallet` dentro do onboarding e tratar `operationally_verified` como gate visivel de saida para liberar a aplicacao.

## Contexto
PO decidiu que o onboarding nao deve liberar o produto apenas por verificacao superficial de assinatura ou formato. O usuario deve sair do onboarding somente quando a conta estiver operacionalmente validada, e esse check deve ser transparente na UX.

## Escopo Fechado
- implementar o passo tecnico de `operational verification` no onboarding
- refletir `operationally_verified` como estado funcional consumivel pela UI
- propor e fechar o side effect minimo aceitavel do probe operacional
- alinhar payload, resposta e erros com a integracao Pacifica
- preservar rastreabilidade do que foi executado no probe

## Fora de Escopo
- redesenho completo do onboarding
- expansao para mais de um fluxo de validacao operacional

## Dependencias
- [x] BG-011 decidido do ponto de vista de produto
- [x] alinhamento tecnico com integracao Pacifica
- [x] definicao do side effect minimo aceitavel
- [x] BG-013 com handoff de UX/copy/estados finais do onboarding

## Critérios de Aceite Iniciais
- [x] onboarding so libera a aplicacao quando `operationally_verified` for verdadeiro
- [x] existe proposta tecnica clara para o probe operacional com side effect minimo
- [x] erros, retry e sucesso ficam alinhados com o contrato do app
- [x] o estado fica auditavel para diagnostico tecnico

## Proximo Passo Recomendado
Usar o fluxo validado como base para os proximos passos do Functional MVP que dependem de conta operacionalmente pronta.

## Log de Acompanhamento
- `2026-03-26`: card criado a partir da decisao de PO de expor `operationally_verified` no onboarding como gate visivel de prontidao operacional.
- `2026-03-26`: base tecnica do `operational verification` implementada sem depender da UX final: schema Prisma estendido com campos de verificacao operacional, contrato compartilhado criado, endpoint `POST /api/onboarding/credentials/verify-operational` adicionado na API e gateway Pacifica preparado para probe `create limit order + cancel order` usando `Agent Wallet`.
- `2026-03-26`: probe operacional configurado para usar `GET /api/v1/info` como fonte de `tick_size`, `lot_size` e `min_order_size`, com `symbol`, `price` e `tif` parametrizaveis por env.
- `2026-03-26`: probe operacional refinado para usar tambem `target_notional_usd` configuravel e, na configuracao atual, tentar `BTC @ 20000 USD` com `11 USD` de notional e `TIF = ALO`, seguido de cancelamento imediato.
- `2026-03-26`: `pnpm typecheck` passou no workspace apos a implementacao tecnica; liberacao final do onboarding permanece pendente do handoff de UX do `BG-013`.
- `2026-03-26`: onboarding do app ajustado ao handoff de design de `BG-013`, com `Run readiness check` exposto como quarto passo visivel, microcopy transparente sobre `create + cancel`, CTA final bloqueado ate `operationally_verified` e mapeamento de estados `pending/verifying/verified/blocked/error` no frontend.
- `2026-03-26`: `pnpm --filter @pacifica/app build` e `pnpm typecheck` passaram apos o encaixe da UX; o card segue em `IN_REVIEW` aguardando validacao funcional manual.
- `2026-03-26`: erro real da Pacifica durante o probe operacional passou a ser mapeado explicitamente quando a `Agent Wallet` nao esta autorizada a operar em nome da conta conectada, retornando mensagem clara para o frontend em vez de cair no bloco generico de `account_blocked`.
- `2026-03-26`: validacao funcional manual concluida com sucesso; usuario confirmou conta operacionalmente aprovada apos `builder approval`, validacao da `Agent Wallet` e `Run readiness check`.
