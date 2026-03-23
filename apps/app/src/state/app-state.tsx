import {
  credentialValidationStatusSchema,
  onboardingStatusSchema,
  walletSessionStatusSchema,
  type CredentialValidationStatus,
  type OnboardingStatus,
  type PacificaValidationErrorCode,
  type WalletSession,
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

export type AppSessionState = {
  locale: AppLocale;
  wallet: WalletSession;
  credentials: CredentialState;
  onboarding: {
    status: OnboardingStatus;
    accountReady: boolean;
  };
};

type AppStateContextValue = {
  state: AppSessionState;
  canAccessProduct: boolean;
  setLocale: (locale: AppLocale) => void;
  setWalletSession: (nextWallet: Partial<WalletSession>) => void;
  setCredentialState: (nextCredentials: Partial<CredentialState>) => void;
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
    onboarding: {
      status: "wallet_pending",
      accountReady: false,
    },
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
      credentials: {
        ...baseState.credentials,
        ...parsed.credentials,
        validationStatus: credentialValidationStatus(parsed.credentials?.validationStatus),
      },
      onboarding: {
        ...baseState.onboarding,
        ...parsed.onboarding,
        status: onboardingStatus(parsed.onboarding?.status),
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

function onboardingStatus(value: unknown): OnboardingStatus {
  const result = onboardingStatusSchema.safeParse(value);
  return result.success ? result.data : "wallet_pending";
}

function deriveCanAccessProduct(state: AppSessionState) {
  return (
    state.wallet.sessionStatus === "connected" &&
    state.credentials.validationStatus === "valid" &&
    state.onboarding.status === "ready" &&
    state.onboarding.accountReady
  );
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
    window.localStorage.setItem(storageKey, JSON.stringify(state));
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
      setCredentialState,
      setOnboardingState,
      resetOnboardingState,
    }),
    [
      resetOnboardingState,
      setCredentialState,
      setLocale,
      setOnboardingState,
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
