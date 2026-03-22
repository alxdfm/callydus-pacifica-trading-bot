# Handoff do MVP para Design e Dev

## Contexto e Objetivo
Este documento traduz o `MVP Scope Lock` em instruções executáveis para Design e Dev.

Objetivo:
- eliminar interpretação aberta
- fixar o comportamento esperado por tela
- padronizar estados, copy e regras de UX
- garantir que o MVP permaneça simples para usuários não técnicos

## Diretrizes Gerais
- o usuário não deve ver JSON, contrato técnico ou lógica bruta
- os presets são a unidade principal de decisão
- a UI deve priorizar estado, ação e leitura rápida
- qualquer ação crítica precisa ser inequívoca
- o mobile não é uma adaptação secundária; ele faz parte do MVP
- estados vazios, loading, erro e sucesso devem existir onde houver dependência assíncrona ou ausência de dados
- a interface deve ser em inglês por padrão e preparada para i18n desde o primeiro dia

## Copy Base do Produto
Usar a linguagem abaixo como referência padrão do MVP.

### Terminologia dos presets
- `Safer`
- `Balanced`
- `More active`

### Labels centrais
- `Dashboard`
- `Presets`
- `Current Trades`
- `History`
- `Connect wallet`
- `Validate credentials`
- `Continue to Dashboard`
- `Pause bot`
- `Resume bot`
- `Review preset`
- `Change preset`
- `Activate preset`
- `Close`

### Mensagens de produto
- `Preset is a strategy suggestion, not a return guarantee.`
- `Stop loss and take profit are mandatory in all presets.`
- `Your account must be ready to operate.`
- `Without validation, access to the product remains blocked.`

## Regras de UX Transversais
- destacar sempre o estado atual antes de mostrar ações secundárias
- manter as ações destrutivas separadas do conteúdo principal
- evitar múltiplos CTAs com o mesmo peso na mesma tela
- mostrar erro perto da origem do problema
- evitar linguagem técnica demais em rótulos e microcopy
- usar um único padrão visual para status em todas as telas
- trades atuais devem sempre ter mais prioridade visual que histórico

## 1. Onboarding

### Objetivo da Tela
Garantir que o usuário conecte wallet Solana e valide credenciais Pacifica antes de acessar o produto.

### Design Deve Entregar
- header curto com explicação do fluxo em 2 etapas
- card de wallet com status claro
- card de credenciais Pacifica com campos claros
- painel de prontidão da conta
- CTA final desabilitado até a conclusão válida
- versão desktop e mobile

### Dev Deve Implementar
- bloqueio de acesso até o onboarding ser concluído
- validação de wallet conectada
- validação de credenciais Pacifica
- persistência do estado mínimo do onboarding
- estados visuais para progresso e falha

### Estados Obrigatórios
- vazio
- conectando wallet
- wallet conectada
- wallet com erro
- credenciais vazias
- validando credenciais
- credenciais válidas
- credenciais inválidas
- conta pronta
- erro geral

### Copy Final
- título: `Set up your account`
- wallet: `Connect Solana wallet`
- credenciais: `Connect Pacifica account`
- CTA: `Continue to Dashboard`

### Regras de UX
- o usuário precisa entender que existem duas etapas principais
- a próxima ação deve estar sempre evidente
- mensagens de erro devem aparecer perto do campo ou ação que falhou
- o CTA final só pode ficar ativo quando wallet e credenciais estiverem válidas

## 2. Presets

### Objetivo da Tela
Permitir comparação simples, revisão mínima e ativação explícita do preset.

### Design Deve Entregar
- cards dos 3 presets com rótulo semântico
- comparação curta entre presets
- painel de revisão do preset selecionado
- bloco de ativação com resumo do que será aplicado
- mobile em coluna única com CTA claro

### Dev Deve Implementar
- renderização dos 3 presets fixos
- seleção de preset
- exibição do painel de revisão somente após seleção
- edição apenas dos campos permitidos
- montagem do payload final de ativação
- persistência do preset ativo

### Estados Obrigatórios
- sem preset selecionado
- preset selecionado
- revisão disponível
- revisão bloqueada enquanto nada for selecionado
- ativação em andamento
- ativado com sucesso
- erro de ativação

### Campos Editáveis do MVP
- `symbol`
- `position size`
- `long`
- `short`

### Campos Não Editáveis
- indicadores
- lógica de entrada
- timeframe
- estrutura de `stop loss`
- estrutura de `take profit`

### Copy Final
- título da tela: `Presets`
- card 1: `Safer`
- card 2: `Balanced`
- card 3: `More active`
- CTA principal: `Activate preset`
- CTA secundário: `Cancel`
- aviso: `Preset is a strategy suggestion, not a return guarantee.`

### Regras de UX
- a decisão vem antes da edição
- a edição vem antes da ativação
- o risco precisa ser visível antes do clique final
- o usuário não deve ver indicadores brutos ou JSON
- o preset selecionado deve ficar evidente sem necessidade de abrir outra tela

## 3. Dashboard

### Objetivo da Tela
Mostrar rapidamente o estado da conta, do bot e dos trades em andamento.

### Design Deve Entregar
- header operacional com status global
- cards de saldo, PnL e contadores
- bloco de preset ativo
- bloco de trades atuais
- bloco de trades recentes
- bloco de alertas
- layout legível em desktop e mobile

### Dev Deve Implementar
- consumo de saldo e PnL
- exibição do preset ativo
- exibição do status do bot
- lista de trades atuais e recentes
- ação global de pausar/retomar bot
- consistência de status com as demais telas

### Estados Obrigatórios
- carregando
- sem dados
- bot ativo
- bot pausado
- bot com erro
- reconciliação necessária
- alertas vazios
- alertas com ocorrência

### Copy Final
- título: `Dashboard`
- estado resumido: `Account connected. Bot active.` ou `Account connected. Bot paused.`
- ação global: `Pause bot` / `Resume bot`
- bloco do preset: `Active preset`
- bloco de trades: `Current Trades`
- bloco de histórico curto: `Recent Trades`

### Regras de UX
- saldo e PnL devem aparecer acima da dobra no desktop
- trades atuais devem aparecer antes dos trades recentes
- preset ativo precisa estar visível sem navegação adicional
- alertas não podem dominar a tela
- o usuário precisa entender o estado do bot em poucos segundos

## 4. Trades Atuais

### Objetivo da Tela
Permitir monitoramento e encerramento manual de trades em aberto.

### Design Deve Entregar
- lista clara de trades abertos
- diferenciação visual por direção e status
- botão destrutivo `Close`
- detalhe do trade selecionado, quando houver
- mobile compacto e legível

### Dev Deve Implementar
- listagem de trades abertos
- exibição de direção, símbolo, entrada, preço atual, PnL e status
- encerramento manual via `market order`
- destaque do trade selecionado
- atualização do dashboard após encerramento

### Estados Obrigatórios
- sem trades abertos
- lista com trades
- trade selecionado
- encerrando trade
- trade encerrado com sucesso
- erro ao encerrar trade

### Copy Final
- título: `Current Trades`
- botão de ação: `Close`
- estado vazio: `No open trades` ou equivalente local definido no layout final

### Regras de UX
- a ação de encerrar deve ser inequívoca
- a confirmação visual precisa evitar clique acidental
- trade da plataforma precisa ser identificável
- a lista não pode parecer histórico

## 5. Histórico

### Objetivo da Tela
Permitir revisão simples de trades encerrados.

### Design Deve Entregar
- lista cronológica de trades fechados
- destaque de resultado positivo e negativo
- motivo de encerramento legível
- mobile com leitura compacta

### Dev Deve Implementar
- listagem de trades encerrados
- exibição de entrada, saída, resultado e motivo
- identificação de trade da plataforma
