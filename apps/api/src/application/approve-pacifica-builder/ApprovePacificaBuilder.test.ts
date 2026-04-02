import { describe, expect, it, vi } from "vitest";
import { createApprovePacificaBuilder } from "./ApprovePacificaBuilder";

const input = {
  mainWalletPublicKey: "wallet-1",
  builderCode: "builder-code",
  maxFeeRate: "0.1",
  timestamp: 123,
  expiryWindow: 10_000,
  signature: "signature",
};

describe("createApprovePacificaBuilder", () => {
  it("exige wallet conectada", async () => {
    const approvePacificaBuilder = createApprovePacificaBuilder({
      builderApproval: {
        approveBuilderCode: vi.fn(),
      } as never,
    });

    const result = await approvePacificaBuilder({
      ...input,
      mainWalletPublicKey: " ",
    });

    expect(result).toEqual({
      ok: false,
      errorCode: "wallet_not_connected",
    });
  });

  it("encaminha o payload integral para a porta externa", async () => {
    const approveBuilderCode = vi.fn().mockResolvedValue({
      ok: true,
      approvedAt: "2026-04-01T00:00:00.000Z",
    });
    const approvePacificaBuilder = createApprovePacificaBuilder({
      builderApproval: {
        approveBuilderCode,
      } as never,
    });

    const result = await approvePacificaBuilder(input);

    expect(result).toEqual({
      ok: true,
      approvedAt: "2026-04-01T00:00:00.000Z",
    });
    expect(approveBuilderCode).toHaveBeenCalledWith(input);
  });
});
