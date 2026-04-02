import { describe, expect, it } from "vitest";
import { getNavigationItems } from "./navigation";

describe("getNavigationItems", () => {
  it("inclui onboarding quando o produto ainda depende do fluxo inicial", () => {
    expect(getNavigationItems(true)[0]).toEqual({
      to: "/onboarding",
      labelKey: "navOnboarding",
    });
  });

  it("mantém apenas a navegação principal quando onboarding não deve aparecer", () => {
    expect(getNavigationItems(false).map((item) => item.to)).toEqual([
      "/dashboard",
      "/presets",
      "/trades",
      "/history",
      "/profile",
    ]);
  });
});
