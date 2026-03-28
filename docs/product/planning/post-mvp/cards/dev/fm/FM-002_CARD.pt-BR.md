# FM-002 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Substituir a validacao local da Agent Wallet por uma validacao real mediada pelo backend, sem expor segredo no frontend, e separar explicitamente esse fluxo do `builder approval` da conta.

## Escopo Fechado
- [x] criar endpoint backend para validar credenciais
- [x] parar de tratar validacao como simulacao local no frontend
- [x] receber resposta real da Pacifica ou adaptador homologado
- [x] persistir somente referencias seguras e nunca segredo bruto no frontend
- [x] alinhar mensagens de erro com o contrato do app
- [x] registrar a mudanca de direcao: `builder approval` deixa de ser o criterio principal de validade da `Agent Wallet`

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [x] frontend nao valida credencial apenas por formato
- [x] o resultado de validacao vem de integracao real ou adapter backend alinhado com contrato oficial
- [x] fluxo de `builder approval` separado e redesenhado para assinatura com wallet principal no frontend
- [x] criterio backend definitivo de validacao da `Agent Wallet` fechado sem depender de `approve_builder_code`

## Dependencias
- [x] FM-001 concluida

## Critérios de Aceite da Task
- [x] frontend nao valida credencial apenas por formato
- [x] o resultado de validacao vem de integracao real ou adapter backend alinhado com contrato oficial
- [x] `builder approval` nao e tratado como validacao da `Agent Wallet`
- [x] a mudanca de direcao esta refletida nas docs e no desenho tecnico do onboarding funcional

## Proximo Passo Recomendado
Usar o onboarding funcional validado como base para os proximos fluxos backend do Functional MVP.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-25`: design tecnico inicial preparado em `docs/dev/FM_002_CREDENTIAL_VALIDATION_TECH_DESIGN.pt-BR.md` para orientar endpoint, cifragem, persistencia e mapeamento de erros.
- `2026-03-25`: fluxo de validacao refinado para usar o approval obrigatorio do `builder code` como gate operacional oficial, com manutencao atomica da credencial antiga em caso de falha na troca.
- `2026-03-25`: antes da implementacao funcional, o `apps/api` deve ganhar esqueleto real em camadas `domain`, `application`, `infrastructure` e `ui/http`, alinhado aos principios de arquitetura e SOLID do projeto.
- `2026-03-25`: esqueleto real do `apps/api` criado com separacao de camadas e composicao inicial do fluxo de validacao de credenciais, ainda usando adapters locais/stub antes da integracao completa com Pacifica e banco real.
- `2026-03-25`: implementacao conectada do `FM-002` entregue em codigo com endpoint local do `api`, approval do `builder code` via backend, cifragem `AES-256-GCM`, persistencia em PostgreSQL via Prisma e onboarding do `app` consumindo a validacao pelo backend.
- `2026-03-25`: task mantida em `IN_REVIEW` ate walkthrough funcional com banco local + API local + credencial real na Pacifica.
- `2026-03-25`: mudanca de direcao confirmada por teste real contra a Pacifica: `approve_builder_code` nao deve mais ser tratado como validacao backend da `Agent Wallet`; o endpoint respondeu `Verification failed` com `Agent Wallet` e `200` com assinatura da conta principal em modo diagnostico local.
- `2026-03-25`: a partir desta evidencia, o `builder approval` passa a ser tratado como passo separado de onboarding via wallet principal no frontend, enquanto a validacao da `Agent Wallet` permanece como responsabilidade backend ainda em refinamento tecnico.
- `2026-03-25`: onboarding ajustado em codigo para o novo fluxo: assinatura do `builder approval` pela wallet principal no frontend, envio via API para a Pacifica e bloqueio da validacao da `Agent Wallet` ate esse gate ser aprovado.
- `2026-03-25`: estudo documental consolidado em `docs/dev/PACIFICA_AGENT_WALLET_OPERATIONAL_VALIDATION_STUDY.pt-BR.md` mostrou que a Pacifica nao expoe endpoint neutro de `check` para `Agent Wallet`; saldo/conta nao servem como prova e `POST`s disponiveis tem side effect operacional.
- `2026-03-26`: a task foi fechada com a implementacao do onboarding funcional completo, incluindo `builder approval` no frontend, validacao backend da `Agent Wallet`, `operational verification` via probe controlado e walkthrough manual bem-sucedido de ponta a ponta.
