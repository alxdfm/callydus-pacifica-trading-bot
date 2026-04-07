import bs58 from "bs58";
import {
  createPacificaBuilderApprovalSigningPayload,
  pacificaBuilderApprovalSubmissionSchema,
  serializePacificaSigningPayload,
  type PacificaBuilderApprovalSubmission,
} from "@pacifica/contracts";

const builderCode = import.meta.env.VITE_PACIFICA_BUILDER_CODE?.trim() ?? "";
const maxFeeRate =
  import.meta.env.VITE_PACIFICA_BUILDER_MAX_FEE_RATE?.trim() ?? "";
const defaultExpiryWindow = parseExpiryWindow(
  import.meta.env.VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
);

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
  const payloadToSign = createPacificaBuilderApprovalSigningPayload({
    builderCode,
    maxFeeRate,
    timestamp,
    expiryWindow: defaultExpiryWindow,
  });
  const compactMessage = serializePacificaSigningPayload(payloadToSign);
  const messageBytes = new TextEncoder().encode(compactMessage);
  const signatureBytes = await input.signMessage(messageBytes);

  return pacificaBuilderApprovalSubmissionSchema.parse({
    mainWalletPublicKey: input.mainWalletPublicKey.trim(),
    builderCode,
    maxFeeRate,
    timestamp,
    expiryWindow: defaultExpiryWindow,
    signature: bs58.encode(signatureBytes),
  });
}

function parseExpiryWindow(rawValue: string | undefined) {
  const normalizedValue = rawValue?.trim() || "30000";
  const parsedValue = Number(normalizedValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      "VITE_PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS must be a positive integer.",
    );
  }

  return parsedValue;
}
