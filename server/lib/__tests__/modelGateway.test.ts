import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createMock = vi.fn();

vi.mock("../../db", () => ({ db: { select: () => ({ from: () => ({ where: async () => [{ total: 0 }] }) }), insert: () => ({ values: () => ({ onConflictDoUpdate: async () => undefined }) }) } }));

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

function textResponse(text: string, stopReason: string = "end_turn") {
  return { content: [{ type: "text", text }], stop_reason: stopReason };
}

describe("ModelGateway (Anthropic-backed)", () => {
  let gateway: ModelGateway;

  beforeEach(() => {
    createMock.mockReset();
    __resetAnthropicClientForTests();
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.PAUSE_ANTHROPIC_API;
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
      priority: "user",
      tag: "test",
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
    await gateway.complete({ tier: "fast",
      priority: "user",
      tag: "test", system: "s", user: "u" });
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
    await gateway.complete({ tier: "reasoning",
      priority: "user",
      tag: "test", system: "s", user: "u" });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-test" }),
    );
  });

  it("honors per-call maxTokens override", async () => {
    createMock.mockResolvedValue(textResponse("x"));
    await gateway.complete({ tier: "fast",
      priority: "user",
      tag: "test", system: "s", user: "u", maxTokens: 42 });
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
    const result = await gateway.complete({ tier: "fast",
      priority: "user",
      tag: "test", system: "s", user: "u" });
    expect(result.content).toBe("part1 part2");
  });

  it("throws when PAUSE_ANTHROPIC_API=true", async () => {
    process.env.PAUSE_ANTHROPIC_API = "true";
    await expect(
      gateway.complete({ tier: "fast",
      priority: "user",
      tag: "test", system: "s", user: "u" }),
    ).rejects.toThrow(/PAUSE_ANTHROPIC_API/);
    expect(createMock).not.toHaveBeenCalled();
  });


  it("retries once on overloaded_error", async () => {
    createMock
      .mockRejectedValueOnce({ status: 529, error: { type: "overloaded_error" } })
      .mockResolvedValueOnce(textResponse("recovered"));
    const result = await gateway.complete({ tier: "fast",
      priority: "user",
      tag: "test", system: "s", user: "u" });
    expect(result.content).toBe("recovered");
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on non-retryable errors", async () => {
    createMock.mockRejectedValue({ status: 400, error: { type: "invalid_request_error" } });
    await expect(
      gateway.complete({ tier: "fast",
      priority: "user",
      tag: "test", system: "s", user: "u" }),
    ).rejects.toBeTruthy();
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("completeJson parses fenced JSON output", async () => {
    createMock.mockResolvedValue(textResponse('```json\n{"a":1}\n```'));
    const result = await gateway.completeJson<{ a: number }>({
      tier: "fast",
      priority: "user",
      tag: "test",
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
      priority: "user",
      tag: "test",
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
      gateway.completeJson({ tier: "fast",
      priority: "user",
      tag: "test", system: "s", user: "u" }),
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

describe("Anthropic-only + truncation handling", () => {
  let gateway: ModelGateway;

  beforeEach(() => {
    createMock.mockReset();
    __resetAnthropicClientForTests();
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.PAUSE_ANTHROPIC_API;
    gateway = new ModelGateway();
  });

  it("every completion goes to Anthropic and only Anthropic models are billed", async () => {
    createMock.mockResolvedValue({ ...textResponse("hi"), usage: { input_tokens: 10, output_tokens: 5 } });
    const result = await gateway.complete({ tier: "reasoning", priority: "user", tag: "test", system: "s", user: "u" });
    expect(result.model).toMatch(/claude/);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces stop_reason on the completion result", async () => {
    createMock.mockResolvedValue(textResponse("done", "end_turn"));
    const result = await gateway.complete({ tier: "fast", priority: "user", tag: "test", system: "s", user: "u" });
    expect(result.stopReason).toBe("end_turn");
  });

  it("completeJson retries ONCE with doubled max_tokens when truncated", async () => {
    createMock
      .mockResolvedValueOnce(textResponse('{"markets": [', "max_tokens"))
      .mockResolvedValueOnce(textResponse('{"markets": []}', "end_turn"));
    const result = await gateway.completeJson<{ markets: unknown[] }>({
      tier: "reasoning", priority: "background", tag: "test-trunc",
      system: "s", user: "u", maxTokens: 2048,
    });
    expect(result.markets).toEqual([]);
    expect(createMock).toHaveBeenCalledTimes(2);
    const secondCall = createMock.mock.calls[1][0];
    expect(secondCall.max_tokens).toBe(4096);
  });

  it("completeJson does not loop on repeated truncation (one doubled retry only)", async () => {
    createMock.mockResolvedValue(textResponse('{"broken": ', "max_tokens"));
    await expect(
      gateway.completeJson({ tier: "fast", priority: "user", tag: "t", system: "s", user: "u" }),
    ).rejects.toThrow();
    // initial + doubled retry, then parse-fail retry path (also capped)
    expect(createMock.mock.calls.length).toBeLessThanOrEqual(4);
  });
});
