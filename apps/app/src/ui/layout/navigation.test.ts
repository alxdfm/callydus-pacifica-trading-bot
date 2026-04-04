import { describe, expect, it } from "vitest";
import { getNavigationItems } from "./navigation";

describe("getNavigationItems", () => {
  it("mantém apenas a navegação principal sem expor onboarding no menu", () => {
    expect(getNavigationItems().map((item) => item.to)).toEqual([
      "/dashboard",
      "/presets",
      "/trades",
      "/history",
      "/profile",
    ]);
  });
});
