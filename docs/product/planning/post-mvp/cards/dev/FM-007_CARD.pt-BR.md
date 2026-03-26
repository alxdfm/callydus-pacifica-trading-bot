# FM-007 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Trocar as acoes locais de pausa, retomada e encerramento por comandos reais, assíncronos e rastreáveis.

## Escopo Fechado
- [ ] criar comandos de pause, resume e close trade
- [ ] usar idempotencia e status de comando
- [ ] refletir processamento, sucesso e falha na UI
- [ ] registrar origem e efeito de cada comando

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] acoes sensiveis do app nao dependem mais de alteracao local de estado
- [ ] cada comando relevante possui status rastreavel e feedback consistente

## Dependencias
- [ ] FM-001 concluida
- [ ] FM-006 concluida

## Critérios de Aceite da Task
- [ ] acoes sensiveis do app nao dependem mais de alteracao local de estado
- [ ] cada comando relevante possui status rastreavel e feedback consistente

## Proximo Passo Recomendado
Implementar command layer no backend e alinhar contratos de resposta com o frontend.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
