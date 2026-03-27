# BG-010 Card

## Status
- status: `DONE`
- tipo: `mudanca de escopo`
- prioridade: `P1`
- owner: `PO`
- area: `integracao pacifica`
- ultima atualizacao: `2026-03-25`

## Objetivo
Refinar e fechar qual deve ser o formato canonico de assinatura dos endpoints assinados da Pacifica, removendo a ambiguidade operacional atual.

## Contexto
Na implementacao atual do `FM-002`, o client da Pacifica usa fallback de assinatura:
- primeiro tenta payload com `type + data`
- se receber `Verification failed`, tenta novamente assinando o `unsignedBody`

Esse comportamento foi reaproveitado da POC antiga e funcionou como compatibilidade pragmatica, mas ainda nao representa um contrato fechado de integracao.

Evidencia ja obtida:
- no `approve_builder_code` assinado pela wallet principal no fluxo novo de onboarding, o caminho `primary` respondeu `200`
- nesse endpoint e nesse fluxo, o `fallback` nao foi necessario
- com `Agent Wallet`, os dois caminhos falharam, mas esse caso deixou de ser o fluxo oficial do builder approval

## Escopo Fechado
- validar se o fallback atual deve permanecer
- definir se existe formato unico canonico por endpoint
- decidir se o time deve abrir alinhamento externo com a Pacifica
- registrar impacto esperado em `FM-002`, `FM-007` e comandos futuros

## Fora de Escopo
- reescrever agora toda a integracao Pacifica sem refinamento previo
- expandir para outros providers

## Racional de Produto
- reduz risco tecnico em comandos sensiveis
- evita manter comportamento "funciona, mas nao sabemos por que"
- melhora previsibilidade para onboarding, ordens e automacao futura

## Dependencias
- evidencias coletadas durante o `FM-002`
- validacao tecnica de dev sobre os endpoints assinados mais importantes

## Critérios de Aceite Iniciais
- existe decisao clara sobre o formato de assinatura a manter
- o fallback atual fica explicitamente classificado como:
  - temporario
  - aceitavel no MVP funcional
  - ou substituivel por padrao unico
- a decisao fica registrada nas docs tecnicas da Pacifica

## Proximo Passo Recomendado
PO alinhar com dev se o fallback atual sera aceito como compromisso do MVP funcional ou se o item exige aprofundamento adicional com a Pacifica antes de avancar nos proximos comandos assinados.

## Log de Acompanhamento
- `2026-03-25`: evidencia real registrada de que `approve_builder_code` com assinatura da conta principal funcionou pelo caminho `primary`; o `fallback` segue sem necessidade comprovada nesse endpoint e nao deve permanecer por inercia se nao fizer sentido para os demais fluxos assinados.

## Impacto de Design
- onboarding passa a tratar `builder approval` como etapa separada entre wallet e `Agent Wallet`
- a UX deve comunicar que esta aprovacao e autorizacao unica da conta, nao transferencia
- erros e rejeicoes de assinatura precisam parecer recuperaveis quando houver retry
- a etapa de `Agent Wallet` continua bloqueada ate aprovacao do builder code

## Evidencia de Design
- [ONBOARDING_STATE_MATRIX.pt-BR.md](../../../../design/ONBOARDING_STATE_MATRIX.pt-BR.md)
- [SCREEN_HANDOFF.pt-BR.md](../../../../design/SCREEN_HANDOFF.pt-BR.md)
- [DESIGN_HANDOFF.pt-BR.md](../../../../design/DESIGN_HANDOFF.pt-BR.md)
- [onboarding.html](../../../../design/preview/onboarding.html)
