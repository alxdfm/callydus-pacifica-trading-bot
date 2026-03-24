# Referencia de Presets

## Objetivo
Consolidar os artefatos operacionais da Sprint 2 para a tela de presets: cards finais, comparador, revisao, ativacao, mobile e i18n.

## Preset Cards

| Preset | Risco | Frequencia | Foco | Descricao curta | CTA |
|---|---|---|---|---|---|
| `Safer` | `Low risk` | `Low frequency` | `Selective entries` | `Lower activity with tighter protection.` | `Select preset` |
| `Balanced` | `Medium risk` | `Medium frequency` | `Controlled entries` | `Steady default with controlled exposure.` | `Selected` ou `Select preset` |
| `More active` | `Higher activity` | `Higher frequency` | `More opportunities` | `More frequent entries without promising returns.` | `Select preset` |

## Regras dos Cards
- cada card comunica risco, frequencia e foco sem depender de texto longo
- `Balanced` pode assumir destaque visual inicial como recomendacao padrao do MVP
- `More active` nao deve parecer agressivo nem sugerir ganho garantido
- o CTA do card seleciona; ele nao ativa o preset

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
- separar grupos de mensagem para:
  - escolha do preset
  - comparacao
  - revisao
  - ativacao
- evitar concatenacao de frases longas no resumo final

## Referencias
- [PRESETS_STRUCTURE.pt-BR.md](./PRESETS_STRUCTURE.pt-BR.md)
- [preview/presets.html](./preview/presets.html)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
