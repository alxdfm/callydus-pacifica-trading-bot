import { redirectToProfileOnUnauthorized } from "../auth/unauthorized-redirect";

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false };

type SafeParseSchema<T> = {
  safeParse: (value: unknown) => SafeParseResult<T>;
};

export async function parseJsonResponse(response: Response): Promise<unknown> {
  if (response.status === 401) {
    redirectToProfileOnUnauthorized();
  }

  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return {
      raw: rawBody,
      status: response.status,
    };
  }
}

export async function parseSchemaOrFallback<T>(
  response: Response,
  schema: SafeParseSchema<T>,
  fallback: T,
): Promise<T> {
  const payload = await parseJsonResponse(response);
  const parsedResponse = schema.safeParse(payload);

  if (parsedResponse.success) {
    return parsedResponse.data;
  }

  return fallback;
}
