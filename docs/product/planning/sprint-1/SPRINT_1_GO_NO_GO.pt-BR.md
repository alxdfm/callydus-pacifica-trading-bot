# Sprint 1: Checklist Go/No-Go

## Objetivo
Dar uma resposta operacional sobre se a Sprint 1 pode começar agora, o que já está pronto e o que ainda precisa ser fechado para evitar travas no meio da execução.

## Status Geral
- decisão: `GO` para iniciar a Sprint 1
- condição: iniciar foundations, shell, i18n e onboarding imediatamente
- ressalva: executar cedo a implementação técnica de wallet e credenciais Pacifica agora que o contrato de dev foi congelado

## Resumo Executivo
A Sprint 1 pode começar agora porque já existem:
- escopo definido
- fluxo de onboarding definido
- regras de navegação e bloqueio definidas
- base visual e handoff de design prontos
- tasks de design e desenvolvimento detalhadas

Os únicos bloqueios relevantes para concluir toda a sprint não impedem o início, mas impedem o fechamento completo de parte do onboarding funcional se permanecerem em aberto.

## Checklist de Prontidão

### Produto
- `OK` MVP Scope Lock aprovado
- `OK` foco da Sprint 1 está claro: foundations, onboarding e i18n
- `OK` comportamento de bloqueio de acesso ao dashboard está definido
- `OK` idioma base em inglês está definido
- `OK` contrato técnico de wallet fechado para dev
- `OK` contrato técnico das credenciais Pacifica fechado como fluxo de `Agent Wallet`

### Design
- `OK` direção visual aprovada
- `OK` design system base documentado
- `OK` componentes principais definidos
- `OK` onboarding desktop e mobile mockados
- `OK` handoff visual para implementação disponível
- `OK` labels e estrutura compatíveis com i18n

### Desenvolvimento
- `OK` shell base do app pode começar imediatamente
- `OK` roteamento principal pode começar imediatamente
- `OK` camada de i18n pode começar imediatamente
- `OK` estado global mínimo pode começar imediatamente
- `OK` estrutura visual do onboarding pode começar imediatamente
- `OK` integração da wallet já tem adapter e estratégia de sessão definidos
- `OK` validação de credenciais já tem contrato técnico de request/response definido

## Status por Task da Sprint

### V1.1 Estruturar shell base da aplicação
- status: `READY`
- motivo: não depende de decisão técnica em aberto
- observação: já existe direção visual suficiente para implementar layout base, topbar, sidebar, rotas e i18n foundation

### V1.2 Implementar estado global mínimo da aplicação
- status: `READY`
- motivo: o modelo geral de onboarding, bloqueio e locale já está claro
- observação: alguns detalhes do shape final podem evoluir, mas a task pode começar sem risco alto

### V1.3 Implementar tela de onboarding
- status: `READY`
- motivo: fluxo, blocos principais, estados e hierarquia visual já estão definidos
- observação: pode ser construída com mocks e adapter local enquanto contratos finais não são congelados

### V1.4 Integrar conexão de wallet Solana
- status: `READY`
- motivo: provider, persistência mínima e estados de erro já estão fechados para dev
- bloqueio: nenhum

### V1.5 Implementar formulário de credenciais Pacifica
- status: `READY`
- motivo: campos e semântica de validação já estão fechados no contrato técnico de `Agent Wallet`
- bloqueio: nenhum

### V1.6 Validar credenciais Pacifica
- status: `READY`
- motivo: payload de request, sucesso, erro e regra de retry já estão definidos para dev
- bloqueio: nenhum

## Decisões Que Precisam Ser Fechadas Cedo

### 1. Wallet Solana
Fechado para dev:
- provider/adapter: adapter interno com implementacao inicial via `@solana/wallet-adapter`
- persistência mínima: estado local de UX com tentativa de `autoConnect`
- tratamento de erro: codigos fechados para ausencia de provider, rejeicao, falha e perda de sessao

Impacta:
- V1.4
- parte final de V1.3
- parte do estado global de V1.2

### 2. Credenciais Pacifica
Fechado para dev:
- campos obrigatórios: `agentWalletPublicKey` e `agentWalletPrivateKey`
- ação de validação: CTA explicito `Validate and Continue`
- payload de sucesso: contrato com `credentialId`, `keyFingerprint`, `validationStatus` e `canProceed`
- payload de erro: contrato com `code`, `message`, `retryable`, `field` e `canProceed`
- regra de retry: apenas erros transitórios podem repetir sem editar campos

Impacta:
- V1.5
- V1.6
- mensagens e estados de onboarding

## Recomendação de Execução

### Pode começar agora
1. V1.1
2. V1.2
3. V1.3
4. estrutura de V1.4 com adapter abstrato
5. estrutura de V1.5 com contrato provisório local

### Deve ser executado cedo para concluir a sprint
1. implementar a integracao da wallet no adapter interno escolhido
2. implementar a validacao Pacifica contra o contrato tecnico fechado

## Critério de Go
A Sprint 1 deve ser considerada oficialmente liberada para início porque:
- não há bloqueio para foundations
- não há bloqueio para shell, i18n e navegação
- não há bloqueio para a UI do onboarding
- o checkpoint tecnico de dev ja foi fechado e o risco principal passa a ser de execucao, nao de definicao

## Critério de Atenção
Se wallet e contrato Pacifica não forem fechados cedo, o risco principal é:
- atraso de implementacao nas tasks P0 finais
- integracao parcial sem cobertura adequada de estados de erro
- divergencia se algum time reabrir contrato ja congelado

## Conclusão
A resposta prática é:
- `sim, a Sprint 1 já pode começar`
- `sim, o checkpoint tecnico de dev ja esta fechado para concluir as tasks sem ambiguidade de contrato`
