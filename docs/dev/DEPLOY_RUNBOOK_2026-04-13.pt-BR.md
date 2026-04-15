# Deploy Runbook — MVP

## Data de referência
`2026-04-13` (atualizado `2026-04-15`)

## Pré-requisitos

Antes de começar, você vai precisar de:

- Conta AWS ativa (qualquer tier)
- Conta Supabase (free tier é suficiente)
- Conta Oracle Cloud (para o worker — free tier)
- `pnpm` instalado
- AWS CLI instalado e configurado (`aws configure`)
- Node.js 20+

---

## Parte 1 — Banco de dados (Supabase)

### 1.1 Criar projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Escolha uma região próxima (ex: `us-east-1` para alinhar com a Lambda)
3. Defina uma senha forte para o banco e guarde — você vai precisar dela
4. **Desative** "Enable Data API (REST, GraphQL)" e "Enable automatic RLS" — não são usados neste projeto

### 1.2 Coletar as strings de conexão

No painel Supabase, vá em **Project Settings → Database → Connection string**.

Você precisa de dois valores:

**`DATABASE_URL`** — Transaction Pooler (para o Lambda)
```
postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**`DIRECT_DATABASE_URL`** — Conexão direta (para migrations)
```
postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

> **Por que dois?** O Lambda usa o Transaction Pooler para evitar esgotar conexões TCP sob concorrência. As migrations precisam de conexão direta (o PgBouncer não suporta DDL em modo transação).

### 1.3 Rodar migrations no Supabase

Com a `DIRECT_DATABASE_URL` em mãos, rode as migrations a partir da raiz do monorepo:

```bash
DIRECT_DATABASE_URL="postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
pnpm --filter @pacifica/database exec prisma migrate deploy
```

Verifique no painel Supabase em **Table Editor** se as tabelas foram criadas.

> **Atenção:** O `schema.prisma` precisa ter `directUrl = env("DIRECT_DATABASE_URL")` na datasource. Sem isso, o Prisma usa o Transaction Pooler para migrations e trava (PgBouncer não suporta advisory locks).

---

## Parte 2 — AWS

### 2.1 Configurar credenciais AWS

Se ainda não configurou:

```bash
aws configure
# AWS Access Key ID: [sua key]
# AWS Secret Access Key: [seu secret]
# Default region name: us-east-1
# Default output format: json
```

Verifique:
```bash
aws sts get-caller-identity
```

### 2.2 Bootstrap do SST

Rode uma única vez por conta AWS + região:

```bash
npx sst install
```

Isso cria os buckets e roles necessários para o SST gerenciar o deploy.

---

## Parte 3 — Prisma Engine Layer (pré-requisito do deploy)

> **Por que é necessário?** O SST usa esbuild para empacotar as Lambdas. O `copyFiles` do SST **não copia arquivos `.so.node`** (binários nativos) — ele os ignora silenciosamente. O binário do Prisma (`libquery_engine-rhel-openssl-3.0.x.so.node`) precisa chegar na Lambda via **Lambda Layer**.

Este passo só precisa ser repetido se a versão do Prisma mudar.

### 3.1 Gerar o binário para Lambda

```bash
pnpm --filter @pacifica/database exec prisma generate
```

O `schema.prisma` precisa ter `binaryTargets = ["native", "rhel-openssl-3.0.x"]`.

### 3.2 Criar o ZIP da Layer

```bash
# Localizar o binário gerado
BINARY=$(find node_modules/.pnpm -name "libquery_engine-rhel-openssl-3.0.x.so.node" 2>/dev/null | head -1)
echo "Binário encontrado: $BINARY"

# Criar o ZIP (flag -j remove caminhos — o arquivo fica na raiz do ZIP)
mkdir -p .build/prisma-layer
cp "$BINARY" .build/prisma-layer/
cd .build/prisma-layer && zip -j prisma-engine.zip libquery_engine-rhel-openssl-3.0.x.so.node && cd ../..
```

### 3.3 Fazer upload como Lambda Layer

```bash
aws lambda publish-layer-version \
  --layer-name prisma-engine-rhel-3 \
  --zip-file fileb://.build/prisma-layer/prisma-engine.zip \
  --compatible-runtimes nodejs22.x \
  --compatible-architectures x86_64 \
  --region us-east-1
```

Guarde o `LayerVersionArn` do output (ex: `arn:aws:lambda:us-east-1:943378954443:layer:prisma-engine-rhel-3:1`).

### 3.4 Atualizar o ARN no sst.config.ts

No `sst.config.ts`, atualize a constante `PRISMA_ENGINE_LAYER` com o ARN obtido.

---

## Parte 4 — Secrets (SST Parameter Store)

O SST armazena secrets no AWS SSM Parameter Store. Rode cada comando abaixo com os valores reais:

```bash
# Para o stage de produção, adicione --stage production em cada comando
npx sst secret set DatabaseUrl "postgres://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true" --stage production

npx sst secret set DirectDatabaseUrl "postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres" --stage production

npx sst secret set CredentialEncryptionKey "[string aleatória de 32+ chars — gere com: openssl rand -hex 32]" --stage production

npx sst secret set PacificaBuilderCode "[seu builder code da Pacifica]" --stage production

npx sst secret set InternalApiSecret "[string aleatória — gere com: openssl rand -hex 24]" --stage production
```

> Para gerar valores seguros:
> ```bash
> openssl rand -hex 32   # para CredentialEncryptionKey
> openssl rand -hex 24   # para InternalApiSecret
> ```

> **Atenção:** Os secrets são escopados por stage. `npx sst secret set DatabaseUrl "..."` sem `--stage production` só afeta o stage padrão (seu username). Sempre especifique `--stage production` para produção.

> **Atenção:** Se você já tem credenciais criptografadas no banco local com `CREDENTIAL_ENCRYPTION_KEY` do `.env`, use o **mesmo valor** em produção. Chaves diferentes = credenciais ilegíveis.

Para verificar os secrets configurados:
```bash
npx sst secret list --stage production
```

---

## Parte 5 — Deploy da API (AWS)

### 5.1 Deploy de produção

```bash
npx sst deploy --stage production
```

> **Atenção:** `npx sst deploy` sem `--stage production` deploya no stage padrão (seu username). Os dois stages são independentes e têm URLs de API Gateway diferentes.

Isso vai:
- Empacotar os Lambdas com esbuild
- Anexar o Lambda Layer com o binário do Prisma
- Criar o API Gateway HTTP API
- Criar as duas funções Lambda (`httpHandler` e `marketRefreshHandler`)
- Configurar o EventBridge Cron (market refresh a cada 1 minuto)

### 5.2 Descobrir a URL de produção

O `sst output` não funciona no SST v3 Ion. Use:

```bash
aws apigatewayv2 get-apis --region us-east-1 \
  --query 'Items[].{Name:Name,Endpoint:ApiEndpoint}' --output json
```

Procure pelo item com `production` no nome. A URL de produção atual é:
```
https://s4z1roxf80.execute-api.us-east-1.amazonaws.com
```

---

## Parte 6 — Frontend (Amplify Hosting)

### 6.1 Variáveis de ambiente no Amplify

No painel AWS → Amplify → seu app → Environment variables:

```
VITE_APP_API_BASE_URL=https://s4z1roxf80.execute-api.us-east-1.amazonaws.com
VITE_APP_WALLETCONNECT_PROJECT_ID=[seu project id]
VITE_APP_CHAIN_ID=1
VITE_APP_CHAIN_NAME=Ethereum
```

> A URL deve apontar para o API Gateway de **produção**, não o de dev. Verifique com o comando acima se a URL mudou após redeploys.

### 6.2 Build e deploy

O `amplify.yml` na raiz do repo já está configurado. Conecte o repo no painel Amplify em **New app → Host web app → GitHub**.

Configure:
- **App root directory:** `apps/app`
- **Build command:** detectado automaticamente via `amplify.yml`

---

## Parte 7 — Worker (Oracle Cloud Always Free)

### 7.1 Criar instância

1. Acesse [cloud.oracle.com](https://cloud.oracle.com)
2. Crie uma instância **VM.Standard.A1.Flex** (Always Free):
   - Shape: 2 OCPU, 12 GB RAM (máximo do free tier)
   - Imagem: Ubuntu 22.04
   - Região: São Paulo (sa-saopaulo-1)
3. Em **Add SSH keys**, cole sua chave pública (obtenha com `ssh-keygen -y -f ~/.ssh/id_rsa`)
4. Abra a porta 22 na VCN: **Networking → Virtual Cloud Networks → sua VCN → Security Lists → Ingress Rules → Add: TCP porta 22**

### 7.2 Configurar a instância

```bash
ssh ubuntu@[ip-publico]

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm e dotenv-cli
npm install -g pnpm dotenv-cli

# Clonar o repositório
git clone [url-do-repo] /app
cd /app
pnpm install

# Gerar o Prisma client para o worker
pnpm --filter @pacifica/database exec prisma generate
```

### 7.3 Configurar variáveis de ambiente do worker

Crie `/app/.env.worker` na instância (nunca commite):

```env
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres
CREDENTIAL_ENCRYPTION_KEY=[mesmo valor usado no SST secret]
PACIFICA_REST_BASE_URL=https://api.pacifica.fi
WORKER_SIGNAL_TRACE_ENABLED=false
NODE_ENV=production
```

Crie um symlink para que o monorepo encontre o `.env`:

```bash
ln -sf /app/.env.worker /app/.env
```

### 7.4 Rodar o worker com PM2

```bash
npm install -g pm2

cd /app
pm2 start --name pacifica-worker \
  "dotenv -e .env.worker -- pnpm --filter @pacifica/worker start"

pm2 save
pm2 startup
# execute o comando que o PM2 imprime
```

Monitorar:
```bash
pm2 logs pacifica-worker
pm2 status
```

---

## Parte 8 — Smoke test pós-deploy

Substitua `[API_URL]` por `https://s4z1roxf80.execute-api.us-east-1.amazonaws.com`.

```bash
# Auth nonce (rota pública) — deve retornar o nonce
curl -s "https://[API_URL]/api/auth/nonce?wallet=testaddress123" | jq .

# Preços de mercado (pode retornar erro se o market refresh ainda não rodou)
curl -s https://[API_URL]/api/market/prices | jq .

# Rota protegida sem token — deve retornar 401
curl -s -X POST https://[API_URL]/api/account/session \
  -H "Content-Type: application/json" | jq .
```

> **Nota:** `/api/market/prices` retorna erro enquanto o MarketRefreshHandler não tiver rodado ao menos uma vez (pode levar até 1 minuto após o deploy).

---

## Parte 9 — Diagnóstico e troubleshooting

### Identificar a função Lambda de produção

Os nomes ficam truncados pelo limite de 64 chars. Para listar:

```bash
aws lambda list-functions --region us-east-1 \
  --query 'Functions[].FunctionName' --output json
```

Funções de produção contêm `production` no nome.

### Ver logs de uma função específica

```bash
# Listar log groups disponíveis
aws logs describe-log-groups --region us-east-1 \
  --query 'logGroups[?contains(logGroupName, `pacifi`)].logGroupName' --output json

# Ver logs recentes
aws logs tail /aws/lambda/[nome-da-funcao] --since 10m --region us-east-1
```

### Verificar se o Layer está anexado

```bash
aws lambda get-function-configuration \
  --function-name [nome-da-funcao] \
  --region us-east-1 \
  --query '{Layers:Layers,PrismaEnginePath:Environment.Variables.PRISMA_QUERY_ENGINE_LIBRARY}' \
  --output json
```

Deve retornar o Layer ARN e `PRISMA_QUERY_ENGINE_LIBRARY=/opt/libquery_engine-rhel-openssl-3.0.x.so.node`.

### Verificar qual Lambda o API Gateway está chamando

```bash
aws apigatewayv2 get-integrations --api-id [api-id] --region us-east-1 \
  --query 'Items[].IntegrationUri' --output json
```

O `api-id` é a parte da URL antes de `.execute-api` (ex: `hdzg2k5mkl`).

> **Armadilha comum:** O `npx sst deploy` sem `--stage production` deploya no stage padrão e cria um API Gateway separado com URL diferente. Sempre confirme qual URL está usando antes de testar.

### Erro "Prisma Client could not locate the Query Engine"

Causa: o binário `.so.node` não está acessível na Lambda.

Checklist:
1. O Layer está anexado à função? (`get-function-configuration` acima)
2. `PRISMA_QUERY_ENGINE_LIBRARY` aponta para `/opt/libquery_engine-rhel-openssl-3.0.x.so.node`?
3. O binário dentro do ZIP foi empacotado com `zip -j` (sem estrutura de diretórios)?
4. O `binaryTargets` no `schema.prisma` inclui `"rhel-openssl-3.0.x"`?

> **Não use `copyFiles` do SST para o binário `.so.node`** — o SST ignora arquivos com extensão `.node` silenciosamente. Use Lambda Layer.

---

## Parte 10 — Manutenção

### Redeploy após mudança de código

```bash
npx sst deploy --stage production
```

### Atualizar um secret

```bash
npx sst secret set CredentialEncryptionKey "[novo valor]" --stage production
npx sst deploy --stage production  # necessário para propagar o novo valor nas Lambdas
```

### Ver logs das Lambdas

```bash
aws logs tail /aws/lambda/pacifica-bot-production-MarketRefreshHandlerFunction-wmawmavn \
  --since 10m --region us-east-1
```

### Rotacionar a `CREDENTIAL_ENCRYPTION_KEY`

> ⚠️ Rotacionar a chave exige re-encriptar todas as credenciais existentes no banco antes de trocar o valor. Sem isso, as credenciais ficam ilegíveis. Não troque sem um plano de migração.

### Atualizar a versão do Prisma

Se o Prisma for atualizado, o binário da Layer muda. Repita o **Parte 3** inteiro e atualize o ARN em `sst.config.ts`.

### Migrations futuras

```bash
DIRECT_DATABASE_URL="[url direta]" \
pnpm --filter @pacifica/database exec prisma migrate deploy
```

---

## Checklist final antes de ir a ar

- [ ] Supabase criado e migrations aplicadas (`prisma migrate deploy`)
- [ ] `schema.prisma` tem `directUrl` e `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
- [ ] Lambda Layer do Prisma engine criado e ARN atualizado no `sst.config.ts`
- [ ] `npx sst secret list --stage production` mostra todos os 5 secrets
- [ ] `npx sst deploy --stage production` concluiu sem erro
- [ ] As duas funções Lambda de produção têm o Layer anexado (verificar com `get-function-configuration`)
- [ ] URL da API Gateway de produção confirmada com `aws apigatewayv2 get-apis`
- [ ] `/api/auth/nonce?wallet=test` retorna nonce
- [ ] `/api/account/session` sem token retorna `401`
- [ ] Frontend apontando para a URL de produção correta no Amplify
- [ ] Worker rodando no Oracle Cloud (`pm2 status`)
- [ ] `WORKER_SIGNAL_TRACE_ENABLED=false` no worker em produção

## URLs de produção (referência)

| Serviço | URL |
|---|---|
| API Gateway (produção) | `https://s4z1roxf80.execute-api.us-east-1.amazonaws.com` |
| API Gateway (dev/alxdfm) | `https://hdzg2k5mkl.execute-api.us-east-1.amazonaws.com` |
| Frontend | `https://trade.callydus.xyz` |
