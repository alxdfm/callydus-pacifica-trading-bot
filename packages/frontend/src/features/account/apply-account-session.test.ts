import { describe, expect, it, vi } from "vitest";
import { applyAccountSessionSnapshot } from "./apply-account-session";

describe("applyAccountSessionSnapshot", () => {
  it("hidrata os slices locais a partir do snapshot operacional persistido", () => {
    const setBuilderApprovalState = vi.fn();
    const setCredentialState = vi.fn();
    const setOperationalState = vi.fn();
    const setPresetState = vi.fn();
    const setRuntimeState = vi.fn();
    const setOnboardingState = vi.fn();

    applyAccountSessionSnapshot(
      {
        walletAddress: "wallet-1",
        onboardingStatus: "ready",
        builderApproved: true,
        credentialId: "credential-1",
        agentWalletPublicKey: "agent-1",
        credentialAlias: "Main",
        keyFingerprint: "fingerprint-1",
        operationallyVerified: true,
        activePreset: null,
        canAccessProduct: true,
        runtime: {
          balance: null,
          botStatus: "active",
          syncStatus: "healthy",
          pacificaConnectionStatus: "connected",
          exchangeSnapshotStatus: "confirmed",
          exchangeLastSyncedAt: null,
          exchangeSnapshotMessage: null,
          activePresetActivationId: null,
          lastHeartbeatAt: "2026-04-01T00:00:00.000Z",
          lastErrorMessage: null,
          currentTrades: [],
          closedTrades: [],
          activeAlerts: [],
        },
        recentEvents: [],
      } as never,
      {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
        setOnboardingState,
      },
    );

    expect(setBuilderApprovalState).toHaveBeenCalled();
    expect(setCredentialState).toHaveBeenCalled();
    expect(setOperationalState).toHaveBeenCalled();
    expect(setPresetState).toHaveBeenCalled();
    expect(setRuntimeState).toHaveBeenCalled();
    expect(setOnboardingState).toHaveBeenCalledWith({
      status: "ready",
      accountReady: true,
      accountLookupStatus: "existing_account",
      discoveredWalletAddress: "wallet-1",
      showCompletionModal: false,
    });
  });
});
