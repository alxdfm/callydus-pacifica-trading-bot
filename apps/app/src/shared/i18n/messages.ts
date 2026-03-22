export const defaultLocale = "en";

export type AppLocale = typeof defaultLocale;

export const messages = {
  en: {
    appName: "Pacifica",
    appTagline: "Automated trading operations with a guided onboarding flow.",
    topbarStatus: "Sprint 1 foundation",
    navSection: "Navigation",
    navOnboarding: "Onboarding",
    navDashboard: "Dashboard",
    navPresets: "Presets",
    navTrades: "Current Trades",
    navHistory: "History",
    localeLabel: "Language",
    localeName: "English",
    shellBlockedBadge: "Blocked until onboarding is complete",
    shellReadyBadge: "Product routes unlocked",
    shellFoundationTitle: "Sprint 1 app shell",
    shellFoundationDescription:
      "Shared layout, route placeholders and i18n wiring are ready for the next tasks.",
    shellOnboardingHint:
      "Onboarding remains the default entry point until wallet and Agent Wallet validation are implemented.",
    mobileMenuLabel: "Primary navigation",
    pageStatusLabel: "Status",
    pageStatusPlaceholder: "Placeholder",
    pageActionLabel: "Next implementation focus",
    pageOnboardingTitle: "Onboarding",
    pageOnboardingDescription:
      "Wallet connection and Agent Wallet validation will be implemented on top of this shell.",
    pageOnboardingAction: "Continue with V1.3 onboarding UI, V1.4 wallet integration and V1.5 credentials flow.",
    pageDashboardTitle: "Dashboard",
    pageDashboardDescription:
      "Dashboard metrics and live account data will plug into this route after onboarding is valid.",
    pageDashboardAction: "Prepare route guards before wiring live read models.",
    pagePresetsTitle: "Presets",
    pagePresetsDescription:
      "Preset catalog and activation review will be added after Sprint 1 foundations are in place.",
    pagePresetsAction: "Keep this route available for navigation and shared layout validation.",
    pageTradesTitle: "Current Trades",
    pageTradesDescription:
      "Open trades and manual close actions are outside the current implementation slice.",
    pageTradesAction: "Preserve navigation shape without adding unsupported bot actions.",
    pageHistoryTitle: "History",
    pageHistoryDescription:
      "Trade history will arrive later with API-backed contracts and loading states.",
    pageHistoryAction: "Use this placeholder to validate desktop and mobile shell behavior.",
    statePanelTitle: "Session state preview",
    stateWalletStatus: "Wallet session",
    stateCredentialStatus: "Credential validation",
    stateOnboardingStatus: "Onboarding status",
    stateAccessStatus: "Product access",
    stateAccessBlocked: "Blocked",
    stateAccessGranted: "Granted",
    stateMainWalletLabel: "Main wallet",
    stateAgentWalletLabel: "Agent wallet",
    stateLocaleLabel: "Active locale",
    stateEmptyValue: "Not set",
  },
} as const;

export type MessageKey = keyof (typeof messages)[AppLocale];
