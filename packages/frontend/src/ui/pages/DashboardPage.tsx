import { useCallback, useEffect, useState } from "react";
import type {
  OperationalDashboardSessionFound,
  PresetIndicatorConfig,
  PresetTriggerRule,
} from "@pacifica/contracts";
import { useLocation, useNavigate } from "react-router-dom";
import { applyOperationalDashboardSessionSnapshot } from "../../features/account/apply-operational-page-sessions";
import { readOperationalDashboardViaBackend } from "../../features/account/backend-operational-page-sessions";
import { useOperationalPageSession } from "../../features/account/use-operational-page-session";
import { getBotStatusPresentation } from "../../features/runtime/bot-status-presentation";
import { getDashboardRuntimeSyncPresentation } from "../../features/runtime/runtime-sync-presentation";
import {
  pauseBotViaBackend,
  resumeBotViaBackend,
} from "../../features/runtime/backend-bot-commands";
import { useAuth } from "../../features/auth/AuthContext";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { ConfirmationModal } from "../components/ConfirmationModal";

function describeIndicator(key: string, indicator: PresetIndicatorConfig) {
  switch (indicator.type) {
    case "volume":
      return `${key}: Volume baseline`;
    case "ema":
      return indicator.source === "volume"
        ? `${key}: EMA ${indicator.period} on volume`
        : `${key}: EMA ${indicator.period}`;
    case "sma":
      return indicator.source === "volume"
        ? `${key}: SMA ${indicator.period} on volume`
        : `${key}: SMA ${indicator.period} on price`;
    case "rsi":
      return `${key}: RSI ${indicator.period}`;
    case "atr":
      return `${key}: ATR ${indicator.period}`;
  }
}

function describeRule(rule: PresetTriggerRule) {
  return `${rule.indicator} ${rule.operator} ${rule.ref ?? rule.value}`;
}

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    canAccessProduct,
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state,
  } = useAppState();
  const { t } = useI18n();
  const { token } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const botStatusPresentation = getBotStatusPresentation(
    state.runtime.botStatus,
    t,
  );
  const resumeActionRequiresPreset =
    botStatusPresentation.nextAction === "resume" &&
    !state.presets.activePreset;
  const botActionBlocked = !canAccessProduct || resumeActionRequiresPreset;
  const botActionBlockedMessage = resumeActionRequiresPreset
    ? t("dashboardResumeRequiresPresetTooltip")
    : undefined;
  const currentTrades = state.runtime.currentTrades.slice(0, 3);
  const recentClosedTrades = state.runtime.closedTrades.slice(0, 4);
  const closedTradesCount = state.runtime.closedTrades.length;
  const wins = state.runtime.closedTrades.filter(
    (trade) => trade.realizedPnl >= 0,
  ).length;
  const losses = closedTradesCount - wins;
  const runtimeSyncPresentation = getDashboardRuntimeSyncPresentation(
    state.runtime.syncStatus,
    state.runtime.exchangeSnapshotStatus,
    state.runtime.exchangeSnapshotMessage,
    state.runtime.exchangeLastSyncedAt,
    state.runtime.lastRuntimeMessage,
    t,
  );
  const activePresetEyebrow = !state.presets.activePreset
    ? t("dashboardNoPresetTitle")
    : state.runtime.botStatus === "active"
      ? t("dashboardActivePresetEyebrow")
      : state.runtime.botStatus === "paused"
        ? t("dashboardPausedPresetEyebrow")
        : state.runtime.botStatus === "syncing"
          ? t("dashboardSyncingPresetEyebrow")
          : state.runtime.botStatus === "inactive"
            ? t("dashboardInactivePresetEyebrow")
            : t("dashboardErrorPresetEyebrow");

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

  function tradeOriginLabel(isPlatformTrade: boolean) {
    return isPlatformTrade
      ? t("tradeOriginPlatform")
      : t("tradeOriginExternal");
  }

  const shouldShowRuntimeErrorBanner =
    state.runtime.screenStatus === "error" &&
    Boolean(state.runtime.lastRuntimeMessage);
  const shouldShowOperationalBanner =
    !shouldShowRuntimeErrorBanner &&
    runtimeSyncPresentation.show &&
    runtimeSyncPresentation.tone !== "neutral";

  const applyDashboardSnapshot = useCallback(
    (snapshot: OperationalDashboardSessionFound) => {
      applyOperationalDashboardSessionSnapshot(snapshot, {
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
  const dashboardSession = useOperationalPageSession({
    readSnapshot: (req) => readOperationalDashboardViaBackend(req, token),
    applySnapshot: applyDashboardSnapshot,
    requestKey: "dashboard",
    loadingMessage: t("runtimeStatusLoadingMessage"),
    unavailableMessage: t("runtimeStatusError"),
  });

  useEffect(() => {
    const onboardingFlashFromState =
      location.state &&
      typeof location.state === "object" &&
      "dashboardToast" in location.state &&
      location.state.dashboardToast === "onboarding_ready";
    const onboardingFlashFromStorage =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("pacifica.dashboard-flash") ===
        "onboarding_ready";

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
    navigate("/strategies");
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

  async function handleToggleBot() {
    const walletAddress = state.wallet.mainWalletPublicKey;
    const isEnteringOperationalState =
      botStatusPresentation.nextAction !== "pause";
    const nextBotStatus = isEnteringOperationalState ? "active" : "paused";
    const nextSyncStatus = isEnteringOperationalState ? "syncing" : "idle";

    if (!walletAddress) {
      return;
    }

    setRuntimeState({
      screenStatus: "loading",
      lastRuntimeMessage: null,
    });

    const commandResult = isEnteringOperationalState
      ? await resumeBotViaBackend({ walletAddress }, token)
      : await pauseBotViaBackend({ walletAddress }, token);

    if (commandResult.status === "error") {
      setRuntimeState({
        screenStatus: "ready",
      });
      showRuntimeToast("danger", commandResult.message);
      return;
    }

    setRuntimeState({
      botStatus: nextBotStatus,
      syncStatus: nextSyncStatus,
      screenStatus: "ready",
    });

    const sessionSnapshot = await dashboardSession.reload();

    if (sessionSnapshot?.status === "found") {
      setRuntimeState({
        screenStatus: "ready",
      });
      showRuntimeToast("success", commandResult.message);
      return;
    }

    setRuntimeState({
      screenStatus: "error",
      lastRuntimeMessage:
        sessionSnapshot?.status === "error"
          ? sessionSnapshot.message
          : t("runtimeStatusError"),
    });
  }

  if (dashboardSession.status === "loading") {
    return (
      <div className="page-stack dashboard-page">
        <section className="topbar">
          <div>
            <p className="page-card__eyebrow">{t("pageDashboardTitle")}</p>
            <h2>{t("dashboardTopbarTitle")}</h2>
            <p className="subtle">{t("dashboardTopbarDescription")}</p>
          </div>
        </section>
        <div className="metric-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <article key={i} className="stat-panel">
              <div className="sk-stack">
                <div className="sk-line sk-line--xs sk-w-40" />
                <div className="sk-line sk-line--xl sk-w-60" />
                <div className="sk-line sk-line--xs sk-w-50" />
              </div>
            </article>
          ))}
        </div>
        <div className="dashboard-grid">
          <section className="panel hero-panel-wide">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-30" />
              <div className="sk-line sk-line--md sk-w-50" />
              <div className="sk-line sk-line--sm sk-w-full" />
              <div className="sk-line sk-line--sm sk-w-70" />
            </div>
          </section>
          <section className="panel trades-panel">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-30" />
              <div className="sk-line sk-line--md sk-w-50" />
              <div className="sk-line sk-line--sm sk-w-full" />
              <div className="sk-line sk-line--sm sk-w-70" />
              <div className="sk-line sk-line--sm sk-w-60" />
            </div>
          </section>
          <section className="panel recent-panel">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-30" />
              <div className="sk-line sk-line--md sk-w-50" />
              <div className="sk-line sk-line--sm sk-w-full" />
              <div className="sk-line sk-line--sm sk-w-70" />
              <div className="sk-line sk-line--sm sk-w-60" />
            </div>
          </section>
        </div>
      </div>
    );
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
          <button
            className="btn secondary"
            onClick={() => navigate("/strategies")}
            type="button"
          >
            {t("dashboardReviewPresetAction")}
          </button>
          <button
            className="btn secondary"
            onClick={() => navigate("/operations")}
            type="button"
          >
            {t("dashboardOperationsAction")}
          </button>
          <span
            className={
              botActionBlockedMessage ? "disabled-tooltip-trigger" : undefined
            }
            data-tooltip={botActionBlockedMessage}
          >
            <button
              className="btn primary"
              disabled={botActionBlocked}
              onClick={() => void handleToggleBot()}
              type="button"
            >
              {botStatusPresentation.actionLabel}
            </button>
          </span>
        </div>
      </section>

      {dashboardSession.status === "error" ? (
        <section className="page-card status-banner status-banner--danger">
          <strong>{t("runtimeStatusError")}</strong>
          <p>{dashboardSession.message}</p>
        </section>
      ) : null}

      {shouldShowRuntimeErrorBanner ? (
        <section className="page-card status-banner status-banner--danger">
          <strong>{t("runtimeStatusError")}</strong>
          {state.runtime.lastRuntimeMessage ? (
            <p>{state.runtime.lastRuntimeMessage}</p>
          ) : null}
        </section>
      ) : null}

      {shouldShowOperationalBanner ? (
        <section
          className={`page-card status-banner status-banner--${runtimeSyncPresentation.tone}`}
        >
          <strong>{runtimeSyncPresentation.title}</strong>
          <p>{runtimeSyncPresentation.message}</p>
        </section>
      ) : null}

      {state.runtime.balance ? (
        <section className="metric-grid">
          <article className="stat-panel emphasis">
            <span>{t("dashboardMetricBalance")}</span>
            <strong>
              {formatCurrency(state.runtime.balance.totalBalance)}
            </strong>
            <p>{t("dashboardMetricBalanceHint")}</p>
          </article>
          <article className="stat-panel">
            <span>{t("dashboardMetricPnl")}</span>
            <strong
              className={
                state.runtime.balance.aggregatedPnl >= 0 ? "up" : "down"
              }
            >
              {formatSignedCurrency(state.runtime.balance.aggregatedPnl)}
            </strong>
            <p>{t("dashboardMetricPnlHint")}</p>
          </article>
          <article className="stat-panel">
            <span>{t("dashboardMetricExposure")}</span>
            <strong>
              {formatCurrency(state.runtime.balance.capitalInUse)}
            </strong>
            <p>{t("dashboardMetricExposureHint")}</p>
          </article>
          <article className="stat-panel">
            <span>{t("dashboardMetricOpenTrades")}</span>
            <strong>{state.runtime.currentTrades.length}</strong>
            <p>{t("dashboardMetricOpenTradesHint")}</p>
          </article>
          <article className="stat-panel">
            <span>{t("dashboardMetricClosedTrades")}</span>
            <strong>{closedTradesCount}</strong>
            <p>
              {closedTradesCount > 0
                ? `${wins} ${t("dashboardWinsLabel")} · ${losses} ${t("dashboardLossesLabel")}`
                : t("dashboardMetricClosedTradesHint")}
            </p>
          </article>
        </section>
      ) : (
        <section className="page-card empty-state">
          <strong>{t("dashboardEmptyTitle")}</strong>
          <p>{t("dashboardEmptyDescription")}</p>
        </section>
      )}

      <section className="dashboard-grid">
        <section className="panel trades-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("dashboardTradesEyebrow")}</p>
              <h3>{t("dashboardTradesTitle")}</h3>
            </div>
            <button
              className="btn secondary"
              onClick={() => navigate("/trades")}
              type="button"
            >
              {t("dashboardViewAllTradesAction")}
            </button>
          </div>

          {currentTrades.length > 0 ? (
            <div className="trade-table">
              {currentTrades.map((trade) => (
                <article
                  key={trade.id}
                  className={`trade-card ${trade.tradeStatus === "open" ? "live" : ""} dashboard-trade-card`}
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
                    </div>
                    <p>
                      {trade.tradeStatus === "open"
                        ? t("tradeStatusOpen")
                        : t("tradeStatusWaiting")}
                      {" · "}
                      {tradeOriginLabel(trade.isPlatformTrade)}
                    </p>
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
                    onClick={() => navigate("/trades")}
                    type="button"
                  >
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

        <section className="panel hero-panel-wide">
          <div className="row-between align-start">
            <div>
              <p className="panel-label">{activePresetEyebrow}</p>
              <h3>
                {state.presets.activePreset
                  ? "YOUR Strategy"
                  : t("dashboardNoPresetTitle")}
              </h3>
              <p className="subtle">
                {state.presets.activePreset
                  ? t("yourStrategyReviewSummary")
                  : t("dashboardNoPresetDescription")}
              </p>
            </div>
            {state.presets.activePreset && state.presets.yourStrategy ? (
              <div className="strategy-info-trigger">
                <span className="strategy-info-btn">i</span>
                <div className="strategy-info-popover">
                  <p className="strategy-info-popover__title">
                    {t("yourStrategySummaryEyebrow")}
                  </p>
                  <div className="strategy-info-popover__section">
                    <strong>{t("yourStrategySummaryIndicatorsTitle")}</strong>
                    <ul className="summary-list">
                      {Object.entries(
                        state.presets.yourStrategy.draft.indicators,
                      ).map(([key, indicator]) => (
                        <li key={key}>{describeIndicator(key, indicator)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="strategy-info-popover__section">
                    <strong>{t("yourStrategySummaryLongTitle")}</strong>
                    <ul className="summary-list">
                      {state.presets.yourStrategy.draft.entry.long.trigger.rules.map(
                        (rule, i) => (
                          <li key={i}>{describeRule(rule)}</li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div className="strategy-info-popover__section">
                    <strong>{t("yourStrategySummaryShortTitle")}</strong>
                    <ul className="summary-list">
                      {state.presets.yourStrategy.draft.entry.short.trigger.rules.map(
                        (rule, i) => (
                          <li key={i}>{describeRule(rule)}</li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div className="strategy-info-popover__section">
                    <strong>{t("yourStrategySummaryRiskTitle")}</strong>
                    <ul className="summary-list">
                      <li>
                        {state.presets.yourStrategy.draft.risk.stopLoss.mode ===
                        "static"
                          ? t("yourStrategyRiskStepStaticSummary").replace(
                              "{value}",
                              String(
                                state.presets.yourStrategy.draft.risk.stopLoss
                                  .value,
                              ),
                            )
                          : t("yourStrategyRiskStepAtrSummary")
                              .replace(
                                "{period}",
                                String(
                                  state.presets.yourStrategy.draft.risk.stopLoss
                                    .period,
                                ),
                              )
                              .replace(
                                "{multiplier}",
                                String(
                                  state.presets.yourStrategy.draft.risk.stopLoss
                                    .multiplier,
                                ),
                              )}
                      </li>
                      <li>{`${t("presetReviewPositionSizeLabel")}: ${state.presets.yourStrategy.draft.positionSizeValue}%`}</li>
                      <li>
                        {state.presets.yourStrategy.draft.risk.takeProfit
                          ? t("yourStrategyTakeProfitSummary").replace(
                              "{multiple}",
                              String(
                                state.presets.yourStrategy.draft.risk.takeProfit
                                  .multiple,
                              ),
                            )
                          : t("yourStrategyTakeProfitSummaryOff")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="row-between align-start">
            <span
              className={`badge badge--${state.presets.activePreset ? "info" : "neutral"}`}
            >
              {state.presets.activePreset
                ? t("yourStrategyRiskLabel")
                : t("presetSidebarEmpty")}
            </span>
          </div>
          {state.presets.activePreset ? (
            <>
              <div className="chip-row">
                <span className="chip">
                  {state.presets.activePreset.editableConfig.symbol}
                </span>
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
                <button
                  className="btn secondary"
                  onClick={() => navigate("/strategies")}
                  type="button"
                >
                  {t("dashboardChangePresetAction")}
                </button>
                <button
                  className="btn primary"
                  onClick={() => navigate("/strategies")}
                  type="button"
                >
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

        <section className="panel recent-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("dashboardRecentEyebrow")}</p>
              <h3>{t("dashboardRecentTitle")}</h3>
            </div>
            <button
              className="btn secondary small"
              onClick={() => navigate("/history")}
              type="button"
            >
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
