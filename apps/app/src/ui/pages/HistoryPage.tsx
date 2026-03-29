import { useEffect, useState } from "react";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";

export function HistoryPage() {
  const { state } = useAppState();
  const { t } = useI18n();
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(
    state.runtime.closedTrades[0]?.id ?? null,
  );

  useEffect(() => {
    if (
      !state.runtime.closedTrades.find((trade) => trade.id === selectedTradeId)
    ) {
      setSelectedTradeId(state.runtime.closedTrades[0]?.id ?? null);
    }
  }, [selectedTradeId, state.runtime.closedTrades]);

  const selectedTrade =
    state.runtime.closedTrades.find((trade) => trade.id === selectedTradeId) ??
    null;

  function formatSignedCurrency(value: number) {
    return `${value >= 0 ? "+" : "-"}${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Math.abs(value))}`;
  }

  function closeReasonLabel(reason: string) {
    switch (reason) {
      case "take_profit":
        return t("tradeCloseReasonTakeProfit");
      case "stop_loss":
        return t("tradeCloseReasonStopLoss");
      case "manual":
        return t("tradeCloseReasonManual");
      default:
        return t("tradeCloseReasonSystem");
    }
  }

  return (
    <div className="page-stack">
      <section className="topbar">
        <div>
          <p className="page-card__eyebrow">{t("pageHistoryTitle")}</p>
          <h2>{t("historyTopbarTitle")}</h2>
          <p className="subtle">{t("historyTopbarDescription")}</p>
        </div>
      </section>

      {state.runtime.lastRuntimeMessage ? (
        <section className="page-card status-banner status-banner--neutral">
          <strong>{t("runtimeStatusReady")}</strong>
          <p>{state.runtime.lastRuntimeMessage}</p>
        </section>
      ) : null}

      <section className="history-screen-grid">
        <section className="panel history-main-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("historyListEyebrow")}</p>
              <h3>{t("historyListTitle")}</h3>
            </div>
            <span className="badge badge--info">
              {`${state.runtime.closedTrades.length} ${t("historyListCountLabel")}`}
            </span>
          </div>

          {state.runtime.closedTrades.length > 0 ? (
            <div className="history-stack">
              {state.runtime.closedTrades.map((trade) => (
                <article
                  key={trade.id}
                  className={`history-card ${selectedTradeId === trade.id ? "selected" : ""}`}
                  onClick={() => setSelectedTradeId(trade.id)}
                >
                  <div>
                    <div className="trade-head">
                      <strong>{trade.symbol}</strong>
                      <span
                        className={`badge badge--${trade.side === "long" ? "info" : "danger"}`}
                      >
                        {trade.side === "long"
                          ? t("tradeSideLong")
                          : t("tradeSideShort")}
                      </span>
                      <span
                        className={`badge badge--${trade.realizedPnl >= 0 ? "success" : "danger"}`}
                      >
                        {closeReasonLabel(trade.closeReason)}
                      </span>
                    </div>
                    <p>
                      {t("historyEntryLabel")}{" "}
                      {new Date(trade.openedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {t("historyExitLabel")}{" "}
                      {new Date(trade.closedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ·{" "}
                      {trade.isPlatformTrade
                        ? t("tradeOriginPlatform")
                        : t("tradeOriginExternal")}
                    </p>
                  </div>
                  <div>
                    <span className="trade-label">
                      {t("historyResultLabel")}
                    </span>
                    <strong className={trade.realizedPnl >= 0 ? "up" : "down"}>
                      {formatSignedCurrency(trade.realizedPnl)}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="info-note">
              <strong>{t("historyEmptyTitle")}</strong>
              <p>{t("historyEmptyDescription")}</p>
            </div>
          )}
        </section>

        <aside
          className={`panel detail-panel ${selectedTrade ? "detail-panel--linked" : ""}`}
        >
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("historyDetailEyebrow")}</p>
              <h3>
                {selectedTrade
                  ? selectedTrade.symbol
                  : t("historyDetailEmptyTitle")}
              </h3>
            </div>
            <span
              className={`badge badge--${
                selectedTrade
                  ? selectedTrade.realizedPnl >= 0
                    ? "success"
                    : "danger"
                  : "neutral"
              }`}
            >
              {selectedTrade
                ? selectedTrade.realizedPnl >= 0
                  ? t("historyDetailPositiveBadge")
                  : t("historyDetailNegativeBadge")
                : t("historyDetailEmptyBadge")}
            </span>
          </div>

          {selectedTrade ? (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>{t("historyDetailCloseReason")}</span>
                  <strong>{closeReasonLabel(selectedTrade.closeReason)}</strong>
                </div>
                <div className="detail-item">
                  <span>{t("historyDetailDirection")}</span>
                  <strong>
                    {selectedTrade.side === "long"
                      ? t("tradeSideLong")
                      : t("tradeSideShort")}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>{t("historyDetailEntry")}</span>
                  <strong>{selectedTrade.entryPrice}</strong>
                </div>
                <div className="detail-item">
                  <span>{t("historyDetailExit")}</span>
                  <strong>{selectedTrade.exitPrice}</strong>
                </div>
              </div>

              <div className="info-note">
                <strong>{t("historyDetailReadingTitle")}</strong>
                <p>{t("historyDetailReadingDescription")}</p>
              </div>
            </>
          ) : (
            <div className="info-note">
              <strong>{t("historyDetailEmptyTitle")}</strong>
              <p>{t("historyDetailEmptyDescription")}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
