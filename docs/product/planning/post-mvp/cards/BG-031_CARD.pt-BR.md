# BG-031 Card

## Status
- status: `DONE`
- tipo: `mudanca de escopo`
- prioridade: `P0`
- owner: `PO`
- area: `presets / strategy builder`
- ultima atualizacao: `2026-04-11`

## Objetivo
Introduzir a feature `YOUR Strategy`, permitindo ao usuario final criar sua propria estrategia do zero, com UX guiada, contrato compatível com os presets atuais e ativacao real no produto.

## Contexto
Hoje o produto oferece 3 presets padrao e ja possui:
- motor de indicadores
- contrato de estrategia
- backtest preview
- ativacao de preset
- runtime real
- readiness operacional

O proximo passo de produto e abrir essa capacidade ao usuario final sem transformar a UX em um builder tecnico bruto.

## Escopo Fechado
- `YOUR Strategy` como quarta opcao ao lado dos presets padrao
- feature para usuario final
- `wizard` guiado como direcao principal de UX
- estrategia gerada do zero, nao apenas derivada de template
- `1 YOUR Strategy` por conta
- suporte a `long`, `short` ou ambos
- regras separadas por lado
- suporte a `entry`, `stop loss` e `take profit`
- suporte a backtest preview e ativacao real

## Fora de Escopo
- multiplas estrategias customizadas por conta
- multiplas entradas
- multiplos alvos
- parcial
- `break even`
- `pyramiding`
- configuracao de `leverage` no builder na V1

## Dependencias
- [x] BG-028 concluido
- [x] BG-029 em refinamento
- [x] FM-013 a FM-017 em baseline funcional

## Critérios de Aceite Iniciais
- [x] existe decisao formal de produto para `YOUR Strategy`
- [x] o recorte funcional da V1 esta congelado
- [x] a feature ja foi desdobrada em tasks separadas para dev, design e QA

## Proximo Passo Recomendado
Abrir trilhas separadas de implementacao, UX/handoff e validacao para `YOUR Strategy`.

## Log de Acompanhamento
- `2026-04-09`: card criado para consolidar a feature `YOUR Strategy` como nova trilha formal de produto no backlog pos-MVP.
