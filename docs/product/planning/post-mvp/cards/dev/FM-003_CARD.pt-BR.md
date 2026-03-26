# FM-003 Card

## Status
- status: `TODO`
- tipo: `arquitetura + implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Remover o acoplamento central ao localStorage para dados operacionais e passar a ler estado da conta, preset e runtime de read models do backend.

## Escopo Fechado
- [ ] separar estado puramente de UI de estado operacional
- [ ] definir read models reais para onboarding, dashboard, presets e history
- [ ] usar banco e API como fonte de verdade para conta, bot e trades
- [ ] manter apenas preferencia de UI em storage local quando fizer sentido

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] saldo, preset ativo, trades e historico nao dependem mais de localStorage como fonte de verdade
- [ ] reiniciar o app nao apaga o estado operacional real do usuario

## Dependencias
- [ ] FM-001 concluida

## Critérios de Aceite da Task
- [ ] saldo, preset ativo, trades e historico nao dependem mais de localStorage como fonte de verdade
- [ ] reiniciar o app nao apaga o estado operacional real do usuario

## Proximo Passo Recomendado
Definir fronteira entre estado de sessao local e estado operacional persistido.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
