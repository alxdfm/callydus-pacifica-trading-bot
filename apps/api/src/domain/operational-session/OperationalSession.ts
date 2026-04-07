import type {
  BalanceSnapshot,
  ClosedTrade,
  ExchangeSnapshotStatus,
  OperationalEvent,
  OnboardingStatus,
  OpenTrade,
  OperationalAlert,
  PacificaConnectionStatus,
  PresetActivation,
  SymbolOperationalConfig,
  SyncStatus,
  BotStatus,
} from "@pacifica/contracts";

export type OperationalRuntimeReadModel = {
  balance: BalanceSnapshot | null;
  botStatus: BotStatus;
  syncStatus: SyncStatus;
  pacificaConnectionStatus: PacificaConnectionStatus;
  exchangeSnapshotStatus: ExchangeSnapshotStatus;
  exchangeLastSyncedAt: string | null;
  exchangeSnapshotMessage: string | null;
  activePresetActivationId: string | null;
  symbolOperationalConfigs: SymbolOperationalConfig[];
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
