# Guia do Monorepo

## Objetivo
Explicar como o workspace está organizado, qual a responsabilidade de cada pacote e como trabalhar no repositório sem criar acoplamento desnecessário.

## Estrutura Atual
```text
apps/
  app/         -> frontend operacional
  api/         -> API e orquestração
  worker/      -> execução contínua e sync operacional

packages/
  contracts/   -> tipos, schemas e contratos compartilhados
  database/    -> schema Prisma e artefatos de persistência
  config/      -> espaço reservado para presets compartilhados de tooling
```

## Regra Principal
- `apps` executam fluxos do produto
- `packages` fornecem capacidades compartilhadas

## Dependências Permitidas
- `apps/app` pode depender de `packages/contracts`
- `apps/api` pode depender de `packages/contracts` e `packages/database`
- `apps/worker` pode depender de `packages/contracts` e `packages/database`
- `packages/contracts` não depende de app
- `packages/database` não depende de app

## Regras de Organização
- não colocar regra de negócio compartilhada direto dentro de `apps/app`
- não duplicar tipos entre frontend, API e worker
- qualquer contrato compartilhado deve nascer em `packages/contracts`
- qualquer mudança estrutural no banco deve nascer em `packages/database`

## Scripts
Comandos principais na raiz:
- `pnpm install`
- `pnpm -r typecheck`
- `pnpm --filter <package> <script>`

## Critério de Evolução
Criar novo pacote apenas quando houver uma fronteira real de responsabilidade, não por preferência estética.
