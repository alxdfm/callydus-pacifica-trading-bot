import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { getApiRuntime } from "../bootstrap/createApiRuntime";
import { createApiHttpHandler } from "../ui/http/createApiHttpHandler";

// Initialise once per cold start
const { api, internalApiSecret } = getApiRuntime();
const handleRequest = createApiHttpHandler(api, { internalApiSecret });

function sanitizeForLog(value: string): string {
  return value.replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, "[REDACTED]");
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  const requestId = event.requestContext.requestId;

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64").toString("utf8")
      : (event.body ?? null);

    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(event.headers ?? {})) {
      headers[key.toLowerCase()] = value;
    }

    const response = await handleRequest({
      method,
      path,
      headers,
      queryStringParameters: event.queryStringParameters ?? {},
      rawBody,
    });

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      JSON.stringify({
        event: "api.unhandled_error",
        requestId,
        method,
        path,
        error: sanitizeForLog(message),
        stack: stack ? sanitizeForLog(stack) : undefined,
      }),
    );
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error", code: "internal_error" }),
    };
  }
}
