import { and, eq, gt, isNull, lt, ne } from "drizzle-orm";
import type { DrizzleDb } from "../client.js";
import { accounts, authNonces, credentials } from "../schema.js";

export type Account = typeof accounts.$inferSelect;
export type Credential = typeof credentials.$inferSelect;
export type AuthNonce = typeof authNonces.$inferSelect;

export async function getAccountByWallet(
  db: DrizzleDb,
  walletAddress: string,
): Promise<Account | null> {
  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.walletAddress, walletAddress));
  return rows[0] ?? null;
}

export async function upsertAccount(
  db: DrizzleDb,
  walletAddress: string,
  patch: Partial<Pick<Account, "onboardingStatus">>,
): Promise<Account> {
  const existing = await getAccountByWallet(db, walletAddress);

  if (existing) {
    const rows = await db
      .update(accounts)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(accounts.walletAddress, walletAddress))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Account update returned no rows.");
    return row;
  }

  const rows = await db
    .insert(accounts)
    .values({ walletAddress, ...patch })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Account insert returned no rows.");
  return row;
}

export async function getCredentialByAccountId(
  db: DrizzleDb,
  accountId: string,
): Promise<Credential | null> {
  const rows = await db
    .select()
    .from(credentials)
    .where(
      and(
        eq(credentials.accountId, accountId),
        eq(credentials.validationStatus, "valid"),
        eq(credentials.lifecycleStatus, "active"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertCredential(
  db: DrizzleDb,
  input: {
    id: string;
    accountId: string;
    publicKey: string;
    encryptedPrivateKeyRef: string;
    keyFingerprint: string;
    credentialAlias?: string | null;
    validationStatus: string;
    lifecycleStatus: string;
    operationallyVerified: boolean;
    lastValidatedAt?: Date | null;
    lastValidationErrorCode?: string | null;
    lastOperationalVerifiedAt?: Date | null;
    lastOperationalErrorCode?: string | null;
    lastOperationalProbeJson?: unknown;
  },
): Promise<Credential> {
  // Retire existing active credentials for this account
  await db
    .update(credentials)
    .set({ lifecycleStatus: "replaced", operationallyVerified: false })
    .where(
      and(
        eq(credentials.accountId, input.accountId),
        eq(credentials.lifecycleStatus, "active"),
        ne(credentials.id, input.id),
      ),
    );

  const rows = await db
    .insert(credentials)
    .values({
      id: input.id,
      accountId: input.accountId,
      publicKey: input.publicKey,
      encryptedPrivateKeyRef: input.encryptedPrivateKeyRef,
      keyFingerprint: input.keyFingerprint,
      credentialAlias: input.credentialAlias ?? null,
      validationStatus: input.validationStatus,
      lifecycleStatus: input.lifecycleStatus,
      operationallyVerified: input.operationallyVerified,
      lastValidatedAt: input.lastValidatedAt ?? null,
      lastValidationErrorCode: input.lastValidationErrorCode ?? null,
      lastOperationalVerifiedAt: input.lastOperationalVerifiedAt ?? null,
      lastOperationalErrorCode: input.lastOperationalErrorCode ?? null,
      lastOperationalProbeJson: input.lastOperationalProbeJson ?? null,
    })
    .onConflictDoUpdate({
      target: credentials.id,
      set: {
        validationStatus: input.validationStatus,
        lifecycleStatus: input.lifecycleStatus,
        operationallyVerified: input.operationallyVerified,
        lastValidatedAt: input.lastValidatedAt ?? null,
        lastValidationErrorCode: input.lastValidationErrorCode ?? null,
        lastOperationalVerifiedAt: input.lastOperationalVerifiedAt ?? null,
        lastOperationalErrorCode: input.lastOperationalErrorCode ?? null,
        lastOperationalProbeJson: input.lastOperationalProbeJson ?? null,
      },
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Credential upsert returned no rows.");
  return row;
}

export async function getNonceByWallet(
  db: DrizzleDb,
  walletAddress: string,
  nonce: string,
): Promise<AuthNonce | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(authNonces)
    .where(
      and(
        eq(authNonces.walletAddress, walletAddress),
        eq(authNonces.nonce, nonce),
        isNull(authNonces.usedAt),
        gt(authNonces.expiresAt, now),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertNonce(
  db: DrizzleDb,
  input: {
    walletAddress: string;
    nonce: string;
    expiresAt: Date;
  },
): Promise<void> {
  // Lazy cleanup of expired nonces
  await db
    .delete(authNonces)
    .where(lt(authNonces.expiresAt, new Date()));

  await db.insert(authNonces).values({
    walletAddress: input.walletAddress,
    nonce: input.nonce,
    expiresAt: input.expiresAt,
  });
}

export async function deleteNonce(
  db: DrizzleDb,
  nonce: string,
): Promise<void> {
  await db.delete(authNonces).where(eq(authNonces.nonce, nonce));
}

export async function consumeNonce(
  db: DrizzleDb,
  nonce: string,
  walletAddress: string,
): Promise<{ valid: boolean }> {
  const now = new Date();
  const rows = await db
    .update(authNonces)
    .set({ usedAt: now })
    .where(
      and(
        eq(authNonces.nonce, nonce),
        eq(authNonces.walletAddress, walletAddress),
        isNull(authNonces.usedAt),
        gt(authNonces.expiresAt, now),
      ),
    )
    .returning();
  return { valid: rows.length > 0 };
}
