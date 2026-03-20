# Sprint 2: Tasks do Designer

## Objetivo da Sprint
Entregar a experiência completa de escolha, comparação, revisão e ativação de presets, pronta para handoff ao desenvolvimento.

## Escopo
- cards finais dos 3 presets
- comparação curta entre presets
- painel de revisão do preset selecionado
- bloco de ativação
- estados desktop e mobile da tela de presets

## Entregáveis finais da Sprint
- tela de presets desktop completa
- tela de presets mobile completa
- cards finais de `Mais seguro`, `Equilibrado` e `Mais ativo`
- comparador resumido
- painel de revisão com campos editáveis
- CTA final de ativação com estados
- handoff mínimo da Sprint 2

## Task D2.1: Definir estrutura final da tela de Presets

### Objetivo
Fechar a estrutura macro da tela de Presets para desktop e mobile.

### Escopo
- header
- grid de presets
- comparador
- revisão do preset
- bloco de ativação

### Atividades
- organizar a hierarquia visual da página
- definir a ordem dos blocos no desktop
- definir a ordem dos blocos no mobile
- validar a relação entre comparação, revisão e ativação
- confirmar que a tela não parece um formulário técnico

### Entregáveis
- arquitetura visual final da tela de presets

### Dependências
- outputs da Sprint 1

### Critério de pronto
- a estrutura responde claramente a escolha, revisão e ativação
- a ordem dos blocos é clara em desktop e mobile

## Task D2.2: Desenhar card final do preset Mais seguro

### Objetivo
Traduzir o preset `Mais seguro` em um card de decisão fácil de entender.

### Escopo
- nome
- risco
- frequência
- foco
- CTA

### Atividades
- definir texto curto do preset
- definir nível de risco visual
- definir frequência esperada
- definir foco do comportamento
- definir CTA de seleção
- validar legibilidade do card em desktop e mobile

### Entregáveis
- card final do preset `Mais seguro`

### Dependências
- D2.1

### Critério de pronto
- o card comunica segurança e seletividade sem excesso de texto

## Task D2.3: Desenhar card final do preset Equilibrado

### Objetivo
Traduzir o preset `Equilibrado` em um card equilibrado e comparável com os outros dois.

### Escopo
- nome
- risco
- frequência
- foco
- CTA

### Atividades
- definir texto curto do preset
- definir tratamento visual de risco médio
- definir frequência equilibrada
- definir foco do comportamento
- definir CTA de seleção
- validar diferenciação frente ao `Mais seguro` e `Mais ativo`

### Entregáveis
- card final do preset `Equilibrado`

### Dependências
- D2.1

### Critério de pronto
- o card comunica equilíbrio entre proteção e oportunidade

## Task D2.4: Desenhar card final do preset Mais ativo

### Objetivo
Traduzir o preset `Mais ativo` em um card que comunica maior atividade sem parecer agressivo ou prometer retorno.

### Escopo
- nome
- risco
- frequência
- foco
- CTA

### Atividades
- definir texto curto do preset
- definir frequência maior
- definir foco em oportunidade
- definir CTA de seleção
- revisar linguagem para evitar interpretação de promessa de ganho

### Entregáveis
- card final do preset `Mais ativo`

### Dependências
- D2.1

### Critério de pronto
- o card comunica mais atividade sem ambiguidade de risco

## Task D2.5: Definir comparador resumido entre presets

### Objetivo
Permitir comparação rápida sem exigir abertura de detalhes técnicos.

### Escopo
- risco
- frequência
- estilo de entrada
- tipo de stop
- tipo de take profit

### Atividades
- definir estrutura do comparador
- definir rótulos curtos e consistentes
- garantir leitura rápida em desktop
- adaptar para formato empilhado no mobile

### Entregáveis
- comparador resumido desktop
- comparador resumido mobile

### Dependências
- D2.2
- D2.3
- D2.4

### Critério de pronto
- o usuário compara os 3 presets sem sair da tela

## Task D2.6: Desenhar painel de revisão do preset selecionado

### Objetivo
Definir a área onde o usuário revisa e ajusta apenas os campos permitidos do MVP.

### Escopo
- resumo do preset selecionado
- campos editáveis
- observação de risco

### Atividades
- desenhar bloco com nome do preset selecionado
- desenhar resumo textual do comportamento
- posicionar campos editáveis:
  - símbolo
  - tamanho da posição
  - long
  - short
- incluir observação de sugestão sem garantia de retorno
- definir estados de preset selecionado e não selecionado

### Entregáveis
- painel de revisão final

### Dependências
- D2.5

### Critério de pronto
- o usuário entende o que será ativado e o que pode ajustar

## Task D2.7: Definir bloco de ativação e estados do CTA

### Objetivo
Especificar o fechamento da decisão de ativação do preset.

### Escopo
- CTA primário
- CTA secundário
- estado habilitado
- estado desabilitado
- estado de loading

### Atividades
- desenhar bloco final de ativação
- definir visual do CTA principal
- definir visual do CTA secundário
- definir estados do botão:
  - normal
  - hover/foco
  - desabilitado
  - loading
- definir mensagem de contexto do resumo final

### Entregáveis
- bloco de ativação completo
- matriz de estados do CTA

### Dependências
- D2.6

### Critério de pronto
- o usuário entende claramente qual preset será ativado antes do clique final

## Task D2.8: Validar comportamento mobile da tela de presets

### Objetivo
Garantir que a experiência de presets continue clara e usável em telas pequenas.

### Escopo
- cards empilhados
- comparador empilhado
- revisão
- CTA persistente

### Atividades
- revisar ordem dos blocos no mobile
- validar legibilidade dos cards
- adaptar comparador para lista vertical
- posicionar CTA final de forma persistente ou clara
- validar densidade de conteúdo

### Entregáveis
- versão mobile refinada e validada

### Dependências
- D2.2
- D2.3
- D2.4
- D2.5
- D2.6
- D2.7

### Critério de pronto
- o fluxo de escolha e ativação funciona sem atrito no mobile

## Task D2.9: Preparar handoff da Sprint 2 para Dev

### Objetivo
Entregar ao time de desenvolvimento os artefatos necessários para implementar a tela de presets sem interpretação livre.

### Escopo
- componentes
- estados
- textos
- comportamento responsivo

### Atividades
- nomear componentes da tela
- organizar estados visuais de seleção
- organizar estados de CTA
- anexar textos curtos e rótulos da página
- anexar comportamento mobile
- registrar observações de hierarquia visual

### Entregáveis
- pacote de handoff da Sprint 2

### Dependências
- D2.1
- D2.2
- D2.3
- D2.4
- D2.5
- D2.6
- D2.7
- D2.8

### Critério de pronto
- o time de desenvolvimento consegue construir a tela de presets sem adivinhar comportamento visual

## Definição de pronto da Sprint do Designer
- os 3 presets estão visualmente fechados
- comparação, revisão e ativação estão definidas
- desktop e mobile estão cobertos
- handoff da Sprint 2 está pronto
