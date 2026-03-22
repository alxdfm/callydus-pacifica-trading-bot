# Sprint 1: Plano de Execução de Design

## Objetivo
Organizar a execução de Design da Sprint 1 em uma sequência curta, prática e compatível com o escopo já definido para foundations, onboarding e i18n-first.

## Escopo da Sprint 1 em Design
- base visual do MVP
- onboarding desktop
- onboarding mobile
- estados de wallet
- estados de credenciais Pacifica
- mensagens curtas de erro e sucesso
- handoff mínimo para desenvolvimento e QA

## Princípio de Trabalho
Nesta sprint, design não deve tentar resolver o MVP inteiro.

A prioridade é:
- criar base visual consistente
- fechar o onboarding com clareza
- cobrir estados críticos
- entregar handoff suficiente para implementação sem adivinhação visual

## Sequência Recomendada
1. congelar fundamentos visuais
2. consolidar o onboarding principal
3. fechar estados e microcopy
4. revisar responsividade
5. entregar handoff

## Plano de 5 Dias

### Dia 1: Fundamentos Visuais
Objetivo:
Fechar a base do sistema visual que sustenta onboarding e telas seguintes.

Entregáveis:
- direção visual confirmada
- paleta principal e semântica
- tipografia
- spacing base
- botões
- inputs
- cards
- badges

Referências:
- [VISUAL_DIRECTION.pt-BR.md](./VISUAL_DIRECTION.pt-BR.md)
- [DESIGN_SYSTEM_FOUNDATION.pt-BR.md](./DESIGN_SYSTEM_FOUNDATION.pt-BR.md)
- [MVP_COMPONENT_SYSTEM.pt-BR.md](./MVP_COMPONENT_SYSTEM.pt-BR.md)
- [preview/index.html](./preview/index.html)

Critério de pronto:
- onboarding já pode ser montado sem inventar novos padrões
- ações primárias, secundárias e destrutivas estão visualmente distintas
- estados semânticos principais já existem

### Dia 2: Onboarding Desktop
Objetivo:
Fechar a estrutura principal do onboarding em desktop.

Entregáveis:
- header com progresso
- card de wallet
- card de credenciais
- painel de status da conta
- CTA final
- hierarquia visual aprovada

Referência:
- [preview/onboarding.html](./preview/onboarding.html)

Critério de pronto:
- o fluxo é compreensível só olhando a tela
- a próxima ação do usuário é sempre clara
- o CTA final só ganha protagonismo quando faz sentido

### Dia 3: Estados e Microcopy
Objetivo:
Fechar os estados críticos do onboarding e a linguagem curta da sprint.

Entregáveis:
- wallet: não conectada, conectando, conectada, erro
- credenciais: vazia, preenchida, validando, válida, inválida
- mensagens curtas de erro
- mensagens curtas de sucesso
- labels compatíveis com i18n

Critério de pronto:
- sucesso, erro e loading não se confundem
- mensagens são curtas e operacionais
- nenhuma interface depende de copy longa para ser entendida

### Dia 4: Mobile e Consistência
Objetivo:
Garantir que a Sprint 1 funciona bem em tela pequena e sem quebrar a base visual.

Entregáveis:
- adaptação mobile do onboarding
- ordem vertical dos blocos validada
- CTA e áreas de toque revisados
- revisão de consistência com design system

Critério de pronto:
- onboarding funciona em coluna única
- mensagens e labels continuam legíveis
- estados continuam claros no mobile

### Dia 5: Handoff
Objetivo:
Transformar o trabalho da sprint em material utilizável por dev e QA.

Entregáveis:
- checklist visual de implementação
- regras por tela da sprint
- referência final dos componentes usados
- observações de QA para onboarding
- links oficiais de preview e docs

Referências:
- [DESIGN_HANDOFF.pt-BR.md](./DESIGN_HANDOFF.pt-BR.md)
- [SCREEN_HANDOFF.pt-BR.md](./SCREEN_HANDOFF.pt-BR.md)
- [preview/onboarding.html](./preview/onboarding.html)

Critério de pronto:
- dev consegue implementar onboarding sem adivinhar layout ou estado
- QA consegue validar os principais estados da sprint
- a sprint fecha com base visual reutilizável

## Checklist de Saída da Sprint
- direção visual validada
- design system mínimo validado
- onboarding desktop validado
- onboarding mobile validado
- estados de wallet validados
- estados de credenciais validados
- microcopy base validada
- handoff mínimo entregue

## O Que Não Deve Entrar na Sprint 1 de Design
- refinamento visual profundo de dashboard completo
- detalhamento completo de trades atuais e histórico
- explorações paralelas de temas alternativos
- animações avançadas
- sistema completo de ícones

## Risco Principal
O maior risco da sprint é dispersão: tentar avançar múltiplas telas ao mesmo tempo e enfraquecer o fechamento do onboarding.

## Regra de Prioridade
Se houver conflito entre ampliar escopo ou fechar bem o onboarding, fechar bem o onboarding.
