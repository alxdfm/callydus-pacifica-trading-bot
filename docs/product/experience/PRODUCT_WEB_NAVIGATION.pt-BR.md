# Navegação e Organização Visual do MVP

## Objetivo
Definir a navegação principal e a organização visual das telas do MVP web, com foco em clareza operacional, ativação rápida de presets e monitoramento simples de trades.

## Princípio de Produto
O usuário deve entender onde está, o que está ativo e qual é a próxima ação em poucos segundos.

A navegação precisa:
- reduzir ambiguidade
- priorizar estado e ação
- evitar sensação de plataforma complexa demais

## Estrutura Principal de Navegação

### Navegação lateral fixa
Itens principais:
- Dashboard
- Presets
- Trades Atuais
- Histórico

### Gate de entrada
Antes da navegação principal, o usuário passa por um fluxo de onboarding:
- conectar wallet Solana
- informar API keys da Pacifica
- validar credenciais

### Barra superior
Elementos fixos:
- status da conexão com a Pacifica
- status geral do bot
- saldo da conta
- ação rápida de pausar ou retomar o bot

## Hierarquia das Telas

### 1. Dashboard
É a tela inicial e o centro operacional do produto.

#### Organização visual
- topo: faixa de status global
- bloco 1: saldo e PnL
- bloco 2: preset ativo e status do bot
- bloco 3: trades atuais
- bloco 4: trades recentes
- bloco 5: chamada para configurar ou trocar preset

#### Objetivo visual
- mostrar a situação da conta imediatamente
- mostrar se existe automação rodando
- permitir acesso rápido à ação mais importante

### 2. Presets
Tela dedicada à escolha e ativação de preset.

#### Organização visual
- topo: resumo curto do que é um preset
- centro: grid com 3 cards principais
- rodapé da área principal: revisão dos campos editáveis

#### Objetivo visual
- facilitar comparação entre presets
- deixar risco e frequência legíveis
- transformar a escolha em uma decisão simples

### 3. Trades Atuais
Tela focada em intervenção operacional.

#### Organização visual
- topo: resumo de quantidade de trades abertos
- centro: lista ou tabela de trades ativos
- lateral ou painel contextual: detalhe do trade selecionado

#### Objetivo visual
- destacar o que exige atenção agora
- permitir encerramento manual sem atrito
- evitar mistura com histórico

### 4. Histórico
Tela focada em leitura posterior.

#### Organização visual
- topo: titulo e contexto curto da lista encerrada
- centro: lista cronológica de trades encerrados
- detalhe opcional ao selecionar um item

#### Objetivo visual
- facilitar revisão do que aconteceu
- separar claramente operação atual de operação passada

## Fluxo de Navegação Recomendado
1. O usuário conclui onboarding.
2. Entra no Dashboard.
3. Se não houver preset ativo, vai para Presets.
4. Escolhe o preset e revisa os campos editáveis.
5. Ativa o bot.
6. Volta ao Dashboard para monitoramento.
7. Usa Trades Atuais quando quiser intervir.
8. Usa Histórico para revisar resultados.

## Regras de Hierarquia Visual
- o estado do bot deve ficar sempre visível
- trades atuais têm prioridade maior que histórico
- o preset ativo deve aparecer no Dashboard
- saldo e PnL devem aparecer acima da dobra no desktop
- ações críticas devem ser poucas e explícitas

## Navegação Mobile
- menu inferior com 4 itens:
  - Dashboard
  - Presets
  - Atuais
  - Histórico
- cards compactos no dashboard
- detalhe de trade em tela dedicada

## Padrão de Ação por Tela

### Dashboard
Ação principal:
- configurar ou revisar preset ativo

### Presets
Ação principal:
- selecionar e ativar preset

### Trades Atuais
Ação principal:
- encerrar trade específico

### Histórico
Ação principal:
- consultar resultado anterior

## O que evitar
- menus profundos
- navegação escondida
- múltiplos CTAs competindo na mesma tela
- excesso de módulos no dashboard
- gráficos complexos como elemento principal

## Sugestão de Direção Visual
- layout limpo com forte separação entre estado global e operação por trade
- cards grandes para presets
- listas densas apenas em trades atuais e histórico
- uso de cor para risco, estado e direção do trade
- foco em leitura rápida, não em decoração

## Critérios de Aceite
- um usuário entende a navegação sem tutorial
- o Dashboard responde à pergunta “o que está acontecendo agora?”
- a tela de Presets responde à pergunta “qual estratégia devo ativar?”
- a tela de Trades Atuais responde à pergunta “onde eu intervenho?”
- a tela de Histórico responde à pergunta “o que aconteceu?”

## Próxima Decisão
Definir o layout detalhado do Dashboard da conta.
