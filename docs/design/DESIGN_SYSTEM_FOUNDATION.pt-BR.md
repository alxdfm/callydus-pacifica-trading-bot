# Fundação do Design System

## Objetivo
Definir os tokens base do MVP para garantir consistência visual entre telas, estados e componentes.

## 1. Princípios de Sistema
- clareza acima de densidade
- consistência acima de variação visual
- contraste funcional acima de decoração
- ações críticas sempre inequívocas
- dark theme como padrão do produto

## 2. Tokens de Cor

### Neutros
- `--color-bg-app: #09111D`
- `--color-bg-surface: #0F1A2B`
- `--color-bg-elevated: #142238`
- `--color-bg-muted: #1A2A43`
- `--color-border-subtle: #243753`
- `--color-border-strong: #35506F`
- `--color-text-primary: #F3F7FC`
- `--color-text-secondary: #A9B8CB`
- `--color-text-muted: #7F93AA`

### Marca e ação
- `--color-accent-500: #2D8CFF`
- `--color-accent-600: #1877E6`
- `--color-accent-700: #125CB3`
- `--color-accent-soft: #102C4B`

### Estados semânticos
- `--color-success-500: #27C07D`
- `--color-success-soft: #102D23`
- `--color-warning-500: #F0A63A`
- `--color-warning-soft: #3A2A13`
- `--color-danger-500: #E56B61`
- `--color-danger-soft: #3C1D21`
- `--color-info-500: #67A8FF`
- `--color-info-soft: #162C48`

### Estado operacional
- `--color-bot-active: #27C07D`
- `--color-bot-paused: #F0A63A`
- `--color-bot-error: #E56B61`
- `--color-connection-ok: #27C07D`
- `--color-connection-off: #73859A`

### Trade e risco
- `--color-pnl-positive: #27C07D`
- `--color-pnl-negative: #E56B61`
- `--color-long: #49A1FF`
- `--color-short: #B07CFF`
- `--color-risk-low: #27C07D`
- `--color-risk-medium: #F0A63A`
- `--color-risk-high: #E56B61`

## 3. Uso de Cor

### Regras
- cor forte deve indicar ação, estado ou resultado
- áreas escuras devem sustentar legibilidade sem virar massa única
- vermelho só aparece em erro, perda e ação destrutiva
- PnL usa cor, mas não depende apenas dela: sinal e label acompanham

## 4. Tipografia

### Família principal
- `Manrope`

### Fallback
- `ui-sans-serif`
- `system-ui`
- `sans-serif`

### Escala recomendada
- `--font-size-12: 0.75rem`
- `--font-size-14: 0.875rem`
- `--font-size-16: 1rem`
- `--font-size-18: 1.125rem`
- `--font-size-20: 1.25rem`
- `--font-size-24: 1.5rem`
- `--font-size-32: 2rem`
- `--font-size-40: 2.5rem`

### Pesos
- `--font-weight-medium: 500`
- `--font-weight-semibold: 600`
- `--font-weight-bold: 700`

### Uso recomendado
- títulos de tela: `24` ou `32`
- números principais: `32` ou `40`
- título de card: `18` ou `20`
- corpo base: `16`
- legenda e metadata: `12` ou `14`

## 5. Espaçamento

### Escala base
- `--space-4: 0.25rem`
- `--space-8: 0.5rem`
- `--space-12: 0.75rem`
- `--space-16: 1rem`
- `--space-20: 1.25rem`
- `--space-24: 1.5rem`
- `--space-32: 2rem`
- `--space-40: 2.5rem`
- `--space-48: 3rem`

### Regras
- cards principais: padding `24`
- cards compactos: padding `16`
- gap entre blocos principais: `24` ou `32`
- gap interno entre label e valor: `8`

## 6. Borda, raio e sombra

### Radius
- `--radius-sm: 0.5rem`
- `--radius-md: 0.75rem`
- `--radius-lg: 1rem`
- `--radius-pill: 999px`

### Border
- espessura padrão: `1px`
- borda sempre visível em cards e inputs
- borda ajuda a separar camadas no tema escuro

### Shadows
- `--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.28)`
- `--shadow-md: 0 12px 32px rgba(0, 0, 0, 0.32)`

### Regra
- sombra serve para separar planos, não para dramatizar

## 7. Grid e Breakpoints

### Desktop
- grid de 12 colunas
- largura máxima do conteúdo: `1280px`

### Tablet
- grid de 8 colunas

### Mobile
- grid fluido de 4 colunas

### Breakpoints sugeridos
- `--bp-sm: 480px`
- `--bp-md: 768px`
- `--bp-lg: 1024px`
- `--bp-xl: 1280px`

## 8. Estados Interativos

### Hover
- aumentar contraste da borda
- pequeno reforço de brilho ou sombra

### Focus
- outline externo com `--color-accent-soft`
- borda usando `--color-accent-500`

### Disabled
- reduzir contraste
- remover sensação de clicável
- manter legibilidade mínima de texto

### Loading
- usar skeleton ou estado de espera discreto
- nunca substituir toda a tela por spinner se houver estrutura carregada

## 9. Semântica de Interface

### Botão principal
Usa `accent`.

### Botão secundário
Usa superfície escura elevada com borda.

### Ação destrutiva
Usa `danger`.

### Badge de status
Usa versão soft da cor semântica.

### Cards financeiros
Base escura; resultado usa cor no valor ou selo, não no fundo inteiro.

## 10. Acessibilidade Mínima
- contraste AA em textos principais
- foco sempre visível por teclado
- não depender só de cor para indicar sucesso, erro ou direção
- targets de toque com pelo menos `40px`
