import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/chat/route";

const originalApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  } else {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalApiKey;
  }
});

describe("POST /api/chat", () => {
  it("returns a clear configuration error when the Gemini key is missing", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error:
        "Google Generative AI is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local.",
    });
  });

  it("rejects malformed chat payloads before calling Gemini", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "The request must include a messages array.",
    });
  });
});
