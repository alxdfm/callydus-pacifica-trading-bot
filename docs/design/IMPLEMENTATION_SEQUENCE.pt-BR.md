# Sequência de Implementação Visual

## Objetivo
Sugerir a ordem mais segura para traduzir o design aprovado em UI real.

## Ordem Recomendada
1. tokens globais e dark theme base
2. layout shell: `Sidebar`, `Topbar`, containers e grid
3. componentes universais: `Button`, `StatusBadge`, `Input`, `Card`
4. onboarding
5. dashboard
6. presets
7. current trades
8. history
9. estados vazios, loading e erro

## Motivo da Ordem
- reduz retrabalho estrutural
- permite validar o tema cedo
- libera onboarding e dashboard primeiro
- deixa listas mais densas para depois da base estabilizada

## Critério de Pronto por Etapa
- tokens: cores, tipografia e espaçamento aplicados globalmente
- shell: navegação e topo consistentes em todas as telas
- componentes: variantes principais e estados interativos implementados
- telas: hierarquia, semântica e responsividade mínimas preservadas

## Risco a Evitar
Não começar por telas isoladas sem antes fechar tokens e shell, porque isso tende a gerar inconsistência visual e retrabalho.
