import { useCallback, useEffect, useMemo, useState } from "react";
import type { Trade } from "@pacifica/shared/contracts";
import { useAuth } from "../../features/auth/AuthContext";
import { useActionToast } from "../../features/runtime/use-action-toast";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { formatPrice, formatQty, formatSignedUsd, formatWhen } from "../../shared/format";
import { closeTrade, getTrades } from "../../v2/client";
import { LoadingPanel } from "../components/LoadingPanel";

type Translate = ReturnType<typeof useI18n>["t"];
type ToastTone = "success" | "danger";

const PERIOD_OPTIONS = [
  { days: 0, labelKey: "tradesFilterAllPeriods" },
  { days: 7, labelKey: "tradesFilterPeriod7d" },
  { days: 30, labelKey: "tradesFilterPeriod30d" },
  { days: 90, labelKey: "tradesFilterPeriod90d" },
] as const;

function PnlCell(props: { value: number }) {
  return (
    <span className={props.value >= 0 ? "tl-pnl--up" : "tl-pnl--down"}>
      {formatSignedUsd(props.value)}
    </span>
  );
}

function SideTag(props: { side: "long" | "short" }) {
  return <span className={`tl-side tl-side--${props.side}`}>{props.side.toUpperCase()}</span>;
}

export function TradesPage() {
  const { t } = useI18n();
  const { token } = useAuth();
  const showToast = useActionToast();

  const [tab, setTab] = useState<"open" | "closed">("open");
  const [symbolFilter, setSymbolFilter] = useState<string>("");
  const [periodDays, setPeriodDays] = useState<number>(0);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [dataStatus, setDataStatus] = useState<"loading" | "ready">("loading");

  const loadTrades = useCallback(async () => {
    const response = await getTrades(token, 200);
    if (response.status === "ok") {
      setOpenTrades(response.openTrades);
      setClosedTrades(response.closedTrades);
    }
    setDataStatus("ready");
  }, [token]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const symbols = useMemo(() => {
    const set = new Set<string>();
    for (const trade of openTrades) set.add(trade.symbol);
    for (const trade of closedTrades) set.add(trade.symbol);
    return [...set].sort();
  }, [openTrades, closedTrades]);

  const visibleOpen = useMemo(
    () => openTrades.filter((trade) => !symbolFilter || trade.symbol === symbolFilter),
    [openTrades, symbolFilter],
  );
  const visibleClosed = useMemo(() => {
    const cutoff = periodDays > 0 ? Date.now() - periodDays * 24 * 60 * 60 * 1000 : 0;
    return closedTrades
      .filter((trade) => !symbolFilter || trade.symbol === symbolFilter)
      .filter(
        (trade) =>
          cutoff === 0 ||
          (trade.closedAt !== null && new Date(trade.closedAt).getTime() >= cutoff),
      )
      .sort(
        (a, b) =>
          new Date(b.closedAt ?? b.openedAt).getTime() -
          new Date(a.closedAt ?? a.openedAt).getTime(),
      );
  }, [closedTrades, symbolFilter, periodDays]);

  const closedTotal = visibleClosed.reduce(
    (sum, trade) => sum + (trade.realizedPnl ?? 0),
    0,
  );

  if (dataStatus === "loading") {
    return (
      <LoadingPanel message={t("runtimeStatusLoadingMessage")} title={t("tradesTitle")} />
    );
  }

  return (
    <div className="builder-page">
      <div className="builder-head">
        <h1>{t("tradesTitle")}</h1>
      </div>

      <section className="builder-card">
        <div className="tl-tabs" role="tablist">
          <button
            aria-selected={tab === "open"}
            className={`tl-tab ${tab === "open" ? "tl-tab--active" : ""}`}
            onClick={() => setTab("open")}
            role="tab"
            type="button"
          >
            {t("tradesTabOpen")}<span className="count">{openTrades.length}</span>
          </button>
          <button
            aria-selected={tab === "closed"}
            className={`tl-tab ${tab === "closed" ? "tl-tab--active" : ""}`}
            onClick={() => setTab("closed")}
            role="tab"
            type="button"
          >
            {t("tradesTabClosed")}<span className="count">{closedTrades.length}</span>
          </button>
        </div>

        <div className="tl-filters">
          <select aria-label={t("tradesFilterAllSymbols")} onChange={(event) => setSymbolFilter(event.target.value)} value={symbolFilter}>
            <option value="">{t("tradesFilterAllSymbols")}</option>
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          {tab === "closed" ? (
            <select aria-label={t("tradesFilterAllPeriods")} onChange={(event) => setPeriodDays(Number(event.target.value))} value={periodDays}>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.days} value={option.days}>{t(option.labelKey)}</option>
              ))}
            </select>
          ) : null}
        </div>

        {tab === "open" ? (
          <OpenTradesTable
            onClosed={() => void loadTrades()}
            onResult={showToast}
            t={t}
            token={token}
            trades={visibleOpen}
          />
        ) : (
          <ClosedTradesTable t={t} total={closedTotal} trades={visibleClosed} />
        )}
      </section>
    </div>
  );
}

function OpenTradesTable(props: {
  onClosed: () => void;
  onResult: (tone: ToastTone, message: string) => void;
  t: Translate;
  token: string | null;
  trades: Trade[];
}) {
  const { onClosed, onResult, t, token, trades } = props;
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function handleClose(trade: Trade) {
    if (confirmingId !== trade.id) {
      setConfirmingId(trade.id);
      window.setTimeout(() => setConfirmingId((id) => (id === trade.id ? null : id)), 4000);
      return;
    }
    setConfirmingId(null);
    setClosingId(trade.id);
    const result = await closeTrade(token, trade.id);
    setClosingId(null);
    onResult(
      result.status === "ok" ? "success" : "danger",
      result.status === "ok" ? t("tradesCloseRequested") : result.message,
    );
    onClosed();
  }

  if (trades.length === 0) {
    return <p className="tl-empty">{t("tradesEmptyOpen")}</p>;
  }

  return (
    <div className="tl-table-wrap">
      <table className="tl-table">
        <thead>
          <tr>
            <th>{t("tradesColSymbol")}</th>
            <th>{t("tradesColSide")}</th>
            <th>{t("tradesColEntry")}</th>
            <th>{t("tradesColQty")}</th>
            <th>{t("tradesColStop")}</th>
            <th>{t("tradesColTarget")}</th>
            <th>{t("tradesColOpened")}</th>
            <th aria-label="actions" />
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.symbol}</td>
              <td><SideTag side={trade.side} /></td>
              <td>{formatPrice(trade.entryPrice)}</td>
              <td>{formatQty(trade.amount)}</td>
              <td>{trade.stopLossPrice !== null ? formatPrice(trade.stopLossPrice) : "—"}</td>
              <td>{trade.takeProfitPrice !== null ? formatPrice(trade.takeProfitPrice) : "—"}</td>
              <td>{formatWhen(trade.openedAt)}</td>
              <td>
                {trade.status === "open" ? (
                  <button
                    className="builder-btn"
                    disabled={closingId !== null}
                    onClick={() => void handleClose(trade)}
                    style={{ padding: "3px 10px", fontSize: 10 }}
                    type="button"
                  >
                    {closingId === trade.id
                      ? t("tradesCloseBusy")
                      : confirmingId === trade.id
                        ? t("tradesCloseConfirm")
                        : t("tradesCloseAction")}
                  </button>
                ) : (
                  <span style={{ color: "var(--text-soft)", fontSize: 11 }}>
                    {trade.status.replace(/_/g, " ")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClosedTradesTable(props: { t: Translate; total: number; trades: Trade[] }) {
  const { t, total, trades } = props;

  if (trades.length === 0) {
    return <p className="tl-empty">{t("tradesEmptyClosed")}</p>;
  }

  return (
    <div className="tl-table-wrap">
      <table className="tl-table">
        <thead>
          <tr>
            <th>{t("tradesColSymbol")}</th>
            <th>{t("tradesColSide")}</th>
            <th>{t("tradesColEntry")}</th>
            <th>{t("tradesColExit")}</th>
            <th>{t("tradesColQty")}</th>
            <th>{t("tradesColPnl")}</th>
            <th>{t("tradesColReason")}</th>
            <th>{t("tradesColClosed")}</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.symbol}</td>
              <td><SideTag side={trade.side} /></td>
              <td>{formatPrice(trade.entryPrice)}</td>
              <td>{trade.exitPrice !== null ? formatPrice(trade.exitPrice) : "—"}</td>
              <td>{formatQty(trade.amount)}</td>
              <td><PnlCell value={trade.realizedPnl ?? 0} /></td>
              <td style={{ color: "var(--text-soft)" }}>{trade.closeReason ?? "—"}</td>
              <td>{trade.closedAt ? formatWhen(trade.closedAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>{t("tradesTotalLabel")}</td>
            <td><PnlCell value={total} /></td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
