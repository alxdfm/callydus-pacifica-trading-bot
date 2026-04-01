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
- credenciais Pacifica
- qualquer material associado a private key
- tokens de integração
- credenciais de infraestrutura

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

### `apps/worker`
Pode acessar segredos necessários para integração contínua com Pacifica.

## Arquivos Locais
- usar `.env.local` para desenvolvimento local
- nunca commitar `.env`
- manter `.env.example` quando fizer sentido para onboarding técnico

No estado atual do projeto:
- existe um `.env.example` na raiz do monorepo com as variaveis minimas para banco local, integracao Pacifica e criptografia de credenciais
- para a trilha funcional com Builder Program, o ambiente tambem deve prever `PACIFICA_BUILDER_CODE` e `PACIFICA_BUILDER_MAX_FEE_RATE`

Semantica atual dessas variaveis:
- `PACIFICA_BUILDER_MAX_FEE_RATE` e usado no fluxo de aprovacao/autorizacao do builder code
- requests de criacao de ordem usam `builder_code`; `max_fee_rate` nao entra no payload de ordem

## Próxima Regra Operacional
Antes do deploy real, definir:
- onde os segredos ficarão em `dev`
- onde os segredos ficarão em `prod`
- quem pode rotacioná-los
- como registrar auditoria mínima de uso e falha
