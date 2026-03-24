# Handoff por Tela

## Objetivo
Resumir o que cada tela precisa preservar visualmente na implementação.

## Onboarding
Referências: [preview/onboarding.html](./preview/onboarding.html), [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md)

Prioridades:
- fluxo em 2 etapas visível sem explicação externa
- wallet e credenciais como únicos blocos principais
- `mainWalletPublicKey` readonly deve parecer dado herdado da wallet conectada
- `Agent Wallet` deve ficar semanticamente distinta da wallet principal
- painel de status da conta separado do formulário
- CTA final `Validate and Continue` bloqueado até sucesso
- estados de validação claramente distinguíveis
- `reconnecting` pode reutilizar a linguagem visual de `connecting`, sem novo estado obrigatório

Comportamento Mobile:
- abaixo de `1240px`, `flow-shell` e `onboarding-grid` colapsam para uma coluna
- a ordem vertical deve preservar: contexto da tela, wallet, `Agent Wallet`, status da conta
- `flow-side` deixa de ser sticky no mobile e vira bloco introdutório acima do conteúdo
- CTA e ações principais devem continuar visíveis sem overflow horizontal
- labels, helper texts e mensagens devem tolerar strings maiores sem sobreposição

Orientação de i18n:
- usar os grupos definidos em [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md) como base de chave para onboarding
- manter distinção explícita entre textos de `wallet` e `Agent Wallet`
- helper texts e mensagens de bloqueio não devem depender de concatenar fragmentos dinâmicos longos

## Dashboard
Referências: [preview/dashboard.html](./preview/dashboard.html), [DASHBOARD_REFERENCE.pt-BR.md](./DASHBOARD_REFERENCE.pt-BR.md)

Prioridades:
- status global acima da dobra
- cards de métrica com leitura imediata
- preset ativo com destaque médio
- trades abertos com prioridade sobre histórico recente
- ação global do bot visível no topo

Comportamento Mobile:
- cards de métrica colapsam para coluna única
- preset ativo permanece acima do histórico recente
- alertas e trades atuais não podem perder prioridade visual

Orientação de i18n:
- header, métricas, alertas e preset ativo devem seguir [DASHBOARD_REFERENCE.pt-BR.md](./DASHBOARD_REFERENCE.pt-BR.md)

## Presets
Referências: [preview/presets.html](./preview/presets.html), [PRESETS_STRUCTURE.pt-BR.md](./PRESETS_STRUCTURE.pt-BR.md), [PRESETS_REFERENCE.pt-BR.md](./PRESETS_REFERENCE.pt-BR.md)

Prioridades:
- comparação vem antes da edição
- preset selecionado tem destaque inequívoco
- revisão e ativação ficam separadas da grade de escolha
- risco permanece visível até o clique final

Comportamento Mobile:
- abaixo de `860px`, presets e comparador colapsam para uma coluna
- a ordem vertical deve preservar: cards, comparador, revisão, ativação
- a tela não pode depender de scroll lateral para comparação

Orientação de i18n:
- nomes oficiais dos presets permanecem `Safer`, `Balanced` e `More active`
- labels e resumos devem ser curtos e tolerar tradução sem redesenho
- estados e textos principais de revisão e ativação devem seguir [PRESETS_REFERENCE.pt-BR.md](./PRESETS_REFERENCE.pt-BR.md)

## Current Trades
Referências: [preview/trades.html](./preview/trades.html), [OPERATIONS_REFERENCE.pt-BR.md](./OPERATIONS_REFERENCE.pt-BR.md)

Prioridades:
- ação `Close trade` sempre visível
- direção e status reconhecíveis rapidamente
- painel de detalhe não compete com a lista principal
- visual mais operacional que analítico

Comportamento Mobile:
- lista e detalhe colapsam em leitura vertical
- `Close trade` continua visível sem scroll lateral

Orientação de i18n:
- labels de direção, status e encerramento seguem [OPERATIONS_REFERENCE.pt-BR.md](./OPERATIONS_REFERENCE.pt-BR.md)

## History
Referências: [preview/history.html](./preview/history.html), [OPERATIONS_REFERENCE.pt-BR.md](./OPERATIONS_REFERENCE.pt-BR.md)

Prioridades:
- leitura cronológica simples
- resultado e motivo de encerramento escaneáveis
- ausência de filtros no MVP
- visual mais discreto que `Current trades`

Comportamento Mobile:
- histórico colapsa para cartões ou linhas compactas em coluna única
- resultado e motivo continuam legíveis sem densidade excessiva

Orientação de i18n:
- motivos de encerramento e resultado seguem [OPERATIONS_REFERENCE.pt-BR.md](./OPERATIONS_REFERENCE.pt-BR.md)

## Navegação
Referência: [preview/index.html](./preview/index.html)

Prioridades:
- sidebar com todas as áreas principais
- item atual destacado
- navegação rasa, sem menus profundos

## Regra Geral
Se houver conflito entre densidade visual e clareza operacional, priorizar clareza operacional.
