import { useCallback, useEffect, useRef, useState } from "react";
import type { OperationalSessionSnapshotRequest } from "@pacifica/contracts";
import { useAppState } from "../../state/app-state";

type LoadStateStatus = "idle" | "loading" | "ready" | "error";
const AUTO_LOAD_DEDUP_MS = 1_500;

type SessionResponse =
  | { status: "found" }
  | { status: "not_found" }
  | { status: "error"; message: string };

type FoundSession<TResponse> = Extract<TResponse, { status: "found" }>;

type SharedLoadResult<TResponse> = TResponse | null;

const sharedAutoLoads = new Map<
  string,
  {
    startedAt: number;
    promise: Promise<SharedLoadResult<SessionResponse>>;
  }
>();

export function useOperationalPageSession<TResponse extends SessionResponse>(input: {
  readSnapshot: (
    request: OperationalSessionSnapshotRequest,
  ) => Promise<TResponse>;
  applySnapshot: (snapshot: FoundSession<TResponse>) => void;
  requestKey: string;
  loadingMessage: string;
  unavailableMessage: string;
  enabled?: boolean;
}) {
  const { state } = useAppState();
  const {
    applySnapshot,
    enabled: enabledProp,
    loadingMessage,
    readSnapshot,
    requestKey,
    unavailableMessage,
  } = input;
  const walletAddress = state.wallet.mainWalletPublicKey;
  const enabled = enabledProp ?? true;
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<LoadStateStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const performLoad = useCallback(async () => {
    if (!walletAddress || !enabled) {
      setStatus("idle");
      setMessage(null);
      return null;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus("loading");
    setMessage(loadingMessage);

    const response = await readSnapshot({
      walletAddress,
    });

    if (requestIdRef.current !== requestId) {
      return null;
    }

    if (response.status === "found") {
      applySnapshot(response as FoundSession<TResponse>);
      setStatus("ready");
      setMessage(null);
      return response;
    }

    setStatus("error");
    setMessage(
      response.status === "error"
        ? response.message
        : unavailableMessage,
    );
    return response;
  }, [
    applySnapshot,
    enabled,
    loadingMessage,
    readSnapshot,
    unavailableMessage,
    walletAddress,
  ]);

  const load = useCallback(
    async (options?: { dedupe?: boolean }) => {
      if (!walletAddress || !enabled) {
        return performLoad();
      }

      if (!options?.dedupe) {
        return performLoad();
      }

      const key = `${requestKey}:${walletAddress}`;
      const currentTime = Date.now();
      const sharedLoad = sharedAutoLoads.get(key);

      if (sharedLoad && currentTime - sharedLoad.startedAt < AUTO_LOAD_DEDUP_MS) {
        return (await sharedLoad.promise) as SharedLoadResult<TResponse>;
      }

      const promise = performLoad() as Promise<SharedLoadResult<SessionResponse>>;
      sharedAutoLoads.set(key, {
        startedAt: currentTime,
        promise,
      });

      window.setTimeout(() => {
        const activeLoad = sharedAutoLoads.get(key);

        if (activeLoad?.promise === promise) {
          sharedAutoLoads.delete(key);
        }
      }, AUTO_LOAD_DEDUP_MS);

      return (await promise) as SharedLoadResult<TResponse>;
    },
    [enabled, performLoad, requestKey, walletAddress],
  );

  useEffect(() => {
    void load({ dedupe: true });
  }, [load]);

  return {
    reload: () => load({ dedupe: false }),
    status,
    message,
    isLoading: status === "loading",
  };
}
