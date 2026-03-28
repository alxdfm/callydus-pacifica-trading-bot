import {
  balanceSnapshotSchema,
  botStatusSchema,
  builderApprovalStatusSchema,
  credentialValidationStatusSchema,
  operationalAlertSchema,
  operationalVerificationStatusSchema,
  onboardingStatusSchema,
  openTradeSchema,
  presetActivationSchema,
  presetEditableConfigSchema,
  syncStatusSchema,
  walletSessionStatusSchema,
  closedTradeSchema,
  type BalanceSnapshot,
  type BotStatus,
  type BuilderApprovalStatus,
  type CredentialValidationStatus,
  type OnboardingStatus,
  type OperationalAlert,
  type OperationalVerificationStatus,
  type PacificaOperationalVerificationErrorCode,
  type PacificaValidationErrorCode,
  type OpenTrade,
  type PresetActivation,
  type PresetEditableConfig,
  type SyncStatus,
  type WalletSession,
  type ClosedTrade,
} from "@pacifica/contracts";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createEmptyRuntimeState, type RuntimeState } from "../features/runtime/demo-runtime";
import { defaultLocale, type AppLocale } from "../shared/i18n/messages";

type CredentialState = {
  agentWalletPublicKey: string | null;
  agentWalletPrivateKey: string | null;
  credentialAlias: string | null;
  credentialId: string | null;
  keyFingerprint: string | null;
  validationStatus: CredentialValidationStatus;
  lastValidatedAt: string | null;
  lastErrorCode: PacificaValidationErrorCode | null;
  lastValidationMessage: string | null;
  retryable: boolean;
};

type BuilderApprovalState = {
  approvalStatus: BuilderApprovalStatus;
  builderCode: string | null;
  approvedAt: string | null;
  lastErrorCode: string | null;
  lastMessage: string | null;
  retryable: boolean;
};

type OperationalVerificationState = {
  status: OperationalVerificationStatus;
  lastVerifiedAt: string | null;
  lastErrorCode: PacificaOperationalVerificationErrorCode | null;
  lastMessage: string | null;
  retryable: boolean;
  probeSymbol: string | null;
  probeClientOrderId: string | null;
};

export type AppSessionState = {
  locale: AppLocale;
  wallet: WalletSession;
  builderApproval: BuilderApprovalState;
  credentials: CredentialState;
  operational: OperationalVerificationState;
  presets: {
    activePreset: PresetActivation | null;
    selectedPresetDefinitionId: string | null;
    draftEditableConfig: PresetEditableConfig | null;
    activationStatus: "idle" | "loading" | "success" | "error";
    activationMessage: string | null;
  };
  onboarding: {
    status: OnboardingStatus;
    accountReady: boolean;
    accountLookupStatus:
      | "idle"
      | "checking"
      | "new_account"
      | "existing_account"
      | "error";
    discoveredWalletAddress: string | null;
    showCompletionModal: boolean;
  };
  runtime: RuntimeState;
};

type AppStateContextValue = {
  state: AppSessionState;
  canAccessProduct: boolean;
  setLocale: (locale: AppLocale) => void;
  setWalletSession: (nextWallet: Partial<WalletSession>) => void;
  setBuilderApprovalState: (nextBuilderApproval: Partial<BuilderApprovalState>) => void;
  setCredentialState: (nextCredentials: Partial<CredentialState>) => void;
  setOperationalState: (
    nextOperational: Partial<OperationalVerificationState>,
  ) => void;
  setPresetState: (nextPresets: Partial<AppSessionState["presets"]>) => void;
  setRuntimeState: (nextRuntime: Partial<RuntimeState>) => void;
  setOnboardingState: (nextOnboarding: Partial<AppSessionState["onboarding"]>) => void;
  resetOnboardingState: () => void;
};

const storageKey = "pacifica.app-state";
const AppStateContext = createContext<AppStateContextValue | null>(null);

export function createInitialAppSessionState(): AppSessionState {
  return {
    locale: defaultLocale,
    wallet: {
      provider: null,
      mainWalletPublicKey: null,
      sessionStatus: "disconnected",
      lastConnectedAt: null,
      errorCode: null,
    },
    builderApproval: {
      approvalStatus: "pending",
      builderCode: null,
      approvedAt: null,
      lastErrorCode: null,
      lastMessage: null,
      retryable: false,
    },
    credentials: {
      agentWalletPublicKey: null,
      agentWalletPrivateKey: null,
      credentialAlias: null,
      credentialId: null,
      keyFingerprint: null,
      validationStatus: "pending",
      lastValidatedAt: null,
      lastErrorCode: null,
      lastValidationMessage: null,
      retryable: false,
    },
    operational: {
      status: "pending",
      lastVerifiedAt: null,
      lastErrorCode: null,
      lastMessage: null,
      retryable: false,
      probeSymbol: null,
      probeClientOrderId: null,
    },
    presets: {
      activePreset: null,
      selectedPresetDefinitionId: null,
      draftEditableConfig: null,
      activationStatus: "idle",
      activationMessage: null,
    },
    onboarding: {
      status: "wallet_pending",
      accountReady: false,
      accountLookupStatus: "idle",
      discoveredWalletAddress: null,
      showCompletionModal: false,
    },
    runtime: createEmptyRuntimeState(),
  };
}

function parseStoredState(rawValue: string | null): AppSessionState {
  if (!rawValue) {
    return createInitialAppSessionState();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AppSessionState>;
    const baseState = createInitialAppSessionState();
    const nextState: AppSessionState = {
      ...baseState,
      ...parsed,
      wallet: {
        ...baseState.wallet,
        ...parsed.wallet,
        sessionStatus: walletSessionStatus(parsed.wallet?.sessionStatus),
      },
      builderApproval: {
        ...baseState.builderApproval,
        ...parsed.builderApproval,
        approvalStatus: builderApprovalStatus(parsed.builderApproval?.approvalStatus),
      },
      credentials: {
        ...baseState.credentials,
        ...parsed.credentials,
        agentWalletPrivateKey: null,
        validationStatus: credentialValidationStatus(parsed.credentials?.validationStatus),
      },
      operational: {
        ...baseState.operational,
        ...parsed.operational,
        status: operationalVerificationStatus(parsed.operational?.status),
      },
      presets: {
        ...baseState.presets,
        ...parsed.presets,
        activePreset: presetActivationValue(parsed.presets?.activePreset),
        draftEditableConfig: presetEditableConfigValue(parsed.presets?.draftEditableConfig),
        activationStatus: presetActivationUiStatus(parsed.presets?.activationStatus),
      },
      runtime: {
        ...baseState.runtime,
        ...parsed.runtime,
        balance: balanceSnapshotValue(parsed.runtime?.balance),
        botStatus: botStatusValue(parsed.runtime?.botStatus),
        syncStatus: syncStatusValue(parsed.runtime?.syncStatus),
        currentTrades: openTradesValue(parsed.runtime?.currentTrades),
        closedTrades: closedTradesValue(parsed.runtime?.closedTrades),
        alerts: operationalAlertsValue(parsed.runtime?.alerts),
        screenStatus: runtimeScreenStatus(parsed.runtime?.screenStatus),
      },
      onboarding: {
        ...baseState.onboarding,
        ...parsed.onboarding,
        status: onboardingStatus(parsed.onboarding?.status),
        accountLookupStatus: onboardingLookupStatus(
          parsed.onboarding?.accountLookupStatus,
        ),
      },
    };

    return nextState;
  } catch {
    return createInitialAppSessionState();
  }
}

function walletSessionStatus(value: unknown): WalletSession["sessionStatus"] {
  const result = walletSessionStatusSchema.safeParse(value);
  return result.success ? result.data : "disconnected";
}

function credentialValidationStatus(value: unknown): CredentialValidationStatus {
  const result = credentialValidationStatusSchema.safeParse(value);
  return result.success ? result.data : "pending";
}

function builderApprovalStatus(value: unknown): BuilderApprovalStatus {
  const result = builderApprovalStatusSchema.safeParse(value);
  return result.success ? result.data : "pending";
}

function onboardingStatus(value: unknown): OnboardingStatus {
  const result = onboardingStatusSchema.safeParse(value);
  return result.success ? result.data : "wallet_pending";
}

function operationalVerificationStatus(
  value: unknown,
): OperationalVerificationStatus {
  const result = operationalVerificationStatusSchema.safeParse(value);
  return result.success ? result.data : "pending";
}

function onboardingLookupStatus(
  value: unknown,
): AppSessionState["onboarding"]["accountLookupStatus"] {
  return value === "checking" ||
    value === "new_account" ||
    value === "existing_account" ||
    value === "error"
    ? value
    : "idle";
}

function presetActivationValue(value: unknown): PresetActivation | null {
  if (!value) {
    return null;
  }

  const result = presetActivationSchema.safeParse(value);
  return result.success ? result.data : null;
}

function presetEditableConfigValue(value: unknown): PresetEditableConfig | null {
  if (!value) {
    return null;
  }

  const result = presetEditableConfigSchema.safeParse(value);
  return result.success ? result.data : null;
}

function presetActivationUiStatus(value: unknown): AppSessionState["presets"]["activationStatus"] {
  return value === "loading" || value === "success" || value === "error" ? value : "idle";
}

function balanceSnapshotValue(value: unknown): BalanceSnapshot | null {
  if (!value) {
    return null;
  }

  const result = balanceSnapshotSchema.safeParse(value);
  return result.success ? result.data : null;
}

function botStatusValue(value: unknown): BotStatus {
  const result = botStatusSchema.safeParse(value);
  return result.success ? result.data : "inactive";
}

function syncStatusValue(value: unknown): SyncStatus {
  const result = syncStatusSchema.safeParse(value);
  return result.success ? result.data : "idle";
}

function openTradesValue(value: unknown): OpenTrade[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const result = openTradeSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

function closedTradesValue(value: unknown): ClosedTrade[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const result = closedTradeSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

function operationalAlertsValue(value: unknown): OperationalAlert[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const result = operationalAlertSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

function runtimeScreenStatus(value: unknown): RuntimeState["screenStatus"] {
  return value === "loading" || value === "ready" || value === "error" ? value : "idle";
}

function deriveCanAccessProduct(state: AppSessionState) {
  return (
    state.wallet.sessionStatus === "connected" &&
    state.builderApproval.approvalStatus === "approved" &&
    state.credentials.validationStatus === "valid" &&
    state.operational.status === "verified" &&
    state.onboarding.status === "ready" &&
    state.onboarding.accountReady
  );
}

function sanitizeStateForPersistence(state: AppSessionState): AppSessionState {
  return {
    ...state,
    credentials: {
      ...state.credentials,
      agentWalletPrivateKey: null,
    },
  };
}

function areObjectsShallowEqual<T extends Record<string, unknown>>(left: T, right: T) {
  const leftKeys = Object.keys(left) as Array<keyof T>;
  const rightKeys = Object.keys(right) as Array<keyof T>;

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppSessionState>(() => {
    if (typeof window === "undefined") {
      return createInitialAppSessionState();
    }

    return parseStoredState(window.localStorage.getItem(storageKey));
  });

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(sanitizeStateForPersistence(state)),
    );
  }, [state]);

  const setLocale = useCallback((locale: AppLocale) => {
    setState((currentState) => {
      if (currentState.locale === locale) {
        return currentState;
      }

      return {
        ...currentState,
        locale,
      };
    });
  }, []);

  const setWalletSession = useCallback((nextWallet: Partial<WalletSession>) => {
    setState((currentState) => {
      const wallet = {
        ...currentState.wallet,
        ...nextWallet,
      };

      if (areObjectsShallowEqual(currentState.wallet, wallet)) {
        return currentState;
      }

      return {
        ...currentState,
        wallet,
      };
    });
  }, []);

  const setCredentialState = useCallback((nextCredentials: Partial<CredentialState>) => {
    setState((currentState) => {
      const credentials = {
        ...currentState.credentials,
        ...nextCredentials,
      };

      if (areObjectsShallowEqual(currentState.credentials, credentials)) {
        return currentState;
      }

      return {
        ...currentState,
        credentials,
      };
    });
  }, []);

  const setBuilderApprovalState = useCallback((nextBuilderApproval: Partial<BuilderApprovalState>) => {
    setState((currentState) => {
      const builderApproval = {
        ...currentState.builderApproval,
        ...nextBuilderApproval,
      };

      if (areObjectsShallowEqual(currentState.builderApproval, builderApproval)) {
        return currentState;
      }

      return {
        ...currentState,
        builderApproval,
      };
    });
  }, []);

  const setOperationalState = useCallback(
    (nextOperational: Partial<OperationalVerificationState>) => {
      setState((currentState) => {
        const operational = {
          ...currentState.operational,
          ...nextOperational,
        };

        if (areObjectsShallowEqual(currentState.operational, operational)) {
          return currentState;
        }

        return {
          ...currentState,
          operational,
        };
      });
    },
    [],
  );

  const setPresetState = useCallback((nextPresets: Partial<AppSessionState["presets"]>) => {
    setState((currentState) => {
      const presets = {
        ...currentState.presets,
        ...nextPresets,
      };

      if (areObjectsShallowEqual(currentState.presets, presets)) {
        return currentState;
      }

      return {
        ...currentState,
        presets,
      };
    });
  }, []);

  const setRuntimeState = useCallback((nextRuntime: Partial<RuntimeState>) => {
    setState((currentState) => {
      const runtime = {
        ...currentState.runtime,
        ...nextRuntime,
      };

      if (areObjectsShallowEqual(currentState.runtime, runtime)) {
        return currentState;
      }

      return {
        ...currentState,
        runtime,
      };
    });
  }, []);

  const setOnboardingState = useCallback(
    (nextOnboarding: Partial<AppSessionState["onboarding"]>) => {
      setState((currentState) => {
        const onboarding = {
          ...currentState.onboarding,
          ...nextOnboarding,
        };

        if (areObjectsShallowEqual(currentState.onboarding, onboarding)) {
          return currentState;
        }

        return {
          ...currentState,
          onboarding,
        };
      });
    },
    [],
  );

  const resetOnboardingState = useCallback(() => {
    setState((currentState) => {
      const nextState = {
        ...createInitialAppSessionState(),
        locale: currentState.locale,
      };

      return JSON.stringify(currentState) === JSON.stringify(nextState)
        ? currentState
        : nextState;
    });
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      canAccessProduct: deriveCanAccessProduct(state),
      setLocale,
      setWalletSession,
      setBuilderApprovalState,
      setCredentialState,
      setOperationalState,
      setPresetState,
      setRuntimeState,
      setOnboardingState,
      resetOnboardingState,
    }),
    [
      resetOnboardingState,
      setBuilderApprovalState,
      setCredentialState,
      setOperationalState,
      setLocale,
      setOnboardingState,
      setPresetState,
      setRuntimeState,
      setWalletSession,
      state,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return value;
}
