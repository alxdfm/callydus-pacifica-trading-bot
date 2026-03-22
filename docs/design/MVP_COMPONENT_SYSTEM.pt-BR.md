# Componentes Base do MVP

## Objetivo
Definir os componentes reutilizáveis que sustentam onboarding, dashboard, presets, trades atuais e histórico.

## 1. Button

### Variantes
- `primary`
- `secondary`
- `destructive`
- `ghost`

### Regras
- `primary` para ação principal da tela
- `secondary` para revisão, navegação e ações de apoio
- `destructive` só para `Encerrar trade`
- `ghost` apenas para ações contextuais de baixa prioridade

### Aparência
- altura padrão: `44px`
- padding horizontal: `16px`
- raio: `--radius-md`
- label curta e imperativa

## 2. Input

### Uso
- wallet não usa input
- onboarding usa inputs para credenciais Pacifica
- presets usa inputs mínimos para revisão

### Regras
- label sempre visível acima do campo
- hint curta abaixo quando necessário
- erro aparece no próprio campo e no texto de suporte

## 3. Select ou Combobox Simples

### Uso
- seleção de símbolo, se necessário

### Regras
- não parecer componente técnico de exchange
- lista simples, legível e com busca apenas se a quantidade exigir

## 4. Switch

### Uso
- habilitar ou desabilitar `long`
- habilitar ou desabilitar `short`

### Regras
- sempre acompanhado por label textual
- estado não pode depender só da posição do switch

## 5. Status Badge

### Uso
- status do bot
- conexão Pacifica
- risco do preset
- direção do trade
- motivo de encerramento

### Variantes mínimas
- `active`
- `paused`
- `error`
- `connected`
- `disconnected`
- `low-risk`
- `medium-risk`
- `high-risk`
- `long`
- `short`

## 6. Metric Card

### Uso
- saldo
- PnL
- trades ativos
- trades encerrados hoje

### Estrutura
- label pequena
- valor principal
- delta ou contexto opcional

### Regras
- o número é o foco
- rótulo continua claro
- usar cor apenas no valor que precisa semântica

## 7. Preset Card

### Uso
- comparação entre `Safer`, `Balanced` e `More active`

### Estrutura
- nome
- badge de risco
- frequência
- timeframe
- descrição curta
- lista curta de prioridades
- CTA `Selecionar`

### Estado selecionado
- borda reforçada
- fundo suave em accent
- selo visual de selecionado

## 8. Review Panel

### Uso
- revisão do preset selecionado
- resumo do que será ativado

### Estrutura
- heading
- resumo textual
- campos editáveis
- aviso de risco

## 9. Trade Row / Trade Card

### Uso
- dashboard
- trades atuais
- histórico

### Campos-base
- símbolo
- direção
- entrada
- preço atual ou saída
- PnL ou resultado
- status ou motivo de encerramento

### Variação por contexto
- em `Trades Atuais`, o CTA `Encerrar` fica visível
- em `Histórico`, o motivo de encerramento ganha prioridade
- no `Dashboard`, a versão é mais compacta

## 10. Alert Banner

### Uso
- erro de conexão
- reconciliação
- falha operacional
- aviso relevante do sistema

### Regras
- uma mensagem principal por banner
- linguagem simples
- ação sugerida quando houver próximo passo claro

## 11. Empty State

### Uso
- sem trades atuais
- sem histórico
- sem preset ativo

### Estrutura
- título curto
- explicação em uma frase
- CTA contextual quando aplicável

### Regra
- estado vazio não pode parecer erro

## 12. Loading State

### Uso
- cards de resumo
- listas de trade
- painel de revisão

### Regra
- preferir skeleton contextual
- manter a estrutura da página estável

## 13. Padrões de Conteúdo

### Labels
- curtas
- objetivas
- sem jargão técnico desnecessário

### CTAs
- `Connect wallet`
- `Validate keys`
- `Select preset`
- `Activate preset`
- `Pause bot`
- `Resume bot`
- `Close trade`

### Proibição
- não expor JSON
- não expor nomes internos de estratégia
- não expor termos técnicos sem tradução de produto

## 14. Prioridade de Implementação
1. `Button`
2. `Input`
3. `Status Badge`
4. `Metric Card`
5. `Preset Card`
6. `Trade Row / Trade Card`
7. `Alert Banner`
8. `Empty State`
9. `Loading State`

## 15. Critério de Pronto
O sistema base está suficientemente pronto quando:
- as telas principais conseguem ser montadas só com esses componentes
- estados críticos já estão cobertos
- existe consistência clara entre desktop e mobile
