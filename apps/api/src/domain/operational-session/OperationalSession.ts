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
  MarketInfoItem,
  YourStrategy,
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

type OperationalSessionShell = Pick<
  OperationalSession,
  | "walletAddress"
  | "onboardingStatus"
  | "builderApproved"
  | "operationallyVerified"
  | "activePreset"
  | "canAccessProduct"
>;

export type OperationalProfileSession = OperationalSessionShell &
  Pick<
    OperationalSession,
    | "credentialId"
    | "agentWalletPublicKey"
    | "credentialAlias"
    | "keyFingerprint"
  > & {
    runtime: Pick<
      OperationalRuntimeReadModel,
      "botStatus" | "lastHeartbeatAt" | "lastErrorMessage"
    >;
  };

export type OperationalDashboardSession = OperationalSessionShell & {
  runtime: Pick<
    OperationalRuntimeReadModel,
    | "balance"
    | "botStatus"
    | "syncStatus"
    | "exchangeSnapshotStatus"
    | "exchangeLastSyncedAt"
    | "exchangeSnapshotMessage"
    | "lastErrorMessage"
    | "currentTrades"
    | "closedTrades"
    | "activeAlerts"
  >;
  recentEvents: OperationalEvent[];
};

export type OperationalPresetsSession = OperationalSessionShell & {
  runtime: Pick<
    OperationalRuntimeReadModel,
    "balance" | "botStatus" | "symbolOperationalConfigs"
  >;
  marketInfo: MarketInfoItem[];
  yourStrategy: YourStrategy | null;
};

export type OperationalTradesSession = OperationalSessionShell & {
  runtime: Pick<
    OperationalRuntimeReadModel,
    | "botStatus"
    | "syncStatus"
    | "exchangeSnapshotStatus"
    | "exchangeLastSyncedAt"
    | "exchangeSnapshotMessage"
    | "lastErrorMessage"
    | "currentTrades"
  >;
};

export type OperationalHistorySession = OperationalSessionShell & {
  runtime: Pick<
    OperationalRuntimeReadModel,
    | "botStatus"
    | "syncStatus"
    | "exchangeSnapshotStatus"
    | "exchangeLastSyncedAt"
    | "exchangeSnapshotMessage"
    | "lastErrorMessage"
    | "closedTrades"
  >;
};

export interface OperationalSessionRepository {
  findByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalSession | null>;
  findProfileByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalProfileSession | null>;
  findDashboardByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalDashboardSession | null>;
  findPresetsByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalPresetsSession | null>;
  findTradesByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalTradesSession | null>;
  findHistoryByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalHistorySession | null>;
}
