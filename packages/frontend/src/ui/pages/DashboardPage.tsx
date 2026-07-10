import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { OperationalEvent, Trade } from "@pacifica/shared/contracts";
import { useAuth } from "../../features/auth/AuthContext";
import { useActionToast } from "../../features/runtime/use-action-toast";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { formatSignedUsd, formatUsd, formatWhen } from "../../shared/format";
import { activateStrategy, getEvents, getTrades, pauseStrategy } from "../../v2/client";
import { useSession } from "../../v2/session";
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
  const showToast = useActionToast();
  const { session, status: sessionStatus, reload: reloadSession } = useSession();

  const [commandBusy, setCommandBusy] = useState(false);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [dataStatus, setDataStatus] = useState<"loading" | "ready">("loading");

  const loadPageData = useCallback(async () => {
    const [tradesResponse, eventsResponse] = await Promise.all([
      getTrades(token),
      getEvents(token),
    ]);

    if (tradesResponse.status === "ok") {
      setOpenTrades(tradesResponse.openTrades);
      setClosedTrades(tradesResponse.closedTrades);
    }

    if (eventsResponse.status === "ok") {
      setEvents(eventsResponse.events);
    }

    setDataStatus("ready");
  }, [token]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const strategy = session?.strategy ?? null;
  const balanceUsd = session?.balanceUsd ?? null;
  const botStatus = strategy?.status ?? null;
  const isBotRunning = botStatus === "active";

  const capitalInUse = useMemo(
    () =>
      openTrades.reduce(
        (sum, trade) => sum + trade.entryPrice * trade.amount,
        0,
      ),
    [openTrades],
  );
  const realizedToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return closedTrades
      .filter(
        (trade) =>
          trade.closedAt !== null &&
          new Date(trade.closedAt).getTime() >= startOfDay.getTime(),
      )
      .reduce((sum, trade) => sum + (trade.realizedPnl ?? 0), 0);
  }, [closedTrades]);
  const recentClosed = useMemo(
    () =>
      [...closedTrades]
        .sort(
          (a, b) =>
            new Date(b.closedAt ?? b.openedAt).getTime() -
            new Date(a.closedAt ?? a.openedAt).getTime(),
        )
        .slice(0, 5),
    [closedTrades],
  );

  const botTone: PillTone = isBotRunning ? "ok" : botStatus === "paused" ? "warn" : "idle";
  const strategyName = strategy ? strategy.draft.name : t("dashTileStrategyNone");

  async function handlePauseResume() {
    if (commandBusy || !strategy) return;
    setCommandBusy(true);
    const result = isBotRunning
      ? await pauseStrategy(token)
      : await activateStrategy(token);
    setCommandBusy(false);
    showToast(
      result.status === "ok" ? "success" : "danger",
      result.status === "ok"
        ? result.strategy.status === "active"
          ? t("dashToastResumed")
          : t("dashToastPaused")
        : result.message,
    );
    void reloadSession();
  }

  if (sessionStatus === "loading" || dataStatus === "loading") {
    return (
      <LoadingPanel message={t("runtimeStatusLoadingMessage")} title={t("dashTitle")} />
    );
  }

  return (
    <div className="builder-page">
      <div className="builder-head">
        <h1>{t("dashTitle")}</h1>
      </div>

      <section className="builder-card">
        <h2>{t("dashHealthTitle")}</h2>
        <div className="health-strip">
          <HealthPill
            label={t("dashHealthBot")}
            tone={botTone}
            value={botStatus ?? t("dashTileStrategyNone")}
          />
          {strategy ? (
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
      </section>

      <div className="dash-tiles">
        <div className="builder-metric">
          <div className="k">{t("dashTileAvailable")}</div>
          <div className="v">{balanceUsd !== null ? formatUsd(balanceUsd) : "—"}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTileCapitalInUse")}</div>
          <div className="v">{formatUsd(capitalInUse)}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("dashTilePnlToday")}</div>
          <div className={`v ${realizedToday >= 0 ? "v--up" : "v--down"}`}>
            {formatSignedUsd(realizedToday)}
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
                      <td className={(trade.realizedPnl ?? 0) >= 0 ? "tl-pnl--up" : "tl-pnl--down"}>
                        {formatSignedUsd(trade.realizedPnl ?? 0)}
                      </td>
                      <td style={{ color: "var(--text-faint)" }}>
                        {trade.closedAt ? formatWhen(trade.closedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="builder-card">
          <h2>{t("dashEventsTitle")}</h2>
          {events.length === 0 ? (
            <p className="tl-empty">{t("dashEventsEmpty")}</p>
          ) : (
            <div className="dash-events">
              {events.slice(0, 6).map((event) => (
                <div className="dash-event" key={event.id}>
                  <span
                    className={`sev sev--${
                      event.type === "order_failed" || event.type === "error"
                        ? "critical"
                        : "info"
                    }`}
                  />
                  <time>{formatWhen(event.createdAt)}</time>
                  <p>{event.type.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
