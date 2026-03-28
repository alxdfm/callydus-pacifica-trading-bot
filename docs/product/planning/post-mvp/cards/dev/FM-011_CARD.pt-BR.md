# FM-011 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-28`

## Objetivo
Modelar o ciclo de vida minimo das credenciais Pacifica para distinguir a credencial validada ainda nao promovida, a credencial operacional atual e o historico ja substituido.

## Escopo Fechado
- [x] adicionar estado de ciclo de vida `pending/active/replaced` em `PacificaCredential`
- [x] manter historico de credenciais antigas no banco sem sobrescrever registros anteriores
- [x] manter nova credencial validada em `pending` ate concluir `operational verification`
- [x] promover apenas uma credencial `active` por conta ao concluir `operational verification`
- [x] marcar credenciais anteriores como `replaced` ao promover nova credencial
- [x] ajustar o lookup de conta para usar apenas a credencial `active`
- [x] evitar short-circuit operacional em credencial ja substituida

## Fora de Escopo
- [ ] introduzir estados adicionais como `draft`, `revoked` ou `expired`
- [ ] expor historico completo de credenciais na UI
- [ ] recuperar ou restaurar credencial antiga pela interface

## Checklist de Entrega Real
- [x] a conta possui no maximo uma `Agent Wallet` ativa por vez
- [x] credenciais substituidas continuam persistidas para auditoria
- [x] o lookup inicial da conta nao depende mais de "ultima credencial valida", e sim da credencial `active`
- [x] a troca de credencial no `Profile` nao reaproveita estado operacional de credencial ja substituida

## Dependencias
- [x] FM-002 concluida
- [x] BG-020 em implementacao

## Critérios de Aceite da Task
- [x] uma nova credencial validada nao nasce `active`; ela permanece `pending` ate o readiness
- [x] uma nova credencial promovida para operacional marca a anterior como `replaced`
- [x] apenas a credencial `active` aparece como referencia operacional atual da conta
- [x] credenciais antigas permanecem armazenadas no banco para historico

## Proximo Passo Recomendado
Manter o modelo em `pending/active/replaced` por enquanto e so introduzir novos estados se o produto realmente exigir.

## Log de Acompanhamento
- `2026-03-28`: task criada e concluida para formalizar o lifecycle minimo de credenciais Pacifica.
- `2026-03-28`: `PacificaCredential` ganhou `lifecycleStatus` com valores `pending/active/replaced`; novas credenciais validadas permanecem `pending`, a promocao operacional marca a nova credencial como `active`, a anterior como `replaced` e o lookup da conta passa a considerar apenas a credencial ativa.
