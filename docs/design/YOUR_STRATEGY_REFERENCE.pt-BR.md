# Referencia de YOUR Strategy

## Objetivo
Congelar a UX da feature `YOUR Strategy` como builder guiado dentro da tela de presets, preservando clareza para usuario intermediario/avancado sem transformar a experiencia em editor tecnico hostil.

## Papel da Feature
- `YOUR Strategy` entra como quarta opcao fixa ao lado de `Safer`, `Balanced` e `More active`
- funciona como estrategia custom por conta, com apenas `1` registro por conta na V1
- reutiliza o mesmo universo de ativacao, backtest e readiness do produto atual

## Regra de Entrada na Tela
- o card `YOUR Strategy` fica sempre visivel no grid principal
- se a conta ainda nao tiver estrategia custom salva, o CTA principal e `Create strategy`
- se a conta ja tiver estrategia custom salva, o CTA principal e `Edit strategy`
- o card nao ativa a estrategia diretamente; ele abre o wizard

## Reset do Builder
- o usuario pode limpar o builder localmente antes de salvar
- essa acao nao persiste mudanca automaticamente
- o reset devolve o wizard ao estado inicial do front
- se existir `YOUR Strategy` salva, o registro persistido continua intacto ate novo save

### Materializacao visual
- o wizard deve expor uma acao clara:
  - `Clear builder`
  - ou `Start over`
- antes de limpar, a UI deve avisar que apenas o front sera resetado
- microcopy sugerida:
  - `This clears the current builder state only. Your saved strategy stays unchanged until you save again.`

## Arquitetura da Jornada

### Ordem dos blocos quando `YOUR Strategy` estiver selecionada
1. header da tela
2. grid com os 4 cards
3. bloco de progresso do wizard
4. painel do step atual
5. preview final com backtest
6. bloco de ativacao

### Regra de leitura
- a experiencia continua guiada
- o usuario deve perceber que esta criando a propria estrategia, nao preenchendo JSON
- cada etapa resolve uma decisao
- a tela deve sempre deixar claro o step atual e o proximo passo

## Steps do Wizard

Sequencia oficial da V1:
1. `Market and direction`
2. `Entry rules`
3. `Stop loss`
4. `Take profit`
5. `Position sizing`
6. `Preview and backtest`

### Step 1 - Market and direction
Campos:
- `symbol`
- `timeframe`
- `long`
- `short`

Regras:
- `symbol` usa apenas:
  - `BTC/USDC`
  - `ETH/USDC`
  - `SOL/USDC`
- `timeframe` usa apenas:
  - `3m`
  - `5m`
  - `15m`
- o usuario deve habilitar `long`, `short` ou ambos
- nunca pode salvar com os dois lados desabilitados

### Step 2 - Entry rules
Campos:
- grupos de regra
- operadores `AND` e `OR`
- comparacoes entre indicadores, preco e thresholds

Regras:
- usar linguagem operacional simples:
  - `All of these`
  - `Any of these`
  - `Add condition`
  - `Add group`
- permitir aninhamento sem expor arvore tecnica crua
- limitar visualmente a complexidade inicial:
  - ate `3 AND`
  - ate `3 OR`
- materializar esse limite na interface, nao apenas na documentacao
- cada grupo precisa mostrar:
  - tipo do grupo
  - quantidade de regras
  - acao de editar/remover

## UX de `AND/OR` com aninhamento
- cada grupo aparece como card interno com label clara:
  - `All of these must happen`
  - `Any of these can happen`
- cada condicao aparece em linha legivel, por exemplo:
  - `EMA 9 crosses above EMA 21`
  - `RSI 14 is below 30`
- um grupo aninhado deve parecer subordinado visualmente, mas continuar legivel
- nao usar node editor nem conectores visuais complexos na V1
- se a combinacao ficar longa, priorizar resumo colapsado com contagem de regras
- o painel deve deixar visivel o guardrail:
  - `Up to 3 AND groups`
  - `Up to 3 OR groups`

### Step 3 - Stop loss
Modos suportados:
- percentual
- preco fixo
- condicao por indicador

Regras:
- `stop loss` e obrigatorio
- o step nao pode ser concluido sem uma opcao valida
- quando usar indicador, a lista deve reaproveitar apenas o catalogo atual permitido

### Step 4 - Take profit
Modos suportados:
- percentual
- `risk/reward`
- preco fixo
- condicao por indicador
- `trailing take profit`

Regras:
- `take profit` pode ficar ausente
- ausencia exige warning forte e confirmacao explicita antes de salvar/ativar
- o warning deve aparecer de forma persistente no step e no preview final
- `trailing take profit` deve parecer modo controlado, nao alvo infinito sem ancora

### Step 5 - Position sizing
Campos:
- `position sizing`

Regras:
- manter o step enxuto
- sizing deve parecer decisao de exposicao, nao configuracao tecnica extensa

### Step 6 - Preview and backtest
Campos:
- resumo final da estrategia
- resumo por lado:
  - `long`
  - `short`
- backtest preview reutilizado
- bloco de readiness/ativacao

Regras:
- o usuario pode salvar sem rodar backtest
- para ativar, o backtest e obrigatorio
- a UI deve tratar `Activate strategy` como bloqueado ate existir backtest valido
- a tela deve deixar clara a diferenca entre:
  - `Save draft`
  - `Run backtest`
  - `Activate strategy`

### Gate de ativacao por backtest
- `Run backtest` vem antes da ativacao no fluxo visual
- sem backtest valido, `Activate strategy` fica desabilitado
- a UI deve explicar o motivo do bloqueio com microcopy curta
- microcopy sugerida:
  - `Run a valid backtest before activation.`

## Catalogo de Indicadores
- usar apenas os indicadores existentes em [PRODUCT_INDICATORS_CATALOG.pt-BR.md](../product/strategy/PRODUCT_INDICATORS_CATALOG.pt-BR.md)
- a UX deve esconder qualquer indicador fora do catalogo atual
- a lista deve agrupar nomes de forma legivel e pesquisavel, sem expor ids tecnicos

## Estado Sem `take profit`
Warning obrigatorio:
- `This strategy has no take profit. Positions can stay open until stop loss or another exit condition closes them.`

Regras:
- warning forte no step de `Take profit`
- warning repetido no preview final
- confirmacao explicita antes de salvar/ativar sem `take profit`
- o warning nao pode parecer erro de sistema; e uma decisao de risco do usuario

### Confirmacao explicita
- a confirmacao nao pode ficar implícita no clique do CTA primario
- antes de `Save draft` ou `Activate strategy` sem `take profit`, a UI deve abrir confirmacao dedicando responsabilidade ao trader
- estrutura minima:
  - titulo: `Continue without take profit?`
  - resumo de risco
  - checkbox obrigatorio:
    - `I understand this strategy can keep positions open without a fixed profit target.`
  - CTA secundario: `Go back`
  - CTA primario:
    - `Save without take profit`
    - ou `Activate without take profit`

## Estado Bloqueado com Bot Rodando
- editar `YOUR Strategy` fica bloqueado com o bot rodando
- o bloqueio precisa aparecer antes da abertura real do wizard ou no topo dele
- microcopy sugerida:
  - `Pause the bot to edit YOUR Strategy.`
  - `Strategy changes stay blocked while operation is active.`

### Materializacao visual
- o card `YOUR Strategy` pode continuar visivel no grid, mas entra com badge de bloqueio
- ao tentar entrar, a UI mostra estado bloqueado em vez do wizard editavel
- estrutura minima do estado bloqueado:
  - badge: `Bot running`
  - titulo: `Editing is blocked while operation is active`
  - resumo curto
  - CTA primario: `Pause bot first`
  - CTA secundario opcional: `View current strategy`

## Preview Final
Estrutura minima:
- nome `YOUR Strategy`
- mercado e timeframe
- lados habilitados
- resumo de entrada
- resumo de `stop loss`
- resumo de `take profit`
- sizing
- badge de risco operacional
- backtest ja integrado ao painel final

Regras:
- preview final nao vira dump tecnico
- usar resumo em frases curtas e cards pequenos
- mostrar warning forte se faltar `take profit`

## Microcopy Base
- `YOUR Strategy`
- `Build your own logic`
- `Create strategy`
- `Edit strategy`
- `Guided builder`
- `Market and direction`
- `Entry rules`
- `Stop loss`
- `Take profit`
- `Position sizing`
- `Preview and backtest`
- `All of these must happen`
- `Any of these can happen`
- `Add condition`
- `Add group`
- `Save draft`
- `Run backtest`
- `Activate strategy`
- `Pause the bot to edit YOUR Strategy.`

## Comportamento Mobile
- o card `YOUR Strategy` entra na mesma pilha dos outros presets
- o progresso do wizard colapsa para lista vertical simples
- o painel do step atual vem antes do preview final
- grupos `AND/OR` aninhados devem colapsar sem exigir scroll horizontal
- CTAs criticos continuam no fim da leitura

## Referencias
- [PRESETS_STRUCTURE.pt-BR.md](./PRESETS_STRUCTURE.pt-BR.md)
- [PRESETS_REFERENCE.pt-BR.md](./PRESETS_REFERENCE.pt-BR.md)
- [preview/presets.html](./preview/presets.html)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
