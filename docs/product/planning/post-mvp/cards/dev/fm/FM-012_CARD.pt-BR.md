# FM-012 Card

## Status
- status: `DONE`
- tipo: `arquitetura + implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-28`

## Objetivo
Reduzir acoplamento e risco no fluxo de credenciais Pacifica do frontend, removendo persistencia da private key no storage local e modularizando a manutencao critica do `Profile`.

## Escopo Fechado
- [x] impedir persistencia de `agentWalletPrivateKey` no `localStorage` do app
- [x] manter a private key apenas em memoria durante a sessao atual do fluxo
- [x] extrair a orquestracao de `Replace Agent Wallet` de `ProfilePage` para hook proprio
- [x] corrigir `findActiveCredential` para buscar apenas credenciais com `lifecycleStatus = active`
- [x] sincronizar a documentacao tecnica e de produto com os ajustes

## Fora de Escopo
- [ ] remover completamente a private key do estado em memoria do frontend
- [ ] reestruturar todo o onboarding para hook/feature propria
- [ ] introduzir camada de secrets frontend dedicada

## Checklist de Entrega Real
- [x] recarregar o app nao reidrata `agentWalletPrivateKey` a partir de `localStorage`
- [x] `ProfilePage` deixou de concentrar toda a regra de substituicao da `Agent Wallet`
- [x] o backend nao trata mais credencial `pending` ou `replaced` como se fosse `active` em `findActiveCredential`

## Dependencias
- [x] FM-011 concluida
- [x] BG-020 em implementacao

## Critérios de Aceite da Task
- [x] `agentWalletPrivateKey` nao e serializada no estado persistido do app
- [x] o fluxo de `Replace Agent Wallet` esta encapsulado fora da pagina principal
- [x] `findActiveCredential` reflete corretamente o lifecycle atual do modelo

## Proximo Passo Recomendado
Se o produto continuar crescendo, considerar remover a private key tambem do estado global em memoria e manter esse segredo apenas em drafts isolados por fluxo.

## Log de Acompanhamento
- `2026-03-28`: task criada e concluida para fechar pontos de higiene arquitetural identificados durante review do `Profile` e do lifecycle de credenciais.
- `2026-03-28`: `agentWalletPrivateKey` deixou de ser persistida em `localStorage`, o fluxo de `Replace Agent Wallet` foi extraido para hook proprio e `findActiveCredential` passou a filtrar apenas credenciais `active`.
