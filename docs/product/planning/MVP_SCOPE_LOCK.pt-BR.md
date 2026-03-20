# Fechamento de Escopo do MVP

## Contexto e Objetivo
Este documento congela o escopo do MVP do produto Pacifica para orientar Designer e Dev no início das tarefas.

O objetivo é validar valor real com usuários não técnicos, com foco em:
- simplicidade de configuração
- clareza operacional
- poucos parâmetros editáveis
- segurança básica para demo e uso inicial

## Princípios Obrigatórios
- o produto deve parecer simples para quem não é técnico
- presets são a unidade principal de configuração
- o usuário não deve montar lógica de estratégia do zero
- `stop loss` e `take profit` são obrigatórios em todos os presets
- a interface não deve expor JSON, contrato técnico ou lógica bruta
- qualquer mudança fora deste escopo deve ser consultada antes da implementação

## Escopo Fechado do MVP

### 1. Onboarding
Fluxo obrigatório antes do uso principal.

Inclui:
- conexão de wallet Solana
- cadastro de credenciais Pacifica
- validação das credenciais
- bloqueio de acesso até conclusão válida

### 2. Presets
Seleção e ativação de estratégia por preset.

Inclui:
- 3 presets fixos: `Mais seguro`, `Equilibrado`, `Mais ativo`
- comparação simples entre presets
- revisão do preset selecionado
- ativação explícita do preset

Campos editáveis permitidos no MVP:
- `symbol`
- `position size`
- habilitar `long`
- habilitar `short`

Campos não editáveis no MVP:
- indicadores
- lógica de entrada
- timeframe
- estrutura de `stop loss`
- estrutura de `take profit`

### 3. Dashboard
Tela central do produto após onboarding.

Inclui:
- saldo atual
- PnL agregado
- preset ativo
- status geral do bot
- trades ativos
- trades recentes
- alertas operacionais mínimos

### 4. Trades Atuais
Monitoramento de posições em aberto.

Inclui:
- lista de trades abertos
- leitura de direção, símbolo, entrada, preço atual, PnL e status
- encerramento manual por trade via `market order`
- identificação de trades criados pela plataforma

### 5. Histórico
Consulta simples de trades encerrados.

Inclui:
- lista cronológica de trades fechados
- hora de entrada e saída
- resultado do trade
- motivo de encerramento
- identificação de trade da plataforma

### 6. Integração e Estados Básicos
Inclui:
- navegação entre telas do MVP
- estados de loading
- estados vazios
- estados de erro
- responsividade mínima desktop e mobile

## Fora de Escopo
Não entram no MVP:
- construtor visual de estratégia
- edição de indicadores
- edição livre de regras de entrada
- múltiplos níveis de configuração técnica
- mais de 3 presets iniciais
- filtros avançados de histórico
- analytics avançado
- dashboards altamente analíticos
- múltiplas ações manuais por trade além do encerramento
- exposição de JSON para o usuário final

## Regras de Negócio Obrigatórias
- sem onboarding válido, o usuário não acessa o produto principal
- sem wallet conectada, o fluxo não avança
- sem credenciais Pacifica válidas, o bot não é ativado
- o preset só pode ser ativado após revisão dos campos permitidos
- o usuário pode encerrar um trade específico sem parar o bot inteiro
- o status do bot precisa ser claro em todas as telas principais
- os textos devem ser simples e consistentes

## Critérios de Aceite do Fechamento de Escopo
O escopo está fechado quando:
- o time consegue explicar o MVP em menos de 1 minuto
- Designer sabe exatamente quais telas desenhar e quais estados cobrir
- Dev sabe exatamente o que implementar e o que não implementar
- QA consegue validar o fluxo principal sem interpretar requisitos abertos
- qualquer pedido novo fora deste documento entra como mudança de escopo

## Hipóteses
- 3 presets são suficientes para demonstrar valor no Hackathon
- usuários não técnicos preferem escolher do que configurar
- a maior percepção de valor vem de clareza operacional, não de flexibilidade
- o encerramento manual por trade é mais valioso do que controles avançados no MVP

## Riscos
- escopo crescer e virar plataforma genérica de trading
- UX ficar técnica demais e afastar usuários não técnicos
- onboarding gerar atrito excessivo
- falta de estados de erro e loading quebrar a demo
- desalinhamento entre docs, design e implementação

## Métricas de Sucesso
- taxa de conclusão do onboarding
- tempo para escolher e ativar um preset
- tempo para entender o estado do bot no dashboard
- uso da ação de encerramento manual por trade
- capacidade de demo ponta a ponta sem intervenção excepcional

## Handoff Para Dev e Designer

### Contexto e objetivo
Entregar um MVP web simples, claro e demonstrável para a Pacifica.

### Escopo desta task
Implementar apenas o que está listado no escopo fechado acima.

### Fora de escopo
Qualquer funcionalidade não listada aqui deve ser tratada como mudança de escopo.

### Regras de negócio obrigatórias
Usar onboarding bloqueante, 3 presets fixos, edição mínima e encerramento manual por trade.

### Critérios de aceite
O usuário conclui onboarding, ativa preset, monitora trades e consulta histórico com clareza.

### Riscos conhecidos
Complexidade excessiva, atrito no onboarding, inconsistência de estados e expansão de escopo.

### Métricas de sucesso
Conclusão do fluxo principal, entendimento rápido do estado do bot e demo estável.
