# FM-004 Card

## Status
- status: `TODO`
- tipo: `estudo + implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-25`

## Objetivo
Obter dados reais de mercado por symbol e timeframe para alimentar indicadores e sinais das estrategias.

## Escopo Fechado
- [ ] definir fonte de candles e ticker
- [ ] garantir suporte aos symbols permitidos no MVP
- [ ] garantir timeframe compativel com os presets atuais
- [ ] normalizar dados para motor de indicadores
- [ ] registrar estrategia de polling ou streaming

## Fora de Escopo
- [ ] expansao de produto fora do fluxo funcional necessario
- [ ] polimento visual sem impacto na funcionalidade real

## Checklist de Entrega Real
- [ ] existe fonte real de dados de mercado para os symbols do MVP
- [ ] o sistema consegue alimentar analise dos presets com candles consistentes

## Dependencias
- [ ] FM-001 concluida

## Critérios de Aceite da Task
- [ ] existe fonte real de dados de mercado para os symbols do MVP
- [ ] o sistema consegue alimentar analise dos presets com candles consistentes

## Proximo Passo Recomendado
Escolher a fonte real de mercado e fechar o formato canonico de candle/price feed.

## Log de Acompanhamento
- `2026-03-25`: card criado a partir do diagnostico de PO sobre a transicao para MVP funcional real.
