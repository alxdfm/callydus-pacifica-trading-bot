import { describe, expect, it, vi } from "vitest";
import {
  SAFER_PRESET_DEFINITION_ID,
  type PresetActivationRequest,
} from "@pacifica/contracts";
import { createActivatePreset } from "./ActivatePreset";

function createRequest(): PresetActivationRequest {
  return {
    walletAddress: "wallet-1",
    presetDefinitionId: SAFER_PRESET_DEFINITION_ID,
    editableConfig: {
      symbol: "ETH/USDC",
      positionSizeType: "balance_percent",
      positionSizeValue: 7,
      longEnabled: false,
      shortEnabled: true,
    },
  };
}

describe("createActivatePreset", () => {
  it("bloqueia ativação sem wallet conectada", async () => {
    const activatePreset = createActivatePreset({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn(),
      },
      presetActivationRepository: {
        activatePreset: vi.fn(),
      } as never,
    });

    const result = await activatePreset({
      ...createRequest(),
      walletAddress: "   ",
    });

    expect(result).toEqual({
      status: "error",
      code: "wallet_not_connected",
      message: "Connect the main wallet before activating a preset.",
      retryable: false,
    });
  });

  it("exige conta pronta e operacionalmente verificada", async () => {
    const activatePreset = createActivatePreset({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue({
          onboardingStatus: "credentials_pending",
          operationallyVerified: false,
        }),
      },
      presetActivationRepository: {
        activatePreset: vi.fn(),
      } as never,
    });

    const result = await activatePreset(createRequest());

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("account_not_ready");
    }
  });

  it("materializa o contrato efetivo com os campos editáveis do produto", async () => {
    const activatePresetRepository = vi.fn().mockResolvedValue({
      activation: {
        id: "activation-1",
        operatorAccountId: "operator-1",
        presetDefinitionId: SAFER_PRESET_DEFINITION_ID,
        activationStatus: "active",
        editableConfig: createRequest().editableConfig,
        activatedAt: "2026-04-01T00:00:00.000Z",
        deactivatedAt: null,
      },
      runtime: {
        botStatus: "inactive",
        pacificaConnectionStatus: "connected",
        syncStatus: "idle",
        exchangeSnapshotStatus: "last_known",
        exchangeLastSyncedAt: null,
        exchangeSnapshotMessage: null,
        activePresetActivationId: "activation-1",
        lastHeartbeatAt: null,
        lastErrorMessage: null,
      },
    });
    const appendOperationalEvent = vi.fn();
    const activatePreset = createActivatePreset({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue({
          onboardingStatus: "ready",
          operationallyVerified: true,
        }),
      },
      presetActivationRepository: {
        activatePreset: activatePresetRepository,
      } as never,
      eventRepository: {
        appendOperationalEvent,
      } as never,
      now: () => new Date("2026-04-01T12:00:00.000Z"),
    });

    const result = await activatePreset(createRequest());

    expect(result.status).toBe("success");
    expect(activatePresetRepository).toHaveBeenCalledTimes(1);
    expect(
      activatePresetRepository.mock.calls[0]?.[0].effectiveContract.symbol,
    ).toBe("ETH/USDC");
    expect(
      activatePresetRepository.mock.calls[0]?.[0].effectiveContract.entry.long.enabled,
    ).toBe(false);
    expect(
      activatePresetRepository.mock.calls[0]?.[0].effectiveContract.entry.short.enabled,
    ).toBe(true);
    expect(
      activatePresetRepository.mock.calls[0]?.[0].effectiveContract.execution.positionSize.value,
    ).toBe(7);
    expect(appendOperationalEvent).toHaveBeenCalledTimes(1);
  });
});
