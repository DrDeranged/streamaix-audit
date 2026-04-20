import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
import { z } from 'zod';
import { marketDataService, type CryptoQuote } from './marketDataService';
import { cacheService } from './cacheService';

// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

export interface ReasoningInsight {
  id: string;
  category:
    | 'regime_shift'
    | 'divergence'
    | 'contrarian'
    | 'cross_asset'
    | 'conditional'
    | 'opportunity'
    | 'risk';
  headline: string;
  reasoning: string[];
  conclusion: string;
  conditional?: { trigger: string; thenOutcome: string };
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'caution';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  assets: string[];
  timestamp: string;
}

export interface SmartInsightsPayload {
  generatedAt: string;
  modelUsed: string;
  fromCache: boolean;
  marketRegime: {
    label: string;
    description: string;
    durabilityHours: number;
  };
  insights: ReasoningInsight[];
}

const CACHE_KEY = 'smart_insights_reasoning_v1';
const CACHE_TTL_SECONDS = 15 * 60;

interface SnapshotEntry {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number | null;
  volume24h: number;
  marketCap: number;
}

const insightCategoryEnum = z.enum([
  'regime_shift',
  'divergence',
  'contrarian',
  'cross_asset',
  'conditional',
  'opportunity',
  'risk',
]);
const sentimentEnum = z.enum(['bullish', 'bearish', 'neutral', 'caution']);
const impactEnum = z.enum(['high', 'medium', 'low']);

const openAiInsightSchema = z.object({
  category: insightCategoryEnum.default('opportunity'),
  headline: z.string().default('Untitled insight'),
  reasoning: z
    .union([z.array(z.string()), z.string()])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .default([]),
  conclusion: z.string().default(''),
  conditional: z
    .object({ trigger: z.string(), thenOutcome: z.string() })
    .optional(),
  sentiment: sentimentEnum.default('neutral'),
  confidence: z.coerce.number().min(0).max(100).default(60),
  impact: impactEnum.default('medium'),
  assets: z.array(z.string()).default([]),
});

const openAiPayloadSchema = z.object({
  marketRegime: z
    .object({
      label: z.string().default('Mixed conditions'),
      description: z
        .string()
        .default('No single dominant regime — wait for clearer signals.'),
      durabilityHours: z.coerce.number().int().min(1).max(168).default(12),
    })
    .default({
      label: 'Mixed conditions',
      description: 'No single dominant regime — wait for clearer signals.',
      durabilityHours: 12,
    }),
  insights: z.array(openAiInsightSchema).default([]),
});

function buildFallback(marketSnapshot: SnapshotEntry[]): SmartInsightsPayload {
  const avg =
    marketSnapshot.reduce((s, c) => s + (c.change24h || 0), 0) /
    Math.max(marketSnapshot.length, 1);
  const regimeLabel =
    avg > 2 ? 'Risk-on momentum' : avg < -2 ? 'Risk-off rotation' : 'Range-bound chop';
  return {
    generatedAt: new Date().toISOString(),
    modelUsed: 'fallback-deterministic',
    fromCache: false,
    marketRegime: {
      label: regimeLabel,
      description:
        avg > 2
          ? 'Broad green tape with mid-caps outperforming majors — typical early-cycle risk-on setup.'
          : avg < -2
            ? 'Synchronous selling across majors and alts; capital rotating toward stable-value assets.'
            : 'No directional conviction; volatility compressing into a coiling pattern.',
      durabilityHours: 12,
    },
    insights: marketSnapshot.slice(0, 5).map((c, i) => ({
      id: `fallback-${i}`,
      category: 'opportunity' as const,
      headline: `${c.symbol} ${c.change24h > 0 ? 'firming' : 'softening'} ${Math.abs(c.change24h).toFixed(1)}%`,
      reasoning: [
        `${c.symbol} printed a ${c.change24h.toFixed(1)}% 24h move at $${c.price.toLocaleString()}.`,
        `Move sits ${Math.abs(c.change24h - avg).toFixed(1)}pp away from the broad average of ${avg.toFixed(1)}%.`,
      ],
      conclusion:
        c.change24h > avg
          ? `Relative strength vs. the tape — watch for follow-through.`
          : `Relative weakness vs. the tape — likely capital rotation away.`,
      sentiment: c.change24h > 0 ? ('bullish' as const) : ('bearish' as const),
      confidence: 60,
      impact: Math.abs(c.change24h) > 5 ? ('high' as const) : ('medium' as const),
      assets: [c.symbol],
      timestamp: new Date().toISOString(),
    })),
  };
}

export class SmartInsightsEngine {
  async generate(opts: { force?: boolean } = {}): Promise<SmartInsightsPayload> {
    if (!opts.force) {
      const cached = cacheService.get<SmartInsightsPayload>(CACHE_KEY);
      if (cached) return { ...cached, fromCache: true };
    }

    const trackedSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'MATIC', 'DOT', 'TON'];
    const quotes: CryptoQuote[] = await marketDataService
      .getCryptoQuotes(trackedSymbols)
      .catch((): CryptoQuote[] => []);
    const snapshot: SnapshotEntry[] = quotes.slice(0, 12).map((c) => ({
      symbol: (c.symbol || '').toString().toUpperCase(),
      name: c.name || c.symbol,
      price: c.price ?? 0,
      change24h: c.percentChange24h ?? 0,
      change7d: c.percentChange7d ?? null,
      volume24h: c.volume24h ?? 0,
      marketCap: c.marketCap ?? 0,
    }));

    if (process.env.PAUSE_OPENAI_API === 'true' || !process.env.OPENAI_API_KEY) {
      const fb = buildFallback(snapshot);
      cacheService.set(CACHE_KEY, fb, CACHE_TTL_SECONDS);
      return fb;
    }

    const btc = snapshot.find(s => s.symbol === 'BTC');
    const eth = snapshot.find(s => s.symbol === 'ETH');
    const top = [...snapshot].sort((a, b) => b.change24h - a.change24h).slice(0, 3);
    const bottom = [...snapshot].sort((a, b) => a.change24h - b.change24h).slice(0, 3);
    const avgChange =
      snapshot.reduce((s, c) => s + (c.change24h || 0), 0) / Math.max(snapshot.length, 1);

    const prompt = `You are an institutional crypto strategist briefing a portfolio manager.
Produce reasoning chains, NOT summaries. Every insight must show your work.

MARKET SNAPSHOT (24h):
BTC: $${btc?.price?.toLocaleString() ?? 'N/A'} (${btc?.change24h?.toFixed(2) ?? '0'}% 24h)
ETH: $${eth?.price?.toLocaleString() ?? 'N/A'} (${eth?.change24h?.toFixed(2) ?? '0'}% 24h)
Avg majors change: ${avgChange.toFixed(2)}%
Top movers up: ${top.map(t => `${t.symbol} +${t.change24h.toFixed(1)}%`).join(', ')}
Top movers down: ${bottom.map(t => `${t.symbol} ${t.change24h.toFixed(1)}%`).join(', ')}

YOUR JOB
Generate 5-7 insights spanning these categories (use AT LEAST 4 distinct categories):
- regime_shift: is the broad tape changing character? (risk-on→risk-off, expansion→contraction)
- divergence: where is one asset behaving abnormally relative to a correlated peer or to BTC?
- contrarian: where is consensus likely wrong? (e.g. funding too euphoric, capitulation overdone)
- cross_asset: narrative connecting two or more assets (rotation, leadership change, beta dispersion)
- conditional: explicit "IF X THEN Y" sequence with measurable trigger
- opportunity: specific actionable setup
- risk: specific risk factor that's underpriced

REASONING REQUIREMENTS
- Each insight's "reasoning" array is 2-4 BULLET STEPS that walk from observation → inference → conclusion. Reference actual numbers from the snapshot.
- The "conclusion" is the one-sentence takeaway.
- Include "conditional" object only when category="conditional".
- Confidence is 0-100. Be honest — most insights should land 55-80, only obvious ones above 85.

Respond with EXACT JSON (no markdown):
{
  "marketRegime": {
    "label": "5-word label",
    "description": "2-sentence description of current regime, what's driving it, and what would invalidate it",
    "durabilityHours": <int 4-72>
  },
  "insights": [
    {
      "category": "regime_shift|divergence|contrarian|cross_asset|conditional|opportunity|risk",
      "headline": "punchy 7-10 word headline",
      "reasoning": ["step 1: observation w/ numbers", "step 2: inference", "step 3: conclusion or implication"],
      "conclusion": "one sentence takeaway",
      "conditional": { "trigger": "specific measurable condition", "thenOutcome": "expected outcome" },
      "sentiment": "bullish|bearish|neutral|caution",
      "confidence": 55-95,
      "impact": "high|medium|low",
      "assets": ["BTC", "ETH"]
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // PREMIUM JUSTIFIED (Apr 2026): highest-visibility surface; reasoning-chain quality directly drives the investor pitch demo
        messages: [
          {
            role: 'system',
            content:
              'You are a senior crypto market strategist. You always show reasoning step by step using the exact numbers given. Output strict JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1800,
        temperature: 0.6,
      });

      const raw = response.choices[0]?.message?.content || '{}';
      const parsedJson: unknown = JSON.parse(raw);
      const parsed = openAiPayloadSchema.parse(parsedJson);
      const now = new Date().toISOString();

      const payload: SmartInsightsPayload = {
        generatedAt: now,
        modelUsed: 'gpt-4o',
        fromCache: false,
        marketRegime: {
          label: parsed.marketRegime.label,
          description: parsed.marketRegime.description,
          durabilityHours: parsed.marketRegime.durabilityHours,
        },
        insights: parsed.insights.map((i, idx) => ({
          id: `insight-${Date.now()}-${idx}`,
          category: i.category,
          headline: i.headline,
          reasoning: i.reasoning,
          conclusion: i.conclusion,
          conditional: i.conditional,
          sentiment: i.sentiment,
          confidence: i.confidence,
          impact: i.impact,
          assets: i.assets,
          timestamp: now,
        })),
      };

      cacheService.set(CACHE_KEY, payload, CACHE_TTL_SECONDS);
      return payload;
    } catch (err) {
      console.error('❌ SmartInsightsEngine generation failed:', err);
      const fb = buildFallback(snapshot);
      cacheService.set(CACHE_KEY, fb, 60);
      return fb;
    }
  }
}

export const smartInsightsEngine = new SmartInsightsEngine();
