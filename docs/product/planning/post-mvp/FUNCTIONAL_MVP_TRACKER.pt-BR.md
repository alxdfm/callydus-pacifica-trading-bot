# Functional MVP Tracker

## Objetivo
Organizar a transicao do MVP demonstravel/mockado para um MVP funcional real, com integracao Pacifica, leitura real de mercado e fluxo operacional persistido.

## Diagnostico Atual
- wallet Phantom ja tem integracao real no frontend
- validacao de credenciais ainda e local/simulada
- ativacao de preset ainda e local/simulada
- runtime operacional ainda depende de `demo-runtime`
- API ainda nao implementa integracao funcional com Pacifica
- contratos e esquema de banco ja existem como base para a proxima fase

## Resumo de Prioridade
- foco principal: fechar integracao Pacifica + analise real dos presets + read models reais do produto
- bloqueio principal: falta contrato tecnico real da Pacifica e runtime de mercado/indicadores

## Dev
| Task | Status | Tipo | Prioridade | Resumo | Proximo passo |
|------|--------|------|------------|--------|---------------|
| FM-001 | DONE | estudo + definicao tecnica | P0 | Contrato tecnico Pacifica fechado com fontes primarias, limites e delimitacao clara entre integracao direta e adaptadores internos | Iniciar FM-002 sobre o contrato fechado e o ambiente local de banco via `docker compose`. |
| FM-002 | IN_REVIEW | implementacao | P0 | Validacao real de credenciais Pacifica mediada por backend, com cifragem e persistencia, agora separada do `builder approval` da conta | Ajustar o fluxo final para `builder approval` via wallet principal no frontend e fechar o criterio backend definitivo da `Agent Wallet`. |
| FM-003 | TODO | arquitetura + implementacao | P0 | Substituir persistencia local por estado operacional de backend | Definir fronteira entre estado de sessao local e estado operacional persistido. |
| FM-004 | TODO | estudo + implementacao | P0 | Criar pipeline real de mercado e candles | Escolher a fonte real de mercado e fechar o formato canonico de candle/price feed. |
| FM-005 | TODO | implementacao | P0 | Implementar motor de indicadores e avaliacao de gatilhos dos presets | Definir se o motor sera proprio ou apoiado em biblioteca validada, com testes dos indicadores obrigatorios. |
| FM-006 | TODO | implementacao | P0 | Ligar ativacao de preset ao runtime operacional real | Fechar o fluxo de comando de ativacao e o modelo de persistencia do contrato efetivo. |
| FM-007 | TODO | implementacao | P0 | Implementar comandos reais de bot e trade via backend | Implementar command layer no backend e alinhar contratos de resposta com o frontend. |
| FM-008 | TODO | implementacao | P0 | Sincronizar dashboard, current trades e history com dados reais | Definir read models finais e substituir progressivamente os pontos de leitura local. |
| FM-009 | TODO | implementacao | P1 | Implementar reconciliacao, heartbeat e recuperacao basica | Definir rotina minima de reconciliacao e o que constitui divergencia critica no MVP funcional. |
| FM-010 | TODO | implementacao | P1 | Instrumentar logs, alertas e auditoria minima do fluxo funcional | Definir eventos minimos obrigatorios de auditoria e alerta antes da demo funcional real. |
| FM-011 | DONE | implementacao | P0 | Modelar lifecycle minimo de credenciais Pacifica com `active/replaced` | Concluida para garantir uma unica `Agent Wallet` ativa por conta e preservar historico sem ambiguidade. |
| FM-012 | DONE | arquitetura + implementacao | P0 | Endurecer a arquitetura do fluxo de credenciais no frontend e alinhar o backend ao lifecycle `active` | Concluida com saneamento do storage local, modularizacao do `Profile` e correcao de `findActiveCredential`. |

## Ordem Recomendada
1. FM-001
2. FM-002
3. FM-003
4. FM-004
5. FM-005
6. FM-006
7. FM-007
8. FM-008
9. FM-009
10. FM-010

## Cards
- [FM-001 Card](./cards/dev/FM-001_CARD.pt-BR.md)
- [FM-002 Card](./cards/dev/FM-002_CARD.pt-BR.md)
- [FM-003 Card](./cards/dev/FM-003_CARD.pt-BR.md)
- [FM-004 Card](./cards/dev/FM-004_CARD.pt-BR.md)
- [FM-005 Card](./cards/dev/FM-005_CARD.pt-BR.md)
- [FM-006 Card](./cards/dev/FM-006_CARD.pt-BR.md)
- [FM-007 Card](./cards/dev/FM-007_CARD.pt-BR.md)
- [FM-008 Card](./cards/dev/FM-008_CARD.pt-BR.md)
- [FM-009 Card](./cards/dev/FM-009_CARD.pt-BR.md)
- [FM-010 Card](./cards/dev/FM-010_CARD.pt-BR.md)
- [FM-011 Card](./cards/dev/FM-011_CARD.pt-BR.md)
- [FM-012 Card](./cards/dev/FM-012_CARD.pt-BR.md)

## Atualizacoes Recentes
- `2026-03-25`: `FM-001` fechado com o documento [PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md](../../../dev/PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md) e o ambiente local de banco padronizado com `docker compose`.
- `2026-03-25`: `FM-002` ganhou design tecnico inicial em [FM_002_CREDENTIAL_VALIDATION_TECH_DESIGN.pt-BR.md](../../../dev/FM_002_CREDENTIAL_VALIDATION_TECH_DESIGN.pt-BR.md).
- `2026-03-25`: `FM-002` foi inicialmente refinado para usar o approval do `builder code` como validacao operacional oficial da credencial, reaproveitando a logica ja provada na POC anterior.
- `2026-03-25`: `apps/api` deixou de ser placeholder e ganhou esqueleto em camadas `domain`, `application`, `infrastructure` e `ui/http` para suportar `FM-002` sem acoplamento precoce.
- `2026-03-25`: `FM-002` entregue em codigo e movido para `IN_REVIEW`, com backend local, approval do builder code via Pacifica, cifragem de segredo e persistencia via Prisma/PostgreSQL.
- `2026-03-25`: mudanca de direcao confirmada por teste real: `approve_builder_code` respondeu `Verification failed` com `Agent Wallet` e `200` com assinatura da conta principal em modo diagnostico local; o fluxo oficial passa a separar `builder approval` da conta no frontend e `Agent Wallet validation` no backend.
- `2026-03-25`: implementacao ajustada ao novo desenho: o app agora assina `approve_builder_code` com a wallet principal no onboarding, a API faz o forward para a Pacifica e a validacao backend da `Agent Wallet` foi desacoplada desse endpoint.
- `2026-03-25`: estudo adicional da doc da Pacifica confirmou que nao existe endpoint dedicado de `check` para `Agent Wallet`; o projeto deve considerar validacao em dois niveis (`validated` e `operationally_verified`) ou assumir conscientemente um `POST` com side effect como probe.
- `2026-03-25`: proposta tecnica de `operational verification pre-run` documentada para refinamento com PO, devido ao risco de o bot falhar apenas na primeira oportunidade real de trade.
- `2026-03-26`: `BG-012` entrou em implementacao tecnica parcial sem depender da UX final: a API ganhou `POST /api/onboarding/credentials/verify-operational`, a persistencia de `PacificaCredential` passou a registrar estado e auditoria de verificacao operacional, e o probe backend foi preparado para `create limit order + cancel order` com parametros de mercado vindos de `GET /api/v1/info`.
- `2026-03-26`: com o handoff do `BG-013` fechado, o onboarding do app passou a expor `Run readiness check` como quarto passo visivel e o acesso ao dashboard agora depende explicitamente de `operationally_verified`, mantendo o probe tecnico `create + cancel` transparente para o usuario.
- `2026-03-26`: `BG-012` foi validado manualmente com sucesso; o fluxo completo de onboarding concluiu `builder approval`, validacao da `Agent Wallet` e `operational verification`, liberando a conta como operacionalmente pronta.
- `2026-03-28`: `FM-011` concluida para introduzir lifecycle minimo `pending/active/replaced` em `PacificaCredential`, garantindo historico de `Agent Wallet` sem ambiguidade sobre qual credencial esta operacionalmente ativa e evitando que uma nova credencial validada seja promovida cedo demais.
- `2026-03-28`: `FM-012` concluida para remover a persistencia da private key do frontend, modularizar o fluxo de `Replace Agent Wallet` e corrigir `findActiveCredential` para respeitar apenas credenciais `active`.
