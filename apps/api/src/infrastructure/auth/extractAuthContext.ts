import type { BearerTokenService } from "./BearerTokenService";

export type AuthContext = { walletAddress: string };

export function extractAuthContext(
  authorizationHeader: string | undefined,
  tokenService: BearerTokenService,
): AuthContext | null {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice(7);
  const result = tokenService.verify(token);
  return result.valid ? { walletAddress: result.walletAddress } : null;
}
