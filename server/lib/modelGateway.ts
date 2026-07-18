import { getOpenAIClient } from "./openaiClient";

/**
 * Model Gateway (minimal)
 *
 * Single entry point for AI chat completions. Services should call
 * `modelGateway.complete()` instead of instantiating raw OpenAI clients.
 * Tiers abstract model selection so callers express intent, not model names.
 *
 * This is the seed of the Phase 2 gateway (see replit.md); it currently
 * supports tiered completion with optional strict JSON-schema output.
 */

export type ModelTier = "reasoning" | "fast";

const TIER_MODELS: Record<ModelTier, string> = {
  reasoning: "gpt-4o",
  fast: "gpt-4o-mini",
};

export interface GatewayCompletionRequest {
  tier: ModelTier;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** When provided, uses strict structured output (json_schema response format). */
  jsonSchema?: {
    name: string;
    schema: Record<string, unknown>;
  };
}

export interface GatewayCompletionResult {
  content: string;
  model: string;
}

export class ModelGateway {
  async complete(req: GatewayCompletionRequest): Promise<GatewayCompletionResult> {
    if (process.env.PAUSE_OPENAI_API === "true") {
      throw new Error("OpenAI API paused (PAUSE_OPENAI_API=true)");
    }
    const model = TIER_MODELS[req.tier];
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      ...(req.jsonSchema
        ? {
            response_format: {
              type: "json_schema" as const,
              json_schema: {
                name: req.jsonSchema.name,
                strict: true,
                schema: req.jsonSchema.schema,
              },
            },
          }
        : {}),
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`Model gateway: empty completion from ${model}`);
    }
    return { content, model };
  }

  /** Convenience: complete and parse JSON output. */
  async completeJson<T = unknown>(req: GatewayCompletionRequest): Promise<T & { _model: string }> {
    const { content, model } = await this.complete(req);
    const parsed = JSON.parse(content) as T;
    return Object.assign(parsed as object, { _model: model }) as T & { _model: string };
  }
}

export const modelGateway = new ModelGateway();
