export interface ExchangePosition {
  symbol: string;
  side: "bid" | "ask";
  amount: string;
  entryPrice: string | null;
}

export interface MarketInfo {
  symbol: string;
  tickSize: string;
  lotSize: string;
  minOrderSize: string;
}

export interface TpSlOrder {
  stopPrice: string;
  limitPrice?: string | null;
  clientOrderId?: string | null;
}

export interface CreateOrderInput {
  symbol: string;
  side: "bid" | "ask";
  amount: string;
  slippagePercent: string;
  clientOrderId: string;
  reduceOnly?: boolean;
  takeProfit?: TpSlOrder | null;
  stopLoss?: TpSlOrder | null;
}

export interface CreateOrderResult {
  raw: unknown;
}

export interface SetTpslInput {
  symbol: string;
  side: "bid" | "ask";
  takeProfit?: TpSlOrder | null;
  stopLoss?: TpSlOrder | null;
}

export interface ClosePositionInput {
  symbol: string;
  side: "bid" | "ask";
  amount: string;
  clientOrderId: string;
}

export interface ExchangeInterface {
  getPositions(): Promise<ExchangePosition[]>;
  getMarketInfo(): Promise<MarketInfo[]>;
  createMarketOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  setPositionTpsl(input: SetTpslInput): Promise<void>;
  closePosition(input: ClosePositionInput): Promise<void>;
}
