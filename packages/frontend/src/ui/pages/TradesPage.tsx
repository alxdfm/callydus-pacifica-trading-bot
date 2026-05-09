import { useCallback, useEffect, useState } from "react";
import type {
  OpenTrade,
  OperationalTradesSessionFound,
} from "@pacifica/contracts";
import { applyOperationalTradesSessionSnapshot } from "../../features/account/apply-operational-page-sessions";
import { readOperationalTradesViaBackend } from "../../features/account/backend-operational-page-sessions";
import { useOperationalPageSession } from "../../features/account/use-operational-page-session";
import { closeTradeViaBackend } from "../../features/runtime/backend-bot-commands";
import { getSecondaryRuntimeSyncPresentation } from "../../features/runtime/runtime-sync-presentation";
import { useAuth } from "../../features/auth/AuthContext";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { PaginationControls } from "../components/PaginationControls";

const TRADES_PER_PAGE = 5;

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
  const { token } = useAuth();
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(
    state.runtime.currentTrades[0]?.id ?? null,
  );
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [pendingCloseTradeId, setPendingCloseTradeId] = useState<string | null>(
    null,
  );
  const [platformPage, setPlatformPage] = useState(1);
  const [externalPage, setExternalPage] = useState(1);
  const applyTradesSnapshot = useCallback(
    (snapshot: OperationalTradesSessionFound) => {
      applyOperationalTradesSessionSnapshot(snapshot, {
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
  const tradesSession = useOperationalPageSession({
    readSnapshot: (req) => readOperationalTradesViaBackend(req, token),
    applySnapshot: applyTradesSnapshot,
    requestKey: "trades",
    loadingMessage: t("runtimeStatusLoadingMessage"),
    unavailableMessage: t("runtimeStatusError"),
  });

  const platformTrades = state.runtime.currentTrades.filter(
    (trade) => trade.isPlatformTrade,
  );
  const externalTrades = state.runtime.currentTrades.filter(
    (trade) => !trade.isPlatformTrade,
  );
  const platformTotalPages = Math.max(
    1,
    Math.ceil(platformTrades.length / TRADES_PER_PAGE),
  );
  const externalTotalPages = Math.max(
    1,
    Math.ceil(externalTrades.length / TRADES_PER_PAGE),
  );
  const visiblePlatformTrades = paginate(
    platformTrades,
    platformPage,
    TRADES_PER_PAGE,
  );
  const visibleExternalTrades = paginate(
    externalTrades,
    externalPage,
    TRADES_PER_PAGE,
  );
  const visibleTrades = [...visiblePlatformTrades, ...visibleExternalTrades];

  useEffect(() => {
    if (platformPage > platformTotalPages) {
      setPlatformPage(platformTotalPages);
    }

    if (externalPage > externalTotalPages) {
      setExternalPage(externalTotalPages);
    }
  }, [externalPage, externalTotalPages, platformPage, platformTotalPages]);

  useEffect(() => {
    if (!visibleTrades.find((trade) => trade.id === selectedTradeId)) {
      setSelectedTradeId(visibleTrades[0]?.id ?? null);
    }
  }, [selectedTradeId, visibleTrades]);

  const selectedTrade =
    state.runtime.currentTrades.find((trade) => trade.id === selectedTradeId) ??
    null;
  const selectedTradeCanBeClosed =
    selectedTrade !== null &&
    selectedTrade.tradeStatus === "open" &&
    closingTradeId !== selectedTrade.id;

  const pendingTrade =
    state.runtime.currentTrades.find(
      (trade) => trade.id === pendingCloseTradeId,
    ) ?? null;
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

  function formatPositionSize(trade: OpenTrade) {
    const totalBalance = state.runtime.balance?.totalBalance ?? null;

    if (!totalBalance || totalBalance <= 0) {
      return formatCurrency(trade.capitalAllocated);
    }

    const sizePercent = (trade.capitalAllocated / totalBalance) * 100;
    return `${sizePercent.toFixed(1)}% · ${formatCurrency(trade.capitalAllocated)}`;
  }

  function showRuntimeToast(
    tone: "info" | "success" | "danger",
    message: string,
  ) {
    setRuntimeState({
      actionToast: {
        id: Date.now(),
        tone,
        message,
      },
    });
  }

  async function handleCloseTrade(tradeId: string) {
    const trade = state.runtime.currentTrades.find(
      (candidate) => candidate.id === tradeId,
    );
    const walletAddress = state.wallet.mainWalletPublicKey;

    if (!trade || !walletAddress) {
      return;
    }

    setClosingTradeId(tradeId);
    setRuntimeState({
      screenStatus: "loading",
      lastRuntimeMessage: null,
    });

    const commandResult = await closeTradeViaBackend({
      walletAddress,
      tradeId,
    }, token);

    if (commandResult.status === "error") {
      setRuntimeState({
        screenStatus: "ready",
      });
      showRuntimeToast("danger", commandResult.message);
      setClosingTradeId(null);
      return;
    }

    const sessionSnapshot = await tradesSession.reload();

    if (sessionSnapshot?.status === "found") {
      setRuntimeState({
        screenStatus: "ready",
      });
      showRuntimeToast("success", t("runtimeActionCloseSuccess"));
    } else {
      setRuntimeState({
        screenStatus: "error",
        lastRuntimeMessage:
          sessionSnapshot?.status === "error"
            ? sessionSnapshot.message
            : t("runtimeStatusError"),
      });
    }

    setClosingTradeId(null);
  }

  if (tradesSession.status === "loading") {
    return (
      <div className="page-stack">
        <section className="topbar">
          <div>
            <p className="page-card__eyebrow">{t("pageTradesTitle")}</p>
            <h2>{t("tradesTopbarTitle")}</h2>
            <p className="subtle">{t("tradesTopbarDescription")}</p>
          </div>
        </section>
        <div className="trade-screen-grid">
          <section className="panel">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-30" />
              <div className="sk-line sk-line--md sk-w-50" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="sk-stack" style={{ marginTop: 8 }}>
                  <div className="sk-line sk-line--sm sk-w-full" />
                  <div className="sk-line sk-line--sm sk-w-70" />
                </div>
              ))}
            </div>
          </section>
          <aside className="panel">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-30" />
              <div className="sk-line sk-line--md sk-w-60" />
              <div className="sk-line sk-line--sm sk-w-full" />
              <div className="sk-line sk-line--sm sk-w-50" />
              <div className="sk-line sk-line--sm sk-w-70" />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <ConfirmationModal
        cancelLabel={t("modalCancelAction")}
        confirmLabel={t("tradeCloseAction")}
        description={
          pendingTrade
            ? t("tradeCloseConfirmDescription").replace(
                "{symbol}",
                pendingTrade.symbol,
              )
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

      {tradesSession.status === "error" ? (
        <section className="page-card status-banner status-banner--danger">
          <strong>{t("runtimeStatusError")}</strong>
          <p>{tradesSession.message}</p>
        </section>
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

      <section className="trade-screen-grid">
        <section className="panel trade-list-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("tradesListEyebrow")}</p>
              <h3>{t("tradesListTitle")}</h3>
            </div>
            <span className="badge badge--neutral">
              {`${state.runtime.currentTrades.length} ${t("tradesTopbarCount")}`}
            </span>
          </div>

          {state.runtime.currentTrades.length > 0 ? (
            <div className="trade-origin-stack">
              <TradeOriginGroup
                currentPage={platformPage}
                emptyTitle={t("tradesGroupEmptyTitle")}
                nextLabel={t("paginationNext")}
                onCloseTrade={(tradeId) => setPendingCloseTradeId(tradeId)}
                onPageChange={setPlatformPage}
                onSelectTrade={setSelectedTradeId}
                previousLabel={t("paginationPrevious")}
                selectedTradeId={selectedTradeId}
                title={t("tradesGroupPlatformTitle")}
                description={t("tradesGroupPlatformDescription")}
                trades={visiblePlatformTrades}
                totalCount={platformTrades.length}
                totalPages={platformTotalPages}
                closingTradeId={closingTradeId}
                formatSignedCurrency={formatSignedCurrency}
                formatTradeOrigin={formatTradeOrigin}
                pageSummary={t("paginationPageOf")
                  .replace("{page}", String(platformPage))
                  .replace("{total}", String(platformTotalPages))}
              />
              <TradeOriginGroup
                currentPage={externalPage}
                emptyTitle={t("tradesGroupEmptyTitle")}
                nextLabel={t("paginationNext")}
                onCloseTrade={(tradeId) => setPendingCloseTradeId(tradeId)}
                onPageChange={setExternalPage}
                onSelectTrade={setSelectedTradeId}
                previousLabel={t("paginationPrevious")}
                selectedTradeId={selectedTradeId}
                title={t("tradesGroupExternalTitle")}
                description={t("tradesGroupExternalDescription")}
                trades={visibleExternalTrades}
                totalCount={externalTrades.length}
                totalPages={externalTotalPages}
                closingTradeId={closingTradeId}
                formatSignedCurrency={formatSignedCurrency}
                formatTradeOrigin={formatTradeOrigin}
                pageSummary={t("paginationPageOf")
                  .replace("{page}", String(externalPage))
                  .replace("{total}", String(externalTotalPages))}
              />
            </div>
          ) : (
            <div className="info-note">
              <strong>{t("tradesEmptyTitle")}</strong>
              <p>{t("tradesEmptyDescription")}</p>
            </div>
          )}
        </section>

        <aside
          className={`panel detail-panel ${selectedTrade ? "detail-panel--linked" : ""}`}
        >
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("tradesDetailEyebrow")}</p>
              <h3>
                {selectedTrade
                  ? selectedTrade.symbol
                  : t("tradesDetailEmptyTitle")}
              </h3>
            </div>
            <span
              className={`badge badge--${
                selectedTrade
                  ? selectedTrade.tradeStatus === "open"
                    ? "success"
                    : "warning"
                  : "neutral"
              }`}
            >
              {selectedTrade
                ? selectedTrade.tradeStatus === "open"
                  ? t("tradeStatusOpen")
                  : t("tradeStatusWaiting")
                : t("tradesDetailEmptyBadge")}
            </span>
          </div>

          {selectedTrade ? (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>{t("tradesDetailOrigin")}</span>
                  <strong>
                    {formatTradeOrigin(selectedTrade.isPlatformTrade)}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradesDetailDirection")}</span>
                  <strong>
                    {selectedTrade.side === "long"
                      ? t("tradeSideLong")
                      : t("tradeSideShort")}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradesDetailPositionSize")}</span>
                  <strong>{formatPositionSize(selectedTrade)}</strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradePnlLabel")}</span>
                  <strong
                    className={selectedTrade.unrealizedPnl >= 0 ? "up" : "down"}
                  >
                    {formatSignedCurrency(selectedTrade.unrealizedPnl)}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradesDetailStopLoss")}</span>
                  <strong>
                    {selectedTrade.stopLossPrice !== null
                      ? selectedTrade.stopLossPrice.toFixed(2)
                      : "-"}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>{t("tradesDetailTakeProfit")}</span>
                  <strong>
                    {selectedTrade.takeProfitPrice !== null
                      ? selectedTrade.takeProfitPrice.toFixed(2)
                      : "-"}
                  </strong>
                </div>
              </div>

              <button
                className="btn danger wide"
                disabled={!selectedTradeCanBeClosed}
                onClick={() => {
                  if (!selectedTradeCanBeClosed) {
                    return;
                  }

                  setPendingCloseTradeId(selectedTrade.id);
                }}
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

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const startIndex = (safePage - 1) * pageSize;

  return items.slice(startIndex, startIndex + pageSize);
}

function TradeOriginGroup(props: {
  currentPage: number;
  emptyTitle: string;
  nextLabel: string;
  onCloseTrade: (tradeId: string) => void;
  onPageChange: (page: number) => void;
  onSelectTrade: (tradeId: string) => void;
  previousLabel: string;
  selectedTradeId: string | null;
  title: string;
  description: string;
  trades: OpenTrade[];
  totalCount: number;
  totalPages: number;
  closingTradeId: string | null;
  formatSignedCurrency: (value: number) => string;
  formatTradeOrigin: (isPlatformTrade: boolean) => string;
  pageSummary: string;
}) {
  const { t } = useI18n();
  const {
    closingTradeId,
    currentPage,
    description,
    emptyTitle,
    formatSignedCurrency,
    formatTradeOrigin,
    nextLabel,
    onCloseTrade,
    onPageChange,
    onSelectTrade,
    pageSummary,
    previousLabel,
    selectedTradeId,
    title,
    totalCount,
    totalPages,
    trades,
  } = props;

  return (
    <section className="trade-origin-group">
      <div className="row-between align-start section-gap">
        <div>
          <p className="panel-label">{title}</p>
          <h4>{title}</h4>
          <p className="subtle">{description}</p>
        </div>
        <span className="badge badge--info">{totalCount}</span>
      </div>

      {trades.length > 0 ? (
        <>
          <div className="trade-stack">
            {trades.map((trade) => {
              const tradeCanBeClosed =
                trade.tradeStatus === "open" && closingTradeId !== trade.id;

              return (
                <article
                  key={trade.id}
                  className={`trade-card wide ${trade.tradeStatus === "open" ? "live" : ""} ${
                    selectedTradeId === trade.id ? "selected" : ""
                  }`}
                  onClick={() => onSelectTrade(trade.id)}
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
                          trade.tradeStatus === "open" ? "success" : "warning"
                        }`}
                      >
                        {trade.tradeStatus === "open"
                          ? t("tradeStatusOpen")
                          : t("tradeStatusWaiting")}
                      </span>
                    </div>
                    <p>{formatTradeOrigin(trade.isPlatformTrade)}</p>
                  </div>
                  <div>
                    <span className="trade-label">{t("tradeEntryLabel")}</span>
                    <strong>{trade.entryPrice}</strong>
                  </div>
                  <div>
                    <span className="trade-label">
                      {t("tradeCurrentLabel")}
                    </span>
                    <strong>{trade.currentPrice}</strong>
                  </div>
                  <div>
                    <span className="trade-label">{t("tradePnlLabel")}</span>
                    <strong
                      className={trade.unrealizedPnl >= 0 ? "up" : "down"}
                    >
                      {formatSignedCurrency(trade.unrealizedPnl)}
                    </strong>
                  </div>
                  <button
                    className="btn secondary small"
                    disabled={!tradeCanBeClosed}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!tradeCanBeClosed) {
                        return;
                      }
                      onCloseTrade(trade.id);
                    }}
                    type="button"
                  >
                    {t("tradeCloseAction")}
                  </button>
                </article>
              );
            })}
          </div>
          <PaginationControls
            nextLabel={nextLabel}
            onPageChange={onPageChange}
            page={currentPage}
            previousLabel={previousLabel}
            summary={pageSummary}
            totalPages={totalPages}
          />
        </>
      ) : (
        <div className="info-note">
          <strong>{emptyTitle}</strong>
          <p>{description}</p>
        </div>
      )}
    </section>
  );
}
