import type { OperationalSessionRepository } from "../../domain/operational-session/OperationalSession";

export type GetOperationalSessionByWalletInput = {
  walletAddress: string;
};

export type GetOperationalSessionByWalletOutput =
  | {
      ok: true;
      accountExists: true;
      session: Awaited<
        ReturnType<OperationalSessionRepository["findByWalletAddress"]>
      > extends infer T
        ? Exclude<T, null>
        : never;
    }
  | {
      ok: true;
      accountExists: false;
      walletAddress: string;
    };

export type GetOperationalSessionByWalletDependencies = {
  operationalSessionRepository: OperationalSessionRepository;
};

export function createGetOperationalSessionByWallet(
  dependencies: GetOperationalSessionByWalletDependencies,
) {
  return async function getOperationalSessionByWallet(
    input: GetOperationalSessionByWalletInput,
  ): Promise<GetOperationalSessionByWalletOutput> {
    const session =
      await dependencies.operationalSessionRepository.findByWalletAddress(
        input.walletAddress,
      );

    if (!session) {
      return {
        ok: true,
        accountExists: false,
        walletAddress: input.walletAddress,
      };
    }

    return {
      ok: true,
      accountExists: true,
      session,
    };
  };
}
