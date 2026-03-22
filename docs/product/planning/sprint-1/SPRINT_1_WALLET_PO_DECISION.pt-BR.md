# Sprint 1: Decisao Parcial de PO para Wallet Solana

## Objetivo
Congelar imediatamente o recorte de produto da integracao de wallet Solana para a Sprint 1, reduzindo ambiguidade antes do fechamento tecnico com desenvolvimento.

## Status da Decisao
- status: `FECHADA`
- papel decisor atual: `PO`
- complemento tecnico incorporado de: `Dev`
- data de fechamento: `2026-03-22`
- impacto principal: `V1.4` e fechamento funcional do onboarding

## O Que Fica Fechado Agora em Produto
- o MVP tera `um unico caminho de wallet` no onboarding
- a wallet exigida continua sendo `wallet Solana`
- `sem wallet conectada`, o usuario nao avanca para o fluxo principal
- o onboarding continua `wallet-first` como parte do fluxo de liberacao do produto
- os estados obrigatorios da wallet no MVP sao:
  - `nao conectada`
  - `conectando`
  - `conectada`
  - `erro`
- a UI deve mostrar status claro da wallet sem linguagem excessivamente tecnica
- o CTA final do onboarding so pode ficar habilitado quando wallet e credenciais estiverem validas
- o MVP nao deve abrir escopo para multiplas wallets ou seletores complexos de provider
- a integracao deve nascer desacoplada da UI por meio de `adapter` ou camada equivalente

## Guardrails de Produto
- nao introduzir fluxo alternativo sem wallet no MVP
- nao permitir bypass manual do bloqueio por falta de wallet conectada
- nao transformar a escolha tecnica da wallet em opcao de UX para o usuario se isso ampliar complexidade
- nao adicionar etapas extras ao onboarding por causa da wallet sem nova decisao de PO

## Fechamento Tecnico Incorporado
- adapter interno do app: `SolanaWalletPort`
- implementacao concreta inicial: `@solana/wallet-adapter-react` com `@solana/wallet-adapter-wallets`
- wallet obrigatoria para aceite da Sprint 1: `Phantom`
- persistencia minima de UX: `selectedWalletProvider`, `lastConnectedMainWalletPublicKey`, `lastConnectedAt`
- reidratacao: tentativa de `autoConnect`, com estado tecnico de `reconnecting` sem liberar produto ate sessao atual valida
- codigos de erro esperados: `wallet_provider_missing`, `wallet_connection_rejected`, `wallet_connection_failed`, `wallet_session_lost`, `wallet_unsupported`

## Observacao de Alinhamento
- para produto e design, os estados visuais continuam sendo `nao conectada`, `conectando`, `conectada` e `erro`
- `reconnecting` deve ser tratado como estado tecnico interno ou variante de loading, sem expandir a matriz visual obrigatoria do MVP sem novo alinhamento

## Critério de Fechamento Final
A decisao da wallet passa a ser considerada `FECHADA` porque:
- [x] houve recomendacao tecnica unica do dev
- [x] persistencia minima foi definida
- [x] comportamento de erro foi definido
- [x] nao houve expansao de escopo de produto na wallet
- [x] impacto em `V1.4` esta claro e executavel

## Efeito Pratico na Sprint 1
- design pode seguir normalmente com estados e handoff da wallet
- dev pode seguir com abstracao, estado e UI da wallet
- dev nao deve considerar a integracao funcional da wallet como fechada antes da resposta final do checkpoint tecnico
- o risco principal continua sendo retrabalho se o caminho tecnico final divergir do adapter provisiorio

## Proximo Passo de PO
Atualizar os artefatos da Sprint 1 para refletir wallet fechada e tratar `Agent Wallet` como decisao separada ainda pendente de aprovacao de produto.
