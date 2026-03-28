# BG-019 Card

## Status
- status: `TODO`
- tipo: `ajuste de UX`
- prioridade: `P1`
- owner: `PO`
- area: `navegacao`
- ultima atualizacao: `2026-03-27`

## Objetivo
Garantir que a acao de `deslogar` redirecione para a pagina inicial quando essa tela existir, mantendo o encerramento de sessao coerente com a jornada publica do produto.

## Contexto
No estado atual do produto, faz sentido encerrar a sessao limpando o estado persistido local. Porem, o destino correto apos `deslogar` ainda nao existe como pagina inicial dedicada. Se esse item ficar misturado com o remapeamento de `Profile`, ele corre risco de ser esquecido.

## Escopo Fechado
- manter a pendencia explicita ate existir pagina inicial dedicada
- quando a pagina inicial estiver pronta, conectar o fluxo de `deslogar` a esse redirect
- garantir que o encerramento de sessao leve o usuario para um destino publico e coerente

## Fora de Escopo
- implementacao da propria pagina inicial
- redefinicao completa da arquitetura publica do produto

## Racional de Produto
- evita perda de contexto de navegacao apos logout
- garante que a pendencia nao fique escondida dentro de outra task
- preserva clareza entre logout atual tecnico e logout final de jornada

## Dependencias
- existencia de pagina inicial dedicada
- alinhamento futuro entre navegacao publica e encerramento de sessao

## Critérios de Aceite Iniciais
- a pendencia de redirect pos-logout fica rastreada em task propria
- quando a pagina inicial existir, o logout deixa de apenas limpar sessao e passa a redirecionar corretamente

## Proximo Passo Recomendado
Manter aberta ate a definicao e implementacao da pagina inicial publica do produto.

## Log de Acompanhamento
- `2026-03-27`: task criada para extrair o redirect pos-logout do remapeamento de `Profile` e evitar que a pendencia se perca antes da existencia da pagina inicial.
