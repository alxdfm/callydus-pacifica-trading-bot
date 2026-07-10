export * from "./types/candle.js";
export * from "./types/signal.js";
export * from "./types/exchange.js";
export * from "./types/trade.js";
export * from "./types/result.js";
// Contrato v2 (API ↔ frontend) vive em "@pacifica/shared/contracts" —
// subpath separado para o worker (que só usa os tipos acima) não carregar
// zod em runtime
