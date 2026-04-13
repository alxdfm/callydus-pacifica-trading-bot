# Plano de Segurança — Autenticação e Isolamento de Contas

## Data de referência
`2026-04-13`

## Objetivo
Documentar as vulnerabilidades identificadas na auditoria de segurança de `2026-04-13` e o plano de implementação para tornar o sistema apto a produção, com decisões alinhadas à arquitetura definida em `ARCHITECTURE_FOUNDATION.pt-BR.md` e ao plano de deploy em `AWS_MVP_DEPLOYMENT_AND_API_SERVERLESS_PLAN_2026-04-12.pt-BR.md`.

---

## Contexto arquitetural relevante

Decisões de infra que impactam diretamente o plano de segurança:

- `api`: migra para `AWS Lambda + API Gateway HTTP API`
- `server.ts` é classificado como **detalhe temporário de dev local** — não é o destino das implementações permanentes
- A camada HTTP permanente é `apps/api/src/ui/http/createApiHttpHandler.ts` (a ser criada como parte da migração Lambda)
- O `scheduler` de market data migra para `EventBridge Scheduler + Lambda` dedicada — a rota `/api/internal/market/refresh` some com essa migração
- O `worker` roda na `Oracle Cloud Always Free` e comunica com a API **exclusivamente via banco**, nunca via HTTP
- Lambda é **stateless por invocação** — qualquer estado in-memory (ex: rate limiter com `Map`) é resetado a cada cold start e não é compartilhado entre instâncias concorrentes

---

## Vulnerabilidades identificadas

### CRITICO

**C1 — Ausência total de autenticação nas rotas de ação**
`apps/api/src/server.ts` (linhas 103–184)

Rotas `pause`, `resume`, `activate strategy`, `save strategy`, `close trade` aceitam `{ walletAddress }` no body sem nenhuma prova de ownership. Qualquer cliente que conheça o endereço Solana de uma vítima pode pausar o bot, sobrescrever estratégia e forçar fechamento de trades.

**C2 — Rotas de leitura expõem dados de qualquer conta**
`apps/api/src/server.ts` (linhas 279–373)

Dashboard, trades, posições, histórico e perfil retornam dados completos para qualquer `walletAddress` fornecido no body, sem autenticação.

---

### ALTO

**A1 — CORS com valor fixo, sem validar o `Origin` recebido**
`apps/api/src/server.ts` (linhas 56–59)

O header `Access-Control-Allow-Origin` é sempre definido com o valor configurado, independente do `Origin` real da requisição.

**A2 — Secrets críticas com default `""` silencioso**
`apps/api/src/server.ts` (linhas 18–33) e `apps/worker/src/infrastructure/config/createWorkerEnvironment.ts`

`CREDENTIAL_ENCRYPTION_KEY` e `PACIFICA_BUILDER_CODE` recebem string vazia como fallback. Se ausentes em produção, o sistema opera com AES sobre chave trivial e sem builder code, silenciosamente.

**A3 — KDF fraco: SHA-256 simples sem salt nem iterações**
`packages/credential-crypto/src/index.ts` (linha 26)

`createHash("sha256").update(key).digest()` não é um KDF seguro. Vulnerável a dicionário se a chave tiver baixa entropia.

**A4 — `findById` de credencial sem filtro de ownership**
`apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts` (linha 314)

`findById(credentialId)` retorna a credencial sem verificar a qual conta pertence. Se o `credentialId` de outro usuário for obtido, a chave cifrada é exposta.

---

### MEDIO

**M1 — Chave privada pode aparecer em logs via `unhandledRejection`**
`apps/worker/src/index.ts` (linha 83)

O handler formata `reason.message` como string sem sanitização. Exceção não capturada lançada durante uso da chave decriptada pode incluí-la no log.

**M2 — `signalTraceEnabled` pode vazar dados financeiros em produção**
`apps/worker/src/application/createOperationalWorker.ts`

Com `WORKER_SIGNAL_TRACE_ENABLED=true`, indicadores técnicos, tamanhos de posição e candles são logados com `walletAddress` em cada entrada. Em logs centralizados, isso expõe dados operacionais sensíveis.

**M3 — `/api/internal/market/refresh` exposta publicamente**
`apps/api/src/server.ts` (linhas 247–261)

Rota com prefixo "internal" não tem nenhuma proteção de rede ou autenticação. Qualquer cliente pode forçar refresh de market data.

**M5 — Comparação de chave privada sem `timingSafeEqual`**
`apps/api/src/application/validate-pacifica-credentials/ValidatePacificaCredentials.ts` (linhas 103–108)

`decryptedPrivateKey.trim() === input.agentWalletPrivateKey.trim()` é vulnerável a timing attack.

---

## Estratégia de autenticação adotada

**Solana Sign-In + Bearer Token stateless (HMAC-SHA256)**

Motivo da escolha:
- `@noble/curves` já está no grafo transitivo de dependências via `@solana/wallet-adapter`
- HMAC-SHA256 com `node:crypto` nativo — zero dependência externa
- Token stateless: compatível com Lambda sem estado compartilhado entre invocações
- Único estado server-side: tabela `AuthNonce` para anti-replay, com TTL de 5 minutos

Fluxo:
```
1. GET  /api/auth/nonce?wallet=<addr>
   <- { nonce: "<uuid>", expiresAt: "<iso>", message: "<texto canônico>" }

2. Frontend assina com wallet Solana:
   signature = wallet.signMessage(encodeUTF8(message))

3. POST /api/auth/verify
   { walletAddress, nonce, signature (base64), expiresAt }
   <- { token: "<hmac-token>", expiresAt: "<iso>" }   (TTL 1h)

4. Todas as rotas protegidas:
   Authorization: Bearer <token>
```

O token é `base64url(walletAddress:expiresAt:hmac)` onde `hmac = HMAC-SHA256(walletAddress:expiresAt, CREDENTIAL_ENCRYPTION_KEY)`. Verificação via `timingSafeEqual`.

---

## Plano de implementação

### Relação com a migração Lambda

**Princípio central:** toda implementação de segurança deve nascer na camada HTTP agnóstica (`createApiHttpHandler.ts`), não em `server.ts`. O `server.ts` permanece apenas como adaptador de dev local.

O plano de segurança é complementar ao plano de migração Lambda documentado em `AWS_MVP_DEPLOYMENT_AND_API_SERVERLESS_PLAN_2026-04-12.pt-BR.md`. A ordem recomendada de execução:

```
Fase 0 (secrets + KDF)   ──► pode executar agora, independente da migração
Fase 1 (CORS + M3)       ──► executar no server.ts atual; replicar na camada agnóstica
Fase 2 (auth infra)      ──► nascer direto em createApiHttpHandler.ts (não em server.ts)
Fases 3, 4, 5, 6         ──► dependem da Fase 2
```

### Validade das implementações após migração Lambda

Referência: análise realizada em 2026-04-13 após conclusão das Fases 0 e 1.

| Mudança implementada | Arquivo | Validade pós-Lambda |
|---|---|---|
| `requireNonEmpty()` nos factories | `createApiEnvironment.ts`, `createWorkerEnvironment.ts` | ✅ Intacto — agnóstico de runtime |
| KDF HKDF com compatibilidade reversa | `packages/credential-crypto/src/index.ts` | ✅ Intacto — agnóstico de runtime |
| Guard `process.exit(1)` de env vars | `apps/api/src/server.ts` | ⚠️ Mover para `createApiRuntime.ts` |
| `applyCorsHeaders()` dinâmico | `apps/api/src/server.ts` | ⚠️ Substituído por config do API Gateway |
| Proteção de `/api/internal/market/refresh` | `apps/api/src/server.ts` | ⚠️ Some com a rota (EventBridge assume) |

**Ação obrigatória ao criar `createApiRuntime.ts`:**
O guard de startup deve ser replicado nesse arquivo. Em Lambda, `createApiRuntime.ts` roda no cold start e é o lugar correto para abortar se as secrets estiverem ausentes — o `lambda/httpHandler.ts` é invocado por request e não deve conter esse guard.

```typescript
// apps/api/src/bootstrap/createApiRuntime.ts
const REQUIRED_ENV_VARS = ["CREDENTIAL_ENCRYPTION_KEY", "PACIFICA_BUILDER_CODE"] as const;
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]?.trim()) {
    throw new Error(`FATAL: environment variable ${key} is required but absent or empty`);
  }
}
```

Nota: em Lambda, `process.exit(1)` dentro de um handler não encerra o processo de forma confiável — usar `throw new Error(...)` no bootstrap garante que a função falhe no cold start com mensagem visível nos logs do CloudWatch.

**CORS pós-Lambda:**
Com API Gateway HTTP API, configurar CORS a nível de infra (CDK/console). O `createApiHttpHandler.ts` não precisa definir headers CORS — o API Gateway injeta automaticamente antes de devolver a resposta ao browser. Não replicar `applyCorsHeaders()` no handler Lambda.

---

### Fase 0 — Secrets obrigatórias + KDF segura ✅ CONCLUÍDA (2026-04-13)
**Vulnerabilidades:** A2, A3 | **Complexidade:** P | **Independente**

#### 0.1 — Abort no startup se secrets ausentes

Arquivos a modificar:
- `apps/api/src/infrastructure/config/createApiEnvironment.ts`
- `apps/worker/src/infrastructure/config/createWorkerEnvironment.ts`

Remover os `?? ""` de `credentialEncryptionKey` e `pacificaBuilderCode`. Substituir por lançamento explícito:

```typescript
if (!process.env.CREDENTIAL_ENCRYPTION_KEY?.trim()) {
  process.stderr.write("FATAL: CREDENTIAL_ENCRYPTION_KEY is required\n");
  process.exit(1);
}
```

Em Lambda, o código de inicialização de módulo (`import`-level) roda no cold start. O `process.exit(1)` em cold start impede que a função Lambda aceite requisições sem as secrets configuradas.

#### 0.2 — KDF segura: SHA-256 → HKDF

Arquivo: `packages/credential-crypto/src/index.ts`

Substituir:
```typescript
const key = createHash("sha256").update(this.encryptionKey).digest();
```
Por:
```typescript
import { hkdfSync } from "node:crypto"; // nativo desde Node.js 15, zero dependência
const salt = Buffer.from(`pacifica-credential-v1:${this.keyId}`, "utf8");
const key = hkdfSync("sha256", this.encryptionKey, salt, "aes-256-gcm-key", 32);
```

**Compatibilidade reversa:** o campo `encryptedPrivateKeyRef` já carrega o `keyId` no payload serializado. Suportar ambos os métodos no `decrypt` baseado no `keyId`:

```typescript
const key = payload.keyId.startsWith("v2")
  ? hkdfDeriveKey(this.encryptionKey, payload.keyId)   // novo
  : sha256DeriveKey(this.encryptionKey);                // legado — remover após re-encriptar tudo
```

Ao fazer deploy, rotacionar `CREDENTIAL_ENCRYPTION_KEY_ID` para `v2` e re-encriptar credenciais existentes via migration script.

**Critério de conclusão:** novos registros usam HKDF; registros legados descriptografam; tests cobrem ambos os caminhos.

---

### Fase 1 — CORS dinâmico + proteção temporária da rota interna ✅ CONCLUÍDA (2026-04-13)
**Vulnerabilidades:** A1, M3 | **Complexidade:** P | **Independente**

#### 1.1 — CORS dinâmico com validação do Origin

Arquivo: `apps/api/src/server.ts` (e replicar em `createApiHttpHandler.ts` quando criado)

```typescript
function applyCorsHeaders(requestOrigin: string | undefined, response: ServerResponse): void {
  if (requestOrigin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  // sem match: não define ACAO — browser bloqueia, servidor não bloqueia (CORS é instrução ao browser)
}
```

Para preflight (OPTIONS) sem `Origin` válido: responder 403.

Nota: com API Gateway, CORS pode ser configurado a nível de infra (no console/CDK). Quando migrar para Lambda, a configuração de CORS no API Gateway substitui o header manual no handler.

#### 1.2 — Proteção temporária de `/api/internal/market/refresh`

Esta rota é **transitória**: some quando o scheduler migrar para EventBridge → Lambda dedicada (conforme `AWS_MVP_DEPLOYMENT_AND_API_SERVERLESS_PLAN_2026-04-12.pt-BR.md`, Fase 4 do refactor).

Enquanto a rota existir, proteger com shared secret via `X-Internal-Secret`:

```typescript
import { timingSafeEqual } from "node:crypto";

const secret = request.headers["x-internal-secret"];
if (!secret || !timingSafeEqual(
  Buffer.from(secret as string),
  Buffer.from(process.env.INTERNAL_API_SECRET!)
)) {
  response.writeHead(403).end(JSON.stringify({ message: "Forbidden" }));
  return;
}
```

Adicionar `INTERNAL_API_SECRET` ao startup guard da Fase 0.

O scheduler local (`startLocalMarketDataRefreshScheduler.ts`) deve passar o header nas chamadas HTTP internas.

Quando migrar para EventBridge, a rota some e esta proteção se torna irrelevante.

---

### Fase 2 — Infraestrutura de autenticação ✅ CONCLUÍDA (2026-04-13)
**Vulnerabilidades:** C1, C2 (infraestrutura) | **Complexidade:** G | **Requer API + App**

**Importante:** esta fase deve ser implementada **diretamente na camada HTTP agnóstica** (`apps/api/src/ui/http/createApiHttpHandler.ts`), não em `server.ts`. Se a migração Lambda ainda não tiver ocorrido, implementar em `server.ts` e migrar junto com o refactor.

#### 2.1 — Migration: tabela `AuthNonce`

Arquivo: `packages/database/prisma/schema.prisma`

```prisma
model AuthNonce {
  id            String    @id @default(uuid()) @db.Uuid
  walletAddress String
  nonce         String    @unique
  expiresAt     DateTime  @db.Timestamptz(6)
  usedAt        DateTime? @db.Timestamptz(6)
  createdAt     DateTime  @default(now()) @db.Timestamptz(6)

  @@index([walletAddress])
  @@index([nonce])
  @@index([expiresAt])
}
```

Executar: `prisma migrate dev --name add_auth_nonce`

**Cleanup em Lambda:** sem processo contínuo disponível, o cleanup de nonces expirados deve ser lazy — executar `deleteMany({ where: { expiresAt: { lt: new Date() } } })` no início de cada chamada a `createNonce`. Isso evita crescimento ilimitado da tabela sem exigir job externo.

#### 2.2 — `AuthRepository`

Novo arquivo: `apps/api/src/domain/auth/AuthRepository.ts`

```typescript
export interface AuthRepository {
  createNonce(input: { walletAddress: string; nonce: string; expiresAt: Date }): Promise<void>;
  consumeNonce(input: { nonce: string; walletAddress: string }): Promise<{ valid: boolean }>;
}
```

Novo arquivo: `apps/api/src/infrastructure/persistence/PrismaAuthRepository.ts`

`consumeNonce`: verificar `usedAt IS NULL AND expiresAt > now()` e marcar `usedAt` atomicamente com `UPDATE ... WHERE usedAt IS NULL RETURNING`. Se nenhuma linha retornada: `{ valid: false }`.

#### 2.3 — Verificação de assinatura Solana

Novo arquivo: `apps/api/src/infrastructure/auth/SolanaSignatureVerifier.ts`

```typescript
import { ed25519 } from "@noble/curves/ed25519"; // já transitiva via wallet-adapter
import bs58 from "bs58";

export function verifySolanaWalletSignature(input: {
  walletAddress: string;  // base58 public key
  message: string;        // texto canônico original
  signature: string;      // base64
}): boolean {
  const publicKeyBytes = bs58.decode(input.walletAddress);
  const messageBytes = new TextEncoder().encode(input.message);
  const signatureBytes = Buffer.from(input.signature, "base64");
  return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
}
```

#### 2.4 — Bearer Token stateless

Novo arquivo: `apps/api/src/infrastructure/auth/BearerTokenService.ts`

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export class BearerTokenService {
  constructor(private readonly signingSecret: string) {}

  issue(walletAddress: string, now: Date): string {
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
    const payload = `${walletAddress}:${expiresAt}`;
    const sig = createHmac("sha256", this.signingSecret).update(payload).digest("hex");
    return Buffer.from(`${payload}:${sig}`).toString("base64url");
  }

  verify(token: string): { valid: true; walletAddress: string } | { valid: false } {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = raw.lastIndexOf(":");
    const payload = raw.slice(0, lastColon);
    const sig = raw.slice(lastColon + 1);
    const expected = createHmac("sha256", this.signingSecret).update(payload).digest("hex");
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return { valid: false };
    }
    const firstColon = payload.indexOf(":");
    const walletAddress = payload.slice(0, firstColon);
    const expiresAt = payload.slice(firstColon + 1);
    if (new Date(expiresAt) < new Date()) return { valid: false };
    return { valid: true, walletAddress };
  }
}
```

#### 2.5 — Use cases de auth

Novo arquivo: `apps/api/src/application/request-auth-nonce/RequestAuthNonce.ts`

- Valida formato do wallet address (base58, 32–44 chars)
- Gera `randomUUID()` como nonce
- Define `expiresAt = now + 5 minutos`
- Executa lazy cleanup de nonces expirados no `AuthRepository`
- Persiste nonce e retorna `{ nonce, expiresAt, message }`

Mensagem canônica:
```
Sign in to Callydus Trading
Wallet: <walletAddress>
Nonce: <nonce>
Expires: <expiresAt>
```

Novo arquivo: `apps/api/src/application/verify-auth-signature/VerifyAuthSignature.ts`

- Consome nonce via `AuthRepository.consumeNonce` (atomicamente)
- Reconstrói mensagem canônica
- Verifica assinatura com `SolanaSignatureVerifier`
- Em sucesso: emite token via `BearerTokenService.issue`
- Retorna `{ token, expiresAt }`

#### 2.6 — Rotas de auth

Adicionar em `createApiHttpHandler.ts` (ou `server.ts` temporariamente):

```
GET  /api/auth/nonce?wallet=<addr>  →  RequestAuthNonce
POST /api/auth/verify               →  VerifyAuthSignature
```

Essas rotas são **públicas** (sem auth, por design — são o próprio ponto de entrada de auth).

#### 2.7 — Middleware de extração de auth

Novo arquivo: `apps/api/src/infrastructure/auth/extractAuthContext.ts`

```typescript
export type AuthContext = { walletAddress: string } | null;

export function extractAuthContext(
  authorizationHeader: string | undefined,
  tokenService: BearerTokenService,
): AuthContext {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice(7);
  const result = tokenService.verify(token);
  return result.valid ? { walletAddress: result.walletAddress } : null;
}
```

#### 2.8 — Frontend: fluxo de autenticação

Novo arquivo: `apps/app/src/features/auth/useAuthToken.ts`

Hook que gerencia:
- Estado: `{ token: string | null; walletAddress: string | null; expiresAt: string | null }`
- `authenticate(walletAddress, signMessage)`: executa GET nonce → signMessage → POST verify → armazena token
- Auto-refresh: re-autentica quando `expiresAt - now < 10min`

Integrar em `apps/app/src/features/wallet/solana/SolanaWalletStateBridge.tsx`: quando `connected && publicKey` mudam, chamar `authenticate`.

Todos os arquivos `backend-*.ts` em `apps/app/src/features/` devem receber `authToken: string` como parâmetro e incluir `"Authorization": "Bearer ${authToken}"` nos headers.

**Critério de conclusão:** token expirado retorna 401; assinatura inválida retorna 401; wallet A não pode operar conta de wallet B.

---

### Fase 3 — Auth obrigatória nas rotas de ação ✅ CONCLUÍDA (2026-04-13)
**Vulnerabilidades:** C1 | **Complexidade:** M | **Depende da Fase 2**

Rotas afetadas: `pause`, `resume`, `activate strategy`, `save strategy`, `close trade`.

Em cada handler:
```typescript
const authContext = extractAuthContext(request.headers["authorization"], tokenService);
if (!authContext) {
  response.writeHead(401).end(JSON.stringify({ status: "error", code: "unauthorized" }));
  return;
}
// walletAddress vem do token — ignorar body.walletAddress
const body = schema.parse({ ...rawBody, walletAddress: authContext.walletAddress });
```

O `walletAddress` usado nos use cases **vem do token**, nunca do body. Isso elimina o spoofing de identidade sem quebrar a assinatura dos use cases existentes.

**`CloseTrade` — verificação de ownership no banco:**

O repositório que executa o comando deve incluir `walletAddress` na cláusula WHERE para garantir ownership no nível do banco:
```sql
WHERE id = $tradeId AND operator_account.wallet_address = $walletAddress
```
Se nenhuma linha afetada: retornar `{ status: "error", code: "trade_not_found" }` (não vazar que o trade existe mas pertence a outro).

**Critério de conclusão:** wallet A não pode pausar bot de wallet B; teste simula ataque de spoofing com token válido de A e walletAddress de B no body.

---

### Fase 4 — Auth obrigatória nas rotas de leitura ✅ CONCLUÍDA (2026-04-13)
**Vulnerabilidades:** C2 | **Complexidade:** M | **Depende da Fase 2**

**Rotas protegidas** (Bearer token obrigatório):
- `/api/account/session`
- `/api/account/profile`
- `/api/account/dashboard`
- `/api/account/trades`
- `/api/account/history`
- `/api/account/presets`

**Rotas que permanecem públicas** (por design — onboarding sem conta):
- `/api/onboarding/*` — usuário ainda não tem token
- `/api/market/*` — dados públicos de mercado
- `/api/auth/*` — o próprio auth

Para rotas protegidas: mesmo padrão da Fase 3 — `walletAddress` do token sobrescreve o do body.

**Rate limiting:**

Rate limit in-memory (`Map`) **não funciona em Lambda** — estado não é compartilhado entre instâncias concorrentes e é resetado em cada cold start.

Abordagem recomendada para o MVP (em ordem de preferência):

1. **API Gateway throttling** — configurar `throttling.burstLimit` e `throttling.rateLimit` por rota no API Gateway. Simples, sem código, eficaz para o MVP. Nenhuma linha de código a adicionar.
2. Se granularidade por usuário for necessária: usar uma tabela `RateLimit` no banco ou DynamoDB com TTL gerenciado pelo banco.

Para o MVP, a opção 1 é suficiente.

**Critério de conclusão:** `/api/account/session` sem token retorna 401; com token de A retorna dados de A mesmo que o body contenha walletAddress de B.

---

### Fase 5 — Ownership check no `findById` de credencial ✅ CONCLUÍDA (2026-04-13)
**Vulnerabilidades:** A4 | **Complexidade:** P | **Independente**

Arquivo: `apps/api/src/infrastructure/persistence/PrismaPacificaCredentialRepository.ts`

```typescript
async findById(
  credentialId: string,
  ownerWalletAddress?: string,
): Promise<PacificaCredential | null> {
  return this.prisma.pacificaCredential.findFirst({
    where: {
      id: credentialId,
      ...(ownerWalletAddress ? {
        operatorAccount: { walletAddress: ownerWalletAddress }
      } : {}),
    },
    ...
  });
}
```

Atualizar interface `PacificaCredentialRepository` e todos os chamadores:
- `StartBotReadinessCheck.ts`: passar `walletAddress` autenticado
- `VerifyPacificaOperational.ts`: idem

Após a Fase 2, o `walletAddress` autenticado estará disponível como parâmetro em todos os use cases.

**Critério de conclusão:** `findById` com `credentialId` de outro usuário retorna `null`; teste unitário cobre o isolation.

---

### Fase 6 — Mitigações de vazamento ✅ CONCLUÍDA (2026-04-13)
**Vulnerabilidades:** M1, M2, M5 | **Complexidade:** P | **Independente**

#### 6.1 — M1: sanitizar `unhandledRejection`

Arquivo: `apps/worker/src/index.ts`

```typescript
function sanitizeForLog(message: string): string {
  // redact strings que parecem chaves privadas (base58, 64+ chars)
  return message.replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, "[REDACTED]");
}

process.once("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  logger.error("worker.unhandled_rejection", { reason: sanitizeForLog(message) });
});
```

Adicionar handler equivalente em `apps/api/src/server.ts` e em `apps/api/src/lambda/httpHandler.ts` (quando criado).

#### 6.2 — M2: warning de `signalTraceEnabled` em produção

Arquivo: `apps/worker/src/infrastructure/config/createWorkerEnvironment.ts`

```typescript
if (process.env.NODE_ENV === "production" && env.signalTraceEnabled) {
  console.warn(
    "[SECURITY] WORKER_SIGNAL_TRACE_ENABLED=true em produção. " +
    "Dados financeiros sensíveis (posições, candles, indicadores) serão logados."
  );
}
```

#### 6.3 — M5: `timingSafeEqual` em comparações de segredo

Arquivo: `apps/api/src/application/validate-pacifica-credentials/ValidatePacificaCredentials.ts`

```typescript
import { timingSafeEqual } from "node:crypto";

const a = Buffer.from(decryptedPrivateKey.trim());
const b = Buffer.from(input.agentWalletPrivateKey.trim());
const isReuse = a.length === b.length && timingSafeEqual(a, b);
```

---

## Tabela resumo

| Fase | Vulnerabilidades | Complexidade | Coord. | Executar em |
|------|-----------------|--------------|--------|-------------|
| 0 | A2, A3 | P | API + worker | Agora |
| 1 | A1, M3 | P | API | Agora |
| 2 | C1+C2 (infra) | G | API + App | Esta semana |
| 3 | C1 (ações) | M | API + App | Esta semana |
| 4 | C2 (leitura) | M | API + App | Esta semana |
| 5 | A4 | P | API | Esta semana |
| 6 | M1, M2, M5 | P | API + worker | Próxima semana |

**Dependências:**
```
Fase 0 ──┐  independentes, executar em paralelo
Fase 1 ──┘

Fase 2 ──► Fase 3
       └──► Fase 4
       └──► Fase 5 (pode antecipar, independente)

Fase 6 ──── independente, qualquer momento
```

---

## Decisões registradas

**Token stateless, sem tabela `AuthSession`**
Lambda não mantém estado entre invocações. O HMAC token é verificável sem consulta ao banco. Revogação imediata não é suportada no MVP — expiração em 1h é o mecanismo de invalidade. Se revogação for necessária no futuro, adicionar `AuthSession` com campo `revokedAt`.

**`walletAddress` do body se torna no-op nas rotas protegidas**
O valor do body é sobrescrito pelo `walletAddress` extraído do token antes de chamar os use cases. Isso elimina o vetor de spoofing sem breaking change nos schemas Zod existentes.

**Rate limiting via API Gateway, não in-memory**
In-memory não funciona em Lambda (estado não compartilhado, reset em cold start). API Gateway throttling cobre o MVP sem nenhuma linha de código adicional.

**Rotas de onboarding permanecem públicas**
O usuário não tem token antes de ter conta. O endpoint de validação de credenciais Pacifica (`/api/onboarding/credentials/validate`) é sensível mas necessário por design. Mitigação: rate limiting via API Gateway por IP.

**`/api/internal/market/refresh` é proteção temporária**
Essa rota some quando o scheduler migrar para EventBridge → Lambda dedicada (conforme o plano de deploy). A proteção com `X-Internal-Secret` na Fase 1 é válida apenas no período de transição.

**Cleanup de `AuthNonce` é lazy**
Lambda não tem processo contínuo para cleanup. O `createNonce` executa `deleteMany` de nonces expirados antes de inserir o novo. Simples, sem job externo, sem crescimento ilimitado da tabela.

**Worker não chama API via HTTP**
Conforme `AWS_MVP_DEPLOYMENT_AND_API_SERVERLESS_PLAN_2026-04-12.pt-BR.md`: o worker comunica com a API exclusivamente via banco. As rotas de heartbeat e reconcile no `server.ts` são chamadas pelo frontend, não pelo worker. Essas rotas são protegidas com Bearer token do usuário na Fase 4.

---

## Documentos relacionados

- `ARCHITECTURE_FOUNDATION.pt-BR.md` — decisões de stack e responsabilidades
- `AWS_MVP_DEPLOYMENT_AND_API_SERVERLESS_PLAN_2026-04-12.pt-BR.md` — plano de migração Lambda
- `API_LAMBDA_GROUPING_AND_IMPLEMENTATION_PLAN_2026-04-12.pt-BR.md` — agrupamento de handlers
- `SECRETS_AND_ENVIRONMENTS.pt-BR.md` — gestão de secrets por ambiente
