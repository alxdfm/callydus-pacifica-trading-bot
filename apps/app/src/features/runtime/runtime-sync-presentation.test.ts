import { describe, expect, it } from "vitest";
import {
  getDashboardRuntimeSyncPresentation,
  getSecondaryRuntimeSyncPresentation,
} from "./runtime-sync-presentation";

const t = (key: string) => key;

describe("runtime-sync-presentation", () => {
  it("prioriza o aviso de last_known quando o snapshot externo está degradado", () => {
    const result = getDashboardRuntimeSyncPresentation(
      "healthy",
      "last_known",
      null,
      "2026-04-01T00:00:00.000Z",
      null,
      t,
    );

    expect(result.show).toBe(true);
    expect(result.tone).toBe("warning");
    expect(result.title).toBe("runtimeExchangeLastKnownTitle");
  });

  it("mostra erro de sync secundário apenas em degraded/error ou last_known", () => {
    expect(
      getSecondaryRuntimeSyncPresentation(
        "healthy",
        "confirmed",
        null,
        null,
        null,
        t,
      ),
    ).toEqual({
      show: false,
      tone: "neutral",
      title: "",
      message: "",
    });
  });
});
