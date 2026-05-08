export type TradeSide = "long" | "short";

export type CloseReason =
  | "take_profit"
  | "stop_loss"
  | "manual"
  | "system"
  | "error";

export type TradeStatus =
  | "open"
  | "close_requested"
  | "closing"
  | "sync_error";
