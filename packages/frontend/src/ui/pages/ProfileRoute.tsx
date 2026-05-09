import { SolanaWalletEnvironment } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { ProfilePage } from "./ProfilePage";

export function ProfileRoute() {
  return (
    <SolanaWalletEnvironment>
      <ProfilePage />
    </SolanaWalletEnvironment>
  );
}
