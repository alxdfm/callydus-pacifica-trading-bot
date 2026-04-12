import { useCallback, useEffect, useState } from "react";
import type { OperationalDashboardSessionFound } from "@pacifica/contracts";
import { applyOperationalDashboardSessionSnapshot } from "../../features/account/apply-operational-page-sessions";
import { readOperationalDashboardViaBackend } from "../../features/account/backend-operational-page-sessions";
import { useOperationalPageSession } from "../../features/account/use-operational-page-session";
import { getDashboardRuntimeSyncPresentation } from "../../features/runtime/runtime-sync-presentation";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { PaginationControls } from "../components/PaginationControls";

export function OperationsPage() {
  const {
    setBuilderApprovalState,
    setCredentialState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state,
  } = useAppState();
  const { t } = useI18n();
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
  const operationsSession = useOperationalPageSession({
    readSnapshot: readOperationalDashboardViaBackend,
    applySnapshot: applyDashboardSnapshot,
    requestKey: "operations",
    loadingMessage: t("runtimeStatusLoadingMessage"),
    unavailableMessage: t("runtimeStatusError"),
  });
  const runtimeSyncPresentation = getDashboardRuntimeSyncPresentation(
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

  const ALERTS_PER_PAGE = 4;
  const [alertPage, setAlertPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const alertsTotalPages = Math.max(
    1,
    Math.ceil(state.runtime.alerts.length / ALERTS_PER_PAGE),
  );
  const visibleAlerts = state.runtime.alerts.slice(
    (alertPage - 1) * ALERTS_PER_PAGE,
    alertPage * ALERTS_PER_PAGE,
  );

  const eventsTotalPages = Math.max(
    1,
    Math.ceil(state.runtime.events.length / ALERTS_PER_PAGE),
  );
  const visibleEvents = state.runtime.events.slice(
    (eventPage - 1) * ALERTS_PER_PAGE,
    eventPage * ALERTS_PER_PAGE,
  );

  useEffect(() => {
    if (alertPage > alertsTotalPages) {
      setAlertPage(alertsTotalPages);
    }
  }, [alertPage, alertsTotalPages]);

  useEffect(() => {
    if (eventPage > eventsTotalPages) {
      setEventPage(eventsTotalPages);
    }
  }, [eventPage, eventsTotalPages]);

  function formatTimestamp(value: string | null) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (operationsSession.status === "loading") {
    return (
      <div className="page-stack">
        <section className="topbar">
          <div>
            <p className="page-card__eyebrow">{t("pageOperationsTitle")}</p>
            <h2>{t("operationsTopbarTitle")}</h2>
            <p className="subtle">{t("operationsTopbarDescription")}</p>
          </div>
        </section>
        <div className="operations-grid">
          <section className="panel">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-30" />
              <div className="sk-line sk-line--md sk-w-50" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="sk-stack" style={{ marginTop: 6 }}>
                  <div className="sk-line sk-line--xs sk-w-40" />
                  <div className="sk-line sk-line--sm sk-w-60" />
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-30" />
              <div className="sk-line sk-line--md sk-w-50" />
              <div className="sk-line sk-line--sm sk-w-full" />
              <div className="sk-line sk-line--sm sk-w-70" />
            </div>
          </section>
          <section className="panel">
            <div className="sk-stack sk-stack--lg">
              <div className="sk-line sk-line--xs sk-w-25" />
              <div className="sk-line sk-line--md sk-w-40" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="sk-stack" style={{ marginTop: 6 }}>
                  <div className="sk-line sk-line--sm sk-w-full" />
                  <div className="sk-line sk-line--xs sk-w-50" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="topbar">
        <div>
          <p className="page-card__eyebrow">{t("pageOperationsTitle")}</p>
          <h2>{t("operationsTopbarTitle")}</h2>
          <p className="subtle">{t("operationsTopbarDescription")}</p>
        </div>
      </section>

      {operationsSession.status === "error" ? (
        <section className="page-card status-banner status-banner--danger">
          <strong>{t("runtimeStatusError")}</strong>
          <p>{operationsSession.message}</p>
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

      <section className="operations-grid">
        <section className="panel operations-panel">
          <div>
            <p className="panel-label">{t("operationsStatusEyebrow")}</p>
            <h3>{t("operationsStatusTitle")}</h3>
            <p className="subtle">{t("operationsStatusDescription")}</p>
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <span>{t("operationsStatusBot")}</span>
              <strong>{state.runtime.botStatus}</strong>
            </div>
            <div className="detail-item">
              <span>{t("operationsStatusSync")}</span>
              <strong>{runtimeSyncPresentation.title}</strong>
            </div>
            <div className="detail-item">
              <span>{t("operationsStatusSnapshot")}</span>
              <strong>{state.runtime.exchangeSnapshotStatus}</strong>
            </div>
            <div className="detail-item">
              <span>{t("operationsStatusLastSync")}</span>
              <strong>
                {formatTimestamp(state.runtime.exchangeLastSyncedAt)}
              </strong>
            </div>
            <div className="detail-item detail-item--wide">
              <span>{t("operationsStatusLastIssue")}</span>
              <strong>
                {state.runtime.lastRuntimeMessage ??
                  t("operationsStatusNoIssue")}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel operations-panel">
          <div>
            <p className="panel-label">{t("operationsAlertsTitle")}</p>
            <h3>{t("operationsAlertsTitle")}</h3>
            <p className="subtle">{t("operationsAlertsDescription")}</p>
          </div>

          {state.runtime.alerts.length > 0 ? (
            <>
              <div className="history-list">
                {visibleAlerts.map((alert) => (
                  <div key={alert.id} className="history-row">
                    <div>
                      <strong>{alert.title}</strong>
                      <p>{alert.message}</p>
                    </div>
                    <strong>{formatTimestamp(alert.createdAt)}</strong>
                  </div>
                ))}
              </div>
              <PaginationControls
                nextLabel={t("paginationNext")}
                onPageChange={setAlertPage}
                page={alertPage}
                previousLabel={t("paginationPrevious")}
                summary={t("paginationPageOf")
                  .replace("{page}", String(alertPage))
                  .replace("{total}", String(alertsTotalPages))}
                totalPages={alertsTotalPages}
              />
            </>
          ) : (
            <div className="info-note">
              <strong>{t("operationsAlertsEmptyTitle")}</strong>
              <p>{t("operationsAlertsEmptyDescription")}</p>
            </div>
          )}
        </section>

        <section className="panel operations-panel">
          <div>
            <p className="panel-label">{t("operationsActivityTitle")}</p>
            <h3>{t("operationsActivityTitle")}</h3>
            <p className="subtle">{t("operationsActivityDescription")}</p>
          </div>

          {state.runtime.events.length > 0 ? (
            <>
              <div className="history-list">
                {visibleEvents.map((event) => (
                  <div key={event.id} className="history-row">
                    <div>
                      <strong>{event.title}</strong>
                      <p>{event.message}</p>
                    </div>
                    <strong>{formatTimestamp(event.createdAt)}</strong>
                  </div>
                ))}
              </div>
              <PaginationControls
                nextLabel={t("paginationNext")}
                onPageChange={setEventPage}
                page={eventPage}
                previousLabel={t("paginationPrevious")}
                summary={t("paginationPageOf")
                  .replace("{page}", String(eventPage))
                  .replace("{total}", String(eventsTotalPages))}
                totalPages={eventsTotalPages}
              />
            </>
          ) : (
            <div className="info-note">
              <strong>{t("operationsActivityEmptyTitle")}</strong>
              <p>{t("operationsActivityEmptyDescription")}</p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
