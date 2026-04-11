import { describe, expect, it } from "vitest";
import {
  createEmptyRuntimeState,
  createRuntimePersistentFeedback,
} from "./runtime-state";

describe("createEmptyRuntimeState", () => {
  it("cria um runtime inicial seguro e sem dados operacionais sensíveis", () => {
    expect(createEmptyRuntimeState()).toEqual({
      balance: null,
      botStatus: "inactive",
      syncStatus: "idle",
      exchangeSnapshotStatus: "last_known",
      exchangeLastSyncedAt: null,
      exchangeSnapshotMessage: null,
      symbolOperationalConfigs: [],
      currentTrades: [],
      closedTrades: [],
      alerts: [],
      events: [],
      screenStatus: "idle",
      lastRuntimeMessage: null,
      actionToast: null,
    });
  });

  it("converte mensagem persistente de runtime em estado de erro coerente", () => {
    expect(createRuntimePersistentFeedback("Pacifica unavailable")).toEqual({
      screenStatus: "error",
      lastRuntimeMessage: "Pacifica unavailable",
    });

    expect(createRuntimePersistentFeedback(null)).toEqual({
      screenStatus: "ready",
      lastRuntimeMessage: null,
    });
  });
});
