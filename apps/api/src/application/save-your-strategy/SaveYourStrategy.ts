import {
  materializeYourStrategyTechnicalContract,
} from "@pacifica/preset-engine";
import type {
  SaveYourStrategyRequest,
  SaveYourStrategyResponse,
} from "@pacifica/contracts";
import type { YourStrategyRepository } from "../../domain/your-strategy/YourStrategyRepository";

export type SaveYourStrategyDependencies = {
  repository: YourStrategyRepository;
};

/**
 * Creates the save use case for the account-scoped YOUR Strategy record.
 *
 * Responsibility:
 * - persist exactly one custom strategy per account
 * - materialize the current draft into the canonical technical contract when possible
 * - block edits while the bot is actively operating
 */
export function createSaveYourStrategy(
  dependencies: SaveYourStrategyDependencies,
) {
  /**
   * Saves the current YOUR Strategy draft for the connected account.
   */
  return async function saveYourStrategy(
    input: SaveYourStrategyRequest,
  ): Promise<SaveYourStrategyResponse> {
    const materialized = materializeYourStrategyTechnicalContract(input.draft);
    const result = await dependencies.repository.saveYourStrategy({
      walletAddress: input.walletAddress,
      draft: input.draft,
      materializedTechnicalContract: materialized.technicalContract,
      activationBlockers: materialized.activationBlockers,
    });

    if (!result.ok) {
      switch (result.code) {
        case "account_not_ready":
          return {
            status: "error",
            code: "account_not_ready",
            message: "Could not resolve an operational account for this wallet.",
            retryable: false,
          };
        case "editing_blocked_while_bot_running":
          return {
            status: "error",
            code: "editing_blocked_while_bot_running",
            message: "Pause the bot before editing YOUR Strategy.",
            retryable: false,
          };
        default:
          return {
            status: "error",
            code: "internal_error",
            message: "YOUR Strategy could not be saved right now.",
            retryable: true,
          };
      }
    }

    return {
      status: "success",
      strategy: result.strategy,
      message: "YOUR Strategy saved successfully.",
    };
  };
}
