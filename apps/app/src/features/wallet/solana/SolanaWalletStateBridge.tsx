import { useEffect, useRef, type PropsWithChildren } from "react";
import type { WalletProvider } from "@pacifica/contracts";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocation, useNavigate } from "react-router-dom";
import { applyAccountSessionSnapshot } from "../../account/apply-account-session";
import { readAccountSessionViaBackend } from "../../account/backend-account-session";
import { createEmptyRuntimeState } from "../../runtime/runtime-state";
import { useAppState } from "../../../state/app-state";
import { useSolanaWalletPort } from "./SolanaWalletEnvironment";
import { lookupOperationalAccountViaBackend } from "../../onboarding/backend-operational-account-lookup";
import { useAuth } from "../../auth/AuthContext";

function mapAdapterNameToWalletProvider(
  providerName: string | null,
): WalletProvider | null {
  if (providerName === "Phantom") {
    return "phantom";
  }

  if (providerName === "Backpack") {
    return "backpack";
  }

  return null;
}

export function SolanaWalletStateBridge({ children }: PropsWithChildren) {
  const { connected, connecting, publicKey, signMessage, wallet } = useWallet();
  const { authenticate, clearAuth, token, walletAddress } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { lastErrorCode, selectedProviderName } = useSolanaWalletPort();
  const {
    setOperationalState,
    setPresetState,
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
    setRuntimeState,
    setWalletSession,
    state,
  } = useAppState();
  const hydratedSessionWalletRef = useRef<string | null>(null);
  const sessionHydrationInFlightWalletRef = useRef<string | null>(null);
  const authenticatedWalletRef = useRef<string | null>(null);

  // Authenticate with the backend when the wallet connects or changes.
  // Skip if a valid token for this wallet is already present (e.g. persisted
  // from a previous session loaded before this component mounted).
  // clearAuth is called on disconnect so stale tokens are not reused.
  useEffect(() => {
    const mainWalletPublicKey = publicKey?.toBase58() ?? null;

    if (!connected || !mainWalletPublicKey || !signMessage) {
      // Only clear auth on a real disconnect (wallet was previously authenticated).
      // On fresh mount the wallet starts as !connected before auto-connect fires;
      // clearing auth here would wipe a valid persisted token unnecessarily.
      if (!connected && authenticatedWalletRef.current !== null) {
        clearAuth();
        authenticatedWalletRef.current = null;
      }
      return;
    }

    if (authenticatedWalletRef.current === mainWalletPublicKey) {
      // Already authenticated this wallet — but if the token was cleared
      // (e.g. after a 401), reset and fall through to re-authenticate.
      if (token !== null) return;
      authenticatedWalletRef.current = null;
    }

    // A valid persisted token for this wallet (e.g. loaded from localStorage)
    // removes the need to prompt for a new signature.
    if (token !== null && walletAddress === mainWalletPublicKey) {
      authenticatedWalletRef.current = mainWalletPublicKey;
      return;
    }

    authenticatedWalletRef.current = mainWalletPublicKey;
    void authenticate(mainWalletPublicKey, signMessage);
  }, [
    authenticate,
    clearAuth,
    connected,
    publicKey,
    signMessage,
    token,
    walletAddress,
  ]);

  useEffect(() => {
    const mainWalletPublicKey = publicKey?.toBase58() ?? null;
    const providerName = selectedProviderName ?? wallet?.adapter.name ?? null;
    const provider = mapAdapterNameToWalletProvider(providerName);
    const walletChanged =
      Boolean(mainWalletPublicKey) &&
      Boolean(state.wallet.mainWalletPublicKey) &&
      state.wallet.mainWalletPublicKey !== mainWalletPublicKey;

    if (walletChanged) {
      setBuilderApprovalState({
        approvalStatus: "pending",
        builderCode: null,
        approvedAt: null,
        lastErrorCode: null,
        lastMessage: null,
        retryable: false,
      });
      setCredentialState({
        credentialId: null,
        keyFingerprint: null,
        validationStatus: "pending",
        lastValidatedAt: null,
        lastErrorCode: null,
        lastValidationMessage: null,
        retryable: false,
      });
      setOperationalState({
        status: "pending",
        lastVerifiedAt: null,
        lastErrorCode: null,
        lastMessage: null,
        retryable: false,
        probeSymbol: null,
        probeClientOrderId: null,
      });
      setPresetState({
        activePreset: null,
        selectedPresetDefinitionId: null,
        draftEditableConfig: null,
        activationStatus: "idle",
        activationMessage: null,
      });
      setRuntimeState({
        ...createEmptyRuntimeState(),
      });
      setOnboardingState({
        accountLookupStatus: "idle",
        discoveredWalletAddress: null,
        showCompletionModal: false,
      });
    }

    if (connected && mainWalletPublicKey) {
      setWalletSession({
        provider,
        mainWalletPublicKey,
        sessionStatus: "connected",
        lastConnectedAt:
          state.wallet.sessionStatus === "connected" &&
          state.wallet.mainWalletPublicKey === mainWalletPublicKey
            ? state.wallet.lastConnectedAt
            : new Date().toISOString(),
        errorCode: null,
      });

      const hasExistingAccountSnapshot =
        state.onboarding.accountLookupStatus === "existing_account" &&
        state.onboarding.discoveredWalletAddress === mainWalletPublicKey;

      // Preserve the canonical onboarding status received from the backend snapshot
      // once this wallet has already been identified as an existing operational account.
      if (hasExistingAccountSnapshot) {
        return;
      }

      if (
        state.credentials.validationStatus === "valid" &&
        state.operational.status === "verified"
      ) {
        setOnboardingState({
          status: "ready",
          accountReady: true,
          accountLookupStatus:
            state.onboarding.accountLookupStatus === "existing_account"
              ? "existing_account"
              : state.onboarding.accountLookupStatus,
        });
      } else if (state.credentials.validationStatus === "validating") {
        setOnboardingState({
          status: "credentials_validating",
          accountReady: false,
        });
      } else {
        setOnboardingState({
          status: "credentials_pending",
          accountReady: false,
        });
      }

      return;
    }

    if (connecting || providerName) {
      setWalletSession({
        provider: provider ?? state.wallet.provider,
        mainWalletPublicKey:
          mainWalletPublicKey ?? state.wallet.mainWalletPublicKey,
        sessionStatus: connecting ? "reconnecting" : "disconnected",
        errorCode: lastErrorCode,
      });
      setOnboardingState({
        status: "wallet_pending",
        accountReady: false,
      });
      return;
    }

    setWalletSession({
      provider: null,
      mainWalletPublicKey: null,
      sessionStatus: lastErrorCode ? "error" : "disconnected",
      errorCode: lastErrorCode,
    });
    setBuilderApprovalState({
      approvalStatus: "pending",
      builderCode: null,
      approvedAt: null,
      lastErrorCode: null,
      lastMessage: null,
      retryable: false,
    });
    setCredentialState({
      credentialId: null,
      keyFingerprint: null,
      validationStatus: "pending",
      lastValidatedAt: null,
      lastErrorCode: null,
      lastValidationMessage: null,
      retryable: false,
    });
    setOperationalState({
      status: "pending",
      lastVerifiedAt: null,
      lastErrorCode: null,
      lastMessage: null,
      retryable: false,
      probeSymbol: null,
      probeClientOrderId: null,
    });
    setPresetState({
      activePreset: null,
      selectedPresetDefinitionId: null,
      draftEditableConfig: null,
      activationStatus: "idle",
      activationMessage: null,
    });
    setRuntimeState({
      ...createEmptyRuntimeState(),
    });
    setOnboardingState({
      status: "wallet_pending",
      accountReady: false,
      accountLookupStatus: "idle",
      discoveredWalletAddress: null,
      showCompletionModal: false,
    });
  }, [
    connected,
    connecting,
    lastErrorCode,
    publicKey,
    selectedProviderName,
    setBuilderApprovalState,
    setCredentialState,
    setOperationalState,
    setPresetState,
    setOnboardingState,
    setRuntimeState,
    setWalletSession,
    state.builderApproval.approvalStatus,
    state.credentials.validationStatus,
    state.onboarding.accountLookupStatus,
    state.operational.status,
    state.wallet.lastConnectedAt,
    state.wallet.mainWalletPublicKey,
    state.wallet.sessionStatus,
    state.wallet.provider,
    wallet,
  ]);

  useEffect(() => {
    const mainWalletPublicKey = publicKey?.toBase58() ?? null;

    if (!connected || !mainWalletPublicKey) {
      hydratedSessionWalletRef.current = null;
      sessionHydrationInFlightWalletRef.current = null;
      return;
    }

    if (
      state.onboarding.accountLookupStatus === "checking" ||
      (state.onboarding.discoveredWalletAddress === mainWalletPublicKey &&
        state.onboarding.accountLookupStatus !== "error")
    ) {
      return;
    }

    let isCancelled = false;

    setOnboardingState({
      accountLookupStatus: "checking",
      discoveredWalletAddress: mainWalletPublicKey,
      showCompletionModal: false,
    });

    void lookupOperationalAccountViaBackend({
      walletAddress: mainWalletPublicKey,
    }).then((result) => {
      if (isCancelled) {
        return;
      }

      if (result.status === "found") {
        setBuilderApprovalState({
          approvalStatus: "approved",
          lastErrorCode: null,
          lastMessage: "Existing operational account found for this wallet.",
          retryable: false,
        });
        setCredentialState({
          credentialId: result.credentialId,
          agentWalletPublicKey: result.agentWalletPublicKey,
          agentWalletPrivateKey: null,
          credentialAlias: result.credentialAlias,
          keyFingerprint: result.keyFingerprint,
          validationStatus: "valid",
          lastValidatedAt: null,
          lastErrorCode: null,
          lastValidationMessage: "Existing operational account found.",
          retryable: false,
        });
        setOperationalState({
          status: "verified",
          lastVerifiedAt: null,
          lastErrorCode: null,
          lastMessage: "Existing operational account found.",
          retryable: false,
          probeSymbol: null,
          probeClientOrderId: null,
        });
        setPresetState({
          activePreset: null,
          selectedPresetDefinitionId: null,
          draftEditableConfig: null,
          activationStatus: "idle",
          activationMessage: null,
        });
        setRuntimeState({
          ...createEmptyRuntimeState(),
          screenStatus: "idle",
          lastRuntimeMessage: null,
        });
        setOnboardingState({
          status: "ready",
          accountReady: true,
          accountLookupStatus: "existing_account",
          discoveredWalletAddress: mainWalletPublicKey,
          showCompletionModal: false,
        });

        if (location.pathname === "/onboarding") {
          window.setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 0);
        }
        return;
      }

      if (result.status === "not_found") {
        setOnboardingState({
          status: "credentials_pending",
          accountReady: false,
          accountLookupStatus: "new_account",
          discoveredWalletAddress: mainWalletPublicKey,
          showCompletionModal: false,
        });
        return;
      }

      setOnboardingState({
        status: "wallet_pending",
        accountReady: false,
        accountLookupStatus: "error",
        discoveredWalletAddress: mainWalletPublicKey,
        showCompletionModal: false,
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [
    connected,
    publicKey,
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    const mainWalletPublicKey = publicKey?.toBase58() ?? null;
    const canHydrateExistingAccount =
      connected &&
      Boolean(mainWalletPublicKey) &&
      (state.onboarding.accountLookupStatus === "existing_account" ||
        state.onboarding.accountReady);

    if (!canHydrateExistingAccount || !mainWalletPublicKey || !token) {
      if (!connected || !mainWalletPublicKey) {
        hydratedSessionWalletRef.current = null;
        sessionHydrationInFlightWalletRef.current = null;
      }
      return;
    }

    if (
      hydratedSessionWalletRef.current === mainWalletPublicKey ||
      sessionHydrationInFlightWalletRef.current === mainWalletPublicKey
    ) {
      return;
    }

    let isCancelled = false;

    sessionHydrationInFlightWalletRef.current = mainWalletPublicKey;

    void readAccountSessionViaBackend(
      { walletAddress: mainWalletPublicKey },
      token,
    ).then((sessionSnapshot) => {
      if (isCancelled) {
        return;
      }

      sessionHydrationInFlightWalletRef.current = null;

      if (sessionSnapshot.status !== "found") {
        return;
      }

      applyAccountSessionSnapshot(sessionSnapshot, {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
        setOnboardingState,
      });
      hydratedSessionWalletRef.current = mainWalletPublicKey;
    });

    return () => {
      isCancelled = true;

      if (sessionHydrationInFlightWalletRef.current === mainWalletPublicKey) {
        sessionHydrationInFlightWalletRef.current = null;
      }
    };
  }, [
    connected,
    publicKey,
    token,
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state.onboarding.accountLookupStatus,
    state.onboarding.accountReady,
  ]);

  return children;
}
