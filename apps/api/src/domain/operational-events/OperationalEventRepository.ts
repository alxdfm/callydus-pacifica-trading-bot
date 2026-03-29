import type { AlertSeverity } from "@pacifica/contracts";

export type AppendOperationalEventInput = {
  walletAddress?: string | null;
  eventType:
    | "credential_validation"
    | "operational_verification"
    | "signal_evaluation"
    | "preset_activation"
    | "bot_command"
    | "runtime_reconciliation";
  severity: AlertSeverity;
  title: string;
  message: string;
  payloadJson?: unknown;
};

export interface OperationalEventRepository {
  appendOperationalEvent(input: AppendOperationalEventInput): Promise<void>;
}
