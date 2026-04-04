# Checklist de Finalizacao do Produto

## Objetivo
Definir o que ainda precisa ser feito para levar o Pacifica Trading Bot de um `Functional MVP` avancado para um produto completo, confiavel e pronto para operar com integracao Pacifica de ponta a ponta.

O foco deste documento e fechar o produto com:
- criacao real de ordens
- fechamento manual de trades
- fechamento automatico por `take profit` e `stop loss`
- analise real de mercado
- decisao de gatilho baseada no contrato efetivo de cada preset
- reconciliacao real com a Pacifica como fonte visivel de verdade
- qualidade alta de execucao, observabilidade, setup e QA

## Resultado Final Esperado
O produto so deve ser considerado finalizado quando cumprir simultaneamente os pontos abaixo:
- o usuario conclui o onboarding real com `wallet principal`, `builder approval`, `Agent Wallet validation` e `operational verification`
- o usuario ativa um preset real e o backend persiste o contrato efetivo aplicado
- o worker analisa candles reais da Pacifica, calcula indicadores reais, avalia regras reais do preset e decide `long`, `short` ou `none`
- o worker cria ordens reais na Pacifica usando a `Agent Wallet` ativa
- o lifecycle local cria `OpenTrade`, atualiza PnL e fecha automaticamente por `TP/SL`
- o usuario consegue fechar manualmente um trade pela UI e isso se reflete corretamente na Pacifica e no estado persistido
- o backend reconcilia saldo, posicoes, ordens e trades com a Pacifica e expoe esse estado como snapshot confiavel do produto
- erros relevantes geram pausa, alerta, trilha de auditoria e caminho claro de recuperacao
- o setup local e repetivel
- a documentacao principal descreve o sistema real, nao uma arquitetura antiga
- testes automatizados e QA manual cobrem os fluxos criticos

## Estado Atual Resumido
Pelo estado atual do codigo, o projeto ja possui uma base forte:
- monorepo organizado com `app`, `api`, `worker` e pacotes compartilhados
- contratos compartilhados para onboarding, runtime, mercado e presets
- schema relacional robusto para credenciais, runtime, comandos, trades, eventos e alertas
- worker com loop continuo, lease, heartbeat, avaliacao de sinais, execucao de ordem e lifecycle local
- API com casos de uso reais para onboarding, ativacao, runtime, mercado e sessao operacional
- frontend operacional com onboarding, dashboard, presets, trades, historico e profile
- suite de testes automatizados ja passando

O que falta e o endurecimento final de reconciliacao, confiabilidade operacional, setup e congruencia documental.

## Atualizacao Documental Recente
- `2026-04-03`: onboarding da wallet principal atualizado para suportar `Phantom` e `Backpack` no frontend
- `2026-04-03`: o step 1 do onboarding ganhou seletor explicito de provider (`Wallet to connect`) antes da acao `Connect wallet`
- `2026-04-03`: o estado de sessao da wallet passou a aceitar `phantom` e `backpack`, e o `Profile` agora exibe o provider realmente conectado
- `2026-04-03`: o `README` foi atualizado para refletir o fluxo manual com selecao de wallet no onboarding

## Frentes Obrigatorias

### 1. Reconciliacao Final com a Pacifica
Essa e a frente mais importante para declarar o produto como completo.

Sem isso, o sistema ainda depende demais do lifecycle local e nao trata a exchange como fonte final de verdade para o estado operacional exibido.

Checklist passo a passo:
- mapear exatamente quais dados da Pacifica sao canonicos para saldo, posicoes, ordens abertas, ordens executadas e trades
- revisar o fluxo atual de `POST /api/account/session` e documentar claramente quais campos ainda podem estar vindo de estado local
- definir regras de reconciliacao para:
  - `OpenTrade` que existe localmente mas nao existe mais na Pacifica
  - trade/ordem existente na Pacifica e ausente localmente
  - drift de `quantity`, `entryPrice`, `currentPrice`, `PnL`, `status` e timestamps
  - fechamento ocorrido na Pacifica fora do fluxo esperado local
- implementar correcoes persistidas de drift relevante no banco
- garantir que o snapshot retornado para o app marque explicitamente:
  - `confirmed` quando veio da exchange com sucesso
  - `last_known` quando houve fallback
- validar o comportamento em indisponibilidade parcial e total da Pacifica
- registrar `OperationalEvent` e `OperationalAlert` para reconciliacoes relevantes, drift e falhas
- executar teste manual de reconciliacao com cenarios reais e registrar evidencias

Critero de aceite:
- dashboard, trades e history nao vendem estado local como confirmado quando a Pacifica nao respondeu
- qualquer discrepancia relevante entre banco/runtime e Pacifica e corrigida ou explicitamente sinalizada

### 2. Execucao Real de Ordens com Alta Confiabilidade
O produto precisa ser capaz de criar ordens reais com comportamento previsivel e auditavel.

Checklist passo a passo:
- revisar o fluxo de `SignalDecision -> OrderExecutionAttempt -> OpenTrade`
- validar idempotencia de execucao por `clientOrderId` e `signalFingerprint`
- garantir que ordem duplicada nao seja disparada em restart, retry ou reprocessamento
- revisar as regras de pausa automatica em erro bloqueante
- validar que falhas retryables e nao retryables recebem tratamento distinto
- garantir persistencia completa de:
  - payload de request
  - response da Pacifica
  - status final
  - motivo de falha
  - timestamp de inicio e fim
- revisar slippage, sizing, validacao de simbolo e arredondamento por `tickSize` e `lotSize`
- validar o comportamento quando a Pacifica rejeita a ordem por conta, assinatura, tamanho, builder code ou market info
- adicionar testes de cenarios de erro de ordem, reprocessamento e retry
- executar smoke test real de criacao de ordem em ambiente controlado

Critero de aceite:
- uma decisao operacional gera no maximo uma tentativa efetiva por idempotencia esperada
- falha critica pausa o runtime com mensagem clara e rastreavel

### 3. Lifecycle Completo de Trades
O sistema precisa fechar o ciclo inteiro do trade com qualidade operacional.

Checklist passo a passo:
- revisar o nascimento de `OpenTrade` a partir da execucao real
- validar a associacao correta entre:
  - `SignalDecision`
  - `OrderExecutionAttempt`
  - `OpenTrade`
  - `ClosedTrade`
- revisar a atualizacao periodica de `currentPrice` e `unrealizedPnl`
- validar o auto-close por candle cruzando `take_profit` ou `stop_loss`
- validar a regra de `uma posicao por simbolo`
- validar o bloqueio de novos sinais enquanto houver posicao aberta no mesmo simbolo
- revisar o fechamento manual de trade:
  - comando persistido
  - traducao para ordem real quando necessario
  - atualizacao no banco
  - reflexo no snapshot do app
- validar o caso em que o fechamento manual e disparado enquanto o worker tambem detecta `TP/SL`
- definir regra explicita de precedencia para concorrencia entre fechamento manual e fechamento automatico
- cobrir esses cenarios em teste automatizado e QA manual

Critero de aceite:
- todo trade nasce, evolui e fecha com trilha auditavel consistente
- o usuario consegue fechar manualmente sem gerar duplicidade ou corrupcao de estado

### 4. Motor de Mercado e Gatilhos dos Presets
O bot precisa decidir de forma confiavel com base no contrato efetivo de cada preset.

Checklist passo a passo:
- revisar o contrato tecnico compartilhado dos presets
- garantir que o `effectiveContractJson` persistido seja a fonte operacional usada pelo worker
- validar o pipeline:
  - traducao `BTC/USDC -> BTC`
  - fetch de candles reais
  - calculo de indicadores
  - avaliacao de regras `threshold` e `cross`
  - derivacao de `riskDistance`, `stop loss` e `take profit`
- testar cada preset suportado com fixtures de candles conhecidas
- validar o comportamento em dados insuficientes, candles ausentes e simbolo nao suportado
- revisar a coerencia entre o que o app promete na UX e o que o backend realmente opera
- documentar claramente quais presets e configuracoes sao oficialmente suportados
- garantir que o worker use exatamente o mesmo motor compartilhado da API para evitar divergencia entre simulacao e execucao
- incluir testes de regressao para cada preset e cada tipo de indicador suportado

Critero de aceite:
- a decisao do worker e auditavel e reproduzivel a partir do contrato efetivo e dos candles usados

### 5. Frontend Operacional Confiavel
O frontend deve refletir o estado real do produto com clareza e sem mascarar falhas.

Checklist passo a passo:
- revisar a dependencia atual de `localStorage`
- reduzir a persistencia local para preferencia de UI e caches nao sensiveis sempre que possivel
- garantir reidratacao consistente da sessao operacional via backend apos reload
- revisar guards de rota e estados de onboarding pronto/bloqueado
- validar mensagens de erro, loading, stale snapshot e fallback `last_known`
- garantir que dashboard, trades e history indiquem claramente quando o snapshot nao esta confirmado pela exchange
- revisar UX de pausa, retomada e fechamento manual
- validar que os estados do bot no frontend correspondem ao runtime persistido
- executar QA manual completo em desktop e mobile

Critero de aceite:
- o usuario entende o estado real do bot, da conta e dos trades sem ambiguidade

### 6. Setup, Banco e Ambiente
O projeto precisa ser simples de subir e previsivel para qualquer pessoa do time.

Checklist passo a passo:
- padronizar o setup com:
  - `.nvmrc`
  - `.env.example`
  - `docker compose`
  - `pnpm install`
- garantir que o `README` descreva o setup real e atual
- resolver o `typecheck` do banco para que falhe apenas por problema real, nao por setup implícito
- decidir se o projeto deve:
  - exigir `.env` criado manualmente
  - ou possuir um fallback local mais amigavel para `Prisma validate`
- validar `db:push`, `prisma validate`, `api dev`, `worker dev` e `app dev` em ambiente limpo
- documentar claramente quais variaveis sao obrigatorias para:
  - onboarding
  - runtime
  - worker
  - integracao Pacifica

Critero de aceite:
- uma pessoa nova consegue subir o projeto local e validar os fluxos principais sem adivinhacao

### 7. Observabilidade, Auditoria e Recuperacao
Produto completo precisa ser operavel quando algo der errado.

Checklist passo a passo:
- revisar todos os pontos que devem gerar `OperationalEvent`
- revisar criterios de criacao e resolucao de `OperationalAlert`
- garantir logs estruturados em:
  - onboarding
  - avaliacao de sinal
  - execucao de ordem
  - fechamento manual
  - reconciliacao
  - pause/resume
- validar mensagens de erro com contexto suficiente para investigacao
- garantir que falhas operacionais relevantes possam ser diagnosticadas por:
  - `walletAddress`
  - `presetActivationId`
  - `signalFingerprint`
  - `clientOrderId`
  - `pacificaOrderId`
- documentar o playbook minimo de recuperacao operacional

Critero de aceite:
- cada falha importante deixa trilha suficiente para diagnostico e recuperacao

### 8. Testes Automatizados e QA Final
A qualidade final depende de prova automatizada e validacao manual estruturada.

Checklist passo a passo:
- manter `pnpm test` verde em todo merge
- manter `pnpm typecheck` verde em ambiente corretamente configurado
- adicionar testes faltantes para:
  - reconciliacao com drift
  - concorrencia entre fechamento manual e `TP/SL`
  - idempotencia de ordem
  - restart seguro do worker
  - fallback de snapshot `last_known`
  - erros reais da Pacifica
- definir uma suite minima de testes de integracao local para `api + worker + db`
- criar checklist manual de QA para:
  - onboarding completo
  - ativacao de preset
  - pausa/retomada
  - criacao de ordem
  - fechamento manual
  - fechamento automatico por `TP/SL`
  - reconciliacao externa
  - comportamento em erro e recuperacao
- registrar os resultados finais de QA com evidencias

Critero de aceite:
- fluxos criticos tem cobertura automatizada e validacao manual documentada

### 9. Documentacao Final Congruente
Hoje essa e uma das lacunas mais visiveis.

Checklist passo a passo:
- atualizar a documentacao de arquitetura para refletir a stack real atual
- atualizar a documentacao do monorepo para refletir os pacotes reais existentes
- revisar o tracker funcional e remover diagnosticos que ja ficaram obsoletos
- adicionar um documento curto de `estado atual do sistema`
- documentar explicitamente:
  - o que ja esta pronto
  - o que ainda esta em endurecimento final
  - o que e suportado oficialmente
  - como subir, testar e operar localmente
- garantir que a documentacao de release esteja alinhada ao codigo e aos scripts reais

Critero de aceite:
- qualquer pessoa consegue entender o sistema real sem depender de contexto oral

## Ordem Recomendada de Fechamento
Para maximizar confiabilidade e evitar retrabalho, a ordem sugerida e:

1. setup e ambiente local
2. reconciliacao final com a Pacifica
3. endurecimento da execucao real de ordens
4. endurecimento do lifecycle completo de trades
5. validacao final do motor de presets e gatilhos
6. ajuste do frontend para refletir a fonte de verdade real
7. observabilidade e playbooks de recuperacao
8. testes de integracao e QA final
9. atualizacao da documentacao final

## Checklist Executivo de Release
Use esta secao como gate final.

### Gate 1. Ambiente
- [ ] `.nvmrc` presente e valido
- [ ] `.env.example` atualizado
- [ ] setup local documentado e testado
- [ ] `pnpm install` funciona em ambiente limpo
- [ ] `pnpm typecheck` funciona com ambiente configurado
- [ ] `pnpm test` verde

### Gate 2. Onboarding
- [ ] wallet principal conecta corretamente
- [ ] `builder approval` funciona no fluxo oficial
- [ ] `Agent Wallet validation` funciona
- [ ] `operational verification` funciona
- [ ] conta so acessa o produto quando realmente pronta

### Gate 3. Presets e Sinais
- [ ] preset ativo persiste contrato efetivo correto
- [ ] candles reais alimentam o motor
- [ ] indicadores sao calculados corretamente
- [ ] regras dos presets disparam sinais coerentes
- [ ] risco (`TP/SL`) deriva do contrato efetivo

### Gate 4. Execucao
- [ ] `SignalDecision` gera tentativa de ordem auditavel
- [ ] ordem real e criada sem duplicidade
- [ ] falha critica pausa o runtime
- [ ] retries e erros sao tratados corretamente

### Gate 5. Trades
- [ ] `OpenTrade` nasce corretamente
- [ ] `currentPrice` e `unrealizedPnl` atualizam corretamente
- [ ] fechamento automatico por `TP/SL` funciona
- [ ] fechamento manual funciona
- [ ] concorrencia entre fechamentos nao corrompe o estado
- [ ] `ClosedTrade` registra motivo correto

### Gate 6. Reconciliacao
- [ ] saldo e posicoes reconciliam com a Pacifica
- [ ] ordens e trades reconciliam com a Pacifica
- [ ] drift relevante e corrigido ou sinalizado
- [ ] snapshot `confirmed` vs `last_known` esta correto
- [ ] UI nao mascara fallback como confirmacao

### Gate 7. Operabilidade
- [ ] eventos e alertas cobrem falhas importantes
- [ ] logs permitem diagnosticar incidentes
- [ ] existe caminho claro de recuperacao operacional

### Gate 8. UX
- [ ] dashboard representa o runtime real
- [ ] presets refletem o estado persistido
- [ ] trades e history refletem o snapshot reconciliado
- [ ] mensagens de erro e fallback sao claras

### Gate 9. Documentacao
- [ ] arquitetura atualizada
- [ ] monorepo atualizado
- [ ] tracker funcional revisado
- [ ] guia de setup validado
- [ ] status real do produto documentado

## Definicao Final de Done
O projeto so deve ser marcado como finalizado quando:
- todos os gates acima estiverem completos
- os fluxos criticos tiverem passado em validacao automatizada e manual
- a Pacifica estiver integrada como fonte operacional confiavel
- o time conseguir subir, operar, testar e explicar o sistema sem recorrer a conhecimento informal

## Proximo Uso Recomendado
Este documento deve ser usado junto com:
- `FUNCTIONAL_MVP_TRACKER.pt-BR.md`
- `FUNCTIONAL_MVP_EXECUTION_PLAN.pt-BR.md`
- `PACIFICA_FUNCTIONAL_MVP_TECH_CONTRACT.pt-BR.md`

Sugestao de governanca:
- revisar este checklist a cada fechamento de slice
- marcar o gate correspondente como concluido apenas com evidencia
- usar este documento como criterio oficial de encerramento do produto
