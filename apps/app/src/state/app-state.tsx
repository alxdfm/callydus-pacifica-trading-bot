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
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultLocale, type AppLocale } from "../shared/i18n/messages";

type CredentialState = {
  agentWalletPublicKey: string | null;
  credentialId: string | null;
  keyFingerprint: string | null;
  validationStatus: CredentialValidationStatus;
  lastValidatedAt: string | null;
  lastErrorCode: PacificaValidationErrorCode | null;
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
      credentialId: null,
      keyFingerprint: null,
      validationStatus: "pending",
      lastValidatedAt: null,
      lastErrorCode: null,
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

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      canAccessProduct: deriveCanAccessProduct(state),
      setLocale: (locale) => {
        setState((currentState) => ({
          ...currentState,
          locale,
        }));
      },
      setWalletSession: (nextWallet) => {
        setState((currentState) => ({
          ...currentState,
          wallet: {
            ...currentState.wallet,
            ...nextWallet,
          },
        }));
      },
      setCredentialState: (nextCredentials) => {
        setState((currentState) => ({
          ...currentState,
          credentials: {
            ...currentState.credentials,
            ...nextCredentials,
          },
        }));
      },
      setOnboardingState: (nextOnboarding) => {
        setState((currentState) => ({
          ...currentState,
          onboarding: {
            ...currentState.onboarding,
            ...nextOnboarding,
          },
        }));
      },
      resetOnboardingState: () => {
        setState((currentState) => ({
          ...createInitialAppSessionState(),
          locale: currentState.locale,
        }));
      },
    }),
    [state],
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
