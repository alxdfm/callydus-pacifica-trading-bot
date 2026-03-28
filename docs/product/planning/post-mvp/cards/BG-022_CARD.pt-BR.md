# BG-022 Card

## Status
- status: `TODO`
- tipo: `bug`
- prioridade: `P1`
- owner: `Dev`
- area: `profile`
- ultima atualizacao: `2026-03-28`

## Objetivo
Corrigir o fluxo de `Replace Agent Wallet` quando o usuario reutiliza uma credencial antiga com `lifecycleStatus = replaced` e informa um novo `credentialAlias`.

## Contexto
Hoje, quando o usuario reenvia no `Profile` uma `Agent Wallet` que ja existia antes no banco e hoje esta marcada como `replaced`, o `/validate` pode reaproveitar a credencial historica sem atualizar o `credentialAlias` com o valor atual digitado no modal.

Isso nao bloqueia o fluxo principal de validacao e readiness, mas cria divergencia entre:
- alias digitado pelo usuario no fluxo atual
- alias persistido no registro reaproveitado

## Escopo Fechado
- investigar o reaproveitamento de credencial `replaced` no `/validate`
- decidir se o alias deve ser atualizado no registro reaproveitado ou se um novo registro deve ser criado
- alinhar o comportamento com a UX do `Profile`
- garantir consistencia entre alias exibido no frontend e alias persistido no banco

## Fora de Escopo
- redesenho do fluxo de `Replace Agent Wallet`
- expansao de lifecycle de credenciais alem do necessario para corrigir o alias

## Dependencias
- [x] BG-020 implementado
- [x] FM-011 concluida

## Critérios de Aceite Iniciais
- [ ] reutilizar uma credencial antiga no `Profile` nao deixa o `credentialAlias` desatualizado
- [ ] o alias persistido no banco reflete a decisao de produto para esse caso
- [ ] a UX nao sugere alteracao persistida se o backend nao atualizar o valor

## Proximo Passo Recomendado
Refinar a regra de produto para alias em credenciais reaproveitadas e so entao ajustar o `/validate` ou o fluxo de `Profile`.

## Log de Acompanhamento
- `2026-03-28`: card criado a partir de validacao manual do `Profile`; problema identificado como nao critico e adiado para refinamento posterior.
