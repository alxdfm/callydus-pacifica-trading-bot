import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { fetchAuthNonce, verifyAuthSignature } from "./backend-auth";

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

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_BEFORE_EXPIRY_MS = 10 * 60 * 1000; // refresh 10 min before expiry

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    token: null,
    walletAddress: null,
    expiresAt: null,
  });
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signMessageRef = useRef<
    ((message: Uint8Array) => Promise<Uint8Array>) | null
  >(null);

  const clearAuth = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    signMessageRef.current = null;
    setState({ token: null, walletAddress: null, expiresAt: null });
  }, []);

  const scheduleRefresh = useCallback(
    (walletAddress: string, expiresAt: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      const msUntilRefresh =
        new Date(expiresAt).getTime() - Date.now() - REFRESH_BEFORE_EXPIRY_MS;

      if (msUntilRefresh <= 0 || !signMessageRef.current) return;

      refreshTimerRef.current = setTimeout(() => {
        if (signMessageRef.current) {
          void authenticate(walletAddress, signMessageRef.current);
        }
      }, msUntilRefresh);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const authenticate = useCallback(
    async (
      walletAddress: string,
      signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    ) => {
      signMessageRef.current = signMessage;

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

      scheduleRefresh(walletAddress, verifyResponse.expiresAt);
    },
    [scheduleRefresh],
  );

  // Clear auth when component unmounts
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

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
