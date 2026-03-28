# FM-003 Card

## Status
- status: `IN_REVIEW`
- tipo: `arquitetura + implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-28`

## Objetivo
Remover o acoplamento central ao localStorage para dados operacionais e passar a ler estado da conta, preset e runtime de read models do backend.

## Escopo Fechado
- [ ] separar estado puramente de UI de estado operacional
- [x] definir primeiro read model real para reidratacao da sessao operacional por `walletAddress`
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
- `2026-03-28`: primeiro corte implementado em codigo para reduzir acoplamento ao estado local no reconnect: backend ganhou endpoint de snapshot operacional por `walletAddress`, com read model de conta, credencial ativa, preset ativo, runtime, saldo, trades, history e alertas; frontend passou a reidratar esses dados ao detectar conta existente.
- `2026-03-28`: o corte atual ainda nao fecha a task inteira porque preset activation e runtime real ainda nao sao persistidos end-to-end pelos proximos `FM-*`; por isso o card permanece em `IN_REVIEW`.
