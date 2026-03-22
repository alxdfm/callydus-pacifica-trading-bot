# Sprint 1: Handoff Operacional de Execucao

## Objetivo
Garantir que a Sprint 1 siga em execucao sem ambiguidade de ownership, sem drift de escopo e sem travar o fechamento funcional do onboarding.

## Decisao Operacional
- a Sprint 1 segue em `GO`
- design e dev devem trabalhar em paralelo desde agora
- onboarding visual nao deve esperar congelamento de wallet e Pacifica
- onboarding funcional final nao pode ser considerado fechado antes do checkpoint de contratos
- a prioridade continua sendo fechar bem o onboarding sem ampliar escopo

## Fluxo de Trabalho Aprovado
1. design fecha onboarding, estados criticos, microcopy e revisao mobile
2. dev implementa foundations, shell, i18n, estado global minimo e estrutura do onboarding em paralelo
3. dev usa mocks e adapters locais nas partes dependentes de contrato externo
4. PO fecha cedo as decisoes de wallet Solana e credenciais Pacifica
5. so depois do checkpoint fechado dev conclui integracao funcional e validacoes finais

## Responsabilidades por Papel

### PO
- owner por congelar cedo as decisoes de produto e contrato que destravam o fechamento funcional da sprint
- owner por manter o escopo do MVP protegido
- owner por decidir em caso de conflito entre velocidade e escopo
- owner por validar se a sprint continua segura ou se algum item precisa ser reclassificado como bloqueio

### Designer
- owner por entregar onboarding desktop e mobile sem lacunas de intencao
- owner por fechar estados criticos de wallet e credenciais
- owner por fechar microcopy curta de erro, sucesso e bloqueio
- owner por garantir que o handoff continue utilizavel por dev e QA sem adivinhacao
- owner por nao expandir fluxo ou complexidade visual fora do onboarding aprovado

### Dev
- owner por iniciar imediatamente foundations, shell, i18n, estado global minimo e estrutura do onboarding
- owner por implementar com mocks e adapters locais enquanto os contratos finais nao estiverem congelados
- owner por propor rapidamente as opcoes tecnicas que o PO precisa decidir
- owner por nao fechar como concluida a integracao funcional de wallet ou Pacifica antes do checkpoint de contrato
- owner por sinalizar cedo qualquer risco de retrabalho ou incompatibilidade tecnica

### QA
- owner por usar o handoff e os cards da sprint como referencia de cobertura esperada
- owner por validar fluxo de onboarding, estados criticos e bloqueio de acesso ao produto
- owner por diferenciar claramente o que e problema visual, problema funcional e problema de contrato ainda em aberto

## Checkpoint Obrigatorio do Inicio da Sprint
Este checkpoint deve acontecer cedo. A sprint pode andar antes dele, mas nao pode fechar onboarding funcional sem ele.

### Wallet Solana
- [ ] provider ou adapter escolhido
- [ ] persistencia minima da sessao definida
- [ ] comportamento de erro definido

### Credenciais Pacifica
- [ ] campos obrigatorios exatos definidos
- [ ] acao que dispara a validacao definida
- [ ] payload de sucesso definido
- [ ] payload de erro definido
- [ ] regra de retry versus falha bloqueante definida

## Regra de Paralelismo
- design nao precisa esperar contrato final para concluir onboarding visual
- dev nao precisa esperar contrato final para concluir foundations e estrutura do onboarding
- dev pode avancar V1.4 e V1.5 parcialmente por abstracao, estado e UI
- V1.6 deve permanecer tratada como fechamento dependente de contrato

## O Que Pode Andar Agora
- D1.1 a D1.7
- V1.1
- V1.2
- V1.3
- parte estrutural de V1.4
- parte estrutural de V1.5

## O Que Nao Pode Ser Dado Como Fechado Antes do Checkpoint
- integracao funcional final de wallet Solana
- validacao funcional final das credenciais Pacifica
- desbloqueio definitivo do acesso ao produto com contrato real

## Critério de Sprint Segura
A Sprint 1 permanece segura para seguir o desenvolvimento se:
- foundations, shell, i18n e estrutura do onboarding estiverem andando sem bloqueio
- design entregar onboarding e estados sem depender do contrato final
- checkpoint de wallet e Pacifica for tratado como prioridade de inicio de sprint
- nenhuma squad ampliar escopo alem do onboarding e foundations aprovados

## Critério de Escalada para PO
Escalar imediatamente para PO se ocorrer qualquer um destes casos:
- proposta de adicionar novos campos, novas etapas ou novas regras ao onboarding
- necessidade de mudar a regra de bloqueio do produto
- conflito entre contrato tecnico proposto e fluxo de produto aprovado
- risco de retrabalho relevante em V1.4, V1.5 ou V1.6

## Resultado Esperado
- onboarding visual fecha cedo
- foundations tecnicas andam sem espera desnecessaria
- integracoes finais fecham com menos retrabalho
- a sprint mantem foco no MVP e evita escopo paralelo
