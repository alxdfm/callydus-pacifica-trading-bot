CREATE TYPE "public"."close_reason" AS ENUM('take_profit', 'stop_loss', 'manual', 'system', 'error');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('signal_evaluated', 'order_submitted', 'order_failed', 'trade_opened', 'trade_closed', 'strategy_activated', 'strategy_paused', 'strategy_stopped', 'reconciliation', 'error');--> statement-breakpoint
CREATE TYPE "public"."strategy_status" AS ENUM('active', 'paused', 'stopped');--> statement-breakpoint
CREATE TYPE "public"."trade_side" AS ENUM('long', 'short');--> statement-breakpoint
CREATE TYPE "public"."trade_status" AS ENUM('open', 'close_requested', 'closing', 'closed');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"onboarding_status" text DEFAULT 'wallet_pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "auth_nonces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"nonce" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_nonces_nonce_unique" UNIQUE("nonce")
);
--> statement-breakpoint
CREATE TABLE "builder_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"builder_code" text NOT NULL,
	"max_fee_rate" text NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"public_key" text NOT NULL,
	"encrypted_private_key_ref" text NOT NULL,
	"key_fingerprint" text NOT NULL,
	"credential_alias" text,
	"validation_status" text DEFAULT 'pending' NOT NULL,
	"lifecycle_status" text DEFAULT 'pending' NOT NULL,
	"operationally_verified" boolean DEFAULT false NOT NULL,
	"last_validated_at" timestamp with time zone,
	"last_validation_error_code" text,
	"last_operational_verified_at" timestamp with time zone,
	"last_operational_error_code" text,
	"last_operational_probe_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid,
	"type" "event_type" NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"symbol" text NOT NULL,
	"status" "strategy_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"side" "trade_side" NOT NULL,
	"amount" numeric(24, 8) NOT NULL,
	"entry_price" numeric(24, 8) NOT NULL,
	"exit_price" numeric(24, 8),
	"sl" numeric(24, 8),
	"tp" numeric(24, 8),
	"status" "trade_status" DEFAULT 'open' NOT NULL,
	"close_reason" "close_reason",
	"realized_pnl" numeric(24, 8),
	"pacifica_order_id" text,
	"client_order_id" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_wallet_address_idx" ON "accounts" USING btree ("wallet_address");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_nonces_nonce_idx" ON "auth_nonces" USING btree ("nonce");--> statement-breakpoint
CREATE INDEX "auth_nonces_wallet_idx" ON "auth_nonces" USING btree ("wallet_address");--> statement-breakpoint
CREATE UNIQUE INDEX "builder_approvals_user_builder_idx" ON "builder_approvals" USING btree ("user_id","builder_code");--> statement-breakpoint
CREATE INDEX "credentials_account_id_idx" ON "credentials" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "credentials_public_key_idx" ON "credentials" USING btree ("public_key");--> statement-breakpoint
CREATE INDEX "events_strategy_id_idx" ON "events" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "events_consumed_at_idx" ON "events" USING btree ("consumed_at");--> statement-breakpoint
CREATE INDEX "strategies_user_id_idx" ON "strategies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "strategies_status_idx" ON "strategies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trades_strategy_id_idx" ON "trades" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "trades_status_idx" ON "trades" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trades_opened_at_idx" ON "trades" USING btree ("opened_at");