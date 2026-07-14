CREATE TABLE "market_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"funding_rate" numeric,
	"next_funding_rate" numeric,
	"open_interest" numeric,
	"oracle_price" numeric,
	"mark_price" numeric,
	"mid_price" numeric,
	"volume_24h" numeric,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "market_snapshots_symbol_recorded_at_idx" ON "market_snapshots" USING btree ("symbol","recorded_at");