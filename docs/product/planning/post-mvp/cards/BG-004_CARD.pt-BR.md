# BG-004 Card

## Status
- status: `DONE`
- tipo: `mudanca de escopo`
- prioridade: `P1`
- owner: `PO`
- area: `conta`
- ultima atualizacao: `2026-03-24`

## Objetivo
Criar uma pagina `Profile` para concentrar edicao posterior dos dados da conta.

## Contexto
Ao remover `Onboarding` da navegacao recorrente, o produto precisa de um destino claro para manutencao futura de dados, sem reabrir a jornada inicial inteira.

## Escopo Fechado
- pagina de profile como area de manutencao de conta
- definicao de quais dados ficam editaveis apos setup inicial
- separacao entre setup inicial e manutencao recorrente

## Fora de Escopo
- expansao de configuracoes de conta alem do necessario
- area completa de settings genérica sem recorte funcional

## Racional de Produto
- preserva clareza de jornada
- cria ponto de manutencao sem reapresentar onboarding inteiro
- reduz ambiguidade sobre onde editar dados sensiveis da conta

## Dependencias
- definicao de campos editaveis
- definicao de regras de seguranca para revalidacao
- alinhamento com design e dev sobre IA de navegacao

## Critérios de Aceite Iniciais
- existe um destino claro para editar dados de conta apos onboarding
- o fluxo nao confunde setup inicial com manutencao recorrente
- os campos editaveis sao explicitamente definidos por produto

## Revalidacao de PO
Com as mudancas operacionais recentes do onboarding, o `Profile` precisa assumir explicitamente o papel de manutencao recorrente de uma conta ja identificada, sem reapresentar a jornada inicial inteira.

Direcao validada:
- `Profile` continua sendo a area recorrente de manutencao apos o onboarding
- `Onboarding` continua sendo a jornada de descoberta, criacao e desbloqueio inicial
- `Profile` nao deve replicar o stepper completo do onboarding
- `Profile` deve mostrar estado atual de prontidao da conta, nao apenas campos editaveis

## Regras Operacionais Atualizadas
- `Main wallet` continua sendo a identidade da conta e nao deve ser editavel inline
- acao de trocar `Main wallet` deve disparar nova descoberta por `walletAddress`
- se a nova wallet apontar para uma conta existente:
- o usuario assume esse contexto de conta sem modal de boas-vindas
- se a nova wallet nao apontar para conta existente:
- areas protegidas devem ser bloqueadas
- o usuario deve voltar ao onboarding a partir do `step 1`
- editar `Agent Wallet` dentro de `Profile` invalida a prontidao operacional atual
- ao editar `Agent Wallet`, o produto deve exigir novamente:
- validacao da `Agent Wallet`
- `operational verification`
- editar apenas `credentialAlias` nao deve reabrir fluxo nem bloquear produto

## Estado Minimo Esperado no Profile
- identidade atual da conta
- status de `builder approval`
- status atual da `Agent Wallet`
- status de `operationally_verified`
- impacto esperado antes de salvar alteracoes sensiveis

## Critérios de Aceite Revalidados
- `Profile` funciona como manutencao de conta ja conhecida, nao como onboarding disfarçado
- trocar `Main wallet` respeita a nova regra de descoberta por `walletAddress`
- editar `Agent Wallet` reabre apenas as validacoes necessarias para esse contexto
- `Profile` deixa claro quando a conta ficou temporariamente bloqueada por revalidacao
- `Profile` e `Onboarding` preservam papeis distintos e coerentes

## Proximo Passo Recomendado
Usar este recorte revalidado como base oficial para as proximas tasks de dev e design ligadas a `Profile`.

## Refinamento de Design
- `Profile` passa a ser a area recorrente de manutencao de conta apos setup concluido
- `Onboarding` permanece restrito a destravar acesso inicial
- `Main wallet` continua visivel como identidade da conta, mas sem edicao inline livre
- `Agent Wallet` ganha area propria de atualizacao com `Save and revalidate`
- `credentialAlias` permanece opcional e de baixo peso visual

## Campos Minimos Pos-Onboarding
- `mainWalletPublicKey`: readonly
- `agentWalletPublicKey`: editavel
- `agentWalletPrivateKey`: exigido novamente ao trocar `Agent Wallet`
- `credentialAlias`: opcional

## Evidencia de Design
- [PROFILE_REFERENCE.pt-BR.md](../../../../design/PROFILE_REFERENCE.pt-BR.md)
- [profile.html](../../../../design/preview/profile.html)

## Log de Implementacao
- `2026-03-24`: rota `Profile` implementada com resumo de status da conta, bloco readonly de `Main wallet`, manutencao de `Agent Wallet`, confirmacao de reconnect e separacao clara entre setup inicial e manutencao recorrente; aguardando validacao manual.
- `2026-03-27`: recorte de `Profile` revalidado por PO apos as mudancas operacionais do onboarding; `Profile` passa a assumir explicitamente manutencao recorrente, descoberta de conta por `walletAddress` ao trocar `Main wallet` e revalidacao de `Agent Wallet` + `operational verification` quando houver mudanca sensivel.
