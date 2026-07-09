import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { SolanaWalletEnvironment } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { SolanaWalletStateBridge } from "../../features/wallet/solana/SolanaWalletStateBridge";
import { useAppState } from "../../state/app-state";
import { OnboardingPage } from "./OnboardingPage";

export function OnboardingRoute() {
  const { canAccessProduct, state } = useAppState();
  const { token } = useAuth();
  // Sem token JWT o produto só devolve 401 — o bypass espera o sign-in SIWS
  const shouldBypassOnboarding =
    Boolean(token) &&
    (canAccessProduct ||
      (state.wallet.sessionStatus === "connected" &&
        state.onboarding.accountLookupStatus === "existing_account"));

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
