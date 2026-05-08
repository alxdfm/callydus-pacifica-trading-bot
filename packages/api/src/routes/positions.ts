import { Hono } from "hono";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import { getAccountByWallet, getCredentialByAccountId } from "../db/queries/accounts.js";
import { AesCredentialEncryptionService } from "../crypto/credential-encryption.js";
import { PacificaClient } from "../exchange/pacifica/client.js";
import { PacificaAdapter } from "../exchange/pacifica/adapter.js";

export function positionsRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // GET /api/positions
  app.get("/", async (c) => {
    const walletAddress = c.get("walletAddress");

    const account = await getAccountByWallet(deps.db, walletAddress);

    if (!account) {
      return c.json({ positions: [] });
    }

    const credential = await getCredentialByAccountId(deps.db, account.id);

    if (!credential) {
      return c.json({ positions: [] });
    }

    const encryptionService = new AesCredentialEncryptionService(
      deps.env.CREDENTIAL_ENCRYPTION_KEY,
      deps.env.CREDENTIAL_ENCRYPTION_KEY_ID,
    );

    let privateKey: string;
    try {
      privateKey = await encryptionService.decryptAgentWalletPrivateKey({
        encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
      });
    } catch {
      return c.json({ positions: [] });
    }

    const client = new PacificaClient({
      apiBaseUrl: deps.env.PACIFICA_REST_BASE_URL,
      account: walletAddress,
      privateKey,
      agentWallet: credential.publicKey,
      builderCode: deps.env.PACIFICA_BUILDER_CODE,
      expiryWindowMs: deps.env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
    });

    const adapter = new PacificaAdapter(client);

    try {
      const positions = await adapter.getPositions();
      return c.json({ positions });
    } catch {
      return c.json({ positions: [] });
    }
  });

  return app;
}
