# FM-014 Card

## Status
- status: `IN_REVIEW`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-31`

## Objetivo
Executar mercado, indicadores e gatilhos dos presets em loop real no `worker`, respeitando a cadencia e as regras finais fechadas por PO.

## Escopo Fechado
- [x] avaliar o preset ativo em loop recorrente no worker
- [x] usar baseline de analise de `1 minuto`
- [x] nao aplicar `cooldown` artificial entre sinais
- [x] permitir `reentrada no mesmo candle`
- [x] evitar disparos duplicados tecnicamente quando a mesma oportunidade ja estiver em processamento
- [x] transformar a avaliacao auditavel do preset em decisao operacional pronta para ordem

## Fora de Escopo
- [ ] alterar contrato funcional dos presets sem nova decisao de PO
- [ ] ampliar escopo para multiplos presets por conta

## Checklist de Entrega Real
- [x] a analise de mercado ocorre sem acao manual do usuario
- [x] o loop reflete as decisoes finais de produto sobre frequencia e reentrada
- [x] a deduplicacao tecnica evita ordem duplicada por repeticao do loop
- [x] a decisao final fica rastreavel para auditoria e debugging

## Dependencias
- [x] baseline implementada em `FM-004`
- [x] baseline implementada em `FM-005`
- [x] FM-013 concluida

## Critérios de Aceite da Task
- [x] o bot avalia mercado em loop real com cadencia de `1 minuto`
- [x] `reentrada no mesmo candle` e tecnicamente possivel sem perder rastreabilidade
- [x] ausencia de `cooldown` artificial nao gera duplicacao operacional por falha de controle interno

## Proximo Passo Recomendado
Usar a decisao operacional produzida pelo loop como entrada de execucao real em `FM-015`.

## Log de Acompanhamento
- `2026-03-30`: card criado a partir das decisoes finais de PO: sem `cooldown` artificial, `reentrada no mesmo candle` permitida e baseline de analise recorrente do worker em `1 minuto`.
- `2026-03-31`: `FM-014` entrou em `IN_REVIEW` com loop real de avaliacao de sinais no `worker`: cadencia persistida de `1 minuto` por conta, market data via gateway compartilhado, engine de preset compartilhado com a API e persistencia deduplicada de `SignalDecision` como decisao operacional pronta para ordem.
