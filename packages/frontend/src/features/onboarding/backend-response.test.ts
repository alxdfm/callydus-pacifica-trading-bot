import { describe, expect, it } from "vitest";
import { parseJsonResponse, parseSchemaOrFallback } from "./backend-response";

describe("backend-response", () => {
  it("retorna null quando o body vem vazio", async () => {
    const response = new Response("");

    await expect(parseJsonResponse(response)).resolves.toBeNull();
  });

  it("retorna fallback raw quando o body não é JSON válido", async () => {
    const response = new Response("oops", {
      status: 502,
    });

    await expect(parseJsonResponse(response)).resolves.toEqual({
      raw: "oops",
      status: 502,
    });
  });

  it("usa fallback tipado quando o schema não bate", async () => {
    const schema = {
      safeParse: (value: unknown) =>
        value === 1
          ? ({ success: true, data: 1 } as const)
          : ({ success: false } as const),
    };
    const response = new Response(JSON.stringify({ nope: true }));

    await expect(parseSchemaOrFallback(response, schema, 99)).resolves.toBe(99);
  });
});
