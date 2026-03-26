# Revisao de Codigo do Fluxo Pacifica Builder Approval

## Objetivo
Registrar a revisao tecnica do modulo de frontend responsavel por montar e assinar o submission de `builder approval`, para validacao do dev operacional antes de qualquer alteracao de implementacao.

## Escopo Revisado
- `apps/app/src/features/onboarding/pacifica-builder-approval.ts`
- `apps/app/src/features/onboarding/backend-builder-approval.ts`
- `packages/contracts/src/index.ts`
- `apps/api/src/infrastructure/pacifica/PacificaBuilderApprovalGateway.ts`
- `apps/api/src/infrastructure/pacifica/PacificaClient.ts`

## Conclusao Executiva
- O fluxo atual esta funcional, mas carrega riscos de consistencia, validacao tardia e duplicacao de regra critica.
- O principal problema identificado e a falta de validacao forte no frontend para `expiryWindow` e para o objeto final antes do envio ao backend.
- O formato do payload assinado esta espalhado entre camadas, o que aumenta risco de drift de contrato conforme o fluxo evoluir.
- A refatoracao recomendada deve priorizar centralizacao de contrato, validacao antecipada e reducao de duplicacao de regra de assinatura.

## Achados

### 1. Risco de `expiryWindow` invalido por parse frouxo de env
Se `VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` vier malformada, o valor atual pode virar `NaN` sem falha imediata no frontend.

Trecho observado:
- `apps/app/src/features/onboarding/pacifica-builder-approval.ts`

Impacto:
- o payload de assinatura passa a carregar um valor invalido
- a serializacao JSON pode transformar esse numero invalido em `null`
- a falha tende a aparecer apenas mais tarde, no backend ou no provider
- diagnostico fica mais caro porque o erro nasce na borda, mas explode em outra camada

Risco para escalabilidade:
- configuracoes invalidas em ambiente podem gerar incidentes dificeis de rastrear
- novos fluxos que reutilizem a mesma env podem herdar o problema

### 2. Validacao local insuficiente do submission final
O frontend monta o objeto final e devolve o submission sem validar localmente contra o schema compartilhado.

Trecho observado:
- `apps/app/src/features/onboarding/pacifica-builder-approval.ts`
- `packages/contracts/src/index.ts`

Impacto:
- entradas invalidas seguem adiante ate o backend
- o erro e capturado tarde demais para uma UX precisa
- a borda do sistema deixa de exercer o papel de validacao antecipada

Risco para escalabilidade:
- quando o contrato crescer com novos campos ou restricoes, a chance de quebra silenciosa aumenta
- o backend passa a absorver responsabilidade que deveria estar compartilhada nas bordas

### 3. Duplicacao de regra critica do payload assinado
O formato da operacao `approve_builder_code` aparece replicado entre frontend e backend, com campos equivalentes em formatos diferentes.

Trechos observados:
- `apps/app/src/features/onboarding/pacifica-builder-approval.ts`
- `apps/api/src/infrastructure/pacifica/PacificaBuilderApprovalGateway.ts`
- `apps/api/src/infrastructure/pacifica/PacificaClient.ts`

Impacto:
- qualquer ajuste de contrato exige mudanca coordenada em mais de um ponto
- a chance de divergencia entre payload assinado, payload transmitido e contrato documentado aumenta
- testes parciais podem mascarar inconsistencias de serializacao e naming

Risco para escalabilidade:
- o custo de manutencao cresce a cada novo endpoint assinado
- o projeto pode acumular variacoes de assinatura com comportamentos parecidos, mas nao identicos

### 4. Uso de serializacao deterministica via helper generico sem ownership clara de contrato
O helper `sortKeysDeep` resolve a ordenacao das chaves para assinatura, mas essa regra esta encapsulada localmente no frontend e sem um contrato compartilhado explicito.

Impacto:
- o codigo funciona, mas a regra critica de assinatura fica escondida em um utilitario generico
- fica dificil saber se a ordenacao e exigencia formal do provider ou apenas uma defesa local
- a manutencao da assinatura depende de conhecimento implicito

Risco para escalabilidade:
- outros fluxos assinados podem reimplementar a mesma ideia de formas levemente diferentes
- a consistencia do modelo de assinatura fica fragil conforme o numero de operacoes cresce

### 5. Acoplamento entre configuracao de frontend e validacao backend sem fonte canonica unica
O backend valida que `builderCode` e `maxFeeRate` recebidos batem com a propria configuracao de ambiente, o que protege o fluxo, mas tambem evidencia que a regra esta distribuida entre camadas.

Trechos observados:
- `apps/app/src/features/onboarding/pacifica-builder-approval.ts`
- `apps/api/src/infrastructure/pacifica/PacificaBuilderApprovalGateway.ts`

Impacto:
- existe defesa contra mismatch, o que e positivo
- ao mesmo tempo, a necessidade dessa defesa mostra ausencia de uma fonte canonica compartilhada para construcao do contrato

Risco para escalabilidade:
- mudancas de configuracao podem exigir sincronizacao manual entre ambientes e responsabilidades
- cresce a chance de erro operacional por drift entre frontend e backend

## Recomendacoes para Validacao do Dev Operacional

### Prioridade Alta
- validar se `VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` deve aceitar apenas inteiro positivo e falhar cedo quando estiver invalida
- validar o submission no frontend com o schema compartilhado antes de enviá-lo ao backend
- confirmar se existe teste cobrindo env invalida e payload final invalido

### Prioridade Media
- centralizar a construcao do payload canonico de assinatura em contrato compartilhado ou helper de fronteira com ownership explicito
- reduzir a duplicacao entre `payload assinado`, `submission frontend` e `payload outbound` do backend
- explicitar o contrato de serializacao deterministica usado na assinatura

### Prioridade Estrutural
- decidir se a regra de assinatura deve morar em `packages/contracts` ou em um modulo compartilhado proprio de integracao Pacifica
- definir uma unica fonte canonica para os campos do `builder approval`
- criar testes de contrato entre frontend, backend e gateway Pacifica para evitar drift

## Perguntas em Aberto para o Dev Operacional
- A ordenacao por `sortKeysDeep` e exigencia formal da Pacifica ou apenas convencao local adotada na implementacao?
- O payload assinado com `type + data` esta formalmente fechado como contrato canonico do projeto?
- O ambiente atual possui validacao automatica para `VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` malformada?
- Queremos falhar imediatamente na carga do modulo quando a configuracao estiver invalida ou apenas bloquear o fluxo no momento da submissao?
- O schema compartilhado deve ser aplicado tambem no frontend como regra obrigatoria para todo submission outbound?

## Proximo Passo Recomendado
- o dev operacional deve validar os pontos acima
- apos a validacao, a implementacao deve priorizar:
  - validacao antecipada de configuracao
  - validacao do submission na borda
  - centralizacao do contrato de assinatura
  - eliminacao de duplicacao de regra critica

## Status
- documento criado em `2026-03-26`
- atualizacao posterior em `2026-03-26`: revisao validada contra o codigo atual e correcoes de alta prioridade aplicadas

## Retorno do Dev Operacional

### Ponto 1. `expiryWindow` invalido por parse frouxo de env
Faz sentido.

Acao aplicada:
- `apps/app/src/features/onboarding/pacifica-builder-approval.ts` agora valida `VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS` como inteiro positivo
- a carga do modulo falha cedo quando a env estiver invalida

Decisao:
- aqui eu preferi falhar cedo, porque esse valor participa diretamente do payload assinado e deixar o erro explodir mais tarde so piora o diagnostico

### Ponto 2. Validacao local insuficiente do submission final
Faz sentido.

Acao aplicada:
- o frontend agora valida o submission final com `pacificaBuilderApprovalSubmissionSchema` antes de devolver o objeto

Decisao:
- isso ficou implementado em `apps/app/src/features/onboarding/pacifica-builder-approval.ts`

### Ponto 3. Duplicacao de regra critica do payload assinado
Faz sentido parcialmente.

Acao aplicada:
- centralizei o payload canonico de `approve_builder_code` e a serializacao deterministica em `packages/contracts/src/index.ts`
- frontend e backend passaram a reutilizar o mesmo helper

Limite atual:
- isso reduz drift no fluxo de builder approval
- mas ainda nao resolve toda a familia de endpoints assinados da Pacifica

### Ponto 4. `sortKeysDeep` sem ownership clara
Faz sentido.

Acao aplicada:
- a serializacao deterministica deixou de ficar escondida apenas no frontend
- agora existe helper compartilhado em `packages/contracts/src/index.ts`

Limite atual:
- o ownership ficou melhor para o fluxo de builder approval
- ainda vale decidir depois se isso deve viver num modulo dedicado de integracao Pacifica em vez de `contracts`

### Ponto 5. Acoplamento entre configuracao frontend e validacao backend
Faz sentido, mas eu nao tratei como bug imediato.

Leitura atual:
- a dupla validacao continua proposital
- o frontend precisa conhecer `builderCode` e `maxFeeRate` para assinar o payload
- o backend precisa revalidar esses mesmos valores para nao confiar cegamente no cliente

Conclusao:
- mantive essa defesa
- o ponto continua valido como observacao estrutural, nao como correcao urgente

## Resultado
- correcoes aplicadas para os achados 1, 2, 3 e 4
- achado 5 mantido como observacao estrutural valida
- `pnpm --filter @pacifica/contracts typecheck` passou
- `pnpm --filter @pacifica/app typecheck` passou
- `pnpm --filter @pacifica/api typecheck` passou
