# Sprint 1: Checklist Go/No-Go

## Objetivo
Dar uma resposta operacional sobre se a Sprint 1 pode começar agora, o que já está pronto e o que ainda precisa ser fechado para evitar travas no meio da execução.

## Status Geral
- decisão: `GO` para iniciar a Sprint 1
- condição: iniciar foundations, shell, i18n e onboarding imediatamente
- ressalva: fechar cedo as decisões técnicas de wallet e credenciais Pacifica para concluir a parte funcional do onboarding sem retrabalho

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
- `ATENCAO` contrato final da integração de wallet ainda precisa ser congelado
- `ATENCAO` contrato final das credenciais Pacifica ainda precisa ser congelado

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
- `ATENCAO` integração real da wallet depende de escolha de provider/adapter
- `ATENCAO` validação real de credenciais depende do shape final do contrato Pacifica

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
- status: `PARTIAL`
- motivo: a task pode começar pela abstração e pelos estados, mas a integração real depende da escolha do provider/adapter
- bloqueio: decisão de wallet Solana

### V1.5 Implementar formulário de credenciais Pacifica
- status: `PARTIAL`
- motivo: UI e estados básicos podem começar, mas o formulário final depende do shape exato dos campos obrigatórios
- bloqueio: definição final de campos e semântica de validação

### V1.6 Validar credenciais Pacifica
- status: `BLOCKED_EARLY`
- motivo: depende diretamente do contrato técnico da validação
- bloqueio: payload de request, payload de sucesso, payload de erro e regra de retry

## Decisões Que Precisam Ser Fechadas Cedo

### 1. Wallet Solana
Precisa ser decidido:
- provider/adapter escolhido
- persistência mínima da sessão
- tratamento de erro esperado

Impacta:
- V1.4
- parte final de V1.3
- parte do estado global de V1.2

### 2. Credenciais Pacifica
Precisa ser decidido:
- campos obrigatórios exatos
- ação que dispara a validação
- payload de sucesso
- payload de erro
- diferença entre falha bloqueante e falha com retry

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

### Deve ser fechado antes de concluir a sprint
1. decisão de wallet Solana
2. contrato das credenciais Pacifica

## Critério de Go
A Sprint 1 deve ser considerada oficialmente liberada para início porque:
- não há bloqueio para foundations
- não há bloqueio para shell, i18n e navegação
- não há bloqueio para a UI do onboarding
- os bloqueios remanescentes afetam integração funcional específica, não o começo da sprint

## Critério de Atenção
Se wallet e contrato Pacifica não forem fechados cedo, o risco principal é:
- onboarding visual pronto, mas onboarding funcional incompleto
- retrabalho de estado e formulário
- atraso no fechamento das tasks P0 finais

## Conclusão
A resposta prática é:
- `sim, a Sprint 1 já pode começar`
- `não, ainda não está 100% pronta para fechar todas as tasks sem congelar wallet e Pacifica`
