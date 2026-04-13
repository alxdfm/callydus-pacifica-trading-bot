import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { getApiRuntime } from "../bootstrap/createApiRuntime";
import { createApiHttpHandler } from "../ui/http/createApiHttpHandler";

// Initialise once per cold start
const { api, internalApiSecret } = getApiRuntime();
const handleRequest = createApiHttpHandler(api, { internalApiSecret });

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString("utf8")
    : (event.body ?? null);

  const headers: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    headers[key.toLowerCase()] = value;
  }

  const response = await handleRequest({
    method: event.requestContext.http.method,
    path: event.rawPath,
    headers,
    queryStringParameters: event.queryStringParameters ?? {},
    rawBody,
  });

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body,
  };
}
