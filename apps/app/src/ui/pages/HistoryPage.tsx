import { useCallback, useEffect, useState } from "react";
import type { ClosedTrade, OperationalHistorySessionFound } from "@pacifica/contracts";
import { applyOperationalHistorySessionSnapshot } from "../../features/account/apply-operational-page-sessions";
import { readOperationalHistoryViaBackend } from "../../features/account/backend-operational-page-sessions";
import { useOperationalPageSession } from "../../features/account/use-operational-page-session";
import { getSecondaryRuntimeSyncPresentation } from "../../features/runtime/runtime-sync-presentation";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { LoadingPanel } from "../components/LoadingPanel";
import { PaginationControls } from "../components/PaginationControls";

const HISTORY_PER_PAGE = 12;

export function HistoryPage() {
  const {
    setBuilderApprovalState,
    setCredentialState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state,
  } = useAppState();
  const { t } = useI18n();
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(
    state.runtime.closedTrades[0]?.id ?? null,
  );
  const [page, setPage] = useState(1);
  const applyHistorySnapshot = useCallback(
    (snapshot: OperationalHistorySessionFound) => {
      applyOperationalHistorySessionSnapshot(snapshot, {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
      });
    },
    [
      setBuilderApprovalState,
      setCredentialState,
      setOperationalState,
      setPresetState,
      setRuntimeState,
    ],
  );
  const historySession = useOperationalPageSession({
    readSnapshot: readOperationalHistoryViaBackend,
    applySnapshot: applyHistorySnapshot,
    requestKey: "history",
    loadingMessage: t("runtimeStatusLoading"),
    unavailableMessage: t("runtimeStatusError"),
  });

  const totalPages = Math.max(1, Math.ceil(state.runtime.closedTrades.length / HISTORY_PER_PAGE));
  const visibleTrades = paginate(state.runtime.closedTrades, page, HISTORY_PER_PAGE);
  const selectedTrade =
    state.runtime.closedTrades.find((trade) => trade.id === selectedTradeId) ?? null;
  const runtimeSyncPresentation = getSecondaryRuntimeSyncPresentation(
    state.runtime.syncStatus,
    state.runtime.exchangeSnapshotStatus,
    state.runtime.exchangeSnapshotMessage,
    state.runtime.exchangeLastSyncedAt,
    state.runtime.lastRuntimeMessage,
    t,
  );
  const shouldShowRuntimeErrorBanner =
    state.runtime.screenStatus === "error" &&
    Boolean(state.runtime.lastRuntimeMessage);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!visibleTrades.find((trade) => trade.id === selectedTradeId)) {
      setSelectedTradeId(visibleTrades[0]?.id ?? null);
    }
  }, [selectedTradeId, visibleTrades]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatSignedCurrency(value: number) {
    return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
  }

  function formatTradeOrigin(isPlatformTrade: boolean) {
    return isPlatformTrade
      ? t("tradeOriginPlatform")
      : t("tradeOriginExternal");
  }

  function formatEventTime(value: string) {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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

      {historySession.status === "loading" || historySession.status === "error" ? (
        historySession.status === "loading" ? (
          <LoadingPanel
            title={t("runtimeStatusLoading")}
            message={historySession.message}
          />
        ) : (
          <section className="page-card status-banner status-banner--danger">
            <strong>{t("runtimeStatusError")}</strong>
            <p>{historySession.message}</p>
          </section>
        )
      ) : null}

      {shouldShowRuntimeErrorBanner ? (
        <section className="page-card status-banner status-banner--danger">
          <strong>{t("runtimeStatusError")}</strong>
          <p>{state.runtime.lastRuntimeMessage}</p>
        </section>
      ) : null}

      {!shouldShowRuntimeErrorBanner && runtimeSyncPresentation.show ? (
        <section
          className={`page-card status-banner status-banner--${runtimeSyncPresentation.tone}`}
        >
          <strong>{runtimeSyncPresentation.title}</strong>
          <p>{runtimeSyncPresentation.message}</p>
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
            <>
              <div className="history-stack">
                {visibleTrades.map((trade) => (
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
                          className={`badge badge--${
                            trade.realizedPnl >= 0 ? "success" : "danger"
                          }`}
                        >
                          {closeReasonLabel(trade.closeReason)}
                        </span>
                      </div>
                      <p>{formatTradeOrigin(trade.isPlatformTrade)}</p>
                      <p>
                        {t("historyEntryLabel")} {formatEventTime(trade.openedAt)}
                        {" · "}
                        {t("historyExitLabel")} {formatEventTime(trade.closedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="trade-label">{t("historyResultLabel")}</span>
                      <strong className={trade.realizedPnl >= 0 ? "up" : "down"}>
                        {formatSignedCurrency(trade.realizedPnl)}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
              <PaginationControls
                nextLabel={t("paginationNext")}
                onPageChange={setPage}
                page={page}
                previousLabel={t("paginationPrevious")}
                summary={t("paginationPageOf")
                  .replace("{page}", String(page))
                  .replace("{total}", String(totalPages))}
                totalPages={totalPages}
              />
            </>
          ) : (
            <div className="info-note">
              <strong>{t("historyEmptyTitle")}</strong>
              <p>{t("historyEmptyDescription")}</p>
            </div>
          )}
        </section>

        <aside className={`panel detail-panel ${selectedTrade ? "detail-panel--linked" : ""}`}>
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
            <div className="detail-grid">
              <div className="detail-item">
                <span>{t("historyDetailResult")}</span>
                <strong className={selectedTrade.realizedPnl >= 0 ? "up" : "down"}>
                  {formatSignedCurrency(selectedTrade.realizedPnl)}
                </strong>
              </div>
              <div className="detail-item">
                <span>{t("historyDetailCloseReason")}</span>
                <strong>{closeReasonLabel(selectedTrade.closeReason)}</strong>
              </div>
              <div className="detail-item">
                <span>{t("historyDetailOrigin")}</span>
                <strong>{formatTradeOrigin(selectedTrade.isPlatformTrade)}</strong>
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

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const startIndex = (safePage - 1) * pageSize;

  return items.slice(startIndex, startIndex + pageSize);
}
