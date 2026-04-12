import { useCallback } from "react";
import type { OperationalDashboardSessionFound } from "@pacifica/contracts";
import { applyOperationalDashboardSessionSnapshot } from "../../features/account/apply-operational-page-sessions";
import { readOperationalDashboardViaBackend } from "../../features/account/backend-operational-page-sessions";
import { useOperationalPageSession } from "../../features/account/use-operational-page-session";
import { getDashboardRuntimeSyncPresentation } from "../../features/runtime/runtime-sync-presentation";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { LoadingPanel } from "../components/LoadingPanel";

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

  return (
    <div className="page-stack">
      <section className="topbar">
        <div>
          <p className="page-card__eyebrow">{t("pageOperationsTitle")}</p>
          <h2>{t("operationsTopbarTitle")}</h2>
          <p className="subtle">{t("operationsTopbarDescription")}</p>
        </div>
      </section>

      {operationsSession.status === "loading" ||
      operationsSession.status === "error" ? (
        operationsSession.status === "loading" ? (
          <LoadingPanel
            title={t("runtimeStatusLoading")}
            message={operationsSession.message}
          />
        ) : (
          <section className="page-card status-banner status-banner--danger">
            <strong>{t("runtimeStatusError")}</strong>
            <p>{operationsSession.message}</p>
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
            <div className="history-list">
              {state.runtime.alerts.map((alert) => (
                <div key={alert.id} className="history-row">
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.message}</p>
                  </div>
                  <strong>{formatTimestamp(alert.createdAt)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="info-note">
              <strong>{t("operationsAlertsEmptyTitle")}</strong>
              <p>{t("operationsAlertsEmptyDescription")}</p>
            </div>
          )}
        </section>

        <section className="panel operations-panel operations-panel--wide">
          <div>
            <p className="panel-label">{t("operationsActivityTitle")}</p>
            <h3>{t("operationsActivityTitle")}</h3>
            <p className="subtle">{t("operationsActivityDescription")}</p>
          </div>

          {state.runtime.events.length > 0 ? (
            <div className="history-list">
              {state.runtime.events.map((event) => (
                <div key={event.id} className="history-row">
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.message}</p>
                  </div>
                  <strong>{formatTimestamp(event.createdAt)}</strong>
                </div>
              ))}
            </div>
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
