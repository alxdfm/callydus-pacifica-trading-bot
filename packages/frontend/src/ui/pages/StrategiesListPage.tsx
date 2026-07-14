import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { StrategyDraft, Trade } from "@pacifica/shared/contracts";
import { useAuth } from "../../features/auth/AuthContext";
import { useActionToast } from "../../features/runtime/use-action-toast";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { formatSignedUsd } from "../../shared/format";
import { activateStrategy, getTrades, pauseStrategy } from "../../v2/client";
import { useSession } from "../../v2/session";
import { LoadingPanel } from "../components/LoadingPanel";

function describeStopLoss(stopLoss: StrategyDraft["risk"]["stopLoss"]): string {
  switch (stopLoss.mode) {
    case "static":
      return `${stopLoss.value}%`;
    case "atr":
      return `ATR(${stopLoss.period})×${stopLoss.multiplier}`;
    case "volumeProfile":
      return `VA(${stopLoss.period})${stopLoss.bufferPercent ? ` +${stopLoss.bufferPercent}%` : ""}`;
  }
}

export function StrategiesListPage() {
  const { t } = useI18n();
  const { token } = useAuth();
  const showToast = useActionToast();
  const { session, status: sessionStatus, reload: reloadSession } = useSession();

  const [commandBusy, setCommandBusy] = useState(false);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);

  const loadTrades = useCallback(async () => {
    const response = await getTrades(token, 200);
    if (response.status === "ok") {
      setClosedTrades(response.closedTrades);
    }
  }, [token]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const strategy = session?.strategy ?? null;
  const isBotRunning = strategy?.status === "active";

  const platformPnl = useMemo(
    () => closedTrades.reduce((sum, trade) => sum + (trade.realizedPnl ?? 0), 0),
    [closedTrades],
  );

  async function handleActivate() {
    if (commandBusy) return;
    setCommandBusy(true);
    const result = await activateStrategy(token);
    setCommandBusy(false);

    if (result.status === "ok") {
      showToast("success", t("builderActivatedMessage"));
    } else {
      showToast("danger", result.message);
    }
    void reloadSession();
  }

  async function handlePause() {
    if (commandBusy) return;
    setCommandBusy(true);
    const result = await pauseStrategy(token);
    setCommandBusy(false);
    showToast(
      result.status === "ok" ? "success" : "danger",
      result.status === "ok" ? t("builderPausedMessage") : result.message,
    );
    void reloadSession();
  }

  if (sessionStatus === "loading") {
    return (
      <LoadingPanel
        message={t("runtimeStatusLoadingMessage")}
        title={t("strategiesTitle")}
      />
    );
  }

  return (
    <div className="builder-page">
      <div className="builder-head">
        <h1>{t("strategiesTitle")}</h1>
        <div className="builder-actions">
          <Link className="builder-btn builder-btn--primary" to="/strategies/builder">
            {strategy ? t("strategiesEdit") : t("strategiesCreate")}
          </Link>
        </div>
      </div>

      {strategy ? (
        <div className="strategy-card-grid">
          <section className="builder-card">
            <div className="builder-head" style={{ marginBottom: 0 }}>
              <h1 style={{ fontSize: 17 }}>{strategy.draft.name}</h1>
              <span
                className={`builder-chip ${
                  isBotRunning ? "builder-chip--active" : "builder-chip--paused"
                }`}
              >
                {isBotRunning
                  ? t("strategiesStatusRunning")
                  : t("strategiesStatusPaused")}
              </span>
            </div>
            <div className="strategy-card__meta">
              <span><b>{strategy.draft.symbol}</b></span>
              <span>{strategy.draft.timeframe}</span>
              <span>SL {describeStopLoss(strategy.draft.risk.stopLoss)}</span>
              {strategy.draft.risk.takeProfit ? (
                <span>TP RR {strategy.draft.risk.takeProfit.multiple}</span>
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
                  disabled={commandBusy || strategy.activationBlockers.length > 0}
                  onClick={() => void handleActivate()}
                  type="button"
                >
                  {t("strategiesActivate")}
                </button>
              )}
            </div>
            {strategy.activationBlockers.length > 0 ? (
              <div className="builder-checklist" style={{ marginTop: 12 }}>
                {strategy.activationBlockers.map((blocker) => (
                  <div className="item item--pending" key={blocker}>{blocker}</div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <section className="builder-card">
          <p className="tl-empty">{t("strategiesEmpty")}</p>
        </section>
      )}
    </div>
  );
}
