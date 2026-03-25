import { Navigate } from "react-router-dom";
import { SolanaWalletEnvironment } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { SolanaWalletStateBridge } from "../../features/wallet/solana/SolanaWalletStateBridge";
import { useAppState } from "../../state/app-state";
import { OnboardingPage } from "./OnboardingPage";

export function OnboardingRoute() {
  const { canAccessProduct } = useAppState();

  if (canAccessProduct) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <SolanaWalletEnvironment>
      <SolanaWalletStateBridge>
        <OnboardingPage />
      </SolanaWalletStateBridge>
    </SolanaWalletEnvironment>
  );
}
