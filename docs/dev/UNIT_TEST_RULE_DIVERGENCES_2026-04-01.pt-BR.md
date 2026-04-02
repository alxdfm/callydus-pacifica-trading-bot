# Divergências de Regra Detectadas por Testes Unitários

## Objetivo
Registrar os testes que foram criados a partir da regra de negócio documentada e que permanecem falhando porque a implementação atual diverge do comportamento esperado.

## Estado em 2026-04-01
Ao rodar `pnpm test`, a suíte fica intencionalmente vermelha por 3 casos:

1. `apps/api/src/application/pause-bot/PauseBot.test.ts`
2. `apps/api/src/application/resume-bot/ResumeBot.test.ts`
3. `apps/app/src/features/onboarding/agent-wallet-validation.test.ts`

## Divergência 1: idempotência de `pause`

### Regra esperada
- comandos operacionais devem usar idempotência real para evitar duplicação por retry
- a chave não deve depender apenas de timestamp

### Evidência documental
- `docs/product/planning/post-mvp/FUNCTIONAL_MVP_DEV_TASKS.pt-BR.md:149`
- `docs/dev/RELATIONAL_DATA_MODEL.pt-BR.md:138`
- `docs/dev/code-review/API_WORKER_CODE_REVIEW_2026-03-31.pt-BR.md:63`

### Implementação atual
- `apps/api/src/application/pause-bot/PauseBot.ts` monta `idempotencyKey` com `walletAddress + nowIso`

### Impacto
- retries de rede ou cliques duplicados geram chaves diferentes
- o contrato de idempotência existe, mas não protege repetição real da mesma intenção

### Teste que falha
- `apps/api/src/application/pause-bot/PauseBot.test.ts`

## Divergência 2: idempotência de `resume`

### Regra esperada
- `resume` deve seguir a mesma semântica de idempotência estável por intenção operacional

### Evidência documental
- `docs/product/planning/post-mvp/FUNCTIONAL_MVP_DEV_TASKS.pt-BR.md:149`
- `docs/dev/RELATIONAL_DATA_MODEL.pt-BR.md:138`
- `docs/dev/code-review/API_WORKER_CODE_REVIEW_2026-03-31.pt-BR.md:63`

### Implementação atual
- `apps/api/src/application/resume-bot/ResumeBot.ts` também usa `walletAddress + nowIso`

### Impacto
- o mesmo retry operacional pode gerar múltiplos comandos persistidos

### Teste que falha
- `apps/api/src/application/resume-bot/ResumeBot.test.ts`

## Divergência 3: wallet principal com whitespace não é tratada como desconectada

### Regra esperada
- o usuário deve conectar a wallet principal antes de validar a `Agent Wallet`
- entrada sem wallet principal válida deve resultar em `wallet_not_connected`

### Evidência documental
- `docs/dev/FM_002_CREDENTIAL_VALIDATION_TECH_DESIGN.pt-BR.md:127`
- `docs/dev/SPRINT_1_ONBOARDING_TECH_CONTRACT.pt-BR.md:152`
- `apps/app/src/ui/pages/OnboardingPage.tsx:826`

### Implementação atual
- `apps/app/src/features/onboarding/agent-wallet-validation.ts` valida `mainWalletPublicKey` com `if (!submission.mainWalletPublicKey)` sem `trim()`
- uma string como `" "` passa por essa checagem e o fluxo cai no erro de `agentWalletPublicKey`

### Impacto
- o erro exibido ao usuário pode apontar para a `Agent Wallet` mesmo quando a wallet principal está efetivamente ausente
- o comportamento fica inconsistente com a mensagem de produto e com a validação esperada do onboarding

### Teste que falha
- `apps/app/src/features/onboarding/agent-wallet-validation.test.ts`

## Próximo passo recomendado
- decidir se o time quer corrigir imediatamente essas divergências ou manter a suíte vermelha temporariamente como trava de contrato
- se a decisão for corrigir, o próximo passo natural é ajustar os casos de uso/validação e rerodar `pnpm test`
