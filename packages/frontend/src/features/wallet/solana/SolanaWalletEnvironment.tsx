import { clusterApiUrl } from "@solana/web3.js";
import { WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
import {
  createContext,
  type MutableRefObject,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  WalletErrorCode,
  WalletProvider as SupportedWalletProvider,
} from "../../../types/contracts";
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
// Phantom e Backpack se registram via Wallet Standard — adapters legados
// deprecados criavam uma segunda instância com transporte quebrado (connect
// pendurava sem erro nem popup no primeiro clique)
const wallets: never[] = [];
const SolanaWalletPortContext = createContext<SolanaWalletPort | null>(null);

const CONNECT_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error("wallet connect timed out")),
      ms,
    );
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

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

function SolanaWalletPortProvider({
  children,
  manualConnectRef,
}: PropsWithChildren<{ manualConnectRef: MutableRefObject<boolean> }>) {
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
        // select() dispara o auto-connect interno da lib FORA do gesto do clique;
        // com a extensão travada isso falha sem abrir o popup de unlock e ainda
        // desseleciona o adapter no erro. manualConnectRef desarma esse auto-connect
        // e o connect acontece direto no adapter, ainda dentro do gesto.
        manualConnectRef.current = true;
        select(supportedWallet.adapter.name as WalletName);
        await withTimeout(supportedWallet.adapter.connect(), CONNECT_TIMEOUT_MS);
        return;
      }

      await withTimeout(connect(), CONNECT_TIMEOUT_MS);
    } catch (error) {
      setLastErrorCode(mapWalletError(error));
    } finally {
      manualConnectRef.current = false;
    }
  }, [availableWallets, connect, manualConnectRef, select, wallet]);

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
  const manualConnectRef = useRef(false);
  // Reconnect silencioso no mount continua; só é suprimido enquanto um
  // connect manual (clique) está em andamento, para não competirem
  const shouldAutoConnect = useCallback(
    async () => !manualConnectRef.current,
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect={shouldAutoConnect} wallets={wallets}>
        <SolanaWalletPortProvider manualConnectRef={manualConnectRef}>
          {children}
        </SolanaWalletPortProvider>
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
