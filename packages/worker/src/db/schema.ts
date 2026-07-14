import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  numeric,
  boolean,
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

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletAddress: text("wallet_address").notNull().unique(),
    onboardingStatus: text("onboarding_status").notNull().default("wallet_pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("accounts_wallet_address_idx").on(t.walletAddress),
  ],
);

export const credentials = pgTable(
  "credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(),
    encryptedPrivateKeyRef: text("encrypted_private_key_ref").notNull(),
    keyFingerprint: text("key_fingerprint").notNull(),
    credentialAlias: text("credential_alias"),
    validationStatus: text("validation_status").notNull().default("pending"),
    lifecycleStatus: text("lifecycle_status").notNull().default("pending"),
    operationallyVerified: boolean("operationally_verified")
      .notNull()
      .default(false),
    lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
    lastValidationErrorCode: text("last_validation_error_code"),
    lastOperationalVerifiedAt: timestamp("last_operational_verified_at", {
      withTimezone: true,
    }),
    lastOperationalErrorCode: text("last_operational_error_code"),
    lastOperationalProbeJson: jsonb("last_operational_probe_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("credentials_account_id_idx").on(t.accountId),
    index("credentials_public_key_idx").on(t.publicKey),
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

// Funding, open interest e mark/oracle do canal `prices` do WS. A Pacifica NÃO
// expõe histórico disso em lugar nenhum (probado em 2026-07-14: /api/v1/trades
// devolve ~2 min e ignora paginação; /api/v1/info só o valor corrente; não há
// stream de liquidação). Esses dados são ORTOGONAIS ao OHLCV — é a única fonte
// de sinal que não é uma transformação do preço — e a única forma de um dia
// backtestar funding extremo ou divergência de OI é começar a gravar agora.
// Espelho da tabela em packages/api/src/db/schema.ts (as migrations saem de lá).
export const marketSnapshots = pgTable(
  "market_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: text("symbol").notNull(),
    fundingRate: numeric("funding_rate"),
    nextFundingRate: numeric("next_funding_rate"),
    openInterest: numeric("open_interest"),
    oraclePrice: numeric("oracle_price"),
    markPrice: numeric("mark_price"),
    midPrice: numeric("mid_price"),
    volume24h: numeric("volume_24h"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    // Idempotência: o snapshot trunca o instante à hora, então uma reexecução
    // dentro da mesma hora não duplica a linha — o insert usa
    // onConflictDoNothing contra este índice.
    uniqueIndex("market_snapshots_symbol_recorded_at_idx").on(
      t.symbol,
      t.recordedAt,
    ),
  ],
);
