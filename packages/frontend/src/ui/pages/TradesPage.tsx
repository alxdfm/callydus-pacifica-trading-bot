import { useMemo, useState } from "react";
import type { ClosedTrade, OpenTrade } from "../../types/contracts";
import { useDashboardSession } from "../../features/account/use-dashboard-session";
import { closeTradeViaBackend } from "../../features/runtime/backend-bot-commands";
import { useAuth } from "../../features/auth/AuthContext";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { formatPrice, formatQty, formatSignedUsd, formatWhen } from "../../shared/format";
import { useAppState } from "../../state/app-state";
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
  const { setRuntimeState, state } = useAppState();

  const [tab, setTab] = useState<"open" | "closed">("open");
  const [symbolFilter, setSymbolFilter] = useState<string>("");
  const [periodDays, setPeriodDays] = useState<number>(0);

  const session = useDashboardSession();

  const openTrades = state.runtime.currentTrades;
  const closedTrades = state.runtime.closedTrades;

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
      .filter((trade) => cutoff === 0 || new Date(trade.closedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  }, [closedTrades, symbolFilter, periodDays]);

  const openTotal = visibleOpen.reduce((sum, trade) => sum + trade.unrealizedPnl, 0);
  const closedTotal = visibleClosed.reduce((sum, trade) => sum + trade.realizedPnl, 0);

  function showToast(tone: ToastTone, message: string) {
    setRuntimeState({ actionToast: { id: Date.now(), tone, message } });
  }

  if (session.status === "loading") {
    return <LoadingPanel message={session.message ?? t("runtimeStatusLoadingMessage")} title={t("tradesTitle")} />;
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
            onClosed={() => void session.reload()}
            onResult={showToast}
            t={t}
            token={token}
            total={openTotal}
            trades={visibleOpen}
            walletAddress={state.wallet.mainWalletPublicKey}
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
  total: number;
  trades: OpenTrade[];
  walletAddress: string | null;
}) {
  const { onClosed, onResult, t, token, total, trades, walletAddress } = props;
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function handleClose(trade: OpenTrade) {
    if (!walletAddress) return;
    if (confirmingId !== trade.id) {
      setConfirmingId(trade.id);
      window.setTimeout(() => setConfirmingId((id) => (id === trade.id ? null : id)), 4000);
      return;
    }
    setConfirmingId(null);
    setClosingId(trade.id);
    const result = await closeTradeViaBackend({ walletAddress, tradeId: trade.id }, token);
    setClosingId(null);
    onResult(result.status === "success" ? "success" : "danger", result.message);
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
            <th>{t("tradesColCurrent")}</th>
            <th>{t("tradesColQty")}</th>
            <th>{t("tradesColStop")}</th>
            <th>{t("tradesColTarget")}</th>
            <th>{t("tradesColPnl")}</th>
            <th>{t("tradesColOpened")}</th>
            <th aria-label="actions" />
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>
                {trade.symbol}
                {trade.isPlatformTrade ? null : <span className="tl-badge-ext">{t("tradesExternalBadge")}</span>}
              </td>
              <td><SideTag side={trade.side} /></td>
              <td>{formatPrice(trade.entryPrice)}</td>
              <td>{formatPrice(trade.currentPrice)}</td>
              <td>{formatQty(trade.quantity)}</td>
              <td>{formatPrice(trade.stopLossPrice)}</td>
              <td>{formatPrice(trade.takeProfitPrice)}</td>
              <td><PnlCell value={trade.unrealizedPnl} /></td>
              <td>{formatWhen(trade.openedAt)}</td>
              <td>
                {trade.isPlatformTrade ? (
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
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7}>{t("tradesTotalLabel")}</td>
            <td><PnlCell value={total} /></td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ClosedTradesTable(props: { t: Translate; total: number; trades: ClosedTrade[] }) {
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
              <td>
                {trade.symbol}
                {trade.isPlatformTrade ? null : <span className="tl-badge-ext">{t("tradesExternalBadge")}</span>}
              </td>
              <td><SideTag side={trade.side} /></td>
              <td>{formatPrice(trade.entryPrice)}</td>
              <td>{formatPrice(trade.exitPrice)}</td>
              <td>{formatQty(trade.quantity)}</td>
              <td><PnlCell value={trade.realizedPnl} /></td>
              <td style={{ color: "var(--text-soft)" }}>{trade.closeReason}</td>
              <td>{formatWhen(trade.closedAt)}</td>
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
