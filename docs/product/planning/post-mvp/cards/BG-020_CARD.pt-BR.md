# BG-020 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- area: `profile`
- ultima atualizacao: `2026-03-28`

## Objetivo
Implementar o remapeamento funcional do `Profile`, tratando logout, bloqueio de edicao critica e revalidacao operacional da `Agent Wallet` sem reabrir o onboarding.

## Contexto
O `Profile` ja existe como baseline, mas agora precisa refletir regras operacionais novas:
- `Main wallet` nao pode ser trocada na tela
- `deslogar` deve encerrar a sessao atual limpando o estado persistido local
- editar `Agent Wallet` e fluxo critico
- `Agent Wallet` nao pode ser editada com bot rodando
- apos editar `Agent Wallet`, a conta precisa voltar para nova validacao + novo `operational verification`
- o usuario nao pode iniciar novo bot enquanto a conta nao recuperar `operationally_verified`

## Escopo Fechado
- remover qualquer affordance de troca de `Main wallet` dentro do `Profile`
- implementar acao de `deslogar` no comportamento atual do produto
- bloquear edicao de `Agent Wallet` se houver bot rodando
- ao editar `Agent Wallet`, invalidar prontidao operacional atual
- reabrir validacao da `Agent Wallet` e `operational verification`
- bloquear `start bot` e demais acoes dependentes enquanto a conta estiver sem nova verificacao operacional
- manter `credentialAlias` como alteracao leve, sem reabrir fluxo critico

## Fora de Escopo
- redirect final do logout para pagina inicial futura
- mudanca do onboarding base
- troca de identidade de conta dentro da mesma tela

## Dependencias
- [x] BG-018 validado como direcao de produto
- [x] alinhamento com runtime sobre criterio de bot rodando
- [x] alinhamento com design sobre estados e mensagens do bloqueio

## Critérios de Aceite Iniciais
- [x] `Main wallet` nao pode ser editada no `Profile`
- [x] `deslogar` limpa o estado persistido local da sessao atual
- [x] `Agent Wallet` nao pode ser editada se houver bot rodando
- [x] editar `Agent Wallet` reabre validacao e `operational verification`
- [x] o usuario nao consegue iniciar novo bot enquanto a conta estiver sem nova verificacao completa
- [x] o fluxo nao reapresenta onboarding inteiro dentro de `Profile`

## Proximo Passo Recomendado
Dev mapear os pontos de bloqueio do runtime e encaixar o fluxo critico de revalidacao dentro do `Profile` sem misturar manutencao recorrente com onboarding.

## Log de Acompanhamento
- `2026-03-27`: card criado a partir do `BG-018` para transformar o remapeamento de `Profile` em trilha funcional de desenvolvimento.
- `2026-03-27`: implementado no app com base no handoff de `Profile`: `Main wallet` readonly sem affordance de troca, `Log out` com limpeza da sessao local no dispositivo, bloqueio de edicao critica da `Agent Wallet` com bot rodando, fluxo interno de manutencao critica sem reabrir onboarding e bloqueio de `start bot` / ativacao de preset enquanto a conta nao recuperar `operational verification`.
- `2026-03-28`: fluxo do `Profile` refinado para linguagem e comportamento de `Replace Agent Wallet`, removendo `save` intermediario e concentrando a manutencao critica em `Stop bot -> Validate Agent Wallet -> Run readiness check`. O readiness so e liberado apos validacao bem-sucedida, a substituicao so e efetivada apos sucesso operacional e o modal permanece aberto com feedback de conclusao.
- `2026-03-28`: correcao funcional importante no backend e no `Profile`: o reaproveitamento de credencial deixou de depender apenas da `Agent Wallet public key`. O `keyFingerprint` passou a considerar `public key + private key`, com fallback de compatibilidade para registros antigos, evitando reuso indevido de credencial quando apenas a chave publica coincide.
- `2026-03-28`: quando o usuario tenta substituir pela mesma credencial ja `operationally_verified`, o `Profile` agora informa explicitamente que nao foi necessario rodar novo readiness check, em vez de reexecutar a verificacao sem contexto.
- `2026-03-28`: a persistencia de credenciais Pacifica foi refinada com lifecycle minimo `pending/active/replaced`. A credencial nova validada no `Profile` permanece `pending`; so apos sucesso no readiness ela vira a unica `active` da conta, enquanto a anterior passa a `replaced` e permanece armazenada para historico.
- `2026-03-28`: gap nao critico identificado em validacao manual: ao reutilizar no `Profile` uma credencial antiga com `lifecycleStatus = replaced`, o alias digitado no fluxo atual pode nao atualizar o alias persistido do registro reaproveitado. Pendencia registrada em `BG-022`.
- `2026-03-28`: refinamentos finais de UX no modal de `Replace Agent Wallet`: `done-notes` com titulo e descricao distintos, `Validate Agent Wallet` passa a travar inputs e o proprio botao apos sucesso, deixando apenas `Run readiness check` disponivel, e a `Agent Wallet private key` passa a aparecer mascarada em vez de vazia apos validacao ou substituicao concluida.
- `2026-03-28`: correcao funcional do `Log out`: alem do estado local do app, o fluxo passou a limpar a chave `walletName` do `wallet-adapter-react`, impedindo `autoConnect` imediato ao voltar para `/onboarding`.
- `2026-03-28`: endurecimento arquitetural posterior: a `Agent Wallet private key` deixou de ser persistida em `localStorage`, a orquestracao de `Replace Agent Wallet` saiu de `ProfilePage` para hook proprio e a regra backend de `findActiveCredential` passou a respeitar apenas credenciais `active`.
- `2026-03-28`: walkthrough funcional concluido com o fluxo de manutencao do `Profile` consistente com o recorte de produto. O card fica fechado; apenas `BG-019` (redirect futuro para home) e `BG-022` (alias em credencial reaproveitada) permanecem como backlog residual separado.
