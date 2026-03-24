# Estrutura da Tela de Presets

## Objetivo
Consolidar a macroestrutura visual da tela de presets da Sprint 2 para desktop e mobile, reduzindo interpretacao livre em design, dev e QA.

## Escopo
Este artefato cobre:
- header da tela
- grade dos 3 presets
- comparador resumido
- painel de revisao do preset selecionado
- bloco de ativacao
- ordem dos blocos em desktop e mobile
- orientacao minima para i18n

## Estrutura Desktop
Ordem dos blocos:
1. header da tela
2. grade de presets
3. comparador resumido
4. painel de revisao
5. bloco de ativacao

Regras:
- a escolha vem antes da edicao
- comparacao vem antes da revisao
- ativacao so aparece depois de comparacao e revisao no fluxo visual
- a tela nao deve parecer formulario tecnico
- risco e frequencia permanecem visiveis antes da ativacao

## Estrutura Mobile
Ordem dos blocos:
1. header da tela
2. presets empilhados
3. comparador empilhado
4. painel de revisao
5. bloco de ativacao

Regras:
- abaixo de `860px`, a grade de presets e o comparador colapsam para uma coluna
- o mobile deve preservar leitura linear sem exigir scroll lateral
- CTA final precisa permanecer claro ao final da revisao, sem competir cedo demais com a escolha
- strings maiores em ingles ou traduzidas nao podem quebrar a ordem dos blocos

## Blocos da Tela

### Header
- apresenta a proposta da tela em linguagem guiada
- reforca que a escolha precede edicao e ativacao

### Preset Grid
- apresenta `Safer`, `Balanced` e `More active` lado a lado no desktop
- deixa o preset selecionado com destaque inequivoco
- CTA de cada card serve para selecionar, nao para ativar

### Quick Comparison
- resume diferencas entre presets sem detalhes tecnicos
- deve permitir comparacao sem sair da tela
- no mobile, vira lista vertical empilhada

### Review Panel
- mostra apenas o preset selecionado
- permite editar apenas os campos permitidos do MVP
- mantem observacao curta de risco sem prometer retorno

### Activation Block
- fecha a decisao
- CTA primario ativa
- CTA secundario cancela ou volta
- estados de habilitado, desabilitado e loading precisam ser visiveis

## Regras de i18n
- labels devem ser curtas, auto-contidas e em ingles primeiro
- nomes dos presets permanecem: `Safer`, `Balanced`, `More active`
- comparador e revisao nao devem depender de frases longas concatenadas
- o layout deve tolerar aumento de texto sem redesenho estrutural

## Referencias
- [preview/presets.html](./preview/presets.html)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
- [DESIGN_HANDOFF.pt-BR.md](./DESIGN_HANDOFF.pt-BR.md)
