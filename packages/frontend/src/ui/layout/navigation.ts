const baseNavigationItems = [
  { to: "/dashboard", labelKey: "navDashboard" },
  { to: "/strategies", labelKey: "navPresets" },
  { to: "/trades", labelKey: "navTrades" },
  { to: "/profile", labelKey: "navProfile" },
] as const;

export function getNavigationItems() {
  return baseNavigationItems;
}
