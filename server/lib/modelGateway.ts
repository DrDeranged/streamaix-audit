import Anthropic from "@anthropic-ai/sdk";
import { checkBudget, dailyBudgetLedger } from "../services/apiCostTracker";

/**
 * Model Gateway
 *
 * Single entry point for AI text completions. Services should call
 * `modelGateway.complete()` / `completeJson()` instead of instantiating raw
 * AI clients. Tiers abstract model selection so callers express intent, not
 * model names.
 *
 * Text/reasoning calls are backed by the Anthropic Messages API. Model IDs
 * are read from env at call time (MODEL_REASONING / MODEL_FAST) so they can
 * be re-pointed without code changes. Audio (whisper-1 transcription, tts-1
 * speech) remains on OpenAI — Anthropic has no audio APIs.
 */

export type ModelTier = "reasoning" | "fast";

const DEFAULT_TIER_MODELS: Record<ModelTier, string> = {
  reasoning: "claude-sonnet-4-6",
  fast: "claude-haiku-4-5-20251001",
};

function modelForTier(tier: ModelTier): string {
  if (tier === "reasoning") {
    return process.env.MODEL_REASONING || DEFAULT_TIER_MODELS.reasoning;
  }
  return process.env.MODEL_FAST || DEFAULT_TIER_MODELS.fast;
}

const DEFAULT_MAX_TOKENS = 1024;
const REQUEST_TIMEOUT_MS = 60_000;

export type CallPriority = "user" | "background";

/**
 * Tags whose calls are purely cosmetic ambience — first to be shed when the
 * daily AI budget degrades (>=80%).
 */
export const COSMETIC_TAGS = new Set([
  "avatar-commentary",
  "social-chatter",
  "community-manager",
  "stream-conversation",
]);

/** Thrown when the daily AI budget blocks a call. Routes map this to 503. */
export class BudgetExceededError extends Error {
  readonly statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export interface GatewayCompletionRequest {
  tier: ModelTier;
  /** Who asked: a live user request, or a background job. Drives budget shedding. */
  priority: CallPriority;
  /** Stable call-site label (e.g. "avatar-commentary") for cost attribution + shedding. */
  tag: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /**
   * When provided, the model is instructed to emit ONLY JSON matching this
   * schema. (Anthropic has no native json response_format; enforcement is
   * instruction + defensive parsing in completeJson.)
   */
  jsonSchema?: {
    name: string;
    schema: Record<string, unknown>;
  };
}

export interface GatewayCompletionResult {
  content: string;
  model: string;
}

let _client: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set it in your environment/secrets " +
        "to enable AI features.",
    );
  }
  _client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
  return _client;
}

/** Test hook: reset the cached client (used by unit tests). */
export function __resetAnthropicClientForTests(): void {
  _client = null;
}

function isRetryable(err: unknown): boolean {
  const anyErr = err as { status?: number; error?: { type?: string } } | undefined;
  if (!anyErr) return false;
  const status = anyErr.status;
  if (status === 429 || (typeof status === "number" && status >= 500)) return true;
  const type =
    anyErr.error?.type ||
    ((anyErr as { error?: { error?: { type?: string } } }).error?.error?.type ?? "");
  return type === "overloaded_error";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip markdown code fences a model may wrap around JSON despite instructions. */
export function stripJsonFences(raw: string): string {
  let text = raw.trim();
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  return text;
}

/**
 * Daily budget enforcement tiers:
 * - >=80%: background calls with cosmetic tags are shed (logged warning).
 * - >=100%: ALL background calls are blocked.
 * - >=150%: user-initiated calls are blocked too (routes surface a 503).
 * Fail-open on ledger errors: a broken meter must not take down AI features.
 */
export async function enforceBudget(priority: CallPriority, tag: string): Promise<void> {
  let status;
  try {
    status = await checkBudget();
  } catch (err) {
    console.error("[budget] checkBudget failed — allowing call:", err);
    return;
  }
  const pct = Math.round(status.ratio * 100);
  if (priority === "background") {
    if (status.ratio >= 1) {
      console.warn(`[budget] blocked background call "${tag}" — daily AI budget at ${pct}%`);
      throw new BudgetExceededError(
        `Daily AI budget exhausted (${pct}% of $${status.budgetUsd}); background call "${tag}" blocked`,
      );
    }
    if (status.ratio >= 0.8 && COSMETIC_TAGS.has(tag)) {
      console.warn(`[budget] skipped cosmetic call "${tag}" — daily AI budget at ${pct}% (degraded)`);
      throw new BudgetExceededError(
        `Daily AI budget degraded (${pct}% of $${status.budgetUsd}); cosmetic call "${tag}" skipped`,
      );
    }
    return;
  }
  if (status.ratio >= 1.5) {
    console.warn(`[budget] blocked user call "${tag}" — daily AI budget at ${pct}%`);
    throw new BudgetExceededError(
      `AI features are temporarily unavailable: daily AI budget exceeded (${pct}% of $${status.budgetUsd}). Try again tomorrow.`,
    );
  }
}

export class ModelGateway {
  async complete(req: GatewayCompletionRequest): Promise<GatewayCompletionResult> {
    if (process.env.PAUSE_ANTHROPIC_API === "true") {
      throw new Error("Anthropic API paused (PAUSE_ANTHROPIC_API=true)");
    }
    await enforceBudget(req.priority, req.tag);
    const model = modelForTier(req.tier);
    const client = getAnthropicClient();

    let system = req.system;
    let user = req.user;
    if (req.jsonSchema) {
      system += `\n\nRespond with ONLY valid JSON matching this schema, no markdown fences, no prose. Schema "${req.jsonSchema.name}": ${JSON.stringify(req.jsonSchema.schema)}`;
    }

    const doRequest = () =>
      client.messages.create({
        model,
        max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      });

    let response: Awaited<ReturnType<typeof doRequest>>;
    try {
      response = await doRequest();
    } catch (err) {
      if (!isRetryable(err)) throw err;
      // One retry with backoff + jitter on 429/5xx/overloaded_error.
      await sleep(1000 + Math.random() * 1000);
      response = await doRequest();
    }

    const usage = response.usage;
    if (usage) {
      dailyBudgetLedger.recordModelTokens(
        "anthropic",
        model,
        usage.input_tokens ?? 0,
        usage.output_tokens ?? 0,
      );
    }

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    if (!content) {
      throw new Error(`Model gateway: empty completion from ${model}`);
    }
    return { content, model };
  }

  /**
   * Complete and parse JSON output. Strips accidental markdown fences and, if
   * parsing/validation fails, retries once feeding the error back to the model.
   */
  async completeJson<T = unknown>(
    req: GatewayCompletionRequest,
    validate?: (parsed: unknown) => T,
  ): Promise<T & { _model: string }> {
    const attempt = async (
      extraUser?: string,
    ): Promise<{ parsed: T; model: string }> => {
      const { content, model } = await this.complete(
        extraUser ? { ...req, user: `${req.user}\n\n${extraUser}` } : req,
      );
      const cleaned = stripJsonFences(content);
      const parsed = JSON.parse(cleaned) as unknown;
      return { parsed: validate ? validate(parsed) : (parsed as T), model };
    };

    try {
      const { parsed, model } = await attempt();
      return Object.assign(parsed as object, { _model: model }) as T & { _model: string };
    } catch (firstError) {
      if (firstError instanceof Error && /paused|not configured/i.test(firstError.message)) {
        throw firstError;
      }
      const message =
        firstError instanceof Error ? firstError.message : String(firstError);
      const { parsed, model } = await attempt(
        `Your previous response was not valid JSON matching the schema. Error: ${message}. Respond again with ONLY the corrected JSON — no markdown fences, no prose.`,
      );
      return Object.assign(parsed as object, { _model: model }) as T & { _model: string };
    }
  }
}

export const modelGateway = new ModelGateway();
