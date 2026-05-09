const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3003";

export type AuthNonceResponse =
  | { status: "ok"; nonce: string; expiresAt: string; message: string }
  | { status: "error"; code: string; message: string };

export type AuthVerifyResponse =
  | { status: "ok"; token: string; expiresAt: string }
  | { status: "error"; code: string; message: string };

export async function fetchAuthNonce(
  walletAddress: string,
): Promise<AuthNonceResponse> {
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/auth/nonce?wallet=${encodeURIComponent(walletAddress)}`,
    );
    return (await response.json()) as AuthNonceResponse;
  } catch {
    return {
      status: "error",
      code: "network_error",
      message: "Could not reach the authentication server.",
    };
  }
}

export async function verifyAuthSignature(input: {
  walletAddress: string;
  nonce: string;
  expiresAt: string;
  signature: string; // base64
}): Promise<AuthVerifyResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await response.json()) as AuthVerifyResponse;
  } catch {
    return {
      status: "error",
      code: "network_error",
      message: "Could not reach the authentication server.",
    };
  }
}
