# Referencia de Presets

## Objetivo
Consolidar os artefatos operacionais da Sprint 2 para a tela de presets: cards finais, comparador, revisao, ativacao, mobile e i18n.

## Preset Cards

| Preset | Risco | Frequencia | Foco | Descricao curta | CTA |
|---|---|---|---|---|---|
| `Safer` | `Low risk` | `Low frequency` | `Selective entries` | `Lower activity with tighter protection.` | `Select preset` |
| `Balanced` | `Medium risk` | `Medium frequency` | `Controlled entries` | `Steady default with controlled exposure.` | `Selected` ou `Select preset` |
| `More active` | `Higher activity` | `Higher frequency` | `More opportunities` | `More frequent entries without promising returns.` | `Select preset` |
| `YOUR Strategy` | `Custom risk` | `Custom cadence` | `Build your own logic` | `Create your own strategy with guided steps and backtest preview.` | `Create strategy` ou `Edit strategy` |

## Regras dos Cards
- cada card comunica risco, frequencia e foco sem depender de texto longo
- `Balanced` pode assumir destaque visual inicial como recomendacao padrao do MVP
- `More active` nao deve parecer agressivo nem sugerir ganho garantido
- `YOUR Strategy` precisa parecer potente, mas guiada
- o CTA do card seleciona; ele nao ativa o preset
- `YOUR Strategy` abre o wizard; nao pula direto para ativacao

## Comparador Resumido

### Desktop
| Preset | Risk | Frequency | Entry style | Stop type | Take profit |
|---|---|---|---|---|---|
| `Safer` | Lower | Lower | Selective | Tighter | Earlier |
| `Balanced` | Medium | Moderate | Controlled | Balanced | Balanced |
| `More active` | Higher | Higher | Opportunistic | Wider | Later |

### Mobile
- o comparador colapsa para uma lista vertical por preset
- cada item mostra os mesmos 5 rotulos, em ordem fixa

### Regra para `YOUR Strategy`
- quando `YOUR Strategy` estiver selecionada, o comparador resumido cede lugar ao progresso do wizard
- a UX nao precisa comparar `YOUR Strategy` linha a linha contra os presets padrao

## Painel de Revisao

### Estrutura
- nome do preset selecionado
- resumo textual curto do comportamento
- campos editaveis:
  - `Symbol`
  - `Position size`
  - `Long`
  - `Short`
- observacao de risco sem promessa de retorno

### Estados
- `No preset selected`: painel vazio com instrução curta para selecionar um preset
- `Preset selected`: resumo e campos editaveis visiveis

## Bloco de Ativacao

### Estrutura
- resumo final do que sera ativado
- CTA secundario: `Cancel`
- CTA primario: `Activate preset`

### Matriz de Estados do CTA
| Estado | Quando aparece | Sinal visual principal | Microcopy de apoio |
|---|---|---|---|
| `Disabled` | sem preset selecionado ou revisao incompleta | botao primario desabilitado | `Select and review a preset to continue.` |
| `Enabled` | preset revisado e pronto para ativacao | botao primario com destaque | `Ready to activate.` |
| `Loading` | ativacao em andamento | botao primario em loading | `Activating preset...` |

## Wizard de `YOUR Strategy`

### Steps
1. `Market and direction`
2. `Entry rules`
3. `Stop loss`
4. `Take profit`
5. `Position sizing`
6. `Preview and backtest`

### Regras do fluxo
- um step por vez como foco principal
- steps futuros visiveis, mas nao dominam a leitura
- o progresso deve materializar os 6 steps completos, incluindo `Position sizing`
- `Entry rules` usa grupos `AND/OR` com linguagem amigavel
- `stop loss` e obrigatorio
- `take profit` opcional exige warning forte e confirmacao explicita
- o preview final reaproveita o backtest existente no produto
- o botao de ativacao so habilita depois do backtest
- o gate do backtest deve ficar visivel no proprio bloco final, nao so implícito no fluxo
- a acao de reset do builder precisa ser explicita e nao pode persistir sozinha

### Regras para `AND/OR`
- usar labels:
  - `All of these must happen`
  - `Any of these can happen`
- cada grupo mostra contagem de regras e hierarquia simples
- aninhamento permitido sem visual de node editor
- evitar jargao estrutural como `expression tree`, `json`, `node`, `payload`
- deixar visivel o limite concreto da V1:
  - ate `3 AND`
  - ate `3 OR`

### Reset do Builder
- expor `Clear builder` ou `Start over`
- resetar apenas o estado local do front
- nao alterar a estrategia persistida sem novo save
- a acao precisa avisar isso antes de limpar

### Estado Bloqueado
- se o bot estiver rodando, `YOUR Strategy` fica bloqueada para edicao
- a mensagem principal deve orientar a pausar o bot antes da edicao
- o estado bloqueado precisa ser visivel no card e no painel principal
- o wizard nao deve parecer parcialmente editavel nesse estado

### Warning Sem `take profit`
- warning forte e persistente no step de `Take profit`
- warning repetido no preview final
- confirmacao explicita antes de salvar/ativar
- a confirmacao usa checkbox obrigatorio e CTA final específico para continuar sem `take profit`

## Comportamento Mobile
- cards empilhados em uma coluna
- comparador empilhado em lista vertical
- revisao vem antes do bloco de ativacao
- CTA final deve permanecer claro no fim da leitura, sem competir com a escolha inicial
- a tela nao pode depender de scroll horizontal

## Orientacao de i18n
- usar labels curtas e auto-contidas
- preservar os nomes finais dos presets:
  - `Safer`
  - `Balanced`
  - `More active`
- `YOUR Strategy`
- separar grupos de mensagem para:
  - escolha do preset
  - comparacao
  - revisao
  - wizard de `YOUR Strategy`
  - ativacao
- evitar concatenacao de frases longas no resumo final

## Referencias
- [PRESETS_STRUCTURE.pt-BR.md](./PRESETS_STRUCTURE.pt-BR.md)
- [YOUR_STRATEGY_REFERENCE.pt-BR.md](./YOUR_STRATEGY_REFERENCE.pt-BR.md)
- [preview/presets.html](./preview/presets.html)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
