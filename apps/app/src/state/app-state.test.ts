import { describe, expect, it } from "vitest";
import {
  areObjectsShallowEqual,
  createInitialAppSessionState,
  deriveCanAccessProduct,
  parseStoredState,
  sanitizeStateForPersistence,
} from "./app-state";

describe("app-state pure logic", () => {
  it("cria sessão inicial segura para onboarding", () => {
    const state = createInitialAppSessionState();

    expect(state.onboarding.status).toBe("wallet_pending");
    expect(state.runtime.botStatus).toBe("inactive");
    expect(state.credentials.agentWalletPrivateKey).toBeNull();
  });

  it("descarta chaves privadas persistidas e normaliza estados inválidos", () => {
    const state = parseStoredState(
      JSON.stringify({
        wallet: {
          provider: "random-wallet",
          sessionStatus: "unknown",
        },
        credentials: {
          agentWalletPrivateKey: "secret",
          validationStatus: "weird",
        },
      }),
    );

    expect(state.wallet.sessionStatus).toBe("disconnected");
    expect(state.wallet.provider).toBeNull();
    expect(state.credentials.validationStatus).toBe("pending");
    expect(state.credentials.agentWalletPrivateKey).toBeNull();
  });

  it("só libera acesso ao produto quando todos os gates obrigatórios passaram", () => {
    const baseState = createInitialAppSessionState();

    expect(deriveCanAccessProduct(baseState)).toBe(false);

    const readyState = {
      ...baseState,
      wallet: {
        ...baseState.wallet,
        sessionStatus: "connected" as const,
      },
      builderApproval: {
        ...baseState.builderApproval,
        approvalStatus: "approved" as const,
      },
      credentials: {
        ...baseState.credentials,
        validationStatus: "valid" as const,
      },
      operational: {
        ...baseState.operational,
        status: "verified" as const,
      },
      onboarding: {
        ...baseState.onboarding,
        status: "ready" as const,
        accountReady: true,
      },
    };

    expect(deriveCanAccessProduct(readyState)).toBe(true);
  });

  it("remove segredo da Agent Wallet antes da persistência local", () => {
    const state = createInitialAppSessionState();
    state.credentials.agentWalletPrivateKey = "secret";

    expect(sanitizeStateForPersistence(state).credentials.agentWalletPrivateKey).toBeNull();
  });

  it("não reidrata estados transitórios que deixam o onboarding travado", () => {
    const state = createInitialAppSessionState();

    state.wallet.sessionStatus = "connected";
    state.builderApproval.approvalStatus = "approving";
    state.builderApproval.lastMessage = "Requesting wallet signature for builder approval.";
    state.credentials.validationStatus = "validating";
    state.credentials.agentWalletPrivateKey = "secret";
    state.operational.status = "verifying";
    state.onboarding.status = "credentials_validating";
    state.onboarding.accountLookupStatus = "new_account";
    state.onboarding.showCompletionModal = true;

    const persistedState = sanitizeStateForPersistence(state);
    const rehydratedState = parseStoredState(JSON.stringify(persistedState));

    expect(rehydratedState.wallet.sessionStatus).toBe("connected");
    expect(rehydratedState.builderApproval.approvalStatus).toBe("pending");
    expect(rehydratedState.builderApproval.lastMessage).toBeNull();
    expect(rehydratedState.credentials.validationStatus).toBe("pending");
    expect(rehydratedState.credentials.agentWalletPrivateKey).toBeNull();
    expect(rehydratedState.operational.status).toBe("pending");
    expect(rehydratedState.onboarding.status).toBe("credentials_pending");
    expect(rehydratedState.onboarding.accountLookupStatus).toBe("new_account");
    expect(rehydratedState.onboarding.showCompletionModal).toBe(false);
  });

  it("compara objetos rasos de forma estável", () => {
    expect(areObjectsShallowEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(areObjectsShallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});
