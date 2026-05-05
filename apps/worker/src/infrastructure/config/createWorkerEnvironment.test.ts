import { describe, expect, it } from "vitest";
import { createWorkerEnvironment } from "./createWorkerEnvironment";

describe("createWorkerEnvironment", () => {
  const requiredSecrets = {
    pacificaBuilderCode: "test-builder",
    credentialEncryptionKey: "x".repeat(32),
  };

  it("aplica defaults operacionais seguros para o worker local", () => {
    const environment = createWorkerEnvironment(requiredSecrets);

    expect(environment.pacificaRestBaseUrl).toBe("https://api.pacifica.fi");
    expect(environment.signalTraceEnabled).toBe(false);
    expect(environment.scanIntervalMs).toBe(5_000);
    expect(environment.heartbeatIntervalMs).toBe(15_000);
    expect(environment.analysisIntervalMs).toBe(60_000);
    expect(environment.leaseDurationMs).toBe(45_000);
    expect(environment.marketOrderSlippagePercent).toBe("0.5");
    expect(environment.workerId).toContain("worker-local-");
  });

  it("permite override explícito das configurações", () => {
    const environment = createWorkerEnvironment({
      ...requiredSecrets,
      workerId: "worker-1",
      signalTraceEnabled: true,
      analysisIntervalMs: 30_000,
    });

    expect(environment.workerId).toBe("worker-1");
    expect(environment.signalTraceEnabled).toBe(true);
    expect(environment.analysisIntervalMs).toBe(30_000);
  });
});
