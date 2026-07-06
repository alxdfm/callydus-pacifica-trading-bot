import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardSession } from "../../features/account/use-dashboard-session";
import {
  pauseBotViaBackend,
  resumeBotViaBackend,
} from "../../features/runtime/backend-bot-commands";
import { useAuth } from "../../features/auth/AuthContext";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { formatSignedUsd, formatUsd, formatWhen } from "../../shared/format";
import { useAppState } from "../../state/app-state";
import { LoadingPanel } from "../components/LoadingPanel";

type PillTone = "ok" | "warn" | "bad" | "idle";

function HealthPill(props: { label: string; tone: PillTone; value: string }) {
  const toneClass = props.tone === "idle" ? "" : `health-pill--${props.tone}`;
  return (
    <span className={`health-pill ${toneClass}`}>
      {props.label}: {props.value}
    </span>
  );
}

export function DashboardPage() {
  const { t } = useI18n();
  const { token } = useAuth();
  const { setRuntimeState, state } = useAppState();

  const [commandBusy, setCommandBusy] = useState(false);

  const session = useDashboardSession();

  const runtime = state.runtime;
  const balance = runtime.balance;
  const openTrades = runtime.currentTrades;
  const closedTrades = runtime.closedTrades;

  const unrealizedPnl = useMemo(
    () => openTrades.reduce((sum, trade) => sum + trade.unrealizedPnl, 0),
    [openTrades],
  );
  const realizedToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return closedTrades
      .filter((trade) => new Date(trade.closedAt).getTime() >= startOfDay.getTime())
      .reduce((sum, trade) => sum + trade.realizedPnl, 0);
  }, [closedTrades]);
  const recentClosed = useMemo(
    () =>
      [...closedTrades]
        .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime())
        .slice(0, 5),
    [closedTrades],
  );

  const botTone: PillTone =
    runtime.botStatus === "active"
      ? "ok"
      : runtime.botStatus === "syncing"
        ? "warn"
        : runtime.botStatus === "error"
          ? "bad"
          : "idle";
  const syncTone: PillTone =
    runtime.syncStatus === "healthy"
      ? "ok"
      : runtime.syncStatus === "error"
        ? "bad"
        : runtime.syncStatus === "idle"
          ? "idle"
          : "warn";
  const exchangeTone: PillTone =
    runtime.exchangeSnapshotStatus === "confirmed" ? "ok" : "warn";

  const strategyName = state.presets.activePreset
    ? state.presets.yourStrategy?.draft.name ?? t("builderStatusActive")
    : t("dashTileStrategyNone");

  const isBotRunning = runtime.botStatus === "active" || runtime.botStatus === "syncing";

  async function handlePauseResume() {
    if (!state.wallet.mainWalletPublicKey || commandBusy) return;
    setCommandBusy(true);
    const command = isBotRunning ? pauseBotViaBackend : resumeBotViaBackend;
    const result = await command({ walletAddress: state.wallet.mainWalletPublicKey }, token);
    setCommandBusy(false);
    setRuntimeState({
      actionToast: {
        id: Date.now(),
        tone: result.status === "success" ? "success" : "danger",
        message: result.message,
      },
    });
    void session.reload();
  }

  if (session.status === "loading") {
    return <LoadingPanel message={session.message ?? t("runtimeStatusLoadingMessage")} title={t("dashTitle")} />;
  }

  return (
    <div className="builder-page">
      <div className="builder-head">
        <h1>{t("dashTitle")}</h1>
      </div>

      <section className="builder-card">
        <h2>{t("dashHealthTitle")}</h2>
        <div className="health-strip">
          <HealthPill label={t("dashHealthBot")} tone={botTone} value={runtime.botStatus} />
          <HealthPill label={t("dashHealthSync")} tone={syncTone} value={runtime.syncStatus} />
          <HealthPill
            label={t("dashHealthExchange")}
            tone={exchangeTone}
            value={`${runtime.exchangeSnapshotStatus} · ${t("dashHealthLastSync")} ${
              runtime.exchangeLastSyncedAt ? formatWhen(runtime.exchangeLastSyncedAt) : t("dashHealthNever")
            }`}
          />
          {state.presets.activePreset ? (
            <button
              className="builder-btn"
              disabled={commandBusy}
              onClick={() => void handlePauseResume()}
              style={{ marginLeft: "auto" }}
              type="button"
            >
              {isBotRunning ? t("dashPause") : t("dashResume")}
            </button>
          ) : null}
        </div>
        {runtime.alerts.length > 0 ? (
          <div className="dash-events" style={{ marginTop: 14 }}>
            <h2 style={{ margin: 0 }}>{t("dashAlertsTitle")}</h2>
            {runtime.alerts.map((alert) => (
              <div className="dash-event" key={alert.id}>
                <span className={`sev sev--${alert.severity}`} />
                <time>{formatWhen(alert.createdAt)}</time>
                <p><strong>{alert.title}</strong> — {alert.message}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="dash-tiles">
        <div className="builder-metric">
          <div className="k">{t("dashTileEquity")}</div>
          <div className="v">{balance ? formatUsd(balance.totalBalance) : "—"}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTileAvailable")}</div>
          <div className="v">{balance ? formatUsd(balance.availableBalance) : "—"}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTileCapitalInUse")}</div>
          <div className="v">{balance ? formatUsd(balance.capitalInUse) : "—"}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTilePnlToday")}</div>
          <div className={`v ${realizedToday >= 0 ? "v--up" : "v--down"}`}>
            {formatSignedUsd(realizedToday)}
          </div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTileUnrealized")}</div>
          <div className={`v ${unrealizedPnl >= 0 ? "v--up" : "v--down"}`}>
            {formatSignedUsd(unrealizedPnl)}
          </div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTileOpenPositions")}</div>
          <div className="v">{openTrades.length}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTileStrategy")}</div>
          <div className="v" style={{ fontSize: 13 }}>{strategyName}</div>
        </div>
      </div>

      <div className="dash-panels">
        <section className="builder-card">
          <h2>
            {t("dashRecentTradesTitle")}
            <Link style={{ marginLeft: "auto", color: "var(--accent)", fontSize: 11 }} to="/trades">
              {t("dashRecentTradesAll")}
            </Link>
          </h2>
          {recentClosed.length === 0 ? (
            <p className="tl-empty">{t("tradesEmptyClosed")}</p>
          ) : (
            <div className="tl-table-wrap">
              <table className="tl-table">
                <tbody>
                  {recentClosed.map((trade) => (
                    <tr key={trade.id}>
                      <td>{trade.symbol}</td>
                      <td><span className={`tl-side tl-side--${trade.side}`}>{trade.side.toUpperCase()}</span></td>
                      <td className={trade.realizedPnl >= 0 ? "tl-pnl--up" : "tl-pnl--down"}>
                        {formatSignedUsd(trade.realizedPnl)}
                      </td>
                      <td style={{ color: "var(--text-faint)" }}>{formatWhen(trade.closedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="builder-card">
          <h2>{t("dashEventsTitle")}</h2>
          {runtime.events.length === 0 ? (
            <p className="tl-empty">{t("dashEventsEmpty")}</p>
          ) : (
            <div className="dash-events">
              {runtime.events.slice(0, 6).map((event) => (
                <div className="dash-event" key={event.id}>
                  <span className={`sev sev--${event.severity}`} />
                  <time>{formatWhen(event.createdAt)}</time>
                  <p>{event.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
