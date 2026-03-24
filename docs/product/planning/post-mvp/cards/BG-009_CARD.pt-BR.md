# BG-009 Card

## Status
- status: `TODO`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `PO`
- area: `interacoes`
- ultima atualizacao: `2026-03-24`

## Objetivo
Substituir `alert` nativo do navegador por modal de confirmacao nas acoes que exigem validacao do usuario.

## Contexto
`alert` do navegador quebra a experiencia, reduz confianca e destoa do nivel de controle visual esperado nas acoes sensiveis do produto.

## Escopo Fechado
- remover `alert` nativo em confirmacoes de acao
- usar modal de confirmacao consistente com o produto
- cobrir principalmente acoes sensiveis como encerramento e ativacao, quando aplicavel

## Fora de Escopo
- sistema completo de modais generico sem recorte funcional

## Racional de Produto
- melhora confianca
- mantém consistencia visual
- torna a acao mais intencional e menos abrupta

## Dependencias
- alinhamento com design sobre contrato visual do modal
- alinhamento com dev sobre pontos de substituicao de `alert`

## Critérios de Aceite Iniciais
- nenhuma acao sensivel relevante usa `alert` nativo
- o modal deixa claro impacto, confirmacao e cancelamento
- o padrao e reaproveitavel em mais de uma tela

## Proximo Passo Recomendado
Mapear todas as acoes sensiveis que ainda dependem de `alert` e consolidar um unico contrato de modal.
