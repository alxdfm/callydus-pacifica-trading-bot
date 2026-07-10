export * from "./types/candle.js";
export * from "./types/signal.js";
export * from "./types/exchange.js";
export * from "./types/trade.js";
export * from "./types/result.js";
// Contrato v2 (API ↔ frontend) — namespace próprio para não colidir com os
// tipos primitivos do worker/engine acima
export * as contractsV2 from "./contracts/index.js";
