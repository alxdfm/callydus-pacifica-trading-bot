import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardSession } from "../../features/account/use-dashboard-session";
import { activateYourStrategyViaBackend } from "../../features/presets/your-strategy-backend";
import { pauseBotViaBackend } from "../../features/runtime/backend-bot-commands";
import { useAuth } from "../../features/auth/AuthContext";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { formatSignedUsd } from "../../shared/format";
import { useAppState } from "../../state/app-state";
import { LoadingPanel } from "../components/LoadingPanel";

export function StrategiesListPage() {
  const { t } = useI18n();
  const { token } = useAuth();
  const { setPresetState, setRuntimeState, state } = useAppState();

  const [commandBusy, setCommandBusy] = useState(false);

  const session = useDashboardSession();

  const yourStrategy = state.presets.yourStrategy;
  const isBotRunning =
    state.runtime.botStatus === "active" || state.runtime.botStatus === "syncing";
  const isActive =
    Boolean(state.presets.activePreset) ||
    isBotRunning ||
    state.runtime.botStatus === "paused";

  const platformPnl = useMemo(
    () =>
      state.runtime.closedTrades
        .filter((trade) => trade.isPlatformTrade)
        .reduce((sum, trade) => sum + trade.realizedPnl, 0),
    [state.runtime.closedTrades],
  );

  function showToast(tone: "success" | "danger", message: string) {
    setRuntimeState({ actionToast: { id: Date.now(), tone, message } });
  }

  async function handleActivate() {
    if (!state.wallet.mainWalletPublicKey || commandBusy) return;
    setCommandBusy(true);
    const result = await activateYourStrategyViaBackend(
      { walletAddress: state.wallet.mainWalletPublicKey },
      token,
    );
    setCommandBusy(false);
    if (result.status === "success") {
      setPresetState({
        activePreset: result.activation,
      });
      setRuntimeState({
        botStatus: result.runtime.botStatus,
        syncStatus: result.runtime.syncStatus,
      });
      showToast("success", result.message);
    } else {
      showToast("danger", result.message);
    }
    void session.reload();
  }

  async function handlePause() {
    if (!state.wallet.mainWalletPublicKey || commandBusy) return;
    setCommandBusy(true);
    const result = await pauseBotViaBackend(
      { walletAddress: state.wallet.mainWalletPublicKey },
      token,
    );
    setCommandBusy(false);
    showToast(result.status === "success" ? "success" : "danger", result.message);
    void session.reload();
  }

  if (session.status === "loading") {
    return <LoadingPanel message={session.message ?? t("runtimeStatusLoadingMessage")} title={t("strategiesTitle")} />;
  }

  return (
    <div className="builder-page">
      <div className="builder-head">
        <h1>{t("strategiesTitle")}</h1>
        <div className="builder-actions">
          <Link className="builder-btn builder-btn--primary" to="/strategies/builder">
            {yourStrategy ? t("strategiesEdit") : t("strategiesCreate")}
          </Link>
        </div>
      </div>

      {yourStrategy ? (
        <div className="strategy-card-grid">
          <section className="builder-card">
            <div className="builder-head" style={{ marginBottom: 0 }}>
              <h1 style={{ fontSize: 17 }}>{yourStrategy.draft.name}</h1>
              <span
                className={`builder-chip ${
                  isActive && isBotRunning
                    ? "builder-chip--active"
                    : isActive
                      ? "builder-chip--paused"
                      : ""
                }`}
              >
                {isActive && isBotRunning
                  ? t("strategiesStatusRunning")
                  : isActive
                    ? t("strategiesStatusPaused")
                    : t("builderStatusDraft")}
              </span>
            </div>
            <div className="strategy-card__meta">
              <span><b>{yourStrategy.draft.symbol}</b></span>
              <span>{yourStrategy.draft.timeframe}</span>
              <span>
                SL{" "}
                {yourStrategy.draft.risk.stopLoss.mode === "static"
                  ? `${yourStrategy.draft.risk.stopLoss.value}%`
                  : `ATR(${yourStrategy.draft.risk.stopLoss.period})×${yourStrategy.draft.risk.stopLoss.multiplier}`}
              </span>
              {yourStrategy.draft.risk.takeProfit ? (
                <span>TP RR {yourStrategy.draft.risk.takeProfit.multiple}</span>
              ) : null}
              <span>
                {t("strategiesPnlLabel")}{" "}
                <b className={platformPnl >= 0 ? "tl-pnl--up" : "tl-pnl--down"}>
                  {formatSignedUsd(platformPnl)}
                </b>
              </span>
            </div>
            <div className="strategy-card__actions">
              <Link className="builder-btn" to="/strategies/builder">
                {t("strategiesEdit")}
              </Link>
              {isBotRunning ? (
                <button
                  className="builder-btn"
                  disabled={commandBusy}
                  onClick={() => void handlePause()}
                  type="button"
                >
                  {t("strategiesPause")}
                </button>
              ) : (
                <button
                  className="builder-btn builder-btn--primary"
                  disabled={commandBusy || yourStrategy.activationBlockers.length > 0}
                  onClick={() => void handleActivate()}
                  type="button"
                >
                  {t("strategiesActivate")}
                </button>
              )}
            </div>
            {yourStrategy.activationBlockers.length > 0 ? (
              <div className="builder-checklist" style={{ marginTop: 12 }}>
                {yourStrategy.activationBlockers.map((blocker) => (
                  <div className="item item--pending" key={blocker}>{blocker}</div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <section className="builder-card">
          <p className="tl-empty">{t("strategiesEmpty")}</p>
          <Link className="builder-btn builder-btn--primary" to="/strategies/builder">
            {t("strategiesCreate")}
          </Link>
        </section>
      )}
    </div>
  );
}
