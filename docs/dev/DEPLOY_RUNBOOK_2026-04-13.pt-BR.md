# Deploy Runbook — MVP

## Data de referência
`2026-04-13`

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

## Parte 3 — Secrets (SST Parameter Store)

O SST armazena secrets no AWS SSM Parameter Store. Rode cada comando abaixo com os valores reais:

```bash
npx sst secret set DatabaseUrl "postgres://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

npx sst secret set DirectDatabaseUrl "postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres"

npx sst secret set CredentialEncryptionKey "[string aleatória de 32+ chars — gere com: openssl rand -hex 32]"

npx sst secret set PacificaBuilderCode "[seu builder code da Pacifica]"

npx sst secret set InternalApiSecret "[string aleatória — gere com: openssl rand -hex 24]"
```

> Para gerar valores seguros para `CredentialEncryptionKey` e `InternalApiSecret`:
> ```bash
> openssl rand -hex 32   # para CredentialEncryptionKey
> openssl rand -hex 24   # para InternalApiSecret
> ```

> **Atenção:** se você já tem credenciais criptografadas no banco local com `CREDENTIAL_ENCRYPTION_KEY` do `.env`, use o **mesmo valor** em produção. Chaves diferentes = credenciais ilegíveis.

Para verificar os secrets configurados:
```bash
npx sst secret list
```

---

## Parte 4 — Deploy da API (AWS)

### 4.1 Primeiro deploy

```bash
npx sst deploy
```

Isso vai:
- Empacotar os Lambdas com esbuild (incluindo o binário Prisma para rhel-openssl-3.0.x)
- Criar o API Gateway HTTP API
- Criar as duas funções Lambda (`httpHandler` e `marketRefreshHandler`)
- Configurar o EventBridge Cron (market refresh a cada 1 minuto)
- Criar o CORS no API Gateway

Ao final, o SST imprime a URL da API:
```
✓  Complete
   PacificaApi: https://[id].execute-api.us-east-1.amazonaws.com
```

Guarde essa URL — ela vai para o `.env` do frontend e do worker.

### 4.2 Deploy de produção

```bash
npx sst deploy --stage production
```

Recursos com `stage=production` têm `protect: true` — o SST bloqueia remoção acidental.

---

## Parte 5 — Frontend (Amplify Hosting)

### 5.1 Configurar variável de ambiente

No arquivo `apps/app/.env.production` (crie se não existir, **não commite**):

```env
VITE_APP_API_BASE_URL=https://[id].execute-api.us-east-1.amazonaws.com
```

### 5.2 Build e deploy

No painel da AWS, vá em **Amplify → New app → Host web app → GitHub**.

Configure:
- **Build command:** `pnpm --filter @pacifica/app build`
- **Output dir:** `apps/app/dist`
- **Variáveis de ambiente:** adicione `VITE_APP_API_BASE_URL` com a URL da API

Ou para deploy manual via CLI:
```bash
pnpm --filter @pacifica/app build
# upload de apps/app/dist via Amplify CLI ou S3+CloudFront
```

---

## Parte 6 — Worker (Oracle Cloud Always Free)

### 6.1 Criar instância

1. Acesse [cloud.oracle.com](https://cloud.oracle.com)
2. Crie uma instância **VM.Standard.A1.Flex** (Always Free):
   - Shape: 1 OCPU, 6 GB RAM
   - Imagem: Ubuntu 22.04
3. Baixe a chave SSH gerada na criação

### 6.2 Configurar a instância

```bash
# Conectar
ssh -i [chave.pem] ubuntu@[ip-publico]

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Clonar o repositório
git clone [url-do-repo] /app
cd /app
pnpm install
```

### 6.3 Configurar variáveis de ambiente do worker

Crie `/app/.env.worker` na instância (nunca commite):

```env
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres
CREDENTIAL_ENCRYPTION_KEY=[mesmo valor usado no SST secret]
PACIFICA_REST_BASE_URL=https://api.pacifica.fi
WORKER_SIGNAL_TRACE_ENABLED=false
NODE_ENV=production
```

### 6.4 Rodar o worker com PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar o worker
cd /app
pm2 start --name pacifica-worker \
  "dotenv -e .env.worker -- pnpm --filter @pacifica/worker start"

# Salvar para reiniciar automaticamente após reboot
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

## Parte 7 — Smoke test pós-deploy

Substitua `[API_URL]` pela URL do API Gateway.

```bash
# Health check: deve retornar 404 (nenhuma rota raiz — é esperado)
curl -s https://[API_URL]/

# Preços de mercado (rota pública)
curl -s https://[API_URL]/api/market/prices | jq .

# Auth nonce (rota pública)
curl -s "https://[API_URL]/api/auth/nonce?wallet=testaddress123" | jq .

# Rota protegida sem token — deve retornar 401
curl -s -X POST https://[API_URL]/api/account/session \
  -H "Content-Type: application/json" | jq .
```

---

## Parte 8 — Manutenção

### Redeploy após mudança de código

```bash
npx sst deploy          # stage padrão (dev)
npx sst deploy --stage production
```

### Atualizar um secret

```bash
npx sst secret set CredentialEncryptionKey "[novo valor]"
npx sst deploy  # necessário para propagar o novo valor nas Lambdas
```

### Ver logs das Lambdas

```bash
npx sst logs   # logs em tempo real de todas as funções
```

Ou no painel AWS em **CloudWatch → Log groups → /aws/lambda/pacifica-bot-***.

### Rotacionar a `CREDENTIAL_ENCRYPTION_KEY`

> ⚠️ Rotacionar a chave exige re-encriptar todas as credenciais existentes no banco antes de trocar o valor. Sem isso, as credenciais ficam ilegíveis. Não troque sem um plano de migração.

### Migrations futuras

```bash
# Rodar migration contra o Supabase
DIRECT_DATABASE_URL="[url direta]" \
pnpm --filter @pacifica/database exec prisma migrate deploy
```

---

## Checklist final antes de ir a ar

- [ ] Supabase criado e migrations aplicadas
- [ ] `npx sst secret list` mostra todos os 5 secrets
- [ ] `npx sst deploy` concluiu sem erro
- [ ] URL da API retorna 404 na raiz (comportamento esperado)
- [ ] `/api/market/prices` retorna dados
- [ ] `/api/account/session` sem token retorna `401`
- [ ] Frontend apontando para a URL da API de produção
- [ ] Worker rodando no Oracle Cloud (`pm2 status`)
- [ ] `WORKER_SIGNAL_TRACE_ENABLED=false` no worker em produção
