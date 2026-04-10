import type {
  PresetTechnicalContract,
  YourStrategy,
  YourStrategyActivationBlocker,
  YourStrategyDraft,
} from "@pacifica/contracts";

export type SaveYourStrategyRepositoryInput = {
  walletAddress: string;
  draft: YourStrategyDraft;
  materializedTechnicalContract: PresetTechnicalContract | null;
  activationBlockers: YourStrategyActivationBlocker[];
};

export type SaveYourStrategyRepositoryResult =
  | {
      ok: true;
      strategy: YourStrategy;
    }
  | {
      ok: false;
      code: "account_not_ready" | "editing_blocked_while_bot_running";
    };

export interface YourStrategyRepository {
  findYourStrategyByWalletAddress(walletAddress: string): Promise<YourStrategy | null>;
  saveYourStrategy(
    input: SaveYourStrategyRepositoryInput,
  ): Promise<SaveYourStrategyRepositoryResult>;
  recordSuccessfulYourStrategyBacktestPreview(input: {
    walletAddress: string;
    fingerprint: string;
    previewedAtIso: string;
  }): Promise<void>;
}
