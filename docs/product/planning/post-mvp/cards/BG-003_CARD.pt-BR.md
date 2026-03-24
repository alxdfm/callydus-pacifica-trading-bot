# BG-003 Card

## Status
- status: `TODO`
- tipo: `ajuste de UX`
- prioridade: `P1`
- owner: `PO`
- area: `navegacao`
- ultima atualizacao: `2026-03-24`

## Objetivo
Tratar `Onboarding` como etapa inicial de jornada, removendo seu acesso recorrente pela navegacao principal apos conta pronta.

## Contexto
Manter `Onboarding` sempre visivel na lateral passa a mensagem errada de pagina operacional recorrente, quando sua funcao e destravar o produto.

## Escopo Fechado
- `Onboarding` acessivel apenas enquanto a conta nao estiver pronta
- regra de exibicao baseada no estado da conta
- navegacao principal focada nas areas operacionais apos setup

## Fora de Escopo
- definicao completa da pagina substituta de edicao de conta

## Racional de Produto
- reforca jornada correta
- reduz ruído na navegacao
- separa setup inicial de operacao recorrente

## Dependencias
- definicao da regra final de conta pronta
- alinhamento com dev sobre guards e navegacao condicional

## Critérios de Aceite Iniciais
- usuario sem setup concluido continua vendo e acessando onboarding
- usuario com conta pronta deixa de ver onboarding na navegacao principal
- a mudanca nao compromete recuperacao de conta ou edicao futura de dados

## Proximo Passo Recomendado
Fechar a regra de exibicao do item de menu com base no estado de onboarding.
