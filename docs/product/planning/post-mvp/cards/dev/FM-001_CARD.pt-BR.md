# FM-001 Card

## Status
- status: `DONE`
- tipo: `estudo + definicao tecnica`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Mapear os endpoints, autenticacao, limites, payloads e respostas reais da Pacifica necessarios para sair do modo local/mockado.

## Escopo Fechado
- [x] descobrir fluxo real de validacao de credenciais
- [x] descobrir fluxo real de ativacao de estrategia ou bot
- [x] descobrir leitura real de saldo, trades abertos, historico e status
- [x] descobrir acao real de pausa, retomada e encerramento manual
- [x] registrar limitacoes, rate limit e erros conhecidos da API

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [x] existe um contrato tecnico claro para a Pacifica, sem lacunas criticas para implementacao
- [x] PO, dev e QA sabem quais partes do fluxo dependem da Pacifica e quais precisam de adaptador local temporario

## Dependencias
- [ ] nenhuma dependencia previa

## Critérios de Aceite da Task
- [x] existe um contrato tecnico claro para a Pacifica, sem lacunas criticas para implementacao
- [x] PO, dev e QA sabem quais partes do fluxo dependem da Pacifica e quais precisam de adaptador local temporario

## Proximo Passo Recomendado
Executar `FM-002` sobre o contrato fechado, movendo a validacao de credenciais para backend com persistencia real.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-25`: documento tecnico consolidado em `docs/dev/PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md`, com referencias primarias da Pacifica e delimitacao entre integracao direta e runtime interno.
- `2026-03-25`: ambiente local de banco padronizado para a trilha funcional via `docker compose`.
