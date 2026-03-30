# FM-014 Card

## Status
- status: `TODO`
- tipo: `implementacao`
- prioridade: `P0`
- owner: `Dev`
- trilha: `Functional MVP`
- ultima atualizacao: `2026-03-30`

## Objetivo
Executar mercado, indicadores e gatilhos dos presets em loop real no `worker`, respeitando a cadencia e as regras finais fechadas por PO.

## Escopo Fechado
- [ ] avaliar o preset ativo em loop recorrente no worker
- [ ] usar baseline de analise de `1 minuto`
- [ ] nao aplicar `cooldown` artificial entre sinais
- [ ] permitir `reentrada no mesmo candle`
- [ ] evitar disparos duplicados tecnicamente quando a mesma oportunidade ja estiver em processamento
- [ ] transformar a avaliacao auditavel do preset em decisao operacional pronta para ordem

## Fora de Escopo
- [ ] alterar contrato funcional dos presets sem nova decisao de PO
- [ ] ampliar escopo para multiplos presets por conta

## Checklist de Entrega Real
- [ ] a analise de mercado ocorre sem acao manual do usuario
- [ ] o loop reflete as decisoes finais de produto sobre frequencia e reentrada
- [ ] a deduplicacao tecnica evita ordem duplicada por repeticao do loop
- [ ] a decisao final fica rastreavel para auditoria e debugging

## Dependencias
- [x] baseline implementada em `FM-004`
- [x] baseline implementada em `FM-005`
- [ ] FM-013 concluida

## Critérios de Aceite da Task
- [ ] o bot avalia mercado em loop real com cadencia de `1 minuto`
- [ ] `reentrada no mesmo candle` e tecnicamente possivel sem perder rastreabilidade
- [ ] ausencia de `cooldown` artificial nao gera duplicacao operacional por falha de controle interno

## Proximo Passo Recomendado
Usar a decisao operacional produzida pelo loop como entrada de execucao real em `FM-015`.

## Log de Acompanhamento
- `2026-03-30`: card criado a partir das decisoes finais de PO: sem `cooldown` artificial, `reentrada no mesmo candle` permitida e baseline de analise recorrente do worker em `1 minuto`.
