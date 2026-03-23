import { clusterApiUrl } from "@solana/web3.js";
import { WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { WalletErrorCode } from "@pacifica/contracts";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";

export type SolanaWalletPort = {
  selectedProviderName: string | null;
  lastErrorCode: WalletErrorCode | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
};

const phantomWalletName = "Phantom";
const endpoint = clusterApiUrl("mainnet-beta");
const wallets = [new PhantomWalletAdapter()];
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
  const { connect, disconnect, select, wallet, wallets: availableWallets } = useWallet();
  const [lastErrorCode, setLastErrorCode] = useState<WalletErrorCode | null>(null);

  const connectWallet = useCallback(async () => {
    const phantomWallet = availableWallets.find(
      (candidate) => candidate.adapter.name === phantomWalletName,
    );

    if (!phantomWallet || phantomWallet.readyState === WalletReadyState.Unsupported) {
      setLastErrorCode("wallet_unsupported");
      return;
    }

    if (
      phantomWallet.readyState !== WalletReadyState.Installed &&
      phantomWallet.readyState !== WalletReadyState.Loadable
    ) {
      setLastErrorCode("wallet_provider_missing");
      return;
    }

    try {
      setLastErrorCode(null);

      if (!wallet || wallet.adapter.name !== phantomWalletName) {
        select(phantomWalletName as WalletName);
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

  const value = useMemo<SolanaWalletPort>(
    () => ({
      selectedProviderName: wallet?.adapter.name ?? null,
      lastErrorCode,
      connectWallet,
      disconnectWallet,
    }),
    [connectWallet, disconnectWallet, lastErrorCode, wallet],
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
