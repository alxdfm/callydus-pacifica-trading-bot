# Design System & UX — Redesign v1

Decisões fechadas em 2026-07-06. Mockup de referência do builder aprovado
(artifact "proposta-v1"). Este documento é a fonte de verdade da implementação.

## Identidade visual — "terminal ledger"

Monospace como voz da marca (rótulos, números, navegação em mono uppercase com
letter-spacing), dourado como acento único, verde/vermelho **reservados** para
semântica de trading (long/short/PnL) — nunca como acento decorativo.

### Tokens de cor

| Token | Escuro (default) | Claro |
|-------|------------------|-------|
| `--ground` | `#0C0F15` | `#F2F3F6` |
| `--panel` | `#131826` | `#FFFFFF` |
| `--panel2` | `#1A2030` | `#E9EBF1` |
| `--border` | `#232B3D` | `#DDE1E9` |
| `--ink` | `#E9EDF4` | `#1A2130` |
| `--muted` | `#8B94A7` | `#5B6474` |
| `--faint` | `#5E6778` | `#8A93A5` |
| `--accent` | `#D9A441` | `#A9741F` |
| `--long` | `#2FA97C` | `#1E7D5B` |
| `--short` | `#D95757` | `#BE4040` |
| série gráfico: estratégia | `#BC862B` | `#A9741F` |
| série gráfico: hold/benchmark | `#6E8FD6` | `#4B6BB4` |

As cores de série foram validadas (banda de luminosidade, croma, separação CVD,
contraste) contra os dois fundos — não alterar sem revalidar.

Regras:
- Tema definido por tokens em `:root` + override em `@media (prefers-color-scheme)`
  e `[data-theme]` — componentes só consomem tokens, nunca hex direto.
- Verde/vermelho apenas para long/short/PnL/status. Acento = dourado, único.
- Fundo escuro é o tema primário de design; o claro tem o mesmo cuidado.

### Tipografia

- **Mono** (`ui-monospace, "Cascadia Code", "JetBrains Mono", "SF Mono", Menlo,
  Consolas, monospace`): títulos de seção (11px, uppercase, letter-spacing .14em),
  navegação, chips, botões, e **todos os números** (`font-variant-numeric:
  tabular-nums` obrigatório em colunas).
- **Sans** (`system-ui`): corpo de texto e formulários. Base 14px.
- Nome de estratégia/página: sans 22px peso 650.

## Arquitetura de navegação

```
Onboarding (fora da nav; some quando completo)
Nav: Dashboard | Estratégias | Trades | Perfil
```

Fusões decididas: **History → aba/filtro em Trades**; **Operations → faixa de
saúde no Dashboard**. As rotas antigas redirecionam.

## Blueprints por tela

### Onboarding (`/onboarding`)
Página inteira (não modal), stepper linear **resumível** — recarregou, volta ao
passo pendente. Passos: 1) conectar wallet · 2) aprovar builder code ·
3) agent wallet (criar/importar + validar assinatura) · 4) readiness check
(probe operacional existente). Cada passo com estado explícito
(pendente/validando/ok/erro + como corrigir). Concluído → `/dashboard`.

### Dashboard (`/dashboard`) — leitura, zero ação
- Linha de tiles: equity total · PnL dia · PnL acumulado · posições abertas ·
  estratégias ativas
- Mini-lista: últimos 5 trades (link → Trades)
- Faixa de saúde do sistema (ex-Operations): worker vivo (heartbeat), WS
  conectado, última análise — pills com estado semântico

### Estratégias (`/strategies`, `/strategies/nova`, `/strategies/:id`)
Lista em cards: nome, símbolo, timeframe, status, PnL, ativar/pausar.

**Builder** (tela de maior investimento — ver mockup):
- Página inteira, duas colunas: config (1fr) + backtest sticky (420px);
  empilha < 980px
- Seções da esquerda: Básico (símbolo/timeframe/alavancagem) · Indicadores
  (chips com nome+params, catálogo completo: EMA, SMA, RSI, ATR, Volume,
  **Donchian, ADX**) · Entrada LONG · Entrada SHORT · Risco (SL ATR/estático,
  TP RR) · Execução (position size) · Checklist de ativação (activationBlockers)
- Regras como frases com tokens editáveis in place; grupos ALL/ANY com
  conector "E/OU" visível entre as linhas
- Backtest: seletor de período + Rodar; curva de equity vs hold (2 séries,
  legenda + labels diretos no endpoint, tooltip com crosshair); tiles de
  métricas (retorno, alpha, max DD, win rate + nº trades, profit factor,
  taxas); `<details>` com tabela dos dados; **estado "obsoleto"** quando a
  config diverge da última execução
- CTAs no header da página: Descartar · Salvar · Ativar (primário)
- Sem wizard, sem modal. Editável em qualquer ordem.

### Trades (`/trades`)
Abas **Abertas / Fechadas** (fechadas absorve a antiga History). PnL real da
Pacifica (não o estimado local). Filtros: estratégia, símbolo, período. Linha
de totais no rodapé. Colunas numéricas em mono tabular, PnL colorido pela
semântica long/short.

### Perfil (`/profile`)
Main wallet (leitura) · agent wallet: trocar/rotacionar → re-validação de
assinatura + re-check operacional · status da aprovação do builder code.

## Componentes compartilhados (inventário mínimo)

`ThemeTokens` (css) · `TopNav` · `Card` (com h2 padrão) · `Chip`/`StatusPill` ·
`Button` (primary/ghost/default) · `Field` · `IndicatorChip` · `RuleRow` ·
`MetricTile` · `EquityChart` · `HealthStrip` · `TradesTable`.

## Fases de implementação sugeridas

1. Tokens + layout base (TopNav, Card, Button, tema claro/escuro)
2. Builder + lista de estratégias (maior valor, maior risco)
3. Trades (fusão com History) + Dashboard (fusão com Operations)
4. Onboarding + Perfil
5. Remoção das páginas antigas e rotas de redirect
