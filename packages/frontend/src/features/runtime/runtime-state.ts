export type RuntimeToast = {
  id: number;
  tone: "info" | "success" | "danger";
  message: string;
};

// Pós-migração v2 o runtime global é só o toast — dados de servidor vivem no
// SessionProvider (v2/session.tsx) e nos estados locais das páginas
export type RuntimeState = {
  actionToast: RuntimeToast | null;
};

export function createEmptyRuntimeState(): RuntimeState {
  return { actionToast: null };
}
