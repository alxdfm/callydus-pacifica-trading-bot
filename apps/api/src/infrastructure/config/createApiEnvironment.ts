export type ApiEnvironment = {
  pacificaRestBaseUrl: string;
  pacificaSignatureExpiryWindowMs: number;
  pacificaBuilderCode: string;
  pacificaBuilderMaxFeeRate: string;
  pacificaOperationalProbeSymbol: string;
  pacificaOperationalProbePrice: string;
  pacificaOperationalProbeTargetNotionalUsd: string;
  pacificaOperationalProbeTif: "ALO" | "GTC" | "IOC";
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
    pacificaOperationalProbeSymbol:
      input.pacificaOperationalProbeSymbol ?? "BTC",
    pacificaOperationalProbePrice:
      input.pacificaOperationalProbePrice ?? "20000",
    pacificaOperationalProbeTargetNotionalUsd:
      input.pacificaOperationalProbeTargetNotionalUsd ?? "11",
    pacificaOperationalProbeTif: input.pacificaOperationalProbeTif ?? "ALO",
    credentialEncryptionKey: input.credentialEncryptionKey ?? "",
    credentialEncryptionKeyId: input.credentialEncryptionKeyId ?? "local-dev-v1",
  };
}
