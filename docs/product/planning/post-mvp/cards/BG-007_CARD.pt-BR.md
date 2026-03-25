# BG-007 Card

## Status
- status: `IN_REVIEW`
- tipo: `ajuste de UX`
- prioridade: `P1`
- owner: `PO`
- area: `presets`
- ultima atualizacao: `2026-03-24`

## Objetivo
Trocar o campo livre de `Symbol` na tela de presets por um `select` com symbols predefinidos.

## Contexto
Campo aberto aumenta risco de erro, reduz previsibilidade e vai contra a proposta de configuracao guiada do produto.

## Escopo Fechado
- `Symbol` como select
- lista fechada de symbols permitidos
- usuario apenas seleciona, sem texto livre

## Fora de Escopo
- busca avançada de ativos
- cadastro livre de pares de trading fora da lista permitida

## Racional de Produto
- reduz erro de entrada
- protege consistencia operacional
- aproxima a tela da proposta de MVP simples para nao tecnicos

## Dependencias
- definicao da lista inicial de symbols permitidos
- alinhamento com design sobre comportamento do select

## Critérios de Aceite Iniciais
- o usuario nao consegue digitar symbols arbitrarios
- os symbols permitidos ficam claros e previsiveis
- a troca nao aumenta friccao desnecessaria no fluxo de ativacao

## Proximo Passo Recomendado
Validar manualmente a implementacao e decidir se o item pode sair do backlog pos-MVP.