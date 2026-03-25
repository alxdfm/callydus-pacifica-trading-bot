import { SolanaWalletEnvironment } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { SolanaWalletStateBridge } from "../../features/wallet/solana/SolanaWalletStateBridge";
import { ProfilePage } from "./ProfilePage";

export function ProfileRoute() {
  return (
    <SolanaWalletEnvironment>
      <SolanaWalletStateBridge>
        <ProfilePage />
      </SolanaWalletStateBridge>
    </SolanaWalletEnvironment>
  );
}
