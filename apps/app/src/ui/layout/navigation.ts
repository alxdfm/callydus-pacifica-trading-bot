const baseNavigationItems = [
  { to: "/dashboard", labelKey: "navDashboard" },
  { to: "/presets", labelKey: "navPresets" },
  { to: "/trades", labelKey: "navTrades" },
  { to: "/history", labelKey: "navHistory" },
  { to: "/operations", labelKey: "navOperations" },
  { to: "/profile", labelKey: "navProfile" },
] as const;

export function getNavigationItems() {
  return baseNavigationItems;
}
