import { useCallback, useRef } from "react";
import type { OperationalDashboardSessionFound } from "../../types/contracts";
import { applyOperationalDashboardSessionSnapshot } from "./apply-operational-page-sessions";
import { readOperationalDashboardViaBackend } from "./backend-operational-page-sessions";
import { useOperationalPageSession } from "./use-operational-page-session";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";

/**
 * Sessão do snapshot operacional do dashboard (trades abertos + fechados +
 * saúde do runtime + YOUR strategy). Compartilhada por Dashboard, Trades e
 * Strategies — o requestKey único deduplica os fetches entre as páginas.
 */
export function useDashboardSession() {
  const { t } = useI18n();
  const { token } = useAuth();
  const {
    setBuilderApprovalState,
    setCredentialState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state,
  } = useAppState();

  const currentPresetsRef = useRef(state.presets);
  currentPresetsRef.current = state.presets;

  const applySnapshot = useCallback(
    (snapshot: OperationalDashboardSessionFound) => {
      applyOperationalDashboardSessionSnapshot(snapshot, {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
        currentPresets: currentPresetsRef.current,
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

  const readSnapshot = useCallback(
    (req: Parameters<typeof readOperationalDashboardViaBackend>[0]) =>
      readOperationalDashboardViaBackend(req, token),
    [token],
  );

  return useOperationalPageSession({
    readSnapshot,
    applySnapshot,
    requestKey: "dashboard",
    loadingMessage: t("runtimeStatusLoadingMessage"),
    unavailableMessage: t("runtimeStatusError"),
  });
}
