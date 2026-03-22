# Princípios de Engenharia

## Objetivo
Definir os princípios de implementação do projeto para manter a base legível, modular, testável e preparada para evolução sem acoplamento desnecessário.

## Direção Geral
O código deve seguir uma abordagem pragmática inspirada em:
- Clean Code
- Clean Architecture
- SOLID

A regra não é adicionar camadas por formalidade. A regra é reduzir acoplamento, tornar intenção explícita e facilitar manutenção.

## Regras de Estrutura

### Modularização
- cada módulo deve ter uma responsabilidade principal
- arquivos devem ser pequenos o suficiente para leitura rápida
- regras de negócio não devem ficar espalhadas entre controller, componente, handler e utilitários
- shared code só deve existir quando houver reuso real ou fronteira clara

### Funções
- funções devem ser pequenas e com objetivo explícito
- cada função deve fazer uma coisa principal
- nomes devem descrever intenção e efeito
- funções com muitos `if`s encadeados, parâmetros demais ou responsabilidade mista devem ser refatoradas

### Naming
- nomes devem explicar papel e contexto sem abreviações desnecessárias
- preferir nomes de domínio do produto aos nomes genéricos
- evitar nomes vagos como `data`, `helper`, `util`, `manager`, `handler2`, `misc`
- booleanos devem soar como pergunta ou estado observável

## Separação de Camadas

### `domain`
Responsável por:
- entidades
- value objects quando fizer sentido
- regras de negócio
- invariantes
- linguagem do produto

Não deve depender de:
- framework web
- banco de dados
- SDK externo
- componentes de UI

### `application`
Responsável por:
- casos de uso
- orquestração entre domínio e infraestrutura
- contratos de entrada e saída
- regras de fluxo da aplicação

Não deve conter:
- detalhes de framework
- acesso direto a detalhes de renderização

### `infrastructure`
Responsável por:
- banco
- adapters externos
- Pacifica
- AWS
- filas, storage e transporte

Deve implementar portas definidas pelas camadas internas.

### `ui`
Responsável por:
- renderização
- interação do usuário
- composição de componentes
- estados visuais

Não deve concentrar:
- regra de negócio complexa
- integração externa direta
- transformação crítica de domínio

## Dependências
- dependências devem apontar para dentro
- domínio não conhece infraestrutura
- componentes não conhecem detalhes do banco
- SDK externo deve ficar isolado atrás de adapter
- contratos devem ser explícitos nas bordas

## SOLID na Prática

### Single Responsibility Principle
- cada módulo deve mudar por um motivo principal
- se uma classe, função ou arquivo muda por motivos de UI, banco e regra de negócio ao mesmo tempo, a divisão está errada

### Open/Closed Principle
- preferir extensão por composição
- evitar condicionais espalhadas para suportar novos comportamentos previsíveis

### Liskov Substitution Principle
- abstrações devem manter comportamento coerente
- não criar interfaces genéricas demais que aceitem implementações incompatíveis

### Interface Segregation Principle
- contratos pequenos e focados
- evitar interfaces grandes para serviços que usam apenas parte delas

### Dependency Inversion Principle
- camadas internas definem contratos
- camadas externas implementam esses contratos

## Regras de Implementação
- validação de entrada deve acontecer na borda
- erro deve ser explícito e com contexto útil
- efeitos colaterais devem ficar isolados
- transformação de dados deve ficar próxima do contexto que a consome
- datas, números monetários, percentuais e status devem ter tratamento consistente
- ações destrutivas devem ser nomeadas de forma inequívoca

## Regras para Frontend
- componentes de tela devem ser finos
- hooks devem encapsular estado e integração, não virar depósito genérico
- componentes compartilhados devem ter API pequena e previsível
- lógica de negócio não deve ficar embutida em JSX complexo
- estados de loading, erro e vazio devem ser tratados explicitamente

## Regras para Backend
- handlers devem ser finos
- caso de uso não deve depender do framework HTTP
- acesso a banco deve ficar isolado em repositórios ou gateways bem definidos
- integração com Pacifica deve ficar em adapter dedicado
- comandos operacionais devem ter logging e comportamento previsível

## Testabilidade
- código deve nascer testável, sem depender de refactor grande depois
- regras de negócio devem ser testadas sem framework
- adapters externos devem ser testados separadamente
- fluxos críticos do produto devem ter cobertura de integração ou e2e

## Sinais de Alerta
Se aparecer qualquer um destes sinais, o código deve ser revisto:
- arquivo grande demais para leitura rápida
- função com múltiplas responsabilidades
- componente que busca dados, trata domínio e renderiza tudo ao mesmo tempo
- utilitários genéricos demais e sem contexto claro
- duplicação de regra crítica em mais de uma camada
- acesso direto a SDK externo fora da infraestrutura
- nomes que exigem leitura do corpo para entender a intenção

## Regra de Pragmatismo
Nem toda abstração deve nascer no primeiro dia.

Devemos abstrair cedo quando houver:
- fronteira de domínio clara
- dependência externa sensível
- risco real de acoplamento
- reuso provável e próximo

Não devemos abstrair cedo quando houver apenas:
- hipótese de reuso
- preferência estética
- tentativa de prever cenários ainda inexistentes

## Critério de Qualidade para Merge
Uma mudança só deve ser considerada pronta quando:
- o código estiver legível sem depender de explicação oral
- a responsabilidade dos módulos estiver clara
- nomes estiverem consistentes com o domínio
- as bordas estiverem validadas
- erros relevantes estiverem tratados
- o acoplamento estiver sob controle
- testes cobrirem o comportamento importante
