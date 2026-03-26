export type ApiEnvironment = {
  pacificaRestBaseUrl: string;
  pacificaSignatureExpiryWindowMs: number;
  pacificaBuilderCode: string;
  pacificaBuilderMaxFeeRate: string;
  pacificaAccountPrivateKey: string;
  credentialEncryptionKey: string;
  credentialEncryptionKeyId: string;
};

export function createApiEnvironment(
  input: Partial<ApiEnvironment> = {},
): ApiEnvironment {
  return {
    pacificaRestBaseUrl: input.pacificaRestBaseUrl ?? "https://api.pacifica.fi",
    pacificaSignatureExpiryWindowMs:
      input.pacificaSignatureExpiryWindowMs ?? 30000,
    pacificaBuilderCode: input.pacificaBuilderCode ?? "",
    pacificaBuilderMaxFeeRate: input.pacificaBuilderMaxFeeRate ?? "",
    pacificaAccountPrivateKey: input.pacificaAccountPrivateKey ?? "",
    credentialEncryptionKey: input.credentialEncryptionKey ?? "",
    credentialEncryptionKeyId: input.credentialEncryptionKeyId ?? "local-dev-v1",
  };
}
