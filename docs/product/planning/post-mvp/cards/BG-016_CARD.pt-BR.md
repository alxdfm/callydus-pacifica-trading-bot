# BG-016 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- area: `onboarding`
- ultima atualizacao: `2026-03-27`

## Objetivo
Implementar a descoberta de `OperationalAccount` por `walletAddress` no step 1 do onboarding e aplicar o desvio de jornada correto para conta existente versus conta nova.

## Contexto
PO definiu que conectar a wallet deve ser suficiente para identificar se o usuario precisa do onboarding completo ou se ja possui conta pronta para seguir direto ao dashboard.

## Escopo Fechado
- consultar `OperationalAccount` pelo `walletAddress` apos conexao da wallet
- se existir conta:
- redirecionar direto ao dashboard
- nao revelar os steps seguintes do onboarding
- nao acionar modal de boas-vindas
- se nao existir conta:
- manter o usuario no onboarding
- liberar visualmente os proximos steps
- sincronizar essa decisao com o estado global do app

## Fora de Escopo
- mudanca do contrato de criacao da conta
- redirecionamentos adicionais fora do onboarding inicial

## Dependencias
- [x] BG-015 decidido do ponto de vista de produto
- [x] contrato de leitura de `OperationalAccount` disponivel no backend
- [x] alinhamento com design sobre reveal progressivo dos steps

## Critérios de Aceite Iniciais
- [x] conectar a wallet executa lookup por `walletAddress`
- [x] usuario com conta existente vai direto ao dashboard
- [x] usuario com conta nova permanece no onboarding completo
- [x] o estado global nao entra em contradicao entre onboarding, shell e navegacao

## Proximo Passo Recomendado
Seguir com os proximos itens do Functional MVP usando o onboarding ja bifurcado entre conta existente e conta nova.

## Log de Acompanhamento
- `2026-03-27`: card criado a partir do refinamento de PO para distinguir usuario novo de conta existente ainda no step 1 do onboarding.
- `2026-03-27`: implementado endpoint de lookup por `walletAddress`, sincronizacao com estado global e desvio de jornada no step 1.
- `2026-03-27`: conta existente passa direto ao dashboard sem revelar os proximos steps e sem modal de boas-vindas.
- `2026-03-27`: conta nova permanece no onboarding e libera visualmente os demais steps apenas apos o lookup retornar `not_found`.
- `2026-03-27`: decisao refinada: `OperationalAccount` passa a ser persistido apenas no fim do onboarding, apos `operational verification` bem-sucedida. O lookup do step 1 considera apenas contas prontas, nao rascunhos de onboarding.
- `2026-03-27`: bug de redirect corrigido. O lookup no step 1 estava cancelando o proprio callback por dependencia reativa no estado de discovery; com o ajuste, contas existentes voltam a sair do onboarding corretamente.
- `2026-03-27`: persistencia do `credentialAlias` corrigida no backend para nao perder o valor informado durante a validacao da `Agent Wallet`.
