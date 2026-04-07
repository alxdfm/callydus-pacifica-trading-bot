# BG-023 Card

## Status
- status: `DONE`
- tipo: `implementacao`
- prioridade: `P1`
- owner: `Dev`
- area: `market data / runtime`
- ultima atualizacao: `2026-04-07`

## Objetivo
Centralizar a leitura de market data publico da Pacifica em snapshots persistidos compartilhados, reduzindo chamadas redundantes da API e do worker.

## Contexto
O worker e endpoints da API podiam consultar candles/prices diretamente na Pacifica, aumentando o risco de `429` e de duplicacao estrutural de chamadas. A proposta documentada em `PACIFICA_MARKET_DATA_CENTRALIZATION_PROPOSAL.pt-BR.md` definiu um desenho local-first para atacar esse problema sem depender de deploy de producao.

## Escopo Fechado
- modelagem de dados para `MarketPriceCurrent`, `MarketCandleSnapshot`, `MarketInfoCurrent` e `MarketRefreshLog`
- repositorio Prisma para snapshots de market data
- `MarketDataRefresher` centralizado
- gateway persistido para a API com refresh on-miss e logs de cache
- scheduler local de refresh a cada `1 minuto`
- script local de refresh manual
- integracao da API de prices/candles/market info/simulacao com o snapshot interno
- integracao do worker para ler candles do snapshot interno com fallback controlado
- rotina manual de cleanup e politica inicial de frescor/retencao

## Fora de Escopo
- `Lambda + EventBridge Scheduler` em producao
- metadados de frescor expostos no contrato publico da API
- metricas formais de impacto em `429` no ambiente real

## Dependencias
- [x] BG-010 concluido
- [x] FM-004 em base funcional
- [x] FM-013 e FM-014 com loop operacional local existente

## Critérios de Aceite Iniciais
- [x] existe snapshot persistido de market data no PostgreSQL
- [x] a API usa snapshot interno como caminho principal para leitura de mercado
- [x] o worker usa snapshot interno para candles antes de consultar a Pacifica
- [x] existe refresh local automatico e refresh manual para testes
- [x] existe cleanup manual para retenção local

## Proximo Passo Recomendado
Usar essa base local-first para promover a execucao de refresh a um scheduler de producao e medir o impacto real em `429`.

## Log de Acompanhamento
- `2026-04-07`: card criado para consolidar a entrega da centralizacao de market data em modo local-first.
- `2026-04-07`: schema Prisma estendido com snapshots de market data e log de refresh.
- `2026-04-07`: API passou a consumir snapshots persistidos para prices, candles, market info, avaliacao de sinal e simulacao/backtest.
- `2026-04-07`: worker passou a ler candles do snapshot interno com fallback controlado para a Pacifica.
- `2026-04-07`: scheduler local, refresh manual e cleanup manual ficaram disponiveis para validacao em ambiente de desenvolvimento.
