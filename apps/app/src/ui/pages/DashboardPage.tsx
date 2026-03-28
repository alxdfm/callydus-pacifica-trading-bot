import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPresetCatalogItemByDefinitionId } from "../../features/presets/preset-catalog";
import { toggleBotState } from "../../features/runtime/demo-runtime";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessProduct, setOnboardingState, setRuntimeState, state } = useAppState();
  const { t } = useI18n();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const botActionBlocked = !canAccessProduct;
  const activePresetItem = getPresetCatalogItemByDefinitionId(
    state.presets.activePreset?.presetDefinitionId,
    t,
  );
  const currentTrades = state.runtime.currentTrades.slice(0, 2);
  const recentClosedTrades = state.runtime.closedTrades.slice(0, 3);
  const activeAlerts = state.runtime.alerts.filter((alert) => alert.isActive).slice(0, 2);
  const closedTodayCount = state.runtime.closedTrades.length;
  const wins = state.runtime.closedTrades.filter((trade) => trade.realizedPnl >= 0).length;
  const losses = closedTodayCount - wins;

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

  const runtimeBannerTone =
    state.runtime.screenStatus === "error"
      ? "danger"
      : state.runtime.screenStatus === "loading"
        ? "warning"
        : "neutral";
  const runtimeBannerMessage =
    state.runtime.screenStatus === "error"
      ? t("runtimeStatusError")
      : state.runtime.screenStatus === "loading"
        ? t("runtimeStatusLoading")
        : state.runtime.lastRuntimeMessage;

  useEffect(() => {
    const onboardingFlashFromState =
      location.state &&
      typeof location.state === "object" &&
      "dashboardToast" in location.state &&
      location.state.dashboardToast === "onboarding_ready";
    const onboardingFlashFromStorage =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("pacifica.dashboard-flash") === "onboarding_ready";

    if (onboardingFlashFromState || onboardingFlashFromStorage) {
      setShowWelcomeModal(true);
    }

    if (
      location.state &&
      typeof location.state === "object" &&
      "dashboardToast" in location.state
    ) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  function dismissWelcomeModal() {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("pacifica.dashboard-flash");
    }

    setOnboardingState({
      showCompletionModal: false,
    });
    setShowWelcomeModal(false);
  }

  function handleWelcomeConfirm() {
    dismissWelcomeModal();
    navigate("/presets");
  }

  return (
    <div className="page-stack dashboard-page">
      <ConfirmationModal
        cancelLabel={t("modalCloseAction")}
        confirmLabel={t("dashboardWelcomeModalConfirm")}
        description={t("dashboardWelcomeModalDescription")}
        isOpen={showWelcomeModal}
        onCancel={dismissWelcomeModal}
        onConfirm={handleWelcomeConfirm}
        showBadge={false}
        title={t("dashboardWelcomeModalTitle")}
        tone="info"
      />

      <section className="topbar">
        <div>
          <p className="page-card__eyebrow">{t("pageDashboardTitle")}</p>
          <h2>{t("dashboardTopbarTitle")}</h2>
          <p className="subtle">{t("dashboardTopbarDescription")}</p>
        </div>
        <div className="topbar-actions">
          <span className="badge badge--neutral">{t("dashboardConnectionOnline")}</span>
          <span
            className={`badge badge--${
              state.runtime.botStatus === "active"
                ? "warning"
                : state.runtime.botStatus === "paused"
                  ? "neutral"
                  : "info"
            }`}
          >
            {state.runtime.botStatus === "active"
              ? t("dashboardBotActive")
              : state.runtime.botStatus === "paused"
                ? t("dashboardBotPaused")
                : t("dashboardBotInactive")}
          </span>
          <button className="btn secondary" onClick={() => navigate("/presets")} type="button">
            {t("dashboardReviewPresetAction")}
          </button>
          <button
            className="btn primary"
            disabled={botActionBlocked}
            onClick={() => setRuntimeState(toggleBotState(state.runtime))}
            type="button"
          >
            {state.runtime.botStatus === "active"
              ? t("dashboardPauseBotAction")
              : t("dashboardResumeBotAction")}
          </button>
        </div>
      </section>

      {runtimeBannerMessage ? (
        <section className={`page-card status-banner status-banner--${runtimeBannerTone}`}>
          <strong>
            {state.runtime.screenStatus === "loading"
              ? t("runtimeStatusLoading")
              : state.runtime.screenStatus === "error"
                ? t("runtimeStatusError")
                : t("runtimeStatusReady")}
          </strong>
          <p>{runtimeBannerMessage}</p>
        </section>
      ) : null}

      {state.runtime.balance ? (
        <section className="metric-grid">
          <article className="stat-panel emphasis">
            <span>{t("dashboardMetricBalance")}</span>
            <strong>{formatCurrency(state.runtime.balance.totalBalance)}</strong>
            <p>{t("dashboardMetricBalanceHint")}</p>
          </article>
          <article className="stat-panel">
            <span>{t("dashboardMetricPnl")}</span>
            <strong className={state.runtime.balance.aggregatedPnl >= 0 ? "up" : "down"}>
              {formatSignedCurrency(state.runtime.balance.aggregatedPnl)}
            </strong>
            <p>{t("dashboardMetricPnlHint")}</p>
          </article>
          <article className="stat-panel">
            <span>{t("dashboardMetricOpenTrades")}</span>
            <strong>{state.runtime.currentTrades.length}</strong>
            <p>{t("dashboardMetricOpenTradesHint")}</p>
          </article>
          <article className="stat-panel">
            <span>{t("dashboardMetricClosedToday")}</span>
            <strong>{closedTodayCount}</strong>
            <p>{`${wins} ${t("dashboardWinsLabel")} · ${losses} ${t("dashboardLossesLabel")}`}</p>
          </article>
        </section>
      ) : (
        <section className="page-card empty-state">
          <strong>{t("dashboardEmptyTitle")}</strong>
          <p>{t("dashboardEmptyDescription")}</p>
        </section>
      )}

      <section className="dashboard-grid">
        <section className="panel hero-panel-wide">
          <div>
            <p className="panel-label">{t("dashboardActivePresetEyebrow")}</p>
            <h3>{activePresetItem ? activePresetItem.definition.name : t("dashboardNoPresetTitle")}</h3>
            <p className="subtle">
              {activePresetItem ? activePresetItem.reviewSummary : t("dashboardNoPresetDescription")}
            </p>
          </div>
          <div className="row-between align-start">
            <span className={`badge badge--${activePresetItem?.riskTone ?? "neutral"}`}>
              {activePresetItem ? activePresetItem.definition.riskLabel : t("presetSidebarEmpty")}
            </span>
          </div>
          {activePresetItem && state.presets.activePreset ? (
            <>
              <div className="chip-row">
                <span className="chip">{state.presets.activePreset.editableConfig.symbol}</span>
                <span className="chip">{activePresetItem.timeframeLabel}</span>
                <span className="chip">
                  {`${t("dashboardSizeLabel")} ${state.presets.activePreset.editableConfig.positionSizeValue}%`}
                </span>
                <span className="chip">
                  {state.presets.activePreset.editableConfig.longEnabled
                    ? t("dashboardLongEnabled")
                    : t("dashboardLongDisabled")}
                </span>
                <span className="chip">
                  {state.presets.activePreset.editableConfig.shortEnabled
                    ? t("dashboardShortEnabled")
                    : t("dashboardShortDisabled")}
                </span>
              </div>
              <div className="action-row">
                <button className="btn secondary" onClick={() => navigate("/presets")} type="button">
                  {t("dashboardChangePresetAction")}
                </button>
                <button className="btn primary" onClick={() => navigate("/presets")} type="button">
                  {t("dashboardOpenPresetAction")}
                </button>
              </div>
            </>
          ) : (
            <div className="info-note">
              <strong>{t("dashboardNoPresetTitle")}</strong>
              <p>{t("dashboardNoPresetDescription")}</p>
            </div>
          )}
        </section>

        <section className="panel alert-panel">
          <div className="row-between align-start">
            <div>
              <p className="panel-label">{t("dashboardAlertsEyebrow")}</p>
              <h3>
                {activeAlerts.length > 0
                  ? `${activeAlerts.length} ${t("dashboardAlertsCountLabel")}`
                  : t("dashboardAlertsEmptyTitle")}
              </h3>
            </div>
            <span className={`badge badge--${activeAlerts.length > 0 ? "info" : "neutral"}`}>
              {activeAlerts.length > 0 ? t("dashboardAlertsInfoBadge") : t("dashboardAlertsEmptyBadge")}
            </span>
          </div>
          <p className="alert-copy">
            {activeAlerts.length > 0
              ? (activeAlerts[0]?.message ?? t("dashboardAlertsEmptyDescription"))
              : t("dashboardAlertsEmptyDescription")}
          </p>
        </section>

        <section className="panel trades-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("dashboardTradesEyebrow")}</p>
              <h3>{t("dashboardTradesTitle")}</h3>
            </div>
            <button className="btn secondary" onClick={() => navigate("/trades")} type="button">
              {t("dashboardViewAllTradesAction")}
            </button>
          </div>

          {currentTrades.length > 0 ? (
            <div className="trade-table">
              {currentTrades.map((trade) => (
                <article key={trade.id} className={`trade-card ${trade.tradeStatus === "open" ? "live" : ""}`}>
                  <div>
                    <div className="trade-head">
                      <strong>{trade.symbol}</strong>
                      <span className={`badge badge--${trade.side === "long" ? "info" : "danger"}`}>
                        {trade.side === "long" ? t("tradeSideLong") : t("tradeSideShort")}
                      </span>
                    </div>
                    <p>
                      {trade.tradeStatus === "open"
                        ? t("tradeStatusOpen")
                        : t("tradeStatusWaiting")}
                      {" · "}
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
                  <button className="btn secondary small" onClick={() => navigate("/trades")} type="button">
                    {t("tradeCloseAction")}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="info-note">
              <strong>{t("dashboardTradesEmptyTitle")}</strong>
              <p>{t("dashboardTradesEmptyDescription")}</p>
            </div>
          )}
        </section>

        <section className="panel recent-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("dashboardRecentEyebrow")}</p>
              <h3>{t("dashboardRecentTitle")}</h3>
            </div>
            <button className="btn secondary small" onClick={() => navigate("/history")} type="button">
              {t("dashboardRecentAction")}
            </button>
          </div>

          {recentClosedTrades.length > 0 ? (
            <div className="history-list">
              {recentClosedTrades.map((trade) => (
                <div key={trade.id} className="history-row">
                  <div>
                    <strong>{trade.symbol}</strong>
                    <p>{closeReasonLabel(trade.closeReason)}</p>
                  </div>
                  <strong className={trade.realizedPnl >= 0 ? "up" : "down"}>
                    {formatSignedCurrency(trade.realizedPnl)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="info-note">
              <strong>{t("dashboardRecentEmptyTitle")}</strong>
              <p>{t("dashboardRecentEmptyDescription")}</p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
