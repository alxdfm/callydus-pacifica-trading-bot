# FM-006 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Fazer com que ativar um preset realmente registre uma estrategia ativa para execucao e monitoramento, em vez de apenas atualizar estado local.

## Escopo Fechado
- [x] persistir ativacao real no backend
- [x] gerar contrato efetivo da estrategia ativa
- [x] vincular preset ativo ao runtime do bot
- [x] refletir estado real de ativacao, pausa e parada

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
Usar a ativacao persistida como entrada canonica dos proximos comandos reais de bot/trade em `FM-007`.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-28`: ativacao real implementada com `POST /api/presets/activate`, persistencia de `PresetActivation` no backend, upsert do `PresetDefinition`, desativacao do preset ativo anterior, atualizacao do `BotRuntimeState.activePresetActivationId` e substituicao do fluxo local no frontend.
- `2026-03-28`: validacao manual local concluida com sucesso: `POST /api/presets/activate` respondeu `success` para uma conta operacional existente e `POST /api/account/session` passou a refletir o `activePreset` e o `activePresetActivationId` persistidos.
