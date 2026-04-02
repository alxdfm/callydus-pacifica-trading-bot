import { describe, expect, it, vi } from "vitest";

vi.mock("./router", () => ({
  router: {},
}));

import { createInitialAppState } from "./index";

describe("createInitialAppState", () => {
  it("inicia o bootstrap sem payloads remotos carregados", () => {
    expect(createInitialAppState()).toEqual({
      onboarding: null,
      dashboard: null,
    });
  });
});
