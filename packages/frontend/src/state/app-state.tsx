import {
  builderApprovalStatusSchema,
  credentialValidationStatusSchema,
  onboardingStatusSchema,
  operationalVerificationStatusSchema,
  walletProviderSchema,
  walletSessionStatusSchema,
  type BuilderApprovalStatus,
  type CredentialValidationStatus,
  type OnboardingStatus,
  type OperationalVerificationStatus,
  type PacificaOperationalVerificationErrorCode,
  type PacificaValidationErrorCode,
  type WalletProvider,
  type WalletSession,
} from "../types/contracts";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createEmptyRuntimeState,
  type RuntimeState,
} from "../features/runtime/runtime-state";

export type CredentialState = {
  agentWalletPublicKey: string | null;
  credentialAlias: string | null;
  credentialId: string | null;
  keyFingerprint: string | null;
  validationStatus: CredentialValidationStatus;
  lastValidatedAt: string | null;
  lastErrorCode: PacificaValidationErrorCode | null;
  lastValidationMessage: string | null;
  retryable: boolean;
};

export type BuilderApprovalState = {
  approvalStatus: BuilderApprovalStatus;
  builderCode: string | null;
  approvedAt: string | null;
  lastErrorCode: string | null;
  lastMessage: string | null;
  retryable: boolean;
};

export type OperationalVerificationState = {
  status: OperationalVerificationStatus;
  lastVerifiedAt: string | null;
  lastErrorCode: PacificaOperationalVerificationErrorCode | null;
  lastMessage: string | null;
  retryable: boolean;
  probeSymbol: string | null;
  probeClientOrderId: string | null;
};

export type AppSessionState = {
  wallet: WalletSession;
  builderApproval: BuilderApprovalState;
  credentials: CredentialState;
  operational: OperationalVerificationState;
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
  setWalletSession: (nextWallet: Partial<WalletSession>) => void;
  setBuilderApprovalState: (nextBuilderApproval: Partial<BuilderApprovalState>) => void;
  setCredentialState: (nextCredentials: Partial<CredentialState>) => void;
  setOperationalState: (
    nextOperational: Partial<OperationalVerificationState>,
  ) => void;
  setRuntimeState: (nextRuntime: Partial<RuntimeState>) => void;
  setOnboardingState: (nextOnboarding: Partial<AppSessionState["onboarding"]>) => void;
  resetOnboardingState: () => void;
};

// v2: bump da chave descarta storages antigos que continham campos removidos
// (locale, presets.selected*/draft*/activation*, runtime.screenStatus, privkey)
const storageKey = "pacifica.app-state.v2";
const AppStateContext = createContext<AppStateContextValue | null>(null);

export function createInitialAppSessionState(): AppSessionState {
  return {
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

export function parseStoredState(rawValue: string | null): AppSessionState {
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
        provider: walletProviderValue(parsed.wallet?.provider),
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
        validationStatus: credentialValidationStatus(parsed.credentials?.validationStatus),
      },
      operational: {
        ...baseState.operational,
        ...parsed.operational,
        status: operationalVerificationStatus(parsed.operational?.status),
      },
      // Toast é efêmero — runtime nunca é reidratado do storage
      runtime: createEmptyRuntimeState(),
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

function walletProviderValue(value: unknown): WalletProvider | null {
  if (value == null) {
    return null;
  }

  const result = walletProviderSchema.safeParse(value);
  return result.success ? result.data : null;
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
  // "checking" and "error" are transient states that should never be persisted.
  // If they appear in storage (legacy sessions), reset to "idle" so the lookup retries.
  if (value === "new_account" || value === "existing_account") {
    return value;
  }
  return "idle";
}











export function deriveCanAccessProduct(state: AppSessionState) {
  return (
    state.wallet.sessionStatus === "connected" &&
    state.builderApproval.approvalStatus === "approved" &&
    state.credentials.validationStatus === "valid" &&
    state.operational.status === "verified" &&
    state.onboarding.status === "ready" &&
    state.onboarding.accountReady
  );
}

export function sanitizeStateForPersistence(state: AppSessionState): AppSessionState {
  const builderApproval =
    state.builderApproval.approvalStatus === "approving"
      ? {
          ...state.builderApproval,
          approvalStatus: "pending" as const,
          lastErrorCode: null,
          lastMessage: null,
          retryable: false,
        }
      : state.builderApproval;
  const credentials =
    state.credentials.validationStatus === "validating"
      ? {
          ...state.credentials,
          validationStatus: "pending" as const,
          credentialId: null,
          keyFingerprint: null,
          lastValidatedAt: null,
          lastErrorCode: null,
          lastValidationMessage: null,
          retryable: false,
        }
      : state.credentials;
  const operational =
    state.operational.status === "verifying"
      ? {
          ...state.operational,
          status: "pending" as const,
          lastVerifiedAt: null,
          lastErrorCode: null,
          lastMessage: null,
          retryable: false,
          probeSymbol: null,
          probeClientOrderId: null,
        }
      : state.operational;
  const walletSession =
    state.wallet.sessionStatus === "reconnecting"
      ? {
          ...state.wallet,
          sessionStatus: "disconnected" as const,
          errorCode: null,
        }
      : state.wallet;
  const isTransientLookupStatus =
    state.onboarding.accountLookupStatus === "checking" ||
    state.onboarding.accountLookupStatus === "error";
  const onboarding =
    state.onboarding.status === "credentials_validating"
      ? {
          ...state.onboarding,
          status: "credentials_pending" as const,
          accountReady: false,
          showCompletionModal: false,
          accountLookupStatus: isTransientLookupStatus
            ? ("idle" as const)
            : state.onboarding.accountLookupStatus,
          discoveredWalletAddress: isTransientLookupStatus
            ? null
            : state.onboarding.discoveredWalletAddress,
        }
      : {
          ...state.onboarding,
          showCompletionModal: false,
          accountLookupStatus: isTransientLookupStatus
            ? ("idle" as const)
            : state.onboarding.accountLookupStatus,
          discoveredWalletAddress: isTransientLookupStatus
            ? null
            : state.onboarding.discoveredWalletAddress,
        };

  return {
    ...state,
    wallet: walletSession,
    builderApproval,
    credentials,
    operational,
    onboarding,
    runtime: {
      ...state.runtime,
      actionToast: null,
    },
  };
}

export function areObjectsShallowEqual<T extends Record<string, unknown>>(
  left: T,
  right: T,
) {
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
      const nextState = createInitialAppSessionState();

      return JSON.stringify(currentState) === JSON.stringify(nextState)
        ? currentState
        : nextState;
    });
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      canAccessProduct: deriveCanAccessProduct(state),
      setWalletSession,
      setBuilderApprovalState,
      setCredentialState,
      setOperationalState,
      setRuntimeState,
      setOnboardingState,
      resetOnboardingState,
    }),
    [
      resetOnboardingState,
      setBuilderApprovalState,
      setCredentialState,
      setOperationalState,
      setOnboardingState,
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
