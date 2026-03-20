# Experiência Web do MVP

## Objetivo
Definir a primeira interface web do produto de forma simples, clara e operável por usuários não técnicos, com foco em dashboard da conta, ativação de preset e monitoramento de trades.

## Princípio de Produto
A web não deve expor a complexidade do contrato técnico ao usuário.

Ela deve:
- guiar a escolha do preset
- mostrar o estado real do bot
- permitir ação manual por trade individual
- deixar claro o que está ativo, o que está parado e o que precisa de atenção

## Estrutura da Interface

### 0. Onboarding
Fluxo obrigatório antes do uso principal.

Deve permitir:
- conectar wallet Solana
- informar API keys da Pacifica
- validar credenciais
- liberar o acesso ao produto somente após sucesso

### 1. Dashboard Inicial
Tela principal ao entrar no produto.

Deve mostrar:
- saldo atual da conta
- PnL agregado
- trades ativos
- trades recentes
- status geral do bot
- indicador visual de conexão/saúde

### 2. Presets
Seção de escolha do preset.

Cada card de preset deve mostrar:
- nome
- nível de risco
- descrição curta
- frequência esperada
- time frame padrão
- indicação de que `stop loss` e `take profit` já vêm obrigatórios

### 3. Configuração Mínima
Tela ou painel de revisão com os campos editáveis do MVP.

Campos permitidos:
- `symbol`
- `position size`
- habilitar ou desabilitar `long`
- habilitar ou desabilitar `short`

Campos não editáveis:
- indicadores
- lógica do preset
- `timeframe`
- estrutura de `stop loss`
- estrutura de `take profit`

### 4. Ativação
Fluxo de confirmação antes de iniciar o bot.

Deve exibir:
- preset selecionado
- parâmetros finais
- risco do preset
- confirmação explícita de ativação

### 5. Trades Atuais
Lista de trades em andamento.

Cada item deve mostrar:
- direção
- símbolo
- entrada
- preço atual
- PnL do trade
- status
- botão de encerrar via `market order`

### 6. Histórico
Lista de trades encerrados.

Deve mostrar:
- hora de entrada e saída
- resultado
- motivo do encerramento
- identificação se foi trade da plataforma

## Fluxo Principal do Usuário
1. Conecta wallet Solana.
2. Informa API keys da Pacifica.
3. Conclui validação da conta.
4. Abre o dashboard.
5. Vê saldo, PnL e estado do bot.
6. Escolhe um preset.
7. Ajusta apenas os campos permitidos.
8. Confirma e ativa o bot.
9. Acompanha os trades em execução.
10. Encerra um trade específico se necessário.
11. Consulta histórico e resultado.

## Estados de Interface

### Estados Globais
- sem conexão
- carregando
- pronto
- ativo
- pausado
- erro
- reconciliação necessária

### Estados de Trade
- aguardando entrada
- aberto
- encerrado por alvo
- encerrado por stop
- encerrado manualmente
- erro na execução

## Sugestões de UX
- usar cards de preset com linguagem simples
- evitar formulários longos
- mostrar risco de forma visual e textual
- usar botões com ação clara, sem ambiguidade
- destacar trades ativos acima do histórico
- permitir encerramento de trade sem sair da tela principal

## O que Não Fazer no MVP
- construtor visual completo de estratégia
- edição livre de lógica de entrada
- múltiplas telas de configuração técnica
- dashboard super analítico antes do core funcionar
- excesso de gráficos sem necessidade de produto

## Regras de Produto
- a web deve simplificar a decisão do usuário
- o preset deve ser a unidade principal de uso
- o trade individual deve ser o foco da intervenção manual
- o dashboard deve priorizar estado e controle, não ornamentação

## Critérios de Aceite
- um usuário entende o estado do bot em poucos segundos
- um usuário consegue ativar um preset com poucos cliques
- um usuário consegue encerrar um trade específico sem parar o bot
- os campos editáveis são poucos e claros
- o dashboard mostra saldo, PnL e trades com consistência

## Riscos
- tentar criar uma interface de trading completa cedo demais
- sobrecarregar o usuário com informação financeira sem hierarquia visual
- confundir preset com configuração técnica
- expor demasiada complexidade no primeiro contato

## Próxima Decisão
Definir a organização visual das telas e a navegação principal entre:
- dashboard
- presets
- trades atuais
- histórico
