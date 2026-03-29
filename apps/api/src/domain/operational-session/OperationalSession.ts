import type {
  BalanceSnapshot,
  ClosedTrade,
  OperationalEvent,
  OnboardingStatus,
  OpenTrade,
  OperationalAlert,
  PacificaConnectionStatus,
  PresetActivation,
  SyncStatus,
  BotStatus,
} from "@pacifica/contracts";

export type OperationalRuntimeReadModel = {
  balance: BalanceSnapshot | null;
  botStatus: BotStatus;
  syncStatus: SyncStatus;
  pacificaConnectionStatus: PacificaConnectionStatus;
  activePresetActivationId: string | null;
  lastHeartbeatAt: string | null;
  lastErrorMessage: string | null;
  currentTrades: OpenTrade[];
  closedTrades: ClosedTrade[];
  activeAlerts: OperationalAlert[];
};

export type OperationalSession = {
  walletAddress: string;
  onboardingStatus: OnboardingStatus;
  credentialId: string | null;
  agentWalletPublicKey: string | null;
  credentialAlias: string | null;
  keyFingerprint: string | null;
  builderApproved: boolean;
  operationallyVerified: boolean;
  activePreset: PresetActivation | null;
  runtime: OperationalRuntimeReadModel;
  recentEvents: OperationalEvent[];
  canAccessProduct: boolean;
};

export interface OperationalSessionRepository {
  findByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalSession | null>;
}
