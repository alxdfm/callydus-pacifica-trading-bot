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
- `Trades atuais`
- `Histórico`
- `Conectar wallet`
- `Validar credenciais`
- `Continuar para o dashboard`
- `Pausar bot`
- `Retomar bot`
- `Revisar preset`
- `Trocar preset`
- `Ativar preset`
- `Encerrar`

### Mensagens de produto
- `Preset é uma sugestão de estratégia, não garantia de retorno.`
- `Stop loss e take profit são obrigatórios em todos os presets.`
- `A conta precisa estar pronta para operar.`
- `Sem validação, o acesso ao produto permanece bloqueado.`

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
- CTA principal: `Ativar preset`
- CTA secundário: `Cancelar`
- aviso: `Preset é uma sugestão de estratégia, não garantia de retorno.`

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
- estado resumido: `Conta conectada. Bot ativo.` ou `Conta conectada. Bot pausado.`
- ação global: `Pausar bot` / `Retomar bot`
- bloco do preset: `Preset ativo`
- bloco de trades: `Trades atuais`
- bloco de histórico curto: `Trades recentes`

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
- botão destrutivo `Encerrar`
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
- título: `Trades atuais`
- botão de ação: `Encerrar`
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
- leitura cronológica simples

### Estados Obrigatórios
- sem histórico
- histórico carregando
- histórico disponível
- erro ao carregar histórico

### Copy Final
- título: `Histórico`
- rótulos principais: `Entrada`, `Saída`, `Resultado`, `Motivo`

### Regras de UX
- o histórico deve ser mais discreto que trades atuais
- a leitura do resultado precisa ser rápida
- filtros complexos não fazem parte do MVP

## 6. Integração e Navegação

### Objetivo da Camada
Garantir que o fluxo entre telas seja previsível.

### Design Deve Entregar
- navegação lateral ou inferior consistente
- estado ativo do item de menu
- ordem visual coerente entre desktop e mobile
- destaque claro da tela atual

### Dev Deve Implementar
- navegação entre Dashboard, Presets, Trades atuais e Histórico
- bloqueio do app principal enquanto onboarding não estiver válido
- sincronização entre preset ativo, bot e telas

### Estados Obrigatórios
- menu com item ativo
- onboarding bloqueante
- navegação disponível
- navegação bloqueada por falta de pré-requisito

### Regras de UX
- não esconder navegação principal
- não criar menus profundos
- não duplicar ações globais em excesso

## Mapa por Responsabilidade

### Design
- desenhar o layout final de cada tela
- definir hierarquia visual
- definir estados vazios, loading, erro e sucesso
- garantir responsividade desktop e mobile
- validar copy visual e clareza de ações

### Dev
- implementar layout e estados
- conectar fluxo entre telas
- manter consistência entre dados, status e navegação
- garantir bloqueios corretos de onboarding
- preservar a simplicidade definida pelo produto

## Critérios de Aceite do Handoff
- Designer consegue produzir as telas sem inferir regras abertas
- Dev consegue implementar sem perguntar o fluxo básico de cada tela
- estados obrigatórios estão declarados por tela
- copy base está fixada
- qualquer mudança nova passa por revisão de produto

## Riscos Se Este Handoff Não Existir
- retrabalho entre Design e Dev
- inconsistência de labels e status
- telas com excesso de informação técnica
- fluxo bloqueado por dependências não explicadas
- perda de foco no público não técnico
