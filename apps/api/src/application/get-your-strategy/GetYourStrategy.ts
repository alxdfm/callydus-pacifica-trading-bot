import type {
  GetYourStrategyRequest,
  GetYourStrategyResponse,
} from "@pacifica/contracts";
import type { YourStrategyRepository } from "../../domain/your-strategy/YourStrategyRepository";

export type GetYourStrategyDependencies = {
  repository: YourStrategyRepository;
};

/**
 * Creates the read use case for the account-scoped YOUR Strategy record.
 *
 * Responsibility:
 * - resolve the persisted custom strategy by wallet
 * - keep the response shape explicit for found/not-found cases
 */
export function createGetYourStrategy(
  dependencies: GetYourStrategyDependencies,
){
  /**
   * Reads the saved YOUR Strategy for the connected account.
   */
  return async function getYourStrategy(
    input: GetYourStrategyRequest,
  ): Promise<GetYourStrategyResponse> {
    const strategy = await dependencies.repository.findYourStrategyByWalletAddress(
      input.walletAddress,
    );

    if (!strategy) {
      return {
        status: "not_found",
        walletAddress: input.walletAddress,
      };
    }

    return {
      status: "found",
      strategy,
    };
  };
}
