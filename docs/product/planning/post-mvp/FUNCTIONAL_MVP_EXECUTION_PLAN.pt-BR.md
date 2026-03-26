# Plano de Execucao do MVP Funcional

## Objetivo
Transformar a trilha do MVP funcional em slices menores, permitindo que o dev avance por etapas verificaveis sem tentar fechar toda a integracao real de uma vez.

## Principio
Priorizar o menor slice que troca simulacao por comportamento real com valor acumulativo:
- primeiro contrato real
- depois credencial real
- depois runtime persistido
- depois mercado e sinais
- depois comandos e reconciliacao

## Slice 1: Contrato Real da Pacifica

### Objetivo
Remover a maior incerteza do projeto antes de investir em implementacao acoplada.

### Tasks
- `FM-001`

### Resultado Esperado
- documento tecnico da Pacifica com endpoints, auth, payloads, respostas, erros e limites
- definicao clara do que pode ser integrado agora e do que ainda precisa de adaptador temporario

### Criterio de Saida
- o dev consegue desenhar backend real sem suposicao critica

## Slice 2: Credencial Real + Fonte de Verdade no Backend

### Objetivo
Parar de depender de validacao local e localStorage como base do fluxo principal.

### Tasks
- `FM-002`
- `FM-003`

### Resultado Esperado
- validacao de credenciais mediada por backend
- persistencia real de conta, credencial e preset ativo
- frontend consumindo estado operacional de backend, nao apenas storage local

### Criterio de Saida
- onboarding deixa de ser apenas um fluxo visual/local e passa a gerar estado real persistido

## Slice 3: Mercado Real + Motor de Sinais

### Objetivo
Tornar os presets operacionalmente reais, conectando contrato de estrategia a dados de mercado e avaliacao de gatilhos.

### Tasks
- `FM-004`
- `FM-005`

### Resultado Esperado
- fonte real de candles
- pipeline de dados normalizado
- indicadores obrigatorios calculados
- gatilhos de preset avaliados de forma auditavel

### Criterio de Saida
- o sistema consegue dizer quando um preset geraria sinal real e por que

## Slice 4: Runtime Real + Comandos Reais

### Objetivo
Fazer o produto operar sobre runtime persistido e comandos reais, em vez de alteracoes locais de tela.

### Tasks
- `FM-006`
- `FM-007`
- `FM-008`

### Resultado Esperado
- ativacao de preset ligada ao runtime real
- pause, resume e close trade via backend
- dashboard, current trades e history lendo dados reais

### Criterio de Saida
- o usuario interage com estado operacional real do produto e nao com simulacao local

## Slice 5: Robustez Minima

### Objetivo
Dar previsibilidade operacional para demo funcional repetivel e evolucao segura.

### Tasks
- `FM-009`
- `FM-010`

### Resultado Esperado
- reconciliacao minima
- heartbeat e recuperacao basica
- logs, alertas e auditoria minima

### Criterio de Saida
- o produto explica o que aconteceu, detecta divergencia relevante e suporta repeticao controlada

## Ordem Recomendada
1. Slice 1
2. Slice 2
3. Slice 3
4. Slice 4
5. Slice 5

## Menor Slice Funcional Possivel
Se o objetivo for comecar imediatamente pelo menor caminho que gera valor real, recomendo:
1. `FM-001`
2. `FM-002`
3. `FM-003`

Esse recorte ja troca o onboarding de mock/local para fluxo real de credencial e persistencia, sem ainda depender do motor completo de estrategia.

## Menor Slice de Estrategia Real
Se o objetivo for provar analise de mercado e preset real o quanto antes, o proximo bloco apos o onboarding real e:
1. `FM-004`
2. `FM-005`

## Observacao de PO
Nao recomendo o dev iniciar por dashboard, current trades ou history reais antes de:
- fechar contrato Pacifica
- tirar onboarding do modo local
- definir fonte real de mercado

Caso contrario, o time corre risco alto de duplicar integracao, retrabalhar read models e sustentar UI real sobre backend ainda hipotetico.
