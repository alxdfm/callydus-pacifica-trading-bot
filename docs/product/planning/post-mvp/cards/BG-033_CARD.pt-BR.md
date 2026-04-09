# BG-033 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `Designer`
- area: `presets / strategy builder`
- ultima atualizacao: `2026-04-09`

## Objetivo
Desenhar a UX de `YOUR Strategy` com foco em acessibilidade cognitiva para usuario intermediario/avancado, mantendo o fluxo potente sem virar um editor tecnico hostil.

## Escopo Fechado
- definir o card fixo `YOUR Strategy` ao lado dos presets padrao
- definir o fluxo em `wizard`
- organizar etapas para:
  - escolha de mercado e timeframe
  - direcao `long/short`
  - regras de entrada
  - `stop loss`
  - `take profit`
  - sizing
  - preview final com backtest
- definir UX para regras `AND/OR` com aninhamento
- definir linguagem amigavel para operadores nao iniciantes
- definir warning forte para estrategia sem `take profit`
- definir estado bloqueado quando o bot estiver rodando
- alinhar handoff para dev e QA

## Fora de Escopo
- builder visual tipo grafo/node editor na V1
- redesign completo da pagina de presets fora do necessario para encaixar `YOUR Strategy`

## Dependencias
- [x] BG-031 validado
- [x] BG-028 concluido
- [x] alinhamento com dev sobre contrato minimo do builder

## Critérios de Aceite Iniciais
- [x] a feature fica compreensivel sem expor JSON ou semantica crua
- [x] o fluxo deixa clara a diferenca entre entrada, stop e take
- [x] `take profit` opcional recebe warning forte e confirmacao explicita
- [x] o preview final reaproveita o backtest de forma coerente com a jornada
- [x] o handoff elimina adivinhacao para dev e QA

## Proximo Passo Recomendado
Designer fechar primeiro arquitetura da jornada e hierarquia da informacao, antes do refinamento fino de microcopy.

## Log de Acompanhamento
- `2026-04-09`: card criado para trilha de design/UX da feature `YOUR Strategy`.
- `2026-04-09`: referencia de design, handoff e preview atualizados para encaixar `YOUR Strategy` como quarto card fixo e wizard guiado com preview final e warning sem `take profit`.
- `2026-04-09`: revisao de PO considerou a direcao geral aderente, mas deixou 3 ajustes formais antes de fechamento total do handoff: explicitar todos os steps do wizard, incluindo `sizing`; incluir estado de edicao bloqueada com bot rodando; e materializar visualmente a confirmacao explicita para salvar/ativar sem `take profit`.
- `2026-04-09`: revalidacao de PO apos correcoes considerou o handoff quase fechado. Os 3 gaps anteriores foram absorvidos no preview; ficaram apenas residuos de refinamento: explicitar visualmente o limite concreto de complexidade (`3 AND` / `3 OR`) e mostrar a acao de limpar/resetar o builder sem persistir mudancas antes do save.
- `2026-04-09`: revalidacao final de PO considerou o handoff de design aderente ao recorte de produto. O preview agora explicita o gate de backtest antes da ativacao, fecha os residuos de `clear builder` e limite de complexidade, e o card passa a `DONE`.
