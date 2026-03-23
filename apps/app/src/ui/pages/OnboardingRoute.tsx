import { SolanaWalletEnvironment } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { SolanaWalletStateBridge } from "../../features/wallet/solana/SolanaWalletStateBridge";
import { OnboardingPage } from "./OnboardingPage";

export function OnboardingRoute() {
  return (
    <SolanaWalletEnvironment>
      <SolanaWalletStateBridge>
        <OnboardingPage />
      </SolanaWalletStateBridge>
    </SolanaWalletEnvironment>
  );
}
