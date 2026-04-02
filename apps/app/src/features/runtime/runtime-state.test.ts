import { describe, expect, it } from "vitest";
import { createEmptyRuntimeState } from "./runtime-state";

describe("createEmptyRuntimeState", () => {
  it("cria um runtime inicial seguro e sem dados operacionais sensíveis", () => {
    expect(createEmptyRuntimeState()).toEqual({
      balance: null,
      botStatus: "inactive",
      syncStatus: "idle",
      exchangeSnapshotStatus: "last_known",
      exchangeLastSyncedAt: null,
      exchangeSnapshotMessage: null,
      currentTrades: [],
      closedTrades: [],
      alerts: [],
      events: [],
      screenStatus: "idle",
      lastRuntimeMessage: null,
    });
  });
});
