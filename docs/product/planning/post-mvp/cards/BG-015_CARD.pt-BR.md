# BG-015 Card

## Status
- status: `DONE`
- tipo: `ajuste de UX`
- prioridade: `P0`
- owner: `PO`
- area: `onboarding`
- ultima atualizacao: `2026-03-27`

## Objetivo
Condicionar o fluxo do onboarding logo no step 1 pela wallet conectada: se a conta ja existir para aquele `walletAddress`, o usuario vai direto para o dashboard; se nao existir, o onboarding expande os proximos steps e segue a jornada completa.

## Contexto
Hoje o onboarding segue a mesma progressao para qualquer usuario. Isso ignora o caso em que a wallet conectada ja pertence a um `OperationalAccount` existente e obriga o usuario a rever um fluxo que nao precisa mais executar.

## Escopo Fechado
- no menu lateral inicial do onboarding, exibir apenas o step 1 de conectar wallet
- apos conectar a wallet, consultar se existe `OperationalAccount` para o `walletAddress`
- se existir conta:
- pular onboarding restante
- nao exibir modal de boas-vindas
- redirecionar direto para o dashboard
- se nao existir conta:
- revelar os proximos steps no menu lateral
- seguir o fluxo atual de onboarding

## Fora de Escopo
- mudanca do contrato de criacao de conta alem da descoberta por wallet
- revisitacao completa da navegacao global fora do fluxo inicial

## Racional de Produto
- reduz atrito para usuario recorrente
- evita reapresentar onboarding para conta ja pronta
- deixa a progressao inicial mais limpa, mostrando apenas o que faz sentido no momento

## Dependencias
- concluido com lookup por `walletAddress` no `OperationalAccount`
- concluido com reveal progressivo dos steps no menu lateral

## Critérios de Aceite Iniciais
- [x] o onboarding abre mostrando apenas o step 1
- [x] conectar wallet dispara a verificacao de conta existente
- [x] usuario com conta existente vai direto ao dashboard sem modal de boas-vindas
- [x] usuario sem conta existente passa a ver os proximos steps e continua o onboarding
- [x] a regra e clara e previsivel para usuario novo e recorrente

## Proximo Passo Recomendado
Seguir com os proximos refinamentos de onboarding em cima da bifurcacao ja implementada entre conta existente e conta nova.

## Log de Acompanhamento
- `2026-03-27`: card criado a partir da decisao de ajustar o onboarding para distinguir usuario novo de conta ja existente logo no step de conexao de wallet.
- `2026-03-27`: decisao absorvida no onboarding real. Conta existente vai direto ao dashboard sem modal de boas-vindas; conta nova revela os demais steps e segue o fluxo completo.
