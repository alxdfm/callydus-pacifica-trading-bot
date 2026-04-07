import {
  runtimeHeartbeatRequestSchema,
  runtimeHeartbeatResponseSchema,
  type RuntimeHeartbeatRequest,
  type RuntimeHeartbeatResponse,
} from "@pacifica/contracts";

type HeartbeatRuntimeHttpRequest = {
  body: RuntimeHeartbeatRequest;
};

export type HeartbeatRuntimeHandler = (
  input: RuntimeHeartbeatRequest,
) => Promise<RuntimeHeartbeatResponse>;

export function createHeartbeatRuntimeRoute(handler: HeartbeatRuntimeHandler) {
  return async function handleHeartbeatRuntime(
    request: HeartbeatRuntimeHttpRequest,
  ): Promise<RuntimeHeartbeatResponse> {
    const body = runtimeHeartbeatRequestSchema.parse(request.body);
    const result = await handler(body);
    return runtimeHeartbeatResponseSchema.parse(result);
  };
}
