# Sprint 2: Tasks do Dev

## Objetivo da Sprint
Entregar a tela funcional de presets, com seleção, revisão dos campos editáveis e ativação do preset, persistindo o estado ativo na aplicação.

## Escopo
- tela de presets
- renderização dos 3 presets
- seleção do preset
- comparação curta
- revisão do preset selecionado
- edição dos campos permitidos
- ativação do preset
- persistência do preset ativo
- inglês como locale padrão e copy pronta para i18n

## Definition of Ready
- o MVP Scope Lock está aprovado
- o MVP Handoff Pack está disponível
- a terminologia dos presets está travada em inglês primeiro
- nenhuma task deve introduzir configuração técnica fora dos campos permitidos
- chaves de tradução são esperadas desde o início

## Entregáveis finais da Sprint
- tela de presets funcional
- 3 presets renderizados
- fluxo de seleção e revisão
- edição dos campos permitidos
- ativação funcional do preset
- estado do preset ativo persistido

## Task V2.1: Implementar estrutura base da tela de Presets

### Objetivo
Construir a página principal de presets no layout compartilhado do app.

### Prioridade
P0

### Escopo
- header
- grid de presets
- comparador
- revisão
- ativação
- áreas de conteúdo prontas para i18n

### Atividades
- criar rota funcional da tela de presets
- implementar header da página
- implementar área principal da página
- reservar blocos para:
  - cards
  - comparador
  - revisão
  - CTA final
- garantir versão responsiva da estrutura base
- ligar a tela ao locale ativo para que copy possa ser traduzida

### Entregáveis
- estrutura renderizada da tela de presets
- estrutura da tela de presets pronta para i18n

### Dependências
- outputs da Sprint 1

### Critério de pronto
- a página existe e suporta os blocos principais definidos em produto
- a página renderiza copy em inglês primeiro e labels traduzidas

## Task V2.2: Renderizar catálogo dos 3 presets

### Objetivo
Exibir os três presets oficiais do MVP com seus conteúdos principais.

### Prioridade
P0

### Escopo
- `Safer`
- `Balanced`
- `More active`

### Atividades
- mapear catálogo final dos presets
- renderizar nome, risco, frequência e descrição curta
- renderizar CTA de seleção em cada card
- aplicar estado visual padrão e estado selecionado
- garantir consistência desktop e mobile

### Entregáveis
- cards dos 3 presets renderizados

### Dependências
- V2.1

### Critério de pronto
- os 3 presets aparecem corretamente
- o conteúdo é consistente com a documentação de produto
- o conteúdo é compatível com inglês primeiro e labels traduzidas

## Task V2.3: Implementar seleção do preset

### Objetivo
Permitir que o usuário selecione um preset e altere o estado da tela de acordo com isso.

### Prioridade
P0

### Escopo
- estado de seleção
- destaque visual
- liberação da revisão

### Atividades
- implementar estado de preset selecionado
- aplicar destaque visual ao card selecionado
- esconder ou bloquear revisão quando nada estiver selecionado
- refletir seleção no bloco de ativação

### Entregáveis
- comportamento funcional de seleção do preset

### Dependências
- V2.2

### Critério de pronto
- o usuário consegue selecionar um preset
- a tela reage de forma consistente à seleção
- o estado de seleção não depende de labels hard-coded

## Task V2.4: Implementar comparador resumido entre presets

### Objetivo
Exibir uma comparação rápida entre os três presets sem expor detalhes técnicos.

### Prioridade
P0

### Escopo
- risco
- frequência
- estilo de entrada
- stop
- take profit

### Atividades
- renderizar comparador com dados resumidos
- ajustar formato desktop
- ajustar formato mobile empilhado
- validar consistência dos rótulos

### Entregáveis
- comparador funcional desktop e mobile

### Dependências
- V2.2

### Critério de pronto
- o comparador está legível e coerente com os presets renderizados
- os rótulos continuam legíveis em layouts traduzidos

## Task V2.5: Implementar painel de revisão do preset selecionado

### Objetivo
Permitir que o usuário revise o preset e altere apenas os campos liberados no MVP.

### Prioridade
P0

### Escopo
- resumo do preset
- campos editáveis
- mensagem de sugestão sem garantia

### Atividades
- renderizar nome do preset selecionado
- renderizar resumo textual do comportamento
- implementar campos:
  - `symbol`
  - `position size`
  - `long`
  - `short`
- refletir alterações no estado local do preset
- renderizar observação de sugestão sem garantia de retorno

### Entregáveis
- painel de revisão funcional

### Dependências
- V2.3

### Critério de pronto
- usuário consegue revisar e editar apenas o que é permitido
- labels de revisão e helper messages vêm da camada de i18n

## Task V2.6: Montar payload final de ativação

### Objetivo
Converter a seleção do preset e as edições permitidas no payload que o bot irá consumir.

### Prioridade
P0

### Escopo
- preset base
- `symbol`
- `position size`
- `long`
- `short`

### Atividades
- mapear preset selecionado para contrato final
- aplicar overrides dos campos editáveis
- validar payload final antes da ativação
- garantir que nada fora do escopo editável seja alterado

### Entregáveis
- payload final de ativação consistente com o contrato

### Dependências
- V2.5

### Critério de pronto
- payload final representa corretamente o preset selecionado com os ajustes do usuário
- a montagem do payload é independente do texto localizado

## Task V2.7: Implementar ativação do preset

### Objetivo
Permitir que o usuário ative o preset a partir da tela de presets.

### Prioridade
P0

### Escopo
- CTA principal
- estado de loading
- sucesso
- erro

### Atividades
- implementar ação `Ativar preset`
- acionar criação ou atualização do preset ativo
- implementar estado de loading no CTA
- implementar tratamento de sucesso
- implementar tratamento de erro
- impedir ativação sem preset selecionado

### Entregáveis
- ativação funcional do preset
- estados mínimos de sucesso e erro

### Dependências
- V2.6

### Critério de pronto
- usuário consegue ativar um preset válido
- falhas de ativação são tratadas
- a copy de ativação vem da camada localizada

## Task V2.8: Persistir preset ativo e refletir no estado da aplicação

### Objetivo
Garantir que o preset ativado continue disponível para o restante do produto.

### Prioridade
P1

### Escopo
- persistência
- reuso no dashboard
- reuso na navegação do app

### Atividades
- persistir preset ativo na camada de estado
- persistir parâmetros editados
- disponibilizar preset ativo para leitura em outras telas
- garantir restauração em recarregamento básico, se aplicável

### Entregáveis
- preset ativo persistido
- estado compartilhado funcional

### Dependências
- V2.7

### Critério de pronto
- o preset ativo está disponível fora da tela de presets
- o estado do preset ativo permanece independente do locale

## Task V2.9: Validar fluxo completo da Sprint 2

### Objetivo
Garantir que o fluxo de seleção e ativação funcione ponta a ponta.

### Prioridade
P1

### Escopo
- carregamento da tela
- seleção
- edição
- ativação
- persistência

### Atividades
- validar abertura da tela de presets
- validar seleção dos 3 presets
- validar edição dos campos permitidos
- validar montagem do payload
- validar ativação com sucesso
- validar comportamento em erro
- validar persistência do preset ativo

### Entregáveis
- Sprint 2 estável para revisão interna

### Dependências
- V2.1
- V2.2
- V2.3
- V2.4
- V2.5
- V2.6
- V2.7
- V2.8

### Critério de pronto
- o usuário escolhe, revisa e ativa um preset sem quebrar o fluxo
- o preset ativo permanece consistente na aplicação
- os fluxos em inglês primeiro e traduzidos se comportam da mesma forma

## Definição de pronto da Sprint do Dev
- tela de presets está funcional
- os 3 presets estão renderizados corretamente
- revisão e edição dos campos permitidos funcionam
- ativação do preset funciona
- preset ativo fica persistido e reutilizável no app
