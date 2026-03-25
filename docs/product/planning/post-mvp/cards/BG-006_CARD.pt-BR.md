# BG-006 Card

## Status
- status: `IN_REVIEW`
- tipo: `melhoria`
- prioridade: `P2`
- owner: `PO`
- area: `design system`
- ultima atualizacao: `2026-03-24`

## Objetivo
Aplicar cursor `default` em todos os textos nao interativos da interface.

## Contexto
O comportamento atual pode transmitir affordance errada em partes da UI que sao apenas informativas.

## Escopo Fechado
- revisar textos estaticos e labels nao clicaveis
- aplicar cursor coerente apenas em elementos interativos

## Fora de Escopo
- revisao completa de acessibilidade e hover states do produto

## Racional de Produto
- remove falso sinal de interatividade
- melhora consistencia de affordance da UI

## Dependencias
- alinhamento com design system

## Critérios de Aceite Iniciais
- textos nao clicaveis usam cursor `default`
- apenas elementos realmente interativos sugerem clique ou acao

## Proximo Passo Recomendado
Validar manualmente a implementacao e decidir se o item pode sair do backlog pos-MVP.