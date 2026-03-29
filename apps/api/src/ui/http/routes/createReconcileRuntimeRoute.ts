import {
  runtimeReconcileRequestSchema,
  runtimeReconcileResponseSchema,
  type RuntimeReconcileRequest,
  type RuntimeReconcileResponse,
} from "@pacifica/contracts";

export type ReconcileRuntimeHttpRequest = {
  body: RuntimeReconcileRequest;
};

export type ReconcileRuntimeHandler = (
  input: RuntimeReconcileRequest,
) => Promise<RuntimeReconcileResponse>;

export function createReconcileRuntimeRoute(handler: ReconcileRuntimeHandler) {
  return async function handleReconcileRuntime(
    request: ReconcileRuntimeHttpRequest,
  ): Promise<RuntimeReconcileResponse> {
    const body = runtimeReconcileRequestSchema.parse(request.body);
    const result = await handler(body);
    return runtimeReconcileResponseSchema.parse(result);
  };
}
