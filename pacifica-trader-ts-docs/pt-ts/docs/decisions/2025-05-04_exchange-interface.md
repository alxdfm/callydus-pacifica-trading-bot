# Decisão: ExchangeInterface como TypeScript interface + injeção

**Data:** 2025-05-04  
**Status:** aceita  
**Autor:** Callydus

## Contexto

O código atual está acoplado diretamente à Pacifica. Precisamos de abstração para testes (mock) e futura troca de exchange.

## Opções consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| Acoplamento direto | simples | não testável, difícil trocar |
| `interface` TS + injeção | contrato explícito, testável | leve indireção |
| Class abstrata | familiar para OOP | desnecessário em TS — interface é suficiente |

## Decisão tomada

**`interface ExchangeInterface` em `shared/src/types.ts`, injetada no Bot via construtor.**

## Consequências

- Bot testável com mock adapter
- Trocar exchange = criar novo adapter
- `bot.ts` não importa nada de `pacifica/` diretamente
