# FM-006 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Fazer com que ativar um preset realmente registre uma estrategia ativa para execucao e monitoramento, em vez de apenas atualizar estado local.

## Escopo Fechado
- [ ] persistir ativacao real no backend
- [ ] gerar contrato efetivo da estrategia ativa
- [ ] vincular preset ativo ao runtime do bot
- [ ] refletir estado real de ativacao, pausa e parada

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] ativar preset cria estado operacional real e persistido
- [ ] dashboard reflete preset ativo de fonte real e nao simulada

## Dependencias
- [ ] FM-001 concluida
- [ ] FM-003 concluida

## Critérios de Aceite da Task
- [ ] ativar preset cria estado operacional real e persistido
- [ ] dashboard reflete preset ativo de fonte real e nao simulada

## Proximo Passo Recomendado
Fechar o fluxo de comando de ativacao e o modelo de persistencia do contrato efetivo.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
