import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";

export function verifySolanaWalletSignature(input: {
  walletAddress: string;
  message: string;
  signature: string; // base64
}): boolean {
  try {
    const publicKeyBytes = bs58.decode(input.walletAddress);
    const messageBytes = new TextEncoder().encode(input.message);
    const signatureBytes = Buffer.from(input.signature, "base64");
    return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
