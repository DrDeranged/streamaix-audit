import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: createMock };
  }
  return { default: MockAnthropic };
});

import {
  ModelGateway,
  stripJsonFences,
  __resetAnthropicClientForTests,
} from "../modelGateway";

function textResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

describe("ModelGateway (Anthropic-backed)", () => {
  let gateway: ModelGateway;

  beforeEach(() => {
    createMock.mockReset();
    __resetAnthropicClientForTests();
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.PAUSE_ANTHROPIC_API;
    delete process.env.PAUSE_OPENAI_API;
    delete process.env.MODEL_REASONING;
    delete process.env.MODEL_FAST;
    gateway = new ModelGateway();
  });

  afterEach(() => {
    delete process.env.MODEL_REASONING;
    delete process.env.MODEL_FAST;
    delete process.env.PAUSE_ANTHROPIC_API;
  });

  it("routes reasoning tier to the default Sonnet model", async () => {
    createMock.mockResolvedValue(textResponse("hello"));
    const result = await gateway.complete({
      tier: "reasoning",
      system: "sys",
      user: "hi",
    });
    expect(result.content).toBe("hello");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-sonnet-4-6", system: "sys" }),
    );
  });

  it("routes fast tier to the default Haiku model with required max_tokens", async () => {
    createMock.mockResolvedValue(textResponse("ok"));
    await gateway.complete({ tier: "fast", system: "s", user: "u" });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
      }),
    );
  });

  it("reads model IDs from env at call time", async () => {
    process.env.MODEL_REASONING = "claude-opus-test";
    createMock.mockResolvedValue(textResponse("x"));
    await gateway.complete({ tier: "reasoning", system: "s", user: "u" });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-test" }),
    );
  });

  it("honors per-call maxTokens override", async () => {
    createMock.mockResolvedValue(textResponse("x"));
    await gateway.complete({ tier: "fast", system: "s", user: "u", maxTokens: 42 });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 42 }),
    );
  });

  it("concatenates multiple text content blocks", async () => {
    createMock.mockResolvedValue({
      content: [
        { type: "text", text: "part1 " },
        { type: "tool_use", id: "t", name: "n", input: {} },
        { type: "text", text: "part2" },
      ],
    });
    const result = await gateway.complete({ tier: "fast", system: "s", user: "u" });
    expect(result.content).toBe("part1 part2");
  });

  it("throws when PAUSE_ANTHROPIC_API=true", async () => {
    process.env.PAUSE_ANTHROPIC_API = "true";
    await expect(
      gateway.complete({ tier: "fast", system: "s", user: "u" }),
    ).rejects.toThrow(/PAUSE_ANTHROPIC_API/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("PAUSE_OPENAI_API does NOT block Anthropic-routed calls", async () => {
    process.env.PAUSE_OPENAI_API = "true";
    createMock.mockResolvedValue(textResponse("fine"));
    const result = await gateway.complete({ tier: "fast", system: "s", user: "u" });
    expect(result.content).toBe("fine");
  });

  it("retries once on overloaded_error", async () => {
    createMock
      .mockRejectedValueOnce({ status: 529, error: { type: "overloaded_error" } })
      .mockResolvedValueOnce(textResponse("recovered"));
    const result = await gateway.complete({ tier: "fast", system: "s", user: "u" });
    expect(result.content).toBe("recovered");
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on non-retryable errors", async () => {
    createMock.mockRejectedValue({ status: 400, error: { type: "invalid_request_error" } });
    await expect(
      gateway.complete({ tier: "fast", system: "s", user: "u" }),
    ).rejects.toBeTruthy();
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("completeJson parses fenced JSON output", async () => {
    createMock.mockResolvedValue(textResponse('```json\n{"a":1}\n```'));
    const result = await gateway.completeJson<{ a: number }>({
      tier: "fast",
      system: "s",
      user: "u",
      jsonSchema: { name: "test", schema: { type: "object" } },
    });
    expect(result.a).toBe(1);
  });

  it("completeJson retries once with the parse error fed back", async () => {
    createMock
      .mockResolvedValueOnce(textResponse("not json at all"))
      .mockResolvedValueOnce(textResponse('{"b":2}'));
    const result = await gateway.completeJson<{ b: number }>({
      tier: "fast",
      system: "s",
      user: "u",
    });
    expect(result.b).toBe(2);
    expect(createMock).toHaveBeenCalledTimes(2);
    const secondCall = createMock.mock.calls[1][0];
    expect(secondCall.messages[0].content).toContain("not valid JSON");
  });

  it("completeJson throws after the repair retry also fails", async () => {
    createMock.mockResolvedValue(textResponse("still not json"));
    await expect(
      gateway.completeJson({ tier: "fast", system: "s", user: "u" }),
    ).rejects.toBeTruthy();
    expect(createMock).toHaveBeenCalledTimes(2);
  });
});

describe("stripJsonFences", () => {
  it("strips ```json fences", () => {
    expect(stripJsonFences('```json\n{"x":1}\n```')).toBe('{"x":1}');
  });
  it("leaves bare JSON alone", () => {
    expect(stripJsonFences('{"x":1}')).toBe('{"x":1}');
  });
});
