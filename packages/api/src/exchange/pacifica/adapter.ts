import type {
  ClosePositionInput,
  CreateOrderInput,
  CreateOrderResult,
  ExchangeInterface,
  ExchangePosition,
  MarketInfo,
  SetTpslInput,
} from "@pacifica/shared";
import { findMarketInfo, PacificaClient } from "./client.js";

export class PacificaAdapter implements ExchangeInterface {
  constructor(private readonly client: PacificaClient) {}

  async getPositions(): Promise<ExchangePosition[]> {
    return this.client.getPositions();
  }

  async getMarketInfo(): Promise<MarketInfo[]> {
    const payload = await this.client.getMarketInfo();
    return extractMarketInfoList(payload);
  }

  async createMarketOrder(
    input: CreateOrderInput,
  ): Promise<CreateOrderResult> {
    const orderInput: Parameters<typeof this.client.createMarketOrder>[0] = {
      symbol: input.symbol,
      side: input.side,
      amount: input.amount,
      slippagePercent: input.slippagePercent,
      clientOrderId: input.clientOrderId,
    };

    if (input.reduceOnly !== undefined) {
      orderInput.reduceOnly = input.reduceOnly;
    }

    if (input.takeProfit !== undefined) {
      orderInput.takeProfit = input.takeProfit;
    }

    if (input.stopLoss !== undefined) {
      orderInput.stopLoss = input.stopLoss;
    }

    const raw = await this.client.createMarketOrder(orderInput);
    return { raw };
  }

  async setPositionTpsl(input: SetTpslInput): Promise<void> {
    const tpslInput: Parameters<typeof this.client.setPositionTpsl>[0] = {
      symbol: input.symbol,
      side: input.side,
    };

    if (input.takeProfit !== undefined) {
      tpslInput.takeProfit = input.takeProfit;
    }

    if (input.stopLoss !== undefined) {
      tpslInput.stopLoss = input.stopLoss;
    }

    await this.client.setPositionTpsl(tpslInput);
  }

  async closePosition(input: ClosePositionInput): Promise<void> {
    await this.client.createMarketOrder({
      symbol: input.symbol,
      side: input.side,
      amount: input.amount,
      slippagePercent: "0.5",
      clientOrderId: input.clientOrderId,
      reduceOnly: true,
    });
  }
}

function extractMarketInfoList(payload: unknown): MarketInfo[] {
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  const source = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
          symbol: key,
          ...(value as Record<string, unknown>),
        }))
      : [];

  return source.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const symbol = String(
      candidate.symbol ?? candidate.name ?? "",
    ).trim();
    const tickSize = String(
      candidate.tick_size ?? candidate.tickSize ?? "",
    ).trim();
    const lotSize = String(
      candidate.lot_size ?? candidate.lotSize ?? "",
    ).trim();
    const minOrderSize = String(
      candidate.min_order_size ?? candidate.minOrderSize ?? "",
    ).trim();

    if (!symbol || !tickSize || !lotSize || !minOrderSize) {
      return [];
    }

    return [{ symbol, tickSize, lotSize, minOrderSize }];
  });
}
