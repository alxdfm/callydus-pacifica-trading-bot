# Secrets e Ambientes

## Objetivo
Definir regras mínimas para ambientes e tratamento de segredos, especialmente as credenciais sensíveis da Pacifica.

## Ambientes Mínimos
- `local`
- `dev`
- `prod`

## Regra Geral
Nenhum segredo sensível deve ficar hardcoded em código, commitado em repositório ou exposto ao browser.

## Segredos Sensíveis
Tratar como segredo crítico:
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- credenciais Pacifica
- qualquer material associado a private key
- tokens de integração
- credenciais de infraestrutura

## Banco e Conexões
Para o MVP, o banco escolhido é `Supabase Postgres`.

Regra operacional para ambientes com `Prisma`:

- `DATABASE_URL` deve representar a conexão usada pelo runtime da aplicação
- `DIRECT_DATABASE_URL` deve representar a conexão direta usada por migrações e tarefas administrativas

Regra específica para serverless:

- `apps/api` em `AWS Lambda` deve usar o `Supabase Transaction Pooler` em `DATABASE_URL`
- funções serverless agendadas, como o refresh de market data, devem seguir a mesma estratégia
- `DIRECT_DATABASE_URL` deve ficar reservada para `prisma migrate`, manutenção e operações administrativas

Motivo:

- `Prisma` usa conexões TCP persistentes
- em `Lambda`, concorrência pode esgotar rápido o pool do banco
- o `Transaction Pooler` reduz esse risco no runtime serverless

## Pacifica
Regras obrigatórias:
- private key nunca em texto puro no banco
- usar referência criptografada ou envelope criptográfico
- preferir KMS ou equivalente para criptografia e rotação
- logs não podem registrar payload sensível
- o browser não deve receber segredo após submissão inicial
- acesso ao segredo deve ficar restrito ao fluxo de validação e ao worker

## Variáveis por Camada
### `apps/app`
Pode receber apenas variáveis públicas ou seguras para frontend.

### `apps/api`
Pode acessar segredos necessários para orquestração e validação controlada.

No deploy alvo atual:
- `DATABASE_URL` deve apontar para o `Transaction Pooler` do `Supabase`
- `DIRECT_DATABASE_URL` deve existir para migrações e manutenção
- segredos sensíveis nunca devem ir para variáveis `VITE_*`

### `apps/worker`
Pode acessar segredos necessários para integração contínua com Pacifica.

No deploy alvo atual:
- pode usar `DATABASE_URL` direta ou via pooler, conforme comportamento operacional observado
- deve ter acesso a `DIRECT_DATABASE_URL` quando houver necessidade de operação administrativa controlada

### `packages/database`
O pacote de banco e os fluxos de migração devem preferir:

- `DIRECT_DATABASE_URL` para `migrate`, manutenção e tarefas administrativas
- `DATABASE_URL` apenas quando o fluxo exigir compatibilidade explícita com o runtime da aplicação

## Arquivos Locais
- usar `.env.local` para desenvolvimento local
- nunca commitar `.env`
- manter `.env.example` quando fizer sentido para onboarding técnico

No estado atual do projeto:
- existe um `.env.example` na raiz do monorepo com as variaveis minimas para banco local, integracao Pacifica e criptografia de credenciais
- para a trilha funcional com Builder Program, o ambiente tambem deve prever `PACIFICA_BUILDER_CODE` e `PACIFICA_BUILDER_MAX_FEE_RATE`
- o arquivo de exemplo ainda nao separa `DATABASE_URL` e `DIRECT_DATABASE_URL`, mas essa separacao passa a ser recomendada para o deploy alvo

Semantica atual dessas variaveis:
- `PACIFICA_BUILDER_MAX_FEE_RATE` e usado no fluxo de aprovacao/autorizacao do builder code
- requests de criacao de ordem usam `builder_code`; `max_fee_rate` nao entra no payload de ordem

## Próxima Regra Operacional
Antes do deploy real, definir:
- onde os segredos ficarão em `dev`
- onde os segredos ficarão em `prod`
- quem pode rotacioná-los
- como registrar auditoria mínima de uso e falha
- qual valor será usado em `DATABASE_URL` por serviço
- qual valor será usado em `DIRECT_DATABASE_URL` para migrações e administração
