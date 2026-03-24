# BG-004 Card

## Status
- status: `TODO`
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

## Proximo Passo Recomendado
Refinar escopo minimo da pagina `Profile` antes de priorizar implementacao.
