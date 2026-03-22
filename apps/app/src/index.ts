import type { DashboardContract, OnboardingContract } from "@pacifica/contracts";

export type AppBootstrapState = {
  onboarding: OnboardingContract | null;
  dashboard: DashboardContract | null;
};

export function createInitialAppState(): AppBootstrapState {
  return {
    onboarding: null,
    dashboard: null,
  };
}
