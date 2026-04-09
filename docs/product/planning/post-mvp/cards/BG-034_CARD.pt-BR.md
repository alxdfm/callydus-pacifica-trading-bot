# BG-034 Card

## Status
- status: `TODO`
- tipo: `qualidade`
- prioridade: `P1`
- owner: `QA`
- area: `presets / strategy builder`
- ultima atualizacao: `2026-04-09`

## Objetivo
Validar `YOUR Strategy` em usabilidade, regras de negocio e fluxo operacional real antes de considerarmos a feature pronta para usuarios finais.

## Escopo Fechado
- validar entendimento do fluxo guiado
- validar regras obrigatorias de `long/short`
- validar obrigatoriedade de `stop loss`
- validar warning e confirmacao explicita quando `take profit` estiver ausente
- validar limites de `symbols` e `timeframes`
- validar aninhamento de regras dentro dos limites definidos
- validar save sem backtest obrigatorio
- validar ativacao com backtest obrigatorio
- validar bloqueio de edicao com bot rodando
- validar integracao com o mesmo fluxo de readiness do `Start bot`

## Fora de Escopo
- performance testing profundo
- expansao de cenarios fora do escopo da V1

## Dependencias
- [ ] BG-031 validado
- [ ] BG-032 funcionalmente entregue
- [ ] BG-033 com handoff de UX fechado

## Critérios de Aceite Iniciais
- [ ] a UX conduz o usuario sem ambiguidade relevante
- [ ] regras de negocio bloqueiam combinacoes invalidas
- [ ] a ativacao da strategy custom segue o mesmo nivel de seguranca operacional dos presets padrao
- [ ] achados residuais ficam consolidados em backlog separado sem contaminar o recorte da V1

## Proximo Passo Recomendado
QA preparar roteiro de validacao cobrindo criacao, edicao, limpeza, save, backtest, ativacao e bloqueios operacionais.

## Log de Acompanhamento
- `2026-04-09`: card criado para garantir trilha explicita de QA na feature `YOUR Strategy`.
