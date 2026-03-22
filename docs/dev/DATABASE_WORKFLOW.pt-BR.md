# Fluxo de Banco de Dados

## Objetivo
Definir o fluxo mínimo de trabalho para schema, validação e migrations do PostgreSQL com Prisma.

## Fonte de Verdade
A fonte de verdade estrutural do banco é:
- `packages/database/prisma/schema.prisma`

## Ordem de Trabalho
1. ajustar modelagem nos docs, quando a mudança for estrutural
2. refletir a mudança em `schema.prisma`
3. validar o schema
4. gerar migration
5. revisar impacto nos contratos compartilhados
6. só então consumir a mudança em `app`, `api` ou `worker`

## Regras
- não mudar schema direto no banco manualmente em ambiente normal
- não criar migration sem entender o impacto no domínio
- mudanças de status, enums e constraints exigem revisão cuidadosa
- toda mudança estrutural relevante deve manter coerência com `packages/contracts`

## Validação Local
Comandos base:
- `pnpm --filter @pacifica/database typecheck`
- `pnpm --filter @pacifica/database prisma:format`

## Migrations
Quando a camada de banco for aberta de vez, o fluxo deve incluir:
- gerar migration com nome descritivo
- revisar SQL gerado
- aplicar primeiro em ambiente local/dev
- validar compatibilidade com dados existentes, quando houver

## Regra de Segurança
Mudanças em tabelas de credenciais, comandos operacionais e trades exigem cuidado extra, porque impactam:
- auditoria
- segurança
- rastreabilidade
- reconciliação operacional
