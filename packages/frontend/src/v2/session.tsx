import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SessionResponse } from "@pacifica/shared/contracts";
import { useAuth } from "../features/auth/AuthContext";
import { getSession } from "./client.js";

// ---------------------------------------------------------------------------
// Estado único do v2: o snapshot de sessão vive SÓ em memória e é hidratado
// de UMA fonte (GET /api/v2/session). Nada de localStorage para dado de
// servidor — a lição do app-state v1 (estado velho renascia como verdade).
// ---------------------------------------------------------------------------

export type SessionData = Extract<SessionResponse, { status: "ok" }>;

type SessionContextValue = {
  session: SessionData | null;
  status: "idle" | "loading" | "ready" | "error";
  errorMessage: string | null;
  reload: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const { token } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<SessionContextValue["status"]>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Apenas a resposta do request mais recente é aplicada (reloads concorrentes
  // e trocas de token não podem sobrescrever com dado antigo)
  const requestSeqRef = useRef(0);

  const reload = useCallback(async () => {
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;

    if (!token) {
      setSession(null);
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    // Refresh em background (pós-comando) não regride para "loading": as
    // páginas fazem early-return de skeleton nesse status e a tela inteira
    // piscaria a cada pause/resume/save
    setStatus((current) => (current === "ready" ? "ready" : "loading"));

    const response = await getSession(token);

    if (requestSeqRef.current !== seq) return;

    if (response.status === "ok") {
      setSession(response);
      setStatus("ready");
      setErrorMessage(null);
    } else {
      setSession(null);
      setStatus("error");
      setErrorMessage(response.message);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, status, errorMessage, reload }),
    [session, status, errorMessage, reload],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return value;
}
