import { useEffect, type PropsWithChildren } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createEmptyRuntimeState } from "../../runtime/demo-runtime";
import { useAppState } from "../../../state/app-state";
import { useSolanaWalletPort } from "./SolanaWalletEnvironment";
import { lookupOperationalAccountViaBackend } from "../../onboarding/backend-operational-account-lookup";
import { readAccountSessionViaBackend } from "../../account/backend-account-session";
import { applyAccountSessionSnapshot } from "../../account/apply-account-session";

export function SolanaWalletStateBridge({ children }: PropsWithChildren) {
  const {
    connected,
    connecting,
    publicKey,
    wallet,
  } = useWallet();
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

  useEffect(() => {
    const mainWalletPublicKey = publicKey?.toBase58() ?? null;
    const providerName = selectedProviderName ?? wallet?.adapter.name ?? null;
    const provider = providerName === "Phantom" ? "phantom" : null;
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
        mainWalletPublicKey: mainWalletPublicKey ?? state.wallet.mainWalletPublicKey,
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
      return;
    }

    if (
      state.onboarding.accountLookupStatus === "checking" ||
      state.onboarding.discoveredWalletAddress === mainWalletPublicKey
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
    }).then(async (result) => {
      if (isCancelled) {
        return;
      }

      if (result.status === "found") {
        const sessionSnapshot = await readAccountSessionViaBackend({
          walletAddress: mainWalletPublicKey,
        });

        if (isCancelled) {
          return;
        }

        if (sessionSnapshot.status === "found") {
          applyAccountSessionSnapshot(sessionSnapshot, {
            setBuilderApprovalState,
            setCredentialState,
            setOperationalState,
            setPresetState,
            setRuntimeState,
            setOnboardingState,
          });
        } else {
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
            screenStatus: "ready",
          });
          setOnboardingState({
            status: "ready",
            accountReady: true,
            accountLookupStatus: "existing_account",
            discoveredWalletAddress: mainWalletPublicKey,
            showCompletionModal: false,
          });
        }

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

  return children;
}
