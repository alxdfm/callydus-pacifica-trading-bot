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
4. [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md)
5. [ONBOARDING_PROGRESS_REFERENCE.pt-BR.md](./ONBOARDING_PROGRESS_REFERENCE.pt-BR.md)
6. [PRESETS_STRUCTURE.pt-BR.md](./PRESETS_STRUCTURE.pt-BR.md)
7. [PRESETS_REFERENCE.pt-BR.md](./PRESETS_REFERENCE.pt-BR.md)
8. [DASHBOARD_REFERENCE.pt-BR.md](./DASHBOARD_REFERENCE.pt-BR.md)
9. [OPERATIONS_REFERENCE.pt-BR.md](./OPERATIONS_REFERENCE.pt-BR.md)
10. [PROFILE_REFERENCE.pt-BR.md](./PROFILE_REFERENCE.pt-BR.md)
11. [MVP_FINALIZATION_REFERENCE.pt-BR.md](./MVP_FINALIZATION_REFERENCE.pt-BR.md)
12. [preview/index.html](./preview/index.html)
13. [preview/theme.css](./preview/theme.css)

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
  - `YOUR Strategy`
- comparacao, revisao e ativacao de presets devem seguir [PRESETS_REFERENCE.pt-BR.md](./PRESETS_REFERENCE.pt-BR.md)
- o wizard de `YOUR Strategy` deve seguir [YOUR_STRATEGY_REFERENCE.pt-BR.md](./YOUR_STRATEGY_REFERENCE.pt-BR.md)
- dashboard deve seguir [DASHBOARD_REFERENCE.pt-BR.md](./DASHBOARD_REFERENCE.pt-BR.md)
- trades atuais e histórico devem seguir [OPERATIONS_REFERENCE.pt-BR.md](./OPERATIONS_REFERENCE.pt-BR.md)
- `Profile` deve seguir [PROFILE_REFERENCE.pt-BR.md](./PROFILE_REFERENCE.pt-BR.md)
- progressão, bloqueio e reabertura de steps do onboarding devem seguir [ONBOARDING_PROGRESS_REFERENCE.pt-BR.md](./ONBOARDING_PROGRESS_REFERENCE.pt-BR.md)
- consistência final, estados vazios, loading e erro devem seguir [MVP_FINALIZATION_REFERENCE.pt-BR.md](./MVP_FINALIZATION_REFERENCE.pt-BR.md)

## Observações de QA
QA deve validar:
- contraste e legibilidade no dark theme
- consistência entre badges, botões e cards
- visibilidade do estado do bot e da conexão
- distinção clara entre `Main wallet` e `Agent Wallet` no onboarding
- `builder approval` claramente percebido como etapa separada e obrigatória da conta
- `operational verification` claramente percebida como check operacional controlado
- progressão do onboarding claramente percebida com steps `done`, `current` e `locked`
- helper text do campo de `Agent Wallet private key` sem ambiguidade
- CTA final bloqueado até wallet + `builder approval` + `Agent Wallet` + `operationally_verified`
- `reconnecting` tratado como variação de loading sem exigir novo estado visual
- clareza da ação `Close trade`
- distinção visual entre `Current trades` e `History`
- separação clara entre manutenção de conta em `Profile` e setup inicial em `Onboarding`
- distinção clara entre presets padrão e `YOUR Strategy`
- warning forte e compreensível quando `YOUR Strategy` estiver sem `take profit`
- confirmação explícita com checkbox antes de salvar/ativar sem `take profit`
- estado bloqueado de edição de `YOUR Strategy` perceptível com bot rodando
- os 6 steps do wizard claramente materializados, incluindo `Position sizing`
- gate visível de backtest válido antes da ativação de `YOUR Strategy`
- `AND/OR` e aninhamento legíveis sem expor semântica técnica crua

## Regras Específicas de Onboarding
- o onboarding tem 4 etapas: wallet, `builder approval`, `Agent Wallet` e `operational verification`
- o `builder approval` acontece entre a conexão da wallet e a validação da `Agent Wallet`
- `builder approval` é uma autorização única da conta assinada com a wallet principal conectada
- o `builder approval` não deve ser descrito como transferência nem como validação da `Agent Wallet`
- `mainWalletPublicKey` é readonly e vem da wallet conectada
- `agentWalletPublicKey` e `agentWalletPrivateKey` são os campos obrigatórios da validação inicial
- `credentialAlias` é opcional e não deve competir com os campos obrigatórios
- a private key solicitada deve ser explicitamente identificada como pertencente à `Agent Wallet`, nunca à wallet principal
- rejeição ou erro em `builder approval` devem oferecer retry claro quando aplicável
- `operational verification` acontece depois da validação da `Agent Wallet` e antes da liberação final
- `operational verification` deve explicar que uma ordem técnica controlada será criada e cancelada em seguida
- a UX não deve chamar esse passo de `trade`
- falha transitória e bloqueio real de conta devem ter mensagens distintas nesse check
- steps futuros ficam visíveis, porém bloqueados, até a conclusão do step anterior
- steps concluídos ficam congelados e reabrem apenas via ação explícita de `Edit`
- editar um step concluído invalida visualmente os steps dependentes conforme [ONBOARDING_PROGRESS_REFERENCE.pt-BR.md](./ONBOARDING_PROGRESS_REFERENCE.pt-BR.md)
- mensagens de erro devem separar falha transitória de erro que exige edição do campo
- estados e microcopy principal do onboarding devem seguir [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md)

## Regras Específicas de Profile
- `Profile` existe para manutenção recorrente da conta após setup inicial
- `Log out` deve aparecer como ação própria de sessão, sem competir com CTAs de formulário
- `mainWalletPublicKey` permanece somente leitura e não deve parecer campo comum editável
- `Main wallet` deve comunicar identidade da conta atual, não manutenção editável
- edição crítica de `Agent Wallet` deve ficar bloqueada quando houver operação em andamento
- mudanças de `Agent Wallet` exigem revalidação explícita
- mudanças de chave em `Agent Wallet` exigem novo `operational verification` antes de retomar operação
- mudança apenas de `credentialAlias` não deve carregar o mesmo peso visual de uma troca de chave
- avisos de segurança precisam mostrar impacto sem linguagem alarmista

## Orientação de i18n Para Onboarding
- usar os grupos de mensagem da seção `Microcopy Principal` em [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md) como referência inicial de chave
- preservar frases curtas e auto-contidas para evitar quebras no layout mobile
- não esconder distinção semântica entre `wallet`, `builder approval`, `Agent Wallet` e `operational verification` por reaproveitamento excessivo de chave
- tratar mensagens de bloqueio, loading, sucesso e erro como grupos separados na camada de i18n
- helper texts devem permanecer independentes dos labels para facilitar tradução e revisão futura

## Escopo Deste Handoff
Este handoff define base visual e estrutura de interface.

Ele não congela ainda:
- animações avançadas
- comportamento de dados em tempo real
- detalhes finais de microcopy por erro de backend
- detalhes de implementação de framework
