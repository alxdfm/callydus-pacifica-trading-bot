# BG-018 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `PO`
- area: `profile`
- ultima atualizacao: `2026-03-28`

## Objetivo
Remapear o `Profile` de forma sequencial em cima do que ja foi fechado, adaptando manutencao de conta as novas regras operacionais do onboarding e do runtime.

## Contexto
O `Profile` ja existe como base funcional fechada. Depois disso, o onboarding mudou operacionalmente e surgiram novas regras para conta existente, logout e revalidacao critica de `Agent Wallet`. Isso deve virar uma nova task, sem reabrir ou reescrever o card base ja concluido.

## Escopo Fechado
- manter `Profile` como area recorrente de manutencao, sem transformar a tela em onboarding
- `Main wallet` permanece apenas como identidade da conta, sem opcao de troca dentro do `Profile`
- se o usuario quiser usar outra wallet principal, isso passa a ser tratado como nova conta
- adicionar acao de `deslogar`
- no estado atual do produto, `deslogar` pode limpar o estado persistido local para encerrar a sessao
- editar `Agent Wallet` deve exigir nova validacao da `Agent Wallet`
- editar `Agent Wallet` deve exigir novo `operational verification`
- nao permitir editar `Agent Wallet` com bot rodando
- impedir novo `start bot` enquanto a conta estiver sem nova `operational verification`
- manter `credentialAlias` como edicao leve, sem reabrir fluxo critico

## Fora de Escopo
- reabrir o card base de criacao de `Profile`
- transformar `Profile` em configuracoes genericas de conta
- permitir troca inline de `Main wallet`

## Racional de Produto
- preserva rastreabilidade do que ja foi fechado
- evita reescrever baseline concluida
- separa claramente manutencao incremental de escopo original da tela
- protege a operacao ao tratar edicao de `Agent Wallet` como fluxo critico

## Dependencias
- alinhamento com dev sobre logout e bloqueio operacional
- alinhamento com design sobre comunicacao de bloqueio e impacto de revalidacao

## Critérios de Aceite Iniciais
- o card original de `Profile` permanece como baseline concluida
- as novas regras operacionais ficam registradas em task sequencial propria
- `Main wallet` nao pode ser trocada dentro de `Profile`
- existe acao clara de `deslogar`
- `Agent Wallet` nao pode ser editada com bot rodando
- editar `Agent Wallet` reabre validacoes e bloqueia operacao ate nova verificacao completa

## Proximo Passo Recomendado
Desdobrar `BG-018` em tasks separadas de dev e design para implementar o remapeamento de `Profile` sem alterar o baseline ja fechado.

## Log de Acompanhamento
- `2026-03-27`: card criado para registrar sequencialmente o remapeamento de `Profile` apos mudancas operacionais do onboarding e do runtime, sem reabrir o card base ja concluido.
- `2026-03-28`: direcao de produto absorvida no `Profile` real por meio das tasks derivadas `BG-020` e `BG-021`. O fluxo final ficou fechado com `Main wallet` readonly, `Log out` local, bloqueio de edicao da `Agent Wallet` com bot rodando e revalidacao operacional critica sem reabrir onboarding.
