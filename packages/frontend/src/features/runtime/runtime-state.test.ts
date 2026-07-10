import { describe, expect, it } from "vitest";
import { createEmptyRuntimeState } from "./runtime-state";

describe("createEmptyRuntimeState", () => {
  it("inicia sem toast pendente", () => {
    expect(createEmptyRuntimeState()).toEqual({ actionToast: null });
  });
});
