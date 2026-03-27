# BG-005 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P1`
- owner: `PO`
- area: `presets`
- ultima atualizacao: `2026-03-24`

## Objetivo
Aumentar a transparencia dos presets, detalhando gatilhos de compra, venda, stop loss e take profit sem poluir o layout principal.

## Contexto
Hoje o nivel de explicacao do preset nao atende a expectativa de transparencia maxima sobre como cada estrategia opera.

## Escopo Fechado
- detalhar gatilhos principais por preset
- cobrir compra, venda, `stop loss` e `take profit`
- usar affordance leve como `i` com tooltip ou hover informativo

## Fora de Escopo
- abrir editor tecnico completo de estrategia
- expor JSON, formulas brutas ou configuracao avançada fora do recorte de produto

## Racional de Produto
- aumenta confianca do usuario
- reduz percepcao de caixa-preta
- melhora entendimento sem sacrificar simplicidade visual

## Dependencias
- consolidacao do contrato exato de copy por preset
- alinhamento com design sobre tooltip, hover e mobile fallback

## Critérios de Aceite Iniciais
- usuario entende de forma simples por que o preset compra, vende e encerra posicao
- a tela continua limpa e nao vira documento tecnico
- a mesma informacao permanece acessivel em desktop e mobile

## Proximo Passo Recomendado
Validar manualmente a implementacao e decidir se o item pode sair do backlog pos-MVP.
