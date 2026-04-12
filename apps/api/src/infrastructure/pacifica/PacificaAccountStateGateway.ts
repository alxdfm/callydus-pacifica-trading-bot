import { PacificaApiError } from "@pacifica/pacifica-trading";
import type {
  PacificaAccountStatePort,
  ReadPacificaAccountStateInput,
} from "../../domain/pacifica-account-state/PacificaAccountStatePort";
import type { ApiEnvironment } from "../config/createApiEnvironment";

/**
 * Reads the externally visible account state directly from Pacifica REST
 * endpoints so the product can reconcile its local read models against the
 * exchange.
 */
export class PacificaAccountStateGateway implements PacificaAccountStatePort {
  constructor(private readonly environment: Pick<ApiEnvironment, "pacificaRestBaseUrl">) {}

  async readAccountState(
    input: ReadPacificaAccountStateInput,
  ) {
    const [accountInfo, positions, orderHistory, tradeHistory, portfolio7d] = await Promise.all([
      this.getJson("/api/v1/account", {
        account: input.walletAddress,
      }),
      this.getJson("/api/v1/positions", {
        account: input.walletAddress,
      }),
      this.getJson("/api/v1/orders/history", {
        account: input.walletAddress,
        limit: "100",
      }),
      this.getJson("/api/v1/trades/history", {
        account: input.walletAddress,
        limit: "100",
      }),
      this.getJson("/api/v1/portfolio", {
        account: input.walletAddress,
        time_range: "7d",
      }),
    ]);

    const normalizedTradeHistory = normalizeTradeHistory(tradeHistory);
    const pnl7d = normalizePortfolioPnl(portfolio7d);

    return {
      fetchedAtIso: input.nowIso,
      balance: normalizeBalanceSnapshot(accountInfo, pnl7d, input.nowIso),
      positions: normalizePositions(positions, normalizedTradeHistory),
      recentTradeHistory: normalizedTradeHistory,
      orderHistorySummary: normalizeOrderHistorySummary(orderHistory),
    };
  }

  private async getJson(
    path: string,
    query: Record<string, string>,
  ): Promise<unknown> {
    const url = new URL(path, this.environment.pacificaRestBaseUrl);

    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw new PacificaApiError(
        `Pacifica API request failed (${response.status}).`,
        {
          status: response.status,
          body: payload,
          retryable: response.status === 429 || response.status >= 500,
        },
      );
    }

    return payload;
  }
}

function normalizePortfolioPnl(payload: unknown): number | null {
  const rows = dataArray(payload);

  if (rows.length === 0) {
    return null;
  }

  // The portfolio series is ordered by timestamp ascending; the last entry
  // holds the cumulative PnL since the start of the requested period.
  const last = rows[rows.length - 1] ?? null;
  if (!last) return null;
  return pickNumber(last, ["pnl"]);
}

function normalizeBalanceSnapshot(payload: unknown, pnl7d: number | null, fallbackNowIso: string) {
  const record = firstDataRecord(payload);

  if (!record) {
    return null;
  }

  const totalBalance = pickNumber(record, [
    "equity",
    "account_equity",
    "accountEquity",
    "balance",
    "total_balance",
    "totalBalance",
  ]);
  const availableBalance = pickNumber(record, [
    "available_balance",
    "availableBalance",
    "available_to_spend",
    "free_collateral",
    "freeCollateral",
    "available",
  ]);
  const realizedOrBaseBalance = pickNumber(record, [
    "balance",
    "wallet_balance",
    "walletBalance",
    "account_balance",
    "accountBalance",
    "cash_balance",
    "cashBalance",
  ]);
  // 7-day PnL sourced from /api/v1/portfolio?time_range=7d (last entry's cumulative pnl)
  const aggregatedPnl = pnl7d;
  const capitalInUse = pickNumber(record, [
    "margin_used",
    "marginUsed",
    "used_margin",
    "usedMargin",
    "total_margin_used",
    "totalMarginUsed",
    "capital_in_use",
    "capitalInUse",
    "margin",
  ]);

  if (
    totalBalance === null ||
    availableBalance === null ||
    aggregatedPnl === null ||
    capitalInUse === null
  ) {
    return null;
  }

  return {
    totalBalance,
    availableBalance,
    aggregatedPnl,
    capitalInUse,
    capturedAtIso:
      pickDateIso(record, ["updated_at", "created_at"]) ?? fallbackNowIso,
  };
}

function normalizePositions(
  payload: unknown,
  recentTradeHistory: Array<{
    symbol: string;
    price: number;
  }>,
) {
  const rows = dataArray(payload);

  return rows
    .map((row) => {
      const symbol = pickString(row, ["symbol"]);
      const side = normalizePositionSide(
        pickString(row, ["side", "position_side"]),
        pickNumber(row, ["amount", "size", "position"]),
      );
      const quantity = Math.abs(
        pickNumber(row, ["amount", "size", "position"]) ?? Number.NaN,
      );
      const entryPrice = pickNumber(row, ["entry_price", "avg_entry_price"]);
      const unrealizedPnl =
        pickNumber(row, [
          "unrealized_pnl",
          "unrealised_pnl",
          "unrealizedPnl",
          "unrealisedPnl",
          "floating_pnl",
          "floatingPnL",
          "floatingPnl",
          "position_pnl",
          "positionPnl",
          "pnl",
        ]) ?? 0;
      const currentPrice =
        pickNumber(row, [
          "mark_price",
          "markPrice",
          "current_price",
          "currentPrice",
          "index_price",
          "indexPrice",
        ]) ??
        recentTradeHistory.find((trade) => trade.symbol === symbol)?.price ??
        entryPrice;

      if (
        !symbol ||
        !side ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        entryPrice === null ||
        currentPrice === null
      ) {
        return null;
      }

      return {
        symbol,
        side,
        quantity,
        entryPrice,
        currentPrice,
        unrealizedPnl,
        pacificaTradeId: `position:${symbol}:${side}`,
        isPlatformTrade: false,
      };
    })
    .filter((row) => row !== null);
}

function normalizeOrderHistorySummary(payload: unknown) {
  const rows = dataArray(payload);
  const openOrderCount = rows.filter((row) => {
    const status = pickString(row, ["order_status"]);
    return status === "open" || status === "partially_filled";
  }).length;
  const stopOrderCount = rows.filter((row) => {
    const orderType = pickString(row, ["order_type"]);
    return Boolean(orderType && orderType.includes("stop"));
  }).length;
  const latest = rows[0] ?? null;

  return {
    openOrderCount,
    stopOrderCount,
    lastOrderId: latest ? pickString(latest, ["order_id"]) : null,
  };
}

function normalizeTradeHistory(payload: unknown) {
  return dataArray(payload)
    .map((row) => {
      const symbol = pickString(row, ["symbol"]);
      const side = pickString(row, ["side"]);
      const price = pickNumber(row, ["price"]);
      const amount = pickNumber(row, ["amount"]);
      const pnl = pickNumber(row, ["pnl"]) ?? 0;
      const createdAtIso = pickDateIso(row, ["created_at"]);

      if (
        !symbol ||
        !side ||
        price === null ||
        amount === null ||
        !createdAtIso
      ) {
        return null;
      }

      return {
        symbol,
        side: side as "open_long" | "open_short" | "close_long" | "close_short",
        clientOrderId: pickString(row, ["client_order_id"]),
        orderId: pickString(row, ["order_id"]),
        price,
        entryPrice: pickNumber(row, ["entry_price"]),
        amount,
        pnl,
        createdAtIso,
        cause: pickString(row, ["cause"]),
      };
    })
    .filter((row) => row !== null);
}

function normalizePositionSide(
  value: string | null,
  amount: number | null,
): "long" | "short" | null {
  if (value === "long" || value === "short") {
    return value;
  }

  if (value === "bid") {
    return "long";
  }

  if (value === "ask") {
    return "short";
  }

  if (amount === null) {
    return null;
  }

  return amount >= 0 ? "long" : "short";
}

function firstDataRecord(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = "data" in payload ? (payload as { data?: unknown }).data : payload;

  if (Array.isArray(data)) {
    return (data[0] as Record<string, unknown> | undefined) ?? null;
  }

  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }

  return null;
}

function dataArray(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = "data" in payload ? (payload as { data?: unknown }).data : payload;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

function pickString(
  value: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const current = value[key];
    if (current === null || current === undefined) {
      continue;
    }

    const normalized = String(current).trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return null;
}

function pickNumber(
  value: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const current = value[key];
    if (current === null || current === undefined) {
      continue;
    }

    const normalized = Number(current);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return null;
}

function pickDateIso(
  value: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const current = value[key];
    if (current === null || current === undefined) {
      continue;
    }

    const numeric = Number(current);
    if (Number.isFinite(numeric) && numeric > 0) {
      return new Date(numeric).toISOString();
    }
  }

  return null;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      raw: text,
    };
  }
}
