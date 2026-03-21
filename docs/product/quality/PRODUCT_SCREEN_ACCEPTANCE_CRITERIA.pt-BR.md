# Critérios de Aceite por Tela

## Objetivo
Consolidar critérios de aceite objetivos para as principais telas do MVP web, alinhando produto, desenvolvimento e QA em torno do comportamento esperado.

## Escopo
Telas cobertas:
- Dashboard
- Presets
- Trades Atuais
- Histórico

## 1. Dashboard

### Critérios Funcionais
- o Dashboard deve exibir saldo atual da conta
- o Dashboard deve exibir PnL agregado
- o Dashboard deve exibir a quantidade de trades ativos
- o Dashboard deve exibir o preset ativo
- o Dashboard deve exibir o status geral do bot
- o Dashboard deve listar trades atuais
- o Dashboard deve listar trades recentes
- o Dashboard deve permitir encerrar um trade específico

### Critérios de UX
- o usuário deve entender se o bot está ativo ou parado em menos de 3 segundos
- trades atuais devem aparecer antes do histórico recente
- o preset ativo deve ser visível sem navegação adicional
- a ação de pausar ou retomar o bot deve estar acessível no topo da tela

### Critérios de Conteúdo
- nomes e rótulos devem ser simples
- não deve haver exposição de JSON ou lógica técnica
- alertas operacionais devem ser visíveis, mas não dominar a interface

### Critérios Mobile
- o Dashboard deve permanecer legível em coluna única
- o botão de encerrar trade deve continuar acessível
- estado do bot e preset ativo devem aparecer acima da dobra

## 2. Presets

### Critérios Funcionais
- a tela deve exibir os 3 presets do MVP
- cada preset deve mostrar nome, risco, frequência e descrição curta
- o usuário deve poder selecionar um preset
- ao selecionar um preset, deve aparecer o painel de revisão
- o painel de revisão deve exibir os campos editáveis do MVP
- o usuário deve conseguir ativar o preset selecionado

### Critérios de UX
- a diferença entre os 3 presets deve ser compreensível sem documentação externa
- o risco do preset deve estar visível antes da ativação
- a edição deve acontecer apenas depois da seleção do preset
- a ativação deve deixar claro qual preset será iniciado

### Critérios de Conteúdo
- deve existir observação de que a estratégia é sugestão, não garantia de retorno
- a tela não deve exibir indicadores brutos, JSON ou lógica técnica
- a comparação entre presets deve usar linguagem simples

### Critérios Mobile
- os presets devem aparecer em cards empilhados
- o preset selecionado deve poder ser revisado sem abrir outra tela
- o CTA de ativação deve continuar visível e claro

## 3. Trades Atuais

### Critérios Funcionais
- a tela deve listar todos os trades abertos da plataforma
- cada trade deve exibir direção, símbolo, entrada, preço atual, PnL e status
- cada trade deve permitir encerramento manual via `market order`
- a tela deve destacar o trade selecionado, quando houver painel de detalhe

### Critérios de UX
- a ação de encerrar trade deve ser inequívoca
- trades devem ser fáceis de diferenciar visualmente por direção e status
- a lista não deve ser confundida com histórico

### Critérios de Conteúdo
- trades criados pela plataforma devem ser identificáveis
- o motivo do estado atual do trade deve ser legível
- a tela não deve exibir informação irrelevante ao monitoramento imediato

### Critérios Mobile
- a lista deve funcionar em formato compacto
- o usuário deve conseguir acessar a ação de encerramento sem dificuldade
- o detalhe do trade pode ser aberto em uma tela dedicada

## 4. Histórico

### Critérios Funcionais
- a tela deve listar trades encerrados
- cada item deve mostrar horário de entrada e saída
- cada item deve mostrar resultado do trade
- cada item deve mostrar motivo de encerramento
- a tela deve permitir leitura cronológica simples

### Critérios de UX
- o histórico não deve competir visualmente com os trades atuais
- a leitura do resultado deve ser rápida
- a tela nao deve incluir filtros no MVP

### Critérios de Conteúdo
- o histórico deve indicar se o encerramento foi por alvo, stop ou ação manual
- trades da plataforma devem ser identificáveis
- a tela deve evitar excesso de detalhes analíticos no MVP

### Critérios Mobile
- a lista deve manter boa legibilidade
- cada item deve ter resumo suficiente sem depender de hover

## Critérios Transversais

### Navegação
- o usuário deve conseguir navegar entre as 4 telas sem ambiguidade
- a tela atual deve estar claramente destacada no menu

### Estado do Sistema
- conexão com a Pacifica deve estar visível nas telas principais
- status geral do bot deve ser consistente entre Dashboard e demais telas

### Consistência
- rótulos de status devem ser os mesmos em todas as telas
- símbolos e direções devem seguir o mesmo padrão visual
- ações críticas devem ter nomenclatura consistente

## Critério Final de Aceite do MVP Web
O MVP web é considerado aceito quando:
- o usuário consegue escolher e ativar um preset
- o usuário consegue entender o estado do bot
- o usuário consegue monitorar trades abertos
- o usuário consegue encerrar um trade sem parar o bot
- o usuário consegue consultar o histórico de forma simples
