import { useEffect, useState } from "react";
import { readAccountSessionViaBackend } from "../../features/account/backend-account-session";
import { applyAccountSessionSnapshot } from "../../features/account/apply-account-session";
import { closeTradeViaBackend } from "../../features/runtime/backend-bot-commands";
import { getSecondaryRuntimeSyncPresentation } from "../../features/runtime/runtime-sync-presentation";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function TradesPage() {
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
    state.runtime.currentTrades[0]?.id ?? null,
  );
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [pendingCloseTradeId, setPendingCloseTradeId] = useState<string | null>(null);

  useEffect(() => {
    if (!state.runtime.currentTrades.find((trade) => trade.id === selectedTradeId)) {
      setSelectedTradeId(state.runtime.currentTrades[0]?.id ?? null);
    }
  }, [selectedTradeId, state.runtime.currentTrades]);

  const selectedTrade =
    state.runtime.currentTrades.find((trade) => trade.id === selectedTradeId) ?? null;

  function formatSignedCurrency(value: number) {
    return `${value >= 0 ? "+" : "-"}${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Math.abs(value))}`;
  }

  async function handleCloseTrade(tradeId: string) {
    const trade = state.runtime.currentTrades.find((candidate) => candidate.id === tradeId);
    const walletAddress = state.wallet.mainWalletPublicKey;

    if (!trade || !walletAddress) {
      return;
    }

    setClosingTradeId(tradeId);
    setRuntimeState({
      screenStatus: "loading",
      lastRuntimeMessage: t("runtimeActionProcessing"),
    });

    const commandResult = await closeTradeViaBackend({
      walletAddress,
      tradeId,
    });

    if (commandResult.status === "error") {
      setRuntimeState({
        screenStatus: "error",
        lastRuntimeMessage: commandResult.message,
      });
      setClosingTradeId(null);
      return;
    }

    const sessionSnapshot = await readAccountSessionViaBackend({
      walletAddress,
    });

    if (sessionSnapshot.status === "found") {
      applyAccountSessionSnapshot(sessionSnapshot, {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
      });
      setRuntimeState({
        screenStatus: "ready",
        lastRuntimeMessage: t("runtimeActionCloseSuccess"),
      });
    } else {
      setRuntimeState({
        screenStatus: "error",
        lastRuntimeMessage:
          sessionSnapshot.status === "error"
            ? sessionSnapshot.message
            : t("runtimeStatusError"),
      });
    }

    setClosingTradeId(null);
  }

  const pendingTrade =
    state.runtime.currentTrades.find((trade) => trade.id === pendingCloseTradeId) ?? null;
  const runtimeSyncPresentation = getSecondaryRuntimeSyncPresentation(
    state.runtime.syncStatus,
    state.runtime.lastRuntimeMessage,
    t,
  );
  const shouldShowRuntimeActionBanner = Boolean(state.runtime.lastRuntimeMessage);

  return (
    <div className="page-stack">
      <ConfirmationModal
        cancelLabel={t("modalCancelAction")}
        confirmLabel={t("tradeCloseAction")}
        description={
          pendingTrade
            ? t("tradeCloseConfirmDescription").replace("{symbol}", pendingTrade.symbol)
            : t("tradeCloseConfirmFallback")
        }
        isOpen={Boolean(pendingTrade)}
        onCancel={() => setPendingCloseTradeId(null)}
        onConfirm={() => {
          if (!pendingCloseTradeId) {
            return;
          }

          setPendingCloseTradeId(null);
          void handleCloseTrade(pendingCloseTradeId);
        }}
        title={t("tradeCloseConfirmTitle")}
        tone="danger"
      />
      <section className="topbar">
        <div>
          <p className="page-card__eyebrow">{t("pageTradesTitle")}</p>
          <h2>{t("tradesTopbarTitle")}</h2>
          <p className="subtle">{t("tradesTopbarDescription")}</p>
        </div>
        <div className="topbar-actions">
          <span className="badge badge--warning">
            {`${state.runtime.currentTrades.length} ${t("tradesTopbarCount")}`}
          </span>
        </div>
      </section>

      {shouldShowRuntimeActionBanner ? (
        <section
          className={`page-card status-banner status-banner--${
            state.runtime.screenStatus === "error"
              ? "danger"
              : state.runtime.screenStatus === "loading"
                ? "warning"
                : "neutral"
          }`}
        >
          <strong>
            {state.runtime.screenStatus === "loading"
              ? t("runtimeStatusLoading")
              : t("runtimeStatusReady")}
          </strong>
          <p>{state.runtime.lastRuntimeMessage}</p>
        </section>
      ) : null}

      {!shouldShowRuntimeActionBanner && runtimeSyncPresentation.show ? (
        <section
          className={`page-card status-banner status-banner--${runtimeSyncPresentation.tone}`}
        >
          <strong>{runtimeSyncPresentation.title}</strong>
          <p>{runtimeSyncPresentation.message}</p>
        </section>
      ) : null}

      <section className="trade-screen-grid">
        <section className="panel trade-list-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("tradesListEyebrow")}</p>
              <h3>{t("tradesListTitle")}</h3>
            </div>
            <span className="badge badge--neutral">{t("tradesListBadge")}</span>
          </div>

          {state.runtime.currentTrades.length > 0 ? (
            <div className="trade-stack">
              {state.runtime.currentTrades.map((trade) => (
                <article
                  key={trade.id}
                  className={`trade-card wide ${trade.tradeStatus === "open" ? "live" : ""} ${
                    selectedTradeId === trade.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTradeId(trade.id)}
                >
                  <div>
                    <div className="trade-head">
                      <strong>{trade.symbol}</strong>
                      <span className={`badge badge--${trade.side === "long" ? "info" : "danger"}`}>
                        {trade.side === "long" ? t("tradeSideLong") : t("tradeSideShort")}
                      </span>
                      <span
                        className={`badge badge--${
                          trade.tradeStatus === "open" ? "success" : "warning"
                        }`}
                      >
                        {trade.tradeStatus === "open" ? t("tradeStatusOpen") : t("tradeStatusWaiting")}
                      </span>
                    </div>
                    <p>
                      {trade.isPlatformTrade ? t("tradeOriginPlatform") : t("tradeOriginExternal")}
                    </p>
                  </div>
                  <div>
                    <span className="trade-label">{t("tradeEntryLabel")}</span>
                    <strong>{trade.entryPrice}</strong>
                  </div>
                  <div>
                    <span className="trade-label">{t("tradeCurrentLabel")}</span>
                    <strong>{trade.currentPrice}</strong>
                  </div>
                  <div>
                    <span className="trade-label">{t("tradePnlLabel")}</span>
                    <strong className={trade.unrealizedPnl >= 0 ? "up" : "down"}>
                      {formatSignedCurrency(trade.unrealizedPnl)}
                    </strong>
                  </div>
                  <button
                    className="btn secondary small"
                    disabled={closingTradeId === trade.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingCloseTradeId(trade.id);
                    }}
                    type="button"
                  >
                    {t("tradeCloseAction")}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="info-note">
              <strong>{t("tradesEmptyTitle")}</strong>
              <p>{t("tradesEmptyDescription")}</p>
            </div>
          )}
        </section>

        <aside className={`panel detail-panel ${selectedTrade ? "detail-panel--linked" : ""}`}>
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("tradesDetailEyebrow")}</p>
              <h3>{selectedTrade ? selectedTrade.symbol : t("tradesDetailEmptyTitle")}</h3>
            </div>
            <span className={`badge badge--${selectedTrade ? "success" : "neutral"}`}>
              {selectedTrade ? t("tradeStatusOpen") : t("tradesDetailEmptyBadge")}
            </span>
          </div>

          {selectedTrade ? (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>{t("tradesDetailDirection")}</span>
                  <strong>{selectedTrade.side === "long" ? t("tradeSideLong") : t("tradeSideShort")}</strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradesDetailPositionSize")}</span>
                  <strong>{`${Math.round((selectedTrade.capitalAllocated / (state.runtime.balance?.totalBalance || 1)) * 100)}%`}</strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradesDetailStopLoss")}</span>
                  <strong>{(selectedTrade.entryPrice * 0.994).toFixed(2)}</strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradesDetailTakeProfit")}</span>
                  <strong>{(selectedTrade.entryPrice * 1.018).toFixed(2)}</strong>
                </div>
              </div>

              <div className="info-note">
                <strong>{t("tradesDetailInterventionTitle")}</strong>
                <p>{t("tradesDetailInterventionDescription")}</p>
              </div>

              <button
                className="btn danger wide"
                disabled={closingTradeId === selectedTrade.id}
                onClick={() => setPendingCloseTradeId(selectedTrade.id)}
                type="button"
              >
                {t("tradeCloseSelectedAction")}
              </button>
            </>
          ) : (
            <div className="info-note">
              <strong>{t("tradesDetailEmptyTitle")}</strong>
              <p>{t("tradesDetailEmptyDescription")}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
