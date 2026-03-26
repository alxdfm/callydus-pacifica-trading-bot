import bs58 from "bs58";
import type { PacificaBuilderApprovalSubmission } from "@pacifica/contracts";

const builderCode = import.meta.env.VITE_PACIFICA_BUILDER_CODE?.trim() ?? "";
const maxFeeRate =
  import.meta.env.VITE_PACIFICA_BUILDER_MAX_FEE_RATE?.trim() ?? "";
const defaultExpiryWindow = Number(
  import.meta.env.VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS?.trim() || "30000",
);

export function getBuilderApprovalConfig() {
  return {
    builderCode,
    maxFeeRate,
    expiryWindow: defaultExpiryWindow,
  };
}

export async function createSignedBuilderApprovalSubmission(input: {
  mainWalletPublicKey: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<PacificaBuilderApprovalSubmission> {
  if (!builderCode || !maxFeeRate) {
    throw new Error(
      "Builder approval is not configured in the frontend environment.",
    );
  }

  const timestamp = Date.now();
  const payloadToSign = {
    timestamp,
    expiry_window: defaultExpiryWindow,
    type: "approve_builder_code",
    data: {
      builder_code: builderCode,
      max_fee_rate: maxFeeRate,
    },
  };
  const compactMessage = JSON.stringify(sortKeysDeep(payloadToSign));
  const messageBytes = new TextEncoder().encode(compactMessage);
  const signatureBytes = await input.signMessage(messageBytes);

  return {
    mainWalletPublicKey: input.mainWalletPublicKey.trim(),
    builderCode,
    maxFeeRate,
    timestamp,
    expiryWindow: defaultExpiryWindow,
    signature: bs58.encode(signatureBytes),
  };
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([leftKey], [rightKey]) => leftKey.localeCompare(rightKey),
    );

    return Object.fromEntries(
      entries.map(([key, itemValue]) => [key, sortKeysDeep(itemValue)]),
    );
  }

  return value;
}
