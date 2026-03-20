# Conceito de Produto

## Hipótese Principal
Um trading bot simples de configurar, com poucos parâmetros e controle fino por trade, tem boa aderência ao Hackathon da Pacifica porque combina demonstração rápida de valor com uma experiência fácil de entender por usuários não técnicos.

## Direção do Produto
O produto deve ser posicionado como um construtor simples de estratégias, não como uma plataforma complexa de trading.

O diferencial principal não é quantidade de indicadores, e sim:
- parametrização rápida com indicadores conhecidos
- execução automática com `stop loss` e `take profit`
- controle por trade sem desligar o bot inteiro
- visualização clara do que está acontecendo na conta

## Público-Alvo
- Participante do hackathon que precisa entender a proposta rapidamente.
- Usuário iniciante que quer automatizar uma estratégia sem lidar com complexidade técnica.
- Operador que quer monitorar e intervir em trades abertos sem pausar toda a automação.

## Fluxo Principal
1. O usuário define uma estratégia simples.
2. Seleciona indicadores e parâmetros básicos.
3. Configura gatilho de entrada, `stop loss` e `take profit`.
4. Inicia o bot.
5. O bot fica monitorando o mercado.
6. Quando o gatilho ocorre, o bot abre o trade com proteção definida.
7. O usuário acompanha saldo, PnL, trades ativos e histórico.
8. O usuário pode encerrar um trade específico sem parar o bot inteiro.

## Decisões Iniciais
- Estratégia padrão ainda não definida.
- O produto vai permitir presets.
- O controle por trade na primeira versão será apenas encerramento por `market order`.
- A interface inicial será web.
- `stop loss` e `take profit` serão obrigatórios em qualquer preset.

## Estados do Trade
Quando falei em estados do trade, a ideia era mapear os status que o usuário vê na lista de trades.

Na primeira versão, os estados mínimos sugeridos são:
- aguardando entrada
- aberto
- encerrado por alvo
- encerrado por stop
- encerrado manualmente
- erro na execução

## Funcionalidades Essenciais
- saldo atual da conta na Pacifica
- lista de trades abertos e fechados
- PnL da conta e dos trades
- identificação de trades criados pela plataforma
- ação manual por trade individual
- configuração simples de indicadores

## Dashboard da Conta
O dashboard da conta será a tela inicial da web.

Os dados exatos ainda estão em definição, mas a direção é mostrar:
- saldo atual
- PnL agregado
- trades ativos
- trades recentes
- identificação de trades da plataforma
- status geral do bot

## Sessão de Presets
O desenho dos presets será tratado em uma sessão própria de produto, porque isso é o núcleo da experiência.

Nessa sessão, vamos definir:
- quais presets existem no início
- quais indicadores cada preset usa
- quais parâmetros ficam fixos
- quais parâmetros continuam editáveis
- como nomear cada preset de forma simples para usuário não técnico
- como evidenciar que o preset é uma sugestão baseada em validação anterior e não garantia de retorno

## Diferenciais de UX
- poucas telas
- linguagem simples
- defaults seguros
- estados muito claros
- ações diretas por trade

## Riscos de Produto
- expor muitos indicadores cedo demais
- criar uma configuração técnica demais para usuários não técnicos
- misturar demo de hackathon com produto final sem separar prioridades
- tornar o controle manual por trade confuso

## Trade-offs
- menos parâmetros melhoram adoção e velocidade de demo, mas reduzem flexibilidade
- mais indicadores aumentam poder, mas pioram a clareza
- permitir intervenção por trade melhora controle, mas exige cuidado para não gerar inconsistência operacional

## Perguntas em Aberto
- Qual será a primeira estratégia padrão do produto?
- O usuário vai montar tudo do zero ou partir de presets?
- O controle por trade será apenas encerramento ou também edição de parâmetros?
- A interface inicial será web, terminal ou uma camada mínima de UI?
- Quais estados do trade o usuário precisa enxergar na primeira versão?
