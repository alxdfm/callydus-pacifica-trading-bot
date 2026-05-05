# Decisão: API serverless via SST + AWS Lambda

**Data:** 2025-05-04  
**Status:** aceita  
**Autor:** Callydus

## Contexto

A API precisa de hosting. O Worker já fica no Oracle Cloud (processo persistente). A API é stateless e pode ser serverless — escala para zero quando ninguém está usando.

## Opções consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| VPS dedicado (Oracle) | simples, mesmo lugar do Worker | paga idle, gerencia servidor |
| Vercel Functions | DX excelente | limites de execução, custo em escala |
| AWS Lambda via SST | escala para zero, free tier generoso, IaC elegante | cold start (~200ms — aceitável) |

## Decisão tomada

**AWS Lambda via SST v3 com Hono como framework.**

SST v3 tem DX excelente para Lambda — deploy em um comando, hot reload local, IaC em TypeScript.

## Consequências

- Zero custo quando idle (free tier Lambda = 1M requests/mês)
- Cold start de ~200ms — aceitável para trading não-HFT
- `sst.config.ts` controla toda a infra
- Revisitar se o projeto crescer para precisar de WebSocket persistente na API (considerar App Runner ou ECS)
