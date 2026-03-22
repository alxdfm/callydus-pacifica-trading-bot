# Arquitetura Base Definida

## Objetivo
Definir a base técnica do MVP web do trading bot Pacifica, alinhada ao produto e às decisões já tomadas para a primeira fase de desenvolvimento.

## Decisão de Arquitetura
A stack base do produto fica definida assim:

- `app`: `React + Vite`
- `api`: `AWS Lambda`
- `worker`: container sempre ativo (`Fargate`, `App Runner` ou VPS pequeno)
- `db`: `PostgreSQL`

## Princípios
- separar claramente aplicação operacional e execução do bot
- manter o frontend desacoplado da Pacifica
- tratar comandos operacionais como ações sensíveis
- começar com contratos explícitos entre `app`, `api` e `worker`
- evitar infraestrutura pesada antes de existir necessidade real

## Leitura do Produto
Pelo material em `docs/product`, o MVP precisa de:
- onboarding com wallet Solana e credenciais Pacifica
- seleção e ativação de presets
- dashboard com estado da conta e do bot
- lista de trades atuais com ação de encerramento manual
- histórico de trades encerrados

Isso exige 3 responsabilidades técnicas distintas:
- aplicação operacional autenticada
- API segura para leitura e comando
- execução contínua do bot e sincronização operacional

## Arquitetura Sugerida

### Modelo
Arquitetura em monorepo com apps separados e pacotes compartilhados.

```text
apps/
  app/         -> painel operacional autenticado
  api/         -> endpoints serverless e orquestração
  worker/      -> sync, polling e execução contínua do bot

packages/
  contracts/   -> schemas e tipos compartilhados
  domain/      -> regras de negócio e mapeamentos
  ui/          -> componentes compartilháveis
  config/      -> tsconfig, lint e presets internos
```

## Responsabilidades

### `apps/app`
- renderiza onboarding, dashboard, presets, trades atuais e histórico
- consome apenas a API interna
- mantém estado de sessão e estado de consulta de UI
- nunca fala com Pacifica diretamente

### `apps/api`
- expõe endpoints usados pela aplicação
- valida payloads e serializa respostas
- protege ações sensíveis como ativar preset, pausar bot e encerrar trade
- lê e grava estado operacional persistido
- delega execução contínua ao worker

### `apps/worker`
- executa polling de status e sincronização de dados
- integra com Pacifica
- aplica presets e comandos operacionais
- consolida estado derivado para leitura rápida da API
- permanece sempre ativo, fora do modelo request/response do Lambda

## Stack Definida

### Workspace e linguagem
- `pnpm` workspaces
- `TypeScript` end-to-end
- `Node.js`

Motivo:
- reduz atrito entre apps e pacotes
- facilita compartilhar contratos e tipos
- mantém setup simples para MVP

### Aplicação
- `React`
- `Vite`
- `TanStack Query`
- `React Hook Form` + `zod`
- `Tailwind CSS`

Motivo:
- a aplicação é um painel autenticado e operacional
- `Vite` reduz complexidade e acelera o desenvolvimento da SPA
- `TanStack Query` resolve polling, cache, invalidação e mutations
- `React Hook Form` + `zod` cobre bem onboarding e ações operacionais com validação explícita

### API
- `AWS Lambda`
- `API Gateway`
- `zod` para validação de borda

Motivo:
- combina bem com endpoints stateless de leitura e comando
- reduz esforço inicial de infraestrutura para a camada HTTP
- permite escalar a API separadamente do worker

### Worker
- `Node.js` em container sempre ativo
- deploy alvo: `Fargate`, `App Runner` ou VPS pequeno

Motivo:
- o bot precisa de processo contínuo para polling, reconciliação e execução operacional
- isso não se encaixa bem no ciclo curto de invocação do Lambda

### Persistência
- `PostgreSQL`
- `Prisma` como ORM e migrations

Motivo:
- há estado operacional, auditoria básica, preset ativo, credenciais e histórico
- o produto exige leitura cronológica, consistência e evolução de consultas
- PostgreSQL oferece uma base mais previsível para esse tipo de domínio

### Testes
- `Vitest` para unit e integração leve
- `Playwright` para fluxos críticos

Cobertura prioritária:
- onboarding
- ativação de preset
- pausa/retomada do bot
- encerramento manual de trade
- leitura de dashboard e histórico

## Fluxo de Responsabilidades
1. a `app` chama a `api`
2. a `api` consulta o `PostgreSQL`
3. a `api` retorna contratos próprios do produto
4. quando necessário, a `api` registra comandos para o `worker`
5. o `worker` executa, sincroniza e persiste o estado atualizado

## Modelo de Dados Inicial

### Entidades mínimas
- `wallet_connections`
- `pacifica_credentials`
- `bot_runtime_state`
- `presets`
- `preset_activations`
- `open_trades`
- `closed_trades`
- `bot_commands`
- `operational_alerts`

### Regra importante
O frontend não deve montar seu próprio modelo de tela a partir de dados crus da Pacifica. A API deve expor contratos próprios do produto.

## Contratos que Devem Nascer Primeiro

### Onboarding
- wallet conectada
- credenciais Pacifica válidas ou inválidas
- estados de erro bloqueante e erro reexecutável

### Dashboard
- saldo
- pnl agregado
- preset ativo
- status do bot
- resumo de trades abertos
- trades recentes
- alertas

### Presets
- catálogo com 3 presets fixos
- revisão apenas dos campos editáveis do MVP
- ativação explícita do preset

### Trades Atuais
- lista de trades abertos
- detalhe resumido
- ação de encerramento

### Histórico
- lista cronológica
- resultado
- motivo de encerramento em linguagem simples

### Bot Commands
- ativar preset
- pausar bot
- retomar bot
- encerrar trade

## Decisões de Segurança
- credenciais Pacifica nunca vão ao browser depois do envio inicial
- ações destrutivas exigem endpoint dedicado e logging de auditoria
- comandos do bot devem ser idempotentes quando aplicável
- integração externa deve ficar isolada em adapter no worker
- a `app` nunca acessa Pacifica diretamente

## O Que Não Fazer na Base Inicial
- não acoplar UI diretamente ao formato da Pacifica
- não mover o worker principal para Lambda
- não introduzir event bus ou fila antes de existir pressão real
- não começar por uma biblioteca de design grande
- não misturar regra operacional do bot dentro da SPA

## Estrutura Recomendada de Entrega

### Fase 1
- monorepo
- `app` em React + Vite
- API mínima em Lambda
- pacote `contracts`
- banco e migrations
- mocks do produto

### Fase 2
- onboarding funcional
- presets
- dashboard com polling simples

### Fase 3
- trades atuais
- histórico
- comandos operacionais reais
- worker integrado com Pacifica

## Primeiro Passo Técnico
Congelar o pacote `packages/contracts` com schemas de:
- onboarding
- dashboard
- preset catalog
- preset activation
- current trades
- history
- bot commands

Sem isso, `app`, `api` e `worker` começam a evoluir sem fronteira estável e o retrabalho sobe rápido.
