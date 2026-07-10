import { clusterApiUrl } from "@solana/web3.js";
import { WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
import {
  createContext,
  type MutableRefObject,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
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

// Longo o suficiente para o usuário deliberar no popup de aprovação da extensão
const CONNECT_TIMEOUT_MS = 60_000;

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
  connectIntentRef,
  lastErrorCode,
  setLastErrorCode,
}: PropsWithChildren<{
  connectIntentRef: MutableRefObject<boolean>;
  lastErrorCode: WalletErrorCode | null;
  setLastErrorCode: (code: WalletErrorCode | null) => void;
}>) {
  const {
    connect,
    connected,
    disconnect,
    select,
    signMessage,
    wallet,
    wallets: availableWallets,
  } = useWallet();

  // Conexão estabelecida encerra a intenção de connect — erros posteriores do
  // adapter (ex.: autoConnect silencioso de outra aba) não são do clique
  useEffect(() => {
    if (connected) {
      connectIntentRef.current = false;
    }
  }, [connected, connectIntentRef]);

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
        // Só seleciona: o próprio WalletProvider dispara adapter.connect() no
        // effect pós-commit dele, DEPOIS de anexar os listeners de 'connect'.
        // Conectar aqui no clique perde o emit síncrono do adapter quando a
        // extensão resolve de cache (domínio trusted) — o evento dispara antes
        // de existir listener e o estado nunca vira connected até o reload.
        // Erros desse caminho chegam via onError do WalletProvider, filtrados
        // pela intenção registrada aqui.
        connectIntentRef.current = true;
        select(supportedWallet.adapter.name as WalletName);
        return;
      }

      await withTimeout(connect(), CONNECT_TIMEOUT_MS);
    } catch (error) {
      setLastErrorCode(mapWalletError(error));
    }
  }, [availableWallets, connect, connectIntentRef, select, setLastErrorCode, wallet]);

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
  const [lastErrorCode, setLastErrorCode] = useState<WalletErrorCode | null>(null);
  // Erros do connect pós-select chegam pelo onError do provider (a lib os
  // "dropa" internamente); só interessam quando houve clique do usuário
  const connectIntentRef = useRef(false);
  const handleWalletError = useCallback((error: unknown) => {
    if (!connectIntentRef.current) {
      return;
    }
    connectIntentRef.current = false;
    setLastErrorCode(mapWalletError(error));
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect onError={handleWalletError} wallets={wallets}>
        <SolanaWalletPortProvider
          connectIntentRef={connectIntentRef}
          lastErrorCode={lastErrorCode}
          setLastErrorCode={setLastErrorCode}
        >
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
