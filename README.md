# Pacifica Trading Bot

Monorepo do MVP Pacifica com `app`, contratos compartilhados e base para API/worker.

## Requisitos

- `Node.js` 20+
- `pnpm` 10+

## Instalação

Na raiz do projeto:

```bash
pnpm install
```

Crie seu arquivo local de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

## Como rodar

Hoje, o fluxo útil para desenvolvimento está no conjunto `database + api + app`, e o `worker` ja pode ser iniciado no primeiro corte do `FM-013`.

Subir o PostgreSQL local via `docker compose`:

```bash
pnpm db:up
```

Aplicar o schema atual no banco local:

```bash
pnpm --filter @pacifica/database db:push
```

Subir a API local do Functional MVP:

```bash
pnpm --filter @pacifica/api dev
```

Subir o worker local em modo dev:

```bash
pnpm --filter @pacifica/worker dev
```

Subir o app em modo dev:

```bash
pnpm --filter @pacifica/app dev
```

O `app`, a `api`, o `worker` e o `database` carregam o `.env` da raiz automaticamente.

O Vite deve abrir em algo como:

```txt
http://localhost:5173
```

## Comandos úteis

Rodar typecheck do app:

```bash
pnpm --filter @pacifica/app typecheck
```

Rodar typecheck do worker:

```bash
pnpm --filter @pacifica/worker typecheck
```

Gerar build do app:

```bash
pnpm --filter @pacifica/app build
```

Rodar typecheck do workspace:

```bash
pnpm typecheck
```

Ver logs do banco:

```bash
pnpm db:logs
```

Derrubar o banco local:

```bash
pnpm db:down
```

## Teste manual do onboarding

1. Rode `pnpm --filter @pacifica/app dev`
2. Abra `http://localhost:5173`
3. Tenha a extensão `Phantom` instalada no navegador
4. Clique em `Connect wallet`
5. Clique em `Approve builder code` e aprove a assinatura na wallet principal
6. Preencha `Agent Wallet public key` e `Agent Wallet private key`
7. Use a private key no mesmo formato `base58` entregue pela Pacifica
8. Clique em `Validate and Continue`

## Estrutura

- `apps/app`: frontend React + Vite
- `apps/api`: base da API
- `apps/worker`: worker operacional continuo
- `packages/contracts`: contratos compartilhados
- `packages/database`: schema Prisma e base de dados
- `docker-compose.yml`: PostgreSQL local para desenvolvimento

## Worker

No estado atual do `FM-013`, o `worker`:
- varre contas com `preset` ativo
- assume ownership por conta via lease persistida em `BotRuntimeState`
- registra `heartbeat` real no runtime
- libera ownership em pause, desativacao ou shutdown

Ele ainda nao:
- avalia sinais em loop
- cria ordens reais na Pacifica
- fecha trades automaticamente

Esses proximos passos ficam para `FM-014` em diante.

## Banco local

O PostgreSQL do projeto sobe por `docker compose` na porta local `55432` por padrao, para evitar conflito com instalacoes locais ja rodando em portas mais comuns.

## Validacao de credenciais

Para o fluxo do `FM-002`, o app espera:
- `VITE_APP_API_BASE_URL=http://localhost:3000`
- `APP_ORIGIN=http://localhost:5173`
- `VITE_PACIFICA_BUILDER_CODE` e `VITE_PACIFICA_BUILDER_MAX_FEE_RATE` iguais aos valores configurados na API
- API local em execucao
- banco local aplicado
- `PACIFICA_REST_BASE_URL`, `PACIFICA_BUILDER_CODE`, `PACIFICA_BUILDER_MAX_FEE_RATE`, `CREDENTIAL_ENCRYPTION_KEY` e `CREDENTIAL_ENCRYPTION_KEY_ID` preenchidos no ambiente da API

Para o `Run readiness check`, a API usa por padrao:
- `PACIFICA_OPERATIONAL_PROBE_SYMBOL=BTC`
- `PACIFICA_OPERATIONAL_PROBE_PRICE=20000`
- `PACIFICA_OPERATIONAL_PROBE_TARGET_NOTIONAL_USD=11`
- `PACIFICA_OPERATIONAL_PROBE_TIF=ALO`
