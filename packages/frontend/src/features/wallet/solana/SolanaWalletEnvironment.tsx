import { clusterApiUrl } from "@solana/web3.js";
import { WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  WalletErrorCode,
  WalletProvider as SupportedWalletProvider,
} from "@pacifica/contracts";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";

type SolanaWalletPort = {
  selectedProviderName: string | null;
  lastErrorCode: WalletErrorCode | null;
  connectWallet: (provider?: SupportedWalletProvider) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  canSignMessages: boolean;
  signWalletMessage: (message: Uint8Array) => Promise<Uint8Array>;
};

const providerAdapterNames: Record<SupportedWalletProvider, string> = {
  phantom: "Phantom",
  backpack: "Backpack",
};
const supportedWalletNames = Object.values(providerAdapterNames) as string[];
const endpoint = clusterApiUrl("mainnet-beta");
const wallets = [new PhantomWalletAdapter(), new BackpackWalletAdapter()];
const SolanaWalletPortContext = createContext<SolanaWalletPort | null>(null);

function mapWalletError(error: unknown): WalletErrorCode {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("reject") || message.includes("declin")) {
    return "wallet_connection_rejected";
  }

  if (message.includes("not ready") || message.includes("not installed")) {
    return "wallet_provider_missing";
  }

  if (message.includes("disconnect")) {
    return "wallet_session_lost";
  }

  return "wallet_connection_failed";
}

function SolanaWalletPortProvider({ children }: PropsWithChildren) {
  const {
    connect,
    disconnect,
    select,
    signMessage,
    wallet,
    wallets: availableWallets,
  } = useWallet();
  const [lastErrorCode, setLastErrorCode] = useState<WalletErrorCode | null>(null);

  const connectWallet = useCallback(async (provider?: SupportedWalletProvider) => {
    const requestedAdapterName = provider ? providerAdapterNames[provider] : null;
    const selectedWallet =
      wallet &&
      supportedWalletNames.includes(wallet.adapter.name)
        ? wallet
        : null;
    const matchingWallets = requestedAdapterName
      ? availableWallets.filter(
          (candidate) => candidate.adapter.name === requestedAdapterName,
        )
      : availableWallets;
    const candidateWallets = selectedWallet && !requestedAdapterName
      ? [
          ...matchingWallets.filter(
            (candidate) => candidate.adapter.name === selectedWallet.adapter.name,
          ),
          ...matchingWallets.filter(
            (candidate) => candidate.adapter.name !== selectedWallet.adapter.name,
          ),
        ]
      : matchingWallets;
    const supportedWallet = candidateWallets.find((candidate) => {
      if (!supportedWalletNames.includes(candidate.adapter.name)) {
        return false;
      }

      return (
        candidate.readyState === WalletReadyState.Installed ||
        candidate.readyState === WalletReadyState.Loadable
      );
    });
    const hasSupportedWallet = availableWallets.some((candidate) =>
      supportedWalletNames.includes(candidate.adapter.name),
    );

    if (!hasSupportedWallet) {
      setLastErrorCode("wallet_provider_missing");
      return;
    }

    if (!supportedWallet) {
      setLastErrorCode("wallet_unsupported");
      return;
    }

    try {
      setLastErrorCode(null);

      if (!wallet || wallet.adapter.name !== supportedWallet.adapter.name) {
        select(supportedWallet.adapter.name as WalletName);
        return;
      }

      await connect();
    } catch (error) {
      setLastErrorCode(mapWalletError(error));
    }
  }, [availableWallets, connect, select, wallet]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setLastErrorCode(null);
    } catch {
      setLastErrorCode("wallet_session_lost");
    }
  }, [disconnect]);

  const signWalletMessage = useCallback(
    async (message: Uint8Array) => {
      if (typeof signMessage !== "function") {
        throw new Error("Wallet message signing is unavailable.");
      }

      return signMessage(message);
    },
    [signMessage],
  );

  const value = useMemo<SolanaWalletPort>(
    () => ({
      selectedProviderName: wallet?.adapter.name ?? null,
      lastErrorCode,
      connectWallet,
      disconnectWallet,
      canSignMessages: typeof signMessage === "function",
      signWalletMessage,
    }),
    [connectWallet, disconnectWallet, lastErrorCode, signMessage, signWalletMessage, wallet],
  );

  return (
    <SolanaWalletPortContext.Provider value={value}>
      {children}
    </SolanaWalletPortContext.Provider>
  );
}

export function SolanaWalletEnvironment({ children }: PropsWithChildren) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect wallets={wallets}>
        <SolanaWalletPortProvider>{children}</SolanaWalletPortProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useSolanaWalletPort() {
  const value = useContext(SolanaWalletPortContext);

  if (!value) {
    throw new Error("useSolanaWalletPort must be used within SolanaWalletEnvironment");
  }

  return value;
}
