# Referencia de Dashboard

## Objetivo
Consolidar a estrutura, os blocos, os estados principais e a orientação de i18n do Dashboard da Sprint 3.

## Estrutura da Tela

### Desktop
Ordem dos blocos:
1. header operacional
2. cards de resumo
3. preset ativo
4. alertas
5. trades atuais
6. trades recentes

### Mobile
Ordem dos blocos:
1. header operacional
2. cards empilhados
3. preset ativo
4. alertas
5. trades atuais
6. trades recentes

## Header Operacional
- título: `Operational overview`
- status da Pacifica visível
- status do bot visível
- CTA principal: `Pause bot`
- CTA secundário: `Review preset`

## Cards de Resumo
Blocos:
- `Total balance`
- `Account PnL`
- `Open trades`
- `Closed today`

Regras:
- saldo e PnL têm maior peso visual
- PnL usa semântica positiva e negativa sem dominar a tela
- rótulos permanecem curtos e escaneáveis

## Preset Ativo
Campos mínimos:
- nome do preset
- risco
- símbolo
- timeframe
- tamanho da posição
- estados de `Long` e `Short`

CTAs:
- `Change preset`
- `Open preset review`

## Trades Atuais no Dashboard
Regras:
- aparecem antes do histórico recente
- mantêm ação `Close trade` visível
- densidade suficiente para leitura rápida, sem virar tabela analítica

## Trades Recentes
Regras:
- atuam como contexto, não como foco principal
- mostram resultado e motivo de encerramento em linguagem de produto
- mantêm leitura cronológica curta

## Alertas
Tipos cobertos:
- erro
- alerta
- reconciliação
- aviso operacional

Regras:
- devem aparecer com alta visibilidade sem poluir a tela
- severidade não depende apenas de cor

## Comportamento Mobile
- cards de resumo em coluna única
- preset ativo acima da dobra sempre que possível
- trades atuais permanecem acima do histórico recente
- alertas mantêm leitura imediata sem empilhar texto excessivo

## Orientação de i18n
- separar grupos de mensagem para:
  - header operacional
  - cards de resumo
  - preset ativo
  - trades atuais
  - histórico recente
  - alertas
- labels curtas e auto-contidas
- evitar frases longas concatenadas em resumo e alertas

## Referencias
- [preview/dashboard.html](./preview/dashboard.html)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
- [DESIGN_HANDOFF.pt-BR.md](./DESIGN_HANDOFF.pt-BR.md)
