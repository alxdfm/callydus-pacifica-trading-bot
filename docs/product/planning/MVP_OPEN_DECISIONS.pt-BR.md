# Checklist de Decisões em Aberto do MVP

## Objetivo
Consolidar as poucas decisões que ainda vale fechar explicitamente antes de abrir todas as tasks de design e desenvolvimento, reduzindo retrabalho e desalinhamento.

## Resumo de Status
- o escopo de produto já está definido o suficiente para iniciar a Sprint 1
- onboarding e presets podem começar imediatamente
- dashboard pode começar com baixo risco
- trades atuais e histórico merecem uma consolidação curta de design antes da implementação completa

## 1. Decisões Para Fechar Agora

### 1.1 Ação global do bot
Decisão:
- `Pausar bot` / `Retomar bot` faz parte do MVP

Por que importa:
- essa ação aparece como requisito em planejamento e critérios de aceite do dashboard
- a documentacao precisa refletir isso de forma consistente

Impacto:
- afeta a topbar
- afeta o header do dashboard
- afeta o modelo de status do bot
- afeta critérios de aceite

Direção recomendada:
- manter `Pausar bot` / `Retomar bot` como acao global fixa do dashboard no MVP
- alinhar handoff, planning, quality e wireframes com essa decisao

### 1.2 Filtros do historico
Decisão:
- a tela de Historico nao tera filtros no MVP

Por que importa:
- alguns docs ainda mencionam filtros simples como opcionais e isso precisa ser removido

Impacto:
- afeta layout do historico
- afeta densidade no mobile
- afeta escopo de implementacao

Direção recomendada:
- remover referencias a filtros do historico nos docs do MVP

### 1.3 Layouts de Trades Atuais e Historico
Decisão:
- definir layout detalhado de `Trades Atuais` e `Historico`

Por que importa:
- os docs de experience tem layout detalhado de onboarding, presets e dashboard
- esse mesmo nivel de detalhe ainda nao existe para essas duas telas

Impacto:
- afeta hierarquia da UI
- afeta comportamento responsivo
- afeta comportamento do painel de detalhe
- afeta tratamento da acao destrutiva

Direção recomendada:
- criar dois docs curtos de experience com:
  - estrutura desktop
  - estrutura mobile
  - estados obrigatorios
  - densidade de informacao por item
  - estado vazio
  - comportamento da acao de encerramento

### 1.4 Consistencia de copy e nomenclatura
Decisão:
- normalizar labels finais e nomes de exemplo entre docs PT-BR e EN

Por que importa:
- ainda existem exemplos inconsistentes nos wireframes, especialmente no nome do preset

Impacto:
- afeta handoff de design
- afeta chaves de i18n
- afeta validacao de QA

Direção recomendada:
- tratar estes nomes como finais:
  - `Safer`
  - `Balanced`
  - `More active`

## 2. Decisões Tecnicas Para Fechar Cedo

### 2.1 Integracao da wallet Solana
Decisão:
- escolher o provider ou adapter de wallet da Sprint 1

Por que importa:
- a implementacao do onboarding depende do modelo de conexao

Impacto:
- afeta estados de conexao
- afeta persistencia de sessao
- afeta tratamento de erro

Direção recomendada:
- escolher um caminho unico de wallet para o MVP e evitar complexidade de multiplas wallets, a menos que isso ja exista

### 2.2 Contrato das credenciais Pacifica
Decisão:
- confirmar quais sao os campos exatos e como funciona o fluxo de validacao

Por que importa:
- os docs ainda deixam `secret ou credencial equivalente` em aberto
- o dev precisa do shape final do formulario e do modelo de resposta da validacao

Impacto:
- afeta formulario do onboarding
- afeta estados de validacao
- afeta integracao backend/API
- afeta mensagens localizadas de erro

Direção recomendada:
- congelar:
  - campos obrigatorios
  - gatilho de validacao
  - payload de sucesso
  - payload de erro
  - falhas bloqueantes vs falhas com retry

### 2.3 Contrato de dados operacionais
Decisão:
- confirmar o shape dos dados de dashboard, trades abertos e historico

Por que importa:
- os requisitos de produto estao claros, mas o mapeamento de dados ainda esta implicito

Impacto:
- afeta modelo de estado no frontend
- afeta mocks
- afeta estados de loading e erro
- afeta sincronizacao entre dashboard e telas de trade

Direção recomendada:
- definir um contrato leve para:
  - resumo da conta
  - status do bot
  - preset ativo
  - trades abertos
  - trades encerrados
  - alertas

### 2.4 Comportamento de atualizacao
Decisão:
- confirmar como o refresh dos dados funciona no MVP

Por que importa:
- os docs definem o que precisa aparecer, mas nao como e com que frequencia isso atualiza

Impacto:
- afeta percepcao de confiabilidade
- afeta atualizacao do dashboard
- afeta sincronizacao apos encerramento de trade

Direção recomendada:
- escolher uma abordagem simples para o MVP:
  - polling
  - refresh manual
  - atualizacao orientada a eventos, se isso ja existir

## 3. O Que Ja Pode Comecar Agora

### Design
- mini sistema visual
- onboarding desktop e mobile
- estados de onboarding
- tela de presets
- cards dos presets
- estados de revisao e ativacao do preset
- hierarquia do dashboard

### Desenvolvimento
- shell da aplicacao
- roteamento
- base de i18n
- layout compartilhado
- modelo de estado do onboarding
- guardas de rota
- estrutura da tela de onboarding
- consumo do contrato dos presets
- camada de mock ou adapter para dados do dashboard

## 4. Modelo de Trabalho Recomendado

### Sequencia recomendada
1. fechar as decisoes em aberto acima em uma passada curta de produto
2. iniciar design e desenvolvimento em paralelo
3. manter design cerca de uma sprint a frente do desenvolvimento
4. evitar abrir implementacao completa da Sprint 4 antes de consolidar os docs faltantes de experience

### Regra pratica
- dev nao deve esperar design visual polido para comecar a Sprint 1
- dev deve esperar fluxo, estados e regras de interacao claros antes de implementar comportamentos sensiveis da UI

## 5. Definicao de Pronto Para Abrir Todas as Tasks
- acao global do bot confirmada ou removida
- filtros do historico confirmados ou removidos
- layout de trades atuais documentado
- layout de historico documentado
- caminho de integracao de wallet escolhido
- formulario e validacao das credenciais Pacifica congelados
- contrato de dados operacionais definido ao menos no nivel de integracao do frontend
- copy e nomenclatura dos wireframes consistentes entre os docs
