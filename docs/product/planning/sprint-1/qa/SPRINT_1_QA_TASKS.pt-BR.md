# Sprint 1: Tasks do QA

## Objetivo da Sprint
Validar se o onboarding da Sprint 1 e compreensivel, seguro e aderente as regras de negocio antes de ser considerado pronto para demo e continuidade do MVP.

## Escopo
- teste de usabilidade do onboarding
- validacao das regras de bloqueio e liberacao do produto
- validacao dos estados de wallet
- validacao dos estados de `Agent Wallet`
- validacao de mensagens de loading, erro, sucesso e bloqueio
- consolidacao de evidencias e recomendacoes para PO, dev e design

## Definition of Ready
- contrato final de wallet Solana esta fechado
- contrato final de `Agent Wallet` esta fechado
- handoff de design da Sprint 1 esta atualizado para o contrato final
- fluxo de onboarding esta implementado ao menos em ambiente navegavel
- labels e mensagens base do onboarding existem no fluxo

## Entregaveis finais da Sprint
- checklist de usabilidade do onboarding executado
- checklist de regras de negocio do onboarding executado
- registro de falhas por severidade
- recomendacoes objetivas para ajuste de dev, design e PO

## Task Q1.1: Validar usabilidade do onboarding

### Objetivo
Verificar se um usuario nao tecnico entende o fluxo de onboarding e consegue completar a jornada sem ambiguidade excessiva.

### Prioridade
P0

### Escopo
- ordem do fluxo
- entendimento de bloqueios
- entendimento da diferenca entre `Main wallet` e `Agent Wallet`
- clareza do CTA final

### Atividades
- validar entendimento de wallet primeiro e credenciais depois
- validar se o usuario entende por que o dashboard continua bloqueado
- validar se `mainWalletPublicKey` readonly e distinguido corretamente
- validar se `agentWalletPrivateKey` gera confianca suficiente com helper text
- validar se `Validate and Continue` deixa a proxima acao clara

### Entregaveis
- registro curto dos principais achados de usabilidade
- severidade dos atritos encontrados

### Dependencias
- D1.5
- D1.6
- V1.3
- V1.5

### Critério de pronto
- existe avaliacao clara dos principais pontos de hesitacao do usuario
- existe avaliacao clara sobre confianca ao pedir `agentWalletPrivateKey`
- os achados sao acionaveis por design e dev

## Task Q1.2: Validar regras de negocio do onboarding

### Objetivo
Confirmar que o produto respeita as regras de bloqueio e liberacao definidas para Sprint 1.

### Prioridade
P0

### Escopo
- bloqueio sem wallet conectada
- bloqueio sem `Agent Wallet` valida
- liberacao somente com sucesso completo
- comportamento em reload e reconexao

### Atividades
- validar bloqueio do produto sem wallet conectada
- validar bloqueio do produto com wallet conectada e credencial invalida
- validar liberacao do dashboard apenas com `status: valid` e `canProceed: true`
- validar comportamento de `autoConnect` e `reconnecting`
- validar retorno para estado pendente em caso de perda de sessao

### Entregaveis
- checklist executado das regras de negocio
- registro de desvios criticos ou ambiguos

### Dependencias
- V1.4
- V1.5
- V1.6

### Critério de pronto
- regras criticas de bloqueio e liberacao foram testadas
- qualquer desvio relevante esta documentado com severidade

## Task Q1.3: Validar mensagens, estados e recuperacao

### Objetivo
Garantir que loading, erro, sucesso e bloqueio orientem corretamente a proxima acao do usuario.

### Prioridade
P0

### Escopo
- estados de wallet
- estados de `Agent Wallet`
- erros transitorios
- erros que exigem edicao
- estado de conta pronta

### Atividades
- validar loading de conexao da wallet
- validar erro de wallet sem deixar a tela ambigua
- validar erro transitorio de validacao com retry claro
- validar erro que exige edicao de campo
- validar estado de sucesso e conta pronta
- validar consistencia entre copy, estado visual e regra de negocio

### Entregaveis
- matriz executada de estados e mensagens
- lista de problemas de clareza por prioridade

### Dependencias
- D1.4
- D1.5
- D1.6
- V1.4
- V1.5
- V1.6

### Critério de pronto
- mensagens nao deixam o usuario sem proxima acao
- loading, erro e sucesso estao coerentes com o contrato aprovado

## Task Q1.4: Consolidar relatorio de QA da Sprint 1

### Objetivo
Transformar os achados de QA em material acionavel para fechamento da sprint.

### Prioridade
P1

### Escopo
- consolidacao dos achados
- severidade
- recomendacoes objetivas
- referencia para PO, dev e design

### Atividades
- agrupar achados por usabilidade, regra de negocio e copy
- classificar severidade e impacto
- registrar recomendacao objetiva para cada achado
- separar claramente bug, ajuste de UX e melhoria

### Entregaveis
- relatorio final de QA da Sprint 1
- backlog de achados priorizado

### Dependencias
- Q1.1
- Q1.2
- Q1.3

### Critério de pronto
- PO, dev e design conseguem agir sem reinterpretar os achados

## Definicao de pronto da Sprint do QA
- onboarding foi avaliado em usabilidade
- regras de negocio do onboarding foram verificadas
- estados e mensagens foram verificados
- achados foram consolidados com severidade e recomendacao
