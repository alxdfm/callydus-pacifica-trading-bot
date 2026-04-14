import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { fetchAuthNonce, verifyAuthSignature } from "./backend-auth";
import { registerClearAuth } from "./unauthorized-redirect";

type AuthState = {
  token: string | null;
  walletAddress: string | null;
  expiresAt: string | null;
};

type AuthContextValue = AuthState & {
  authenticate: (
    walletAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  ) => Promise<void>;
  clearAuth: () => void;
};

const AUTH_STORAGE_KEY = "callydus.auth";

function loadPersistedAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null, walletAddress: null, expiresAt: null };
    const parsed = JSON.parse(raw) as AuthState;
    // Discard if already expired
    if (parsed.expiresAt && new Date(parsed.expiresAt) <= new Date()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { token: null, walletAddress: null, expiresAt: null };
    }
    return parsed;
  } catch {
    return { token: null, walletAddress: null, expiresAt: null };
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(loadPersistedAuth);

  useEffect(() => {
    if (state.token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [state]);

  const clearAuth = useCallback(() => {
    setState({ token: null, walletAddress: null, expiresAt: null });
  }, []);

  useEffect(() => {
    registerClearAuth(clearAuth);
  }, [clearAuth]);

  const authenticate = useCallback(
    async (
      walletAddress: string,
      signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    ) => {
      const nonceResponse = await fetchAuthNonce(walletAddress);
      if (nonceResponse.status !== "ok") return;

      const { nonce, expiresAt, message } = nonceResponse;

      const messageBytes = new TextEncoder().encode(message);
      let signatureBytes: Uint8Array;
      try {
        signatureBytes = await signMessage(messageBytes);
      } catch {
        // User rejected the signing request
        return;
      }

      const signature = uint8ArrayToBase64(signatureBytes);

      const verifyResponse = await verifyAuthSignature({
        walletAddress,
        nonce,
        expiresAt,
        signature,
      });

      if (verifyResponse.status !== "ok") return;

      setState({
        token: verifyResponse.token,
        walletAddress,
        expiresAt: verifyResponse.expiresAt,
      });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        authenticate,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Converts a Uint8Array to a base64 string, handling large arrays safely.
 * btoa(String.fromCharCode(...bytes)) fails for large arrays due to call stack
 * limits, so we use this helper for robustness.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
