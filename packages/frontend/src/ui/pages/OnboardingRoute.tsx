import { Navigate } from "react-router-dom";
import { SolanaWalletEnvironment } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { SolanaWalletStateBridge } from "../../features/wallet/solana/SolanaWalletStateBridge";
import { useAppState } from "../../state/app-state";
import { OnboardingPage } from "./OnboardingPage";

export function OnboardingRoute() {
  const { canAccessProduct, state } = useAppState();
  const shouldBypassOnboarding =
    canAccessProduct ||
    (state.wallet.sessionStatus === "connected" &&
      state.onboarding.accountLookupStatus === "existing_account");

  if (shouldBypassOnboarding) {
    const shouldShowCompletionModal = state.onboarding.showCompletionModal;

    if (typeof window !== "undefined" && shouldShowCompletionModal) {
      window.sessionStorage.setItem("pacifica.dashboard-flash", "onboarding_ready");
    }
    return (
      <Navigate
        replace
        state={
          shouldShowCompletionModal
            ? { dashboardToast: "onboarding_ready" }
            : null
        }
        to="/dashboard"
      />
    );
  }

  return (
    <SolanaWalletEnvironment>
      <SolanaWalletStateBridge>
        <OnboardingPage />
      </SolanaWalletStateBridge>
    </SolanaWalletEnvironment>
  );
}
