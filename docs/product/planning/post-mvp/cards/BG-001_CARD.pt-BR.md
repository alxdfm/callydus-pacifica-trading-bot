# BG-001 Card

## Status
- status: `TODO`
- tipo: `ajuste de UX`
- prioridade: `P1`
- owner: `PO`
- area: `shell`
- ultima atualizacao: `2026-03-24`

## Objetivo
Fixar a lateral esquerda da aplicacao para que a navegacao permaneça estatica enquanto o conteudo principal rola de forma independente.

## Contexto
Hoje a shell nao reforca o modelo de leitura `navegacao fixa + area operacional rolavel`, o que reduz previsibilidade de uso nas telas principais.

## Escopo Fechado
- lateral esquerda fixa
- rolagem concentrada no conteudo da direita
- comportamento consistente em dashboard, presets, trades e history

## Fora de Escopo
- redesenho estrutural completo da shell
- alteracao de arquitetura de navegacao alem do necessario para o comportamento fixed

## Racional de Produto
- melhora orientacao espacial
- reduz perda de contexto ao navegar por telas longas
- reforca leitura de produto como control surface

## Dependencias
- alinhamento com design sobre responsividade
- alinhamento com dev sobre layout compartilhado

## Critérios de Aceite Iniciais
- a lateral permanece visivel durante a rolagem do conteudo principal
- o comportamento nao quebra mobile nem cria scroll duplo confuso
- a navegacao continua clara e estatica em todas as telas operacionais

## Proximo Passo Recomendado
Validar com design e dev o ajuste no layout compartilhado antes de entrar em implementacao.
