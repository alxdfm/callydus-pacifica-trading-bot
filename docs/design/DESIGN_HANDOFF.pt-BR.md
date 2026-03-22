# Handoff de Design

## Objetivo
Consolidar a base visual aprovada do MVP em uma referência prática para desenvolvimento e QA.

## Direção Aprovada
- nome: `Night Command`
- tema padrão: escuro
- tom: operacional, preciso, controlado
- contraste: alto em informação crítica
- cor principal: azul petróleo luminoso

## O Que Está Fechado
- personalidade visual
- tokens base do design system
- componentes principais do MVP
- mockups visuais de onboarding, dashboard, presets, trades atuais e histórico
- comportamento visual base de hover, foco e destaque

## Fontes de Verdade
1. [VISUAL_DIRECTION.pt-BR.md](./VISUAL_DIRECTION.pt-BR.md)
2. [DESIGN_SYSTEM_FOUNDATION.pt-BR.md](./DESIGN_SYSTEM_FOUNDATION.pt-BR.md)
3. [MVP_COMPONENT_SYSTEM.pt-BR.md](./MVP_COMPONENT_SYSTEM.pt-BR.md)
4. [preview/index.html](./preview/index.html)
5. [preview/theme.css](./preview/theme.css)

## Tokens Prioritários Para Codificar
- cores de superfície
- cores semânticas
- tipografia
- spacing
- radius
- border
- shadow
- focus ring

## Componentes Prioritários Para Implementação
1. `Button`
2. `StatusBadge`
3. `MetricCard`
4. `Input`
5. `PresetCard`
6. `TradeRow`
7. `AlertBanner`
8. `EmptyState`
9. `ReviewPanel`
10. `Topbar`
11. `Sidebar`

## Regras de Implementação
- dark theme é o padrão inicial do produto
- não criar variante clara como requisito desta fase
- estados críticos devem existir desde a primeira implementação visual
- navegação lateral deve manter todas as telas principais visíveis
- o estado atual da tela deve ficar marcado no menu
- ações destrutivas devem ser semanticamente distintas das ações primárias
- foco visível por teclado não é opcional
- não usar cor como único indicador de direção, estado ou resultado

## Regras de Conteúdo
- manter labels curtas e diretas
- evitar linguagem técnica exposta ao usuário
- preservar nomenclatura final dos presets:
  - `Safer`
  - `Balanced`
  - `More active`

## Observações de QA
QA deve validar:
- contraste e legibilidade no dark theme
- consistência entre badges, botões e cards
- visibilidade do estado do bot e da conexão
- distinção clara entre `Main wallet` e `Agent Wallet` no onboarding
- helper text do campo de `Agent Wallet private key` sem ambiguidade
- CTA `Validate and Continue` bloqueado até wallet + credenciais válidas
- `reconnecting` tratado como variação de loading sem exigir novo estado visual
- clareza da ação `Close trade`
- distinção visual entre `Current trades` e `History`

## Regras Específicas de Onboarding
- a etapa 2 usa o contrato de `Agent Wallet`, não `API key + secret`
- `mainWalletPublicKey` é readonly e vem da wallet conectada
- `agentWalletPublicKey` e `agentWalletPrivateKey` são os campos obrigatórios da validação inicial
- `credentialAlias` é opcional e não deve competir com os campos obrigatórios
- a private key solicitada deve ser explicitamente identificada como pertencente à `Agent Wallet`, nunca à wallet principal
- mensagens de erro devem separar falha transitória de erro que exige edição do campo

## Escopo Deste Handoff
Este handoff define base visual e estrutura de interface.

Ele não congela ainda:
- animações avançadas
- comportamento de dados em tempo real
- detalhes finais de microcopy por erro de backend
- detalhes de implementação de framework
