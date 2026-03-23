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

## Como rodar

Hoje, o fluxo útil para desenvolvimento está no frontend `app`.

Subir o app em modo dev:

```bash
pnpm --filter @pacifica/app dev
```

O Vite deve abrir em algo como:

```txt
http://localhost:5173
```

## Comandos úteis

Rodar typecheck do app:

```bash
pnpm --filter @pacifica/app typecheck
```

Gerar build do app:

```bash
pnpm --filter @pacifica/app build
```

Rodar typecheck do workspace:

```bash
pnpm typecheck
```

## Teste manual do onboarding

1. Rode `pnpm --filter @pacifica/app dev`
2. Abra `http://localhost:5173`
3. Tenha a extensão `Phantom` instalada no navegador
4. Clique em `Connect wallet`
5. Preencha `Agent Wallet public key` e `Agent Wallet private key`
6. Use a private key no mesmo formato `base58` entregue pela Pacifica
7. Clique em `Validate and Continue`

## Estrutura

- `apps/app`: frontend React + Vite
- `apps/api`: base da API
- `apps/worker`: base do worker
- `packages/contracts`: contratos compartilhados
- `packages/database`: schema Prisma e base de dados
