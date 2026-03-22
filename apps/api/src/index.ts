import type {
  DashboardContract,
  HistoryContract,
  OnboardingContract,
  PresetCatalogContract,
} from "@pacifica/contracts";

export type ApiReadModels = {
  onboarding: OnboardingContract;
  dashboard: DashboardContract;
  presets: PresetCatalogContract;
  history: HistoryContract;
};

export function createApiModule(): { name: string } {
  return { name: "pacifica-api" };
}
