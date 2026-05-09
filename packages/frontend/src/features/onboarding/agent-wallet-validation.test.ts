import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { validateAgentWalletLocally } from "./agent-wallet-validation";

describe("validateAgentWalletLocally", () => {
  beforeAll(() => {
    Object.assign(globalThis, {
      window: globalThis,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("falha quando a wallet principal não está conectada", async () => {
    vi.useFakeTimers();

    const promise = validateAgentWalletLocally({
      mainWalletPublicKey: " ",
      agentWalletPublicKey: "agent",
      agentWalletPrivateKey: "secret",
      credentialAlias: null,
    });

    await vi.advanceTimersByTimeAsync(700);

    await expect(promise).resolves.toMatchObject({
      status: "error",
      code: "wallet_not_connected",
      canProceed: false,
      field: "mainWalletPublicKey",
    });
  });

  it("falha quando a public key da Agent Wallet é inválida", async () => {
    vi.useFakeTimers();

    const promise = validateAgentWalletLocally({
      mainWalletPublicKey: Keypair.generate().publicKey.toBase58(),
      agentWalletPublicKey: "invalid",
      agentWalletPrivateKey: "secret",
      credentialAlias: null,
    });

    await vi.advanceTimersByTimeAsync(700);

    await expect(promise).resolves.toMatchObject({
      status: "invalid",
      code: "invalid_agent_wallet_format",
      canProceed: false,
      field: "agentWalletPublicKey",
    });
  });

  it("valida credencial quando a Agent Wallet usa secret base58 correspondente", async () => {
    vi.useFakeTimers();
    const agentWallet = Keypair.generate();

    const promise = validateAgentWalletLocally({
      mainWalletPublicKey: Keypair.generate().publicKey.toBase58(),
      agentWalletPublicKey: agentWallet.publicKey.toBase58(),
      agentWalletPrivateKey: bs58.encode(agentWallet.secretKey),
      credentialAlias: "Main",
    });

    await vi.advanceTimersByTimeAsync(700);

    await expect(promise).resolves.toMatchObject({
      status: "valid",
      mainWalletPublicKey: expect.any(String),
      agentWalletPublicKey: agentWallet.publicKey.toBase58(),
      validationStatus: "valid",
      canProceed: true,
    });
  });
});
