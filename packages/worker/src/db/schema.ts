import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const strategyStatusEnum = pgEnum("strategy_status", [
  "active",
  "paused",
  "stopped",
]);

export const tradeSideEnum = pgEnum("trade_side", ["long", "short"]);

export const tradeStatusEnum = pgEnum("trade_status", [
  "open",
  "close_requested",
  "closing",
  "closed",
]);

export const closeReasonEnum = pgEnum("close_reason", [
  "take_profit",
  "stop_loss",
  "manual",
  "system",
  "error",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "signal_evaluated",
  "order_submitted",
  "order_failed",
  "trade_opened",
  "trade_closed",
  "strategy_activated",
  "strategy_paused",
  "strategy_stopped",
  "reconciliation",
  "error",
]);

export const strategies = pgTable(
  "strategies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    config: jsonb("config").notNull(),
    symbol: text("symbol").notNull(),
    status: strategyStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("strategies_user_id_idx").on(t.userId),
    index("strategies_status_idx").on(t.status),
  ],
);

export const trades = pgTable(
  "trades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id")
      .notNull()
      .references(() => strategies.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    side: tradeSideEnum("side").notNull(),
    amount: numeric("amount", { precision: 24, scale: 8 }).notNull(),
    entryPrice: numeric("entry_price", { precision: 24, scale: 8 }).notNull(),
    exitPrice: numeric("exit_price", { precision: 24, scale: 8 }),
    sl: numeric("sl", { precision: 24, scale: 8 }),
    tp: numeric("tp", { precision: 24, scale: 8 }),
    status: tradeStatusEnum("status").notNull().default("open"),
    closeReason: closeReasonEnum("close_reason"),
    realizedPnl: numeric("realized_pnl", { precision: 24, scale: 8 }),
    pacificaOrderId: text("pacifica_order_id"),
    clientOrderId: text("client_order_id"),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("trades_strategy_id_idx").on(t.strategyId),
    index("trades_status_idx").on(t.status),
    index("trades_opened_at_idx").on(t.openedAt),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id").references(() => strategies.id, {
      onDelete: "cascade",
    }),
    type: eventTypeEnum("type").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [
    index("events_strategy_id_idx").on(t.strategyId),
    index("events_type_idx").on(t.type),
    index("events_consumed_at_idx").on(t.consumedAt),
  ],
);

export const builderApprovals = pgTable(
  "builder_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    builderCode: text("builder_code").notNull(),
    maxFeeRate: text("max_fee_rate").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("builder_approvals_user_builder_idx").on(
      t.userId,
      t.builderCode,
    ),
  ],
);
