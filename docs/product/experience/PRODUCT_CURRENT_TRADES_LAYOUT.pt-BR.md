# Layout Detalhado da Tela de Trades Atuais

## Objetivo
Definir a estrutura visual detalhada da tela de Trades Atuais do MVP, com foco em monitoramento operacional, leitura rapida e encerramento manual sem ambiguidade.

## Funcao da Tela
A tela de Trades Atuais deve responder a quatro perguntas:
- quais trades estao abertos agora?
- qual deles exige minha atencao?
- qual o estado atual de cada trade?
- como encerro um trade especifico com seguranca?

## Principio de Layout
Trades Atuais nao deve parecer historico.

Ela deve funcionar como:
- monitoramento imediato
- lista de atencao atual
- intervencao manual controlada
- leitura operacional objetiva

## Estrutura Desktop

### Faixa 1: Header Operacional
Conteudo:
- titulo: `Trades atuais`
- subtitulo curto explicando que aqui ficam apenas posicoes abertas
- contador de trades abertos
- resumo opcional de exposicao atual, se isso ja existir sem aumentar complexidade

Objetivo:
- deixar claro que esta tela mostra apenas o que esta em risco agora
- reforcar prioridade operacional

### Faixa 2: Lista Principal de Trades
Bloco principal da tela.

Conteudo:
- lista ou tabela de trades abertos
- ordenacao simples e previsivel
- destaque visual do item selecionado

Cada item deve mostrar:
- direcao
- simbolo
- preco de entrada
- preco atual
- PnL
- status
- identificacao de trade da plataforma
- acao `Encerrar`

Objetivo:
- permitir escaneamento rapido
- mostrar o essencial sem poluicao analitica
- dar acesso imediato a acao principal da tela

### Faixa 3: Painel de Detalhe do Trade
Bloco lateral ou contextual no desktop.

Conteudo:
- simbolo e direcao do trade selecionado
- status atual
- horario de entrada, se estiver disponivel
- resumo do risco aplicado no momento da entrada, se isso ja existir no contrato exibivel
- confirmacao da acao destrutiva
- CTA final `Encerrar`

Objetivo:
- evitar encerramento acidental
- dar contexto minimo antes da acao manual
- manter a lista principal leve

### Faixa 4: Estado Vazio ou Mensagem de Apoio
Quando nao houver trades abertos.

Conteudo:
- mensagem: `No open trades`
- texto curto explicando que novos trades aparecerao aqui quando o bot estiver operando
- CTA opcional para voltar ao `Dashboard`, se isso ajudar a navegacao sem competir com a tela

Objetivo:
- evitar tela morta
- manter clareza de estado

## Estrutura Visual Recomendada

### Grid Desktop
- 12 colunas
- header ocupa largura total
- lista principal ocupa 8 colunas
- painel de detalhe ocupa 4 colunas
- estado vazio ocupa largura total

### Hierarquia Visual
- lista de trades e o foco principal
- o PnL deve ser legivel, mas nao mais importante que status e direcao
- o botao `Encerrar` deve ser visivel e inequivoco
- a confirmacao da acao destrutiva deve ficar no painel de detalhe ou em confirmacao equivalente

## Comportamento Mobile

### Ordem dos blocos
1. Header
2. Lista compacta de trades
3. Detalhe do trade em tela dedicada, drawer ou expansao por item
4. Confirmacao de encerramento

### Regras
- um item por bloco compacto
- a acao `Encerrar` continua acessivel sem depender de hover
- detalhe do trade pode abrir em uma tela dedicada ou sheet
- evitar tabela larga no mobile

## Estados da Tela

### Estados globais
- carregando
- sem trades abertos
- lista com trades
- erro de carregamento

### Estados por trade
- aguardando entrada, se esse estado realmente aparecer na camada visivel do MVP
- aberto
- encerrando trade
- erro ao encerrar

### Estados da acao manual
- acao disponivel
- confirmacao pendente
- encerramento em andamento
- encerrado com sucesso
- falha ao encerrar

## Regras de Produto
- a tela nao deve misturar trades abertos com trades encerrados
- a acao de encerrar deve atuar em um trade especifico sem parar o bot inteiro
- o trade da plataforma deve ser identificavel
- a informacao exibida deve priorizar monitoramento imediato, nao analise profunda

## O que nao incluir no MVP
- filtros complexos
- historico misturado na mesma lista
- graficos por trade
- edicao de parametros do trade aberto
- multiplas acoes manuais alem de `Encerrar`

## Critérios de Aceite
- um usuario identifica rapidamente quais trades estao abertos
- um usuario diferencia `long` e `short` sem esforco
- um usuario encontra o status atual de cada trade sem abrir outra tela
- um usuario consegue encerrar um trade especifico com seguranca visual
- a tela continua legivel em desktop e mobile

## Recomendacao Final
A tela de Trades Atuais deve parecer uma fila operacional enxuta. O foco precisa estar em:
- o que esta aberto
- o que esta acontecendo agora
- qual acao manual e possivel
