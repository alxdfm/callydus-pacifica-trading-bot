import { useEffect, type PropsWithChildren } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppState } from "../../../state/app-state";
import { useSolanaWalletPort } from "./SolanaWalletEnvironment";

export function SolanaWalletStateBridge({ children }: PropsWithChildren) {
  const {
    connected,
    connecting,
    publicKey,
    wallet,
  } = useWallet();
  const { lastErrorCode, selectedProviderName } = useSolanaWalletPort();
  const {
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
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

      if (state.credentials.validationStatus === "valid") {
        setOnboardingState({
          status: "ready",
          accountReady: true,
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
    setOnboardingState({
      status: "wallet_pending",
      accountReady: false,
    });
  }, [
    connected,
    connecting,
    lastErrorCode,
    publicKey,
    selectedProviderName,
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
    setWalletSession,
    state.builderApproval.approvalStatus,
    state.credentials.validationStatus,
    state.wallet.lastConnectedAt,
    state.wallet.mainWalletPublicKey,
    state.wallet.sessionStatus,
    state.wallet.provider,
    wallet,
  ]);

  return children;
}
