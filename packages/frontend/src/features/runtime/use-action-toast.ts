import { useCallback } from "react";
import { useAppState } from "../../state/app-state";
import type { RuntimeToast } from "./runtime-state";

// Toast de resultado de ação (pause/resume/save/close) — um único helper para
// as páginas em vez de cada uma montar o patch de runtime na mão

export function useActionToast() {
  const { setRuntimeState } = useAppState();

  return useCallback(
    (tone: RuntimeToast["tone"], message: string) => {
      setRuntimeState({ actionToast: { id: Date.now(), tone, message } });
    },
    [setRuntimeState],
  );
}
