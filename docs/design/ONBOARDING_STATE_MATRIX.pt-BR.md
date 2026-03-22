# Matriz de Estados do Onboarding

## Objetivo
Consolidar os estados visuais e a microcopy operacional minima do onboarding da Sprint 1 para reduzir adivinhacao de dev e QA.

## Escopo
Este artefato cobre apenas os estados criticos formais da Sprint 1.

Inclui:
- wallet Solana

Nao inclui ainda:
- matriz completa de `Agent Wallet`
- tabela completa de microcopy de onboarding

## Wallet Solana

| Estado visual | Quando aparece | Sinal visual principal | Acao principal | Microcopy curta |
|---|---|---|---|---|
| `Not connected` | estado inicial ou apos perda de sessao | badge neutra, card sem destaque de sucesso | `Connect wallet` | `Connect Phantom to continue.` |
| `Connecting` | usuario iniciou conexao ou app tenta reconectar sessao | badge informativa, indicador de loading visivel | sem acao primaria extra | `Connecting to Phantom...` |
| `Connected` | wallet ativa e public key disponivel na sessao atual | badge de sucesso, card com destaque positivo moderado | `Change wallet` | `Wallet connected and ready.` |
| `Error` | conexao falhou, foi recusada ou provider nao esta disponivel | badge de erro, mensagem curta proxima do card | `Try again` | `Could not connect wallet.` |

## Regras de Interpretacao
- `reconnecting` deve reutilizar o mesmo tratamento visual de `Connecting`
- `Connected` e `Error` nao podem depender apenas de cor; precisam de label clara
- loading deve parecer transitorio, nunca estado travado
- a wallet aceita na Sprint 1 e `Phantom`
- nenhum estado de wallet libera o produto sem validacao bem-sucedida de `Agent Wallet`

## Observacoes Para QA
- validar se `Connecting` e percebido como tentativa em andamento, nao como travamento
- validar se `Error` aparece proximo do bloco da wallet
- validar se `Connected` exibe a wallet correta e mantem clareza do proximo passo
- validar se o onboarding volta para estado pendente de wallet quando a sessao e perdida
