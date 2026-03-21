# Layout Detalhado da Tela de Historico

## Objetivo
Definir a estrutura visual detalhada da tela de Historico do MVP, com foco em leitura simples de trades encerrados, resultado e motivo de encerramento.

## Funcao da Tela
A tela de Historico deve responder a tres perguntas:
- o que aconteceu nas operacoes encerradas?
- o resultado foi positivo ou negativo?
- o encerramento ocorreu por alvo, stop ou acao manual?

## Principio de Layout
Historico nao deve competir com Trades Atuais.

Ela deve funcionar como:
- revisao rapida
- leitura cronologica
- consulta posterior
- contexto de resultado sem excesso analitico

## Estrutura Desktop

### Faixa 1: Header da Tela
Conteudo:
- titulo: `History`
- subtitulo curto explicando que esta tela mostra apenas trades encerrados
- resumo compacto da quantidade de trades exibidos, se isso ajudar sem adicionar ruido

Objetivo:
- deixar clara a diferenca entre operacao atual e operacao passada
- contextualizar a lista que vem abaixo

### Faixa 2: Lista Cronologica Principal
Bloco principal da tela.

Cada item deve mostrar:
- simbolo
- direcao
- horario de entrada
- horario de saida
- resultado do trade
- motivo de encerramento
- identificacao de trade da plataforma

Objetivo:
- permitir leitura rapida do resultado
- manter uma estrutura repetivel e escaneavel
- facilitar comparacao visual entre lucro e prejuizo

### Faixa 3: Detalhe Opcional do Item Selecionado
Se houver detalhe no desktop.

Conteudo:
- resumo expandido do trade encerrado
- horario completo
- sequencia basica do encerramento
- motivo exibido em linguagem simples

Objetivo:
- adicionar contexto sem tornar a lista principal densa demais
- manter a tela util em desktop sem elevar a complexidade do MVP

### Faixa 4: Estado Vazio
Quando nao houver trades encerrados.

Conteudo:
- mensagem: `No trade history yet`
- texto curto explicando que trades encerrados aparecerao aqui

Objetivo:
- deixar o estado do produto claro
- evitar interpretacao de erro quando o historico ainda estiver vazio

## Estrutura Visual Recomendada

### Grid Desktop
- 12 colunas
- header ocupa largura total
- lista principal ocupa 8 ou 12 colunas, dependendo da implementacao do detalhe
- painel de detalhe opcional ocupa 4 colunas
- estado vazio ocupa largura total

### Hierarquia Visual
- o resultado do trade deve ser o elemento mais facil de escanear dentro de cada item
- o motivo de encerramento deve ser legivel sem abrir outra tela
- a lista deve ser mais discreta visualmente do que Trades Atuais
- ganho e perda devem usar tratamento consistente de cor, sem exagero

## Comportamento Mobile

### Ordem dos blocos
1. Header
2. Lista compacta de historico
3. Detalhe opcional em tela dedicada ou expansao por item

### Regras
- cada item precisa resumir resultado e motivo sem depender de hover
- evitar tabela larga no mobile
- a leitura deve continuar cronologica e compacta
- nao introduzir filtros no MVP

## Estados da Tela

### Estados globais
- carregando
- sem historico
- lista com trades encerrados
- erro de carregamento

### Estados de conteudo
- resultado positivo
- resultado negativo
- encerrado por alvo
- encerrado por stop
- encerrado manualmente
- encerrado com erro, se esse motivo fizer parte da camada visivel do MVP

## Regras de Produto
- a tela deve mostrar apenas trades encerrados
- motivo de encerramento deve ser exibido em linguagem simples
- a identificacao de trade da plataforma deve permanecer visivel
- o historico deve ajudar a revisar o que ocorreu, nao a operar o proximo trade

## O que nao incluir no MVP
- filtros avancados
- analytics aprofundado
- graficos de performance
- comparacoes extensas entre periodos
- mistura com trades atuais

## Critérios de Aceite
- um usuario entende rapidamente se o resultado foi positivo ou negativo
- um usuario identifica o motivo de encerramento sem interpretacao tecnica
- um usuario diferencia Historico de Trades Atuais em poucos segundos
- cada item funciona bem em desktop e mobile
- a tela continua simples e escaneavel

## Recomendacao Final
A tela de Historico deve parecer um registro enxuto de resultado. O foco precisa estar em:
- o que encerrou
- como encerrou
- qual foi o resultado
