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

## Dashboard
Referência: [preview/dashboard.html](./preview/dashboard.html)

Prioridades:
- status global acima da dobra
- cards de métrica com leitura imediata
- preset ativo com destaque médio
- trades abertos com prioridade sobre histórico recente
- ação global do bot visível no topo

## Presets
Referência: [preview/presets.html](./preview/presets.html)

Prioridades:
- comparação vem antes da edição
- preset selecionado tem destaque inequívoco
- revisão e ativação ficam separadas da grade de escolha
- risco permanece visível até o clique final

## Current Trades
Referência: [preview/trades.html](./preview/trades.html)

Prioridades:
- ação `Close trade` sempre visível
- direção e status reconhecíveis rapidamente
- painel de detalhe não compete com a lista principal
- visual mais operacional que analítico

## History
Referência: [preview/history.html](./preview/history.html)

Prioridades:
- leitura cronológica simples
- resultado e motivo de encerramento escaneáveis
- ausência de filtros no MVP
- visual mais discreto que `Current trades`

## Navegação
Referência: [preview/index.html](./preview/index.html)

Prioridades:
- sidebar com todas as áreas principais
- item atual destacado
- navegação rasa, sem menus profundos

## Regra Geral
Se houver conflito entre densidade visual e clareza operacional, priorizar clareza operacional.
