import { z } from "zod";
import { apiErrorSchema } from "./common.js";
import { strategySchema } from "./strategy.js";

// ---------------------------------------------------------------------------
// GET /api/v2/session — o snapshot único de hidratação. Substitui os seis
// snapshots do v1 (/session, /profile, /dashboard, /presets, /trades,
// /history) e o canAccessProduct de 6 condições em 4 slices.
//
// Regras de desenho:
// - `access` é derivado NO SERVIDOR — o cliente não recombina flags
// - `strategy.status` é a única fonte de "bot rodando" (não existe botStatus)
// - `balanceUsd` é o available_to_spend REAL da Pacifica (null se indisponível)
// - nada de campos sem lastro (syncStatus/exchangeSnapshotStatus do v1 eram
//   literais fixos que nunca refletiram nada)
// ---------------------------------------------------------------------------

export const credentialSummarySchema = z.object({
  id: z.string().uuid(),
  agentWalletPublicKey: z.string().min(1),
  alias: z.string().nullable(),
  keyFingerprint: z.string().min(1),
  operationallyVerified: z.boolean(),
});

export const accessStatusSchema = z.enum(["ready", "onboarding_required"]);

export const sessionResponseSchema = z.union([
  z.object({
    status: z.literal("ok"),
    walletAddress: z.string().min(1),
    access: accessStatusSchema,
    credential: credentialSummarySchema.nullable(),
    strategy: strategySchema.nullable(),
    balanceUsd: z.number().nullable(),
  }),
  apiErrorSchema,
]);

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type CredentialSummary = z.infer<typeof credentialSummarySchema>;
export type AccessStatus = z.infer<typeof accessStatusSchema>;
