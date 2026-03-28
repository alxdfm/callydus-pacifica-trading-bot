# BG-021 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `Designer`
- area: `profile`
- ultima atualizacao: `2026-03-28`

## Objetivo
Revisar a UX do `Profile` para refletir manutencao recorrente de conta, impacto de bloqueio operacional e revalidacao critica da `Agent Wallet` com clareza para usuario nao tecnico.

## Contexto
O `Profile` nao pode parecer um onboarding reaberto, mas agora precisa comunicar um fluxo critico quando a `Agent Wallet` for alterada:
- conta pode ficar temporariamente bloqueada
- a operacao precisa parar ou permanecer indisponivel
- `Main wallet` nao e editavel
- existe acao de `deslogar`

## Escopo Fechado
- reforcar visualmente que `Profile` e manutencao recorrente, nao setup inicial
- definir o bloco e a copy da acao de `deslogar`
- definir como comunicar que `Main wallet` e identidade readonly
- definir estados de bloqueio quando o bot estiver rodando e a `Agent Wallet` nao puder ser editada
- definir estados de impacto quando a edicao da `Agent Wallet` exigir nova validacao + novo `operational verification`
- alinhar handoff para dev e QA

## Fora de Escopo
- redesign estrutural completo da tela
- pagina inicial pos-logout
- novos fluxos fora do escopo de manutencao de conta

## Dependencias
- [x] BG-018 validado como direcao de produto
- [x] proposta tecnica inicial de dev para bloqueio de operacao e revalidacao critica

## Critérios de Aceite Iniciais
- [x] o usuario entende que `Profile` e manutencao recorrente, nao onboarding
- [x] `Main wallet` aparece como identidade da conta, sem expectativa de edicao
- [x] `deslogar` aparece como acao distinta e compreensivel
- [x] a UX deixa claro quando a `Agent Wallet` nao pode ser editada por causa de bot rodando
- [x] a UX deixa claro que editar `Agent Wallet` reabre validacao e bloqueia operacao ate nova verificacao
- [x] estados e mensagens deixam a proxima acao evidente

## Proximo Passo Recomendado
Designer fechar copy, estados e hierarquia visual do `Profile` para o fluxo critico de manutencao da `Agent Wallet` e logout da sessao atual.

## Log de Acompanhamento
- `2026-03-27`: card criado a partir do `BG-018` para transformar o remapeamento de `Profile` em trilha explicita de UX e handoff.
- `2026-03-27`: referencia de design, handoff e preview de `Profile` atualizados com `Log out`, `Main wallet` como identidade readonly, bloqueio de edicao critica com bot rodando e impacto de revalidacao + `operational verification`.
- `2026-03-28`: UX do modal de `Replace Agent Wallet` refinada no app: copy e semantica deixaram de usar `Edit` e passaram para `Replace`, o fluxo ficou reduzido a `Stop bot -> Validate Agent Wallet -> Run readiness check`, estados de sucesso/erro ficaram mais explicitos e a private key passou a ser mascarada apos validacao ou conclusao.
- `2026-03-28`: feedback de logout consolidado na UX do `Profile`: o fluxo segue simples para o usuario, mas o comportamento tecnico agora limpa tambem a chave `walletName` do `wallet-adapter-react` para evitar reconexao automatica indevida ao retornar para o onboarding.
- `2026-03-28`: fechamento operacional do `Profile` validado. A UX final preserva manutencao recorrente, diferencia claramente `Main wallet` de `Agent Wallet`, explica bloqueio critico com bot rodando e deixa o proximo passo evidente durante revalidacao.
