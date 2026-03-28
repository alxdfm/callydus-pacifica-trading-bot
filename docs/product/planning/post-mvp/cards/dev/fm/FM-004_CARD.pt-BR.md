# FM-004 Card

## Status
- status: `IN_REVIEW`
- tipo: `estudo + implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-28`

## Objetivo
Obter dados reais de mercado por symbol e timeframe para alimentar indicadores e sinais das estrategias.

## Escopo Fechado
- [x] definir fonte de candles e ticker
- [ ] garantir suporte aos symbols permitidos no MVP
- [x] garantir timeframe compativel com os presets atuais
- [x] normalizar dados para motor de indicadores
- [ ] registrar estrategia de polling ou streaming

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [x] existe fonte real de dados de mercado para os symbols do MVP
- [x] o sistema consegue alimentar analise dos presets com candles consistentes

## Dependencias
- [ ] FM-001 concluida

## Critérios de Aceite da Task
- [x] existe fonte real de dados de mercado para os symbols do MVP
- [x] o sistema consegue alimentar analise dos presets com candles consistentes

## Proximo Passo Recomendado
Escolher a fonte real de mercado e fechar o formato canonico de candle/price feed.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
- `2026-03-28`: contrato compartilhado de mercado adicionado com snapshots de preco e candles normalizados.
- `2026-03-28`: backend ganhou fonte real de market data via Pacifica para `prices`, `kline` e `kline/mark`, com normalizacao para contratos internos e endpoints locais `GET /api/market/prices` e `POST /api/market/candles`.
- `2026-03-28`: contrato real de retorno de candles confirmado em teste manual contra a Pacifica; o endpoint devolve objetos com `t/T/s/i/o/c/h/l/v/n`, e o adapter local passou a converter `limit` em `end_time` para respeitar a restricao real de range da Pacifica.
- `2026-03-28`: a task permanece em `IN_REVIEW` porque o consumo desses dados pelo motor de indicadores ainda depende do `FM-005`.
