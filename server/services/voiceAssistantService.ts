import OpenAI from 'openai';
import { z } from 'zod';
import { marketDataService, type CryptoQuote } from './marketDataService';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type VoiceIntentType =
  | 'navigate'
  | 'lookup_market'
  | 'check_balance'
  | 'summarize_bounty'
  | 'none';

export interface VoiceIntent {
  type: VoiceIntentType;
  path?: string;
  symbol?: string;
  bountyId?: string;
}

export type VoiceIntentResult =
  | { kind: 'market'; symbol: string; price: number; percentChange24h: number; source: 'live' | 'unavailable' }
  | { kind: 'balance'; streamPoints: number; username: string | null }
  | { kind: 'bounty'; bountyId: string; title: string; reward: number; status: string; summary: string }
  | { kind: 'navigate'; path: string }
  | { kind: 'error'; message: string }
  | null;

export interface VoiceAssistantResponse {
  transcript: string;
  spokenResponse: string;
  displayResponse: string;
  intent: VoiceIntent;
  intentResult: VoiceIntentResult;
  audioBase64: string | null;
  audioMimeType: 'audio/mpeg' | null;
  modelUsed: string;
}

export interface VoiceAssistantContext {
  currentPath?: string;
  username?: string | null;
  summariesCount?: number;
  bountiesCount?: number;
  walletBalance?: number;
  recentBountyTitles?: string[];
}

const KNOWN_PATHS: Array<{ keywords: string[]; path: string; label: string }> = [
  { keywords: ['dashboard', 'home', 'main'], path: '/dashboard', label: 'Dashboard' },
  { keywords: ['market', 'prediction'], path: '/markets', label: 'Prediction Markets' },
  { keywords: ['insight', 'reasoning'], path: '/insights', label: 'Smart Insights' },
  { keywords: ['bount'], path: '/bounties', label: 'Bounties' },
  { keywords: ['discover', 'explore'], path: '/discover', label: 'Discover' },
  { keywords: ['avatar', 'expert'], path: '/avatars', label: 'Knowledge Avatars' },
  { keywords: ['portfolio', 'wallet', 'balance'], path: '/portfolio', label: 'Portfolio' },
  { keywords: ['stream', 'live'], path: '/streams', label: 'Live Streams' },
  { keywords: ['leaderboard', 'rank'], path: '/leaderboard', label: 'Leaderboard' },
];

const intentSchema = z.object({
  type: z
    .enum(['navigate', 'lookup_market', 'check_balance', 'summarize_bounty', 'none'])
    .default('none'),
  path: z.string().optional(),
  symbol: z.string().optional(),
  bountyId: z.string().optional(),
});

const modelOutputSchema = z.object({
  spokenResponse: z.string().min(1).max(800),
  displayResponse: z.string().min(1).max(1500),
  intent: intentSchema.default({ type: 'none' }),
});

const TRACKED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX'];

function buildSystemPrompt(ctx: VoiceAssistantContext, market: CryptoQuote[]): string {
  const marketLines = market
    .slice(0, 8)
    .map(
      (q) =>
        `- ${q.symbol}: $${q.price.toLocaleString()} (${q.percentChange24h >= 0 ? '+' : ''}${q.percentChange24h.toFixed(2)}% 24h)`,
    )
    .join('\n');

  const navList = KNOWN_PATHS.map((p) => `  - "${p.label}" -> ${p.path}`).join('\n');

  return `You are the StreamAiX voice assistant. The user just spoke a short request. Reply in two voices:
1) "spokenResponse" - what we will read aloud (1-2 short sentences, conversational, no markdown, no URLs).
2) "displayResponse" - what we will show on screen (can be longer, 1-3 sentences, plain text).

You must also pick exactly one "intent". Available intents:
- navigate: send the user to a page. Set "path" to one of:
${navList}
- lookup_market: pulled live price. Set "symbol" (e.g. BTC). Use this when the user asks about a specific asset price.
- check_balance: user is asking about their balance/wallet. No extra fields.
- summarize_bounty: user is asking about a specific bounty. Set "bountyId" if they named one, otherwise omit.
- none: pure conversational reply, no UI action.

CURRENT CONTEXT
- User is currently on page: ${ctx.currentPath || 'unknown'}
- User: ${ctx.username || 'guest'}
- Summaries created: ${ctx.summariesCount ?? 0}
- Bounties created/claimed: ${ctx.bountiesCount ?? 0}
- STREAM token balance: ${ctx.walletBalance ?? 0}
${ctx.recentBountyTitles && ctx.recentBountyTitles.length
  ? `- Recent bounty titles: ${ctx.recentBountyTitles.slice(0, 3).map((t) => `"${t}"`).join(', ')}`
  : '- Recent activity: (none)'}

LIVE MARKET SNAPSHOT (24h)
${marketLines || '(market data unavailable)'}

RULES
- If the user asks for a price, use the live snapshot above and quote the actual number. Do not make up prices.
- If they say "show me X" / "open X" / "go to X", emit a navigate intent with the matching path.
- Keep spokenResponse short - it's being read by TTS. No code blocks, no asterisks, no emojis.
- Always reply in valid JSON matching: { "spokenResponse": string, "displayResponse": string, "intent": { "type": ..., "path"?: string, "symbol"?: string, "bountyId"?: string } }`;
}

export class VoiceAssistantService {
  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
    const file = new File([audioBuffer], `voice.${ext}`, { type: mimeType || 'audio/webm' });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });
    return (transcription.text || '').trim();
  }

  async respond(
    transcript: string,
    context: VoiceAssistantContext,
  ): Promise<{ spokenResponse: string; displayResponse: string; intent: VoiceIntent }> {
    const market = await marketDataService
      .getCryptoQuotes(TRACKED_SYMBOLS)
      .catch((): CryptoQuote[] => []);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(context, market) },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsedJson: unknown = JSON.parse(raw);
    const parsed = modelOutputSchema.parse(parsedJson);

    return {
      spokenResponse: parsed.spokenResponse,
      displayResponse: parsed.displayResponse,
      intent: parsed.intent,
    };
  }

  async synthesize(text: string): Promise<Buffer> {
    const safeText = text.slice(0, 600);
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: safeText,
      speed: 1.05,
      response_format: 'mp3',
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async run(
    audioBuffer: Buffer,
    mimeType: string,
    context: VoiceAssistantContext,
  ): Promise<VoiceAssistantResponse> {
    if (process.env.PAUSE_OPENAI_API === 'true' || !process.env.OPENAI_API_KEY) {
      return {
        transcript: '',
        spokenResponse: 'The voice assistant is paused right now.',
        displayResponse:
          'The voice assistant is temporarily paused. Please use the text chat instead.',
        intent: { type: 'none' },
        audioBase64: null,
        audioMimeType: null,
        modelUsed: 'paused',
      };
    }

    const transcript = await this.transcribe(audioBuffer, mimeType);
    if (!transcript) {
      return {
        transcript: '',
        spokenResponse: "I didn't catch that. Try again.",
        displayResponse: "I couldn't hear anything. Please try recording again.",
        intent: { type: 'none' },
        audioBase64: null,
        audioMimeType: null,
        modelUsed: 'whisper-1',
      };
    }

    const initial = await this.respond(transcript, context);
    const executed = await this.executeIntent(initial.intent, context, transcript).catch(
      (err): { intentResult: VoiceIntentResult; spokenResponse?: string; displayResponse?: string } => {
        console.error('[VoiceAssistant] intent execution failed', err);
        return { intentResult: null };
      },
    );

    const spokenResponse = executed.spokenResponse ?? initial.spokenResponse;
    const displayResponse = executed.displayResponse ?? initial.displayResponse;
    const audio = await this.synthesize(spokenResponse).catch(() => null);

    return {
      transcript,
      spokenResponse,
      displayResponse,
      intent: initial.intent,
      intentResult: executed.intentResult,
      audioBase64: audio ? audio.toString('base64') : null,
      audioMimeType: audio ? 'audio/mpeg' : null,
      modelUsed: 'whisper-1 + gpt-4o-mini + tts-1',
    };
  }

  /**
   * After the LLM picks an intent, fetch the real data needed to fulfill it.
   * For lookup_market / check_balance / summarize_bounty we override the
   * spoken & displayed text with templated copy that references the real
   * numbers, so the user always hears live data instead of a hallucinated value.
   */
  async executeIntent(
    intent: VoiceIntent,
    context: VoiceAssistantContext,
    transcript: string,
  ): Promise<{ intentResult: VoiceIntentResult; spokenResponse?: string; displayResponse?: string }> {
    if (intent.type === 'lookup_market') {
      const symbol = (intent.symbol || extractSymbol(transcript) || '').toUpperCase();
      if (!symbol) {
        return {
          intentResult: { kind: 'error', message: 'Tell me which asset to look up.' },
          spokenResponse: 'Which asset should I check?',
          displayResponse: "I didn't catch which asset you wanted. Try 'what's BTC at?'",
        };
      }
      const quotes = await marketDataService.getCryptoQuotes([symbol]).catch((): CryptoQuote[] => []);
      const quote = quotes.find((q) => q.symbol.toUpperCase() === symbol);
      if (!quote) {
        return {
          intentResult: { kind: 'market', symbol, price: 0, percentChange24h: 0, source: 'unavailable' },
          spokenResponse: `I don't have a live price for ${symbol} right now.`,
          displayResponse: `Live price for ${symbol} is unavailable. Try again in a moment.`,
        };
      }
      const dir = quote.percentChange24h >= 0 ? 'up' : 'down';
      const pct = Math.abs(quote.percentChange24h).toFixed(2);
      const priceFmt = quote.price >= 1 ? quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : quote.price.toPrecision(4);
      return {
        intentResult: {
          kind: 'market',
          symbol,
          price: quote.price,
          percentChange24h: quote.percentChange24h,
          source: 'live',
        },
        spokenResponse: `${symbol} is at ${priceFmt} dollars, ${dir} ${pct} percent in the last day.`,
        displayResponse: `${symbol} · $${priceFmt} (${quote.percentChange24h >= 0 ? '+' : '-'}${pct}% 24h)`,
      };
    }

    if (intent.type === 'check_balance') {
      const balance = context.walletBalance ?? 0;
      const balanceFmt = balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
      return {
        intentResult: {
          kind: 'balance',
          streamPoints: balance,
          username: context.username ?? null,
        },
        spokenResponse: balance > 0
          ? `You have ${balanceFmt} STREAM tokens.`
          : "You don't have any STREAM tokens yet — claim a bounty to start earning.",
        displayResponse: balance > 0
          ? `${balanceFmt} STREAM tokens in your account.`
          : 'Your STREAM balance is 0. Claim a bounty or summarize a video to start earning.',
      };
    }

    if (intent.type === 'summarize_bounty') {
      // Lazy import to avoid circular deps in tests
      const { storage } = await import('../storage');
      const bountyId = intent.bountyId || extractBountyId(transcript);
      let bounty: { id: string; title: string; description?: string | null; reward: number; status: string } | undefined;
      if (bountyId) {
        bounty = (await storage.getBounty(bountyId).catch(() => undefined)) as typeof bounty;
      }
      // Fall back to the user's most recent bounty title
      if (!bounty && context.recentBountyTitles && context.recentBountyTitles.length > 0) {
        return {
          intentResult: {
            kind: 'bounty',
            bountyId: 'recent',
            title: context.recentBountyTitles[0],
            reward: 0,
            status: 'recent',
            summary: `Your most recent bounty is "${context.recentBountyTitles[0]}".`,
          },
          spokenResponse: `Your most recent bounty is ${context.recentBountyTitles[0]}.`,
          displayResponse: `Most recent bounty: "${context.recentBountyTitles[0]}". Tell me a specific bounty ID for a deeper summary.`,
        };
      }
      if (!bounty) {
        return {
          intentResult: { kind: 'error', message: 'No bounty found.' },
          spokenResponse: "I couldn't find that bounty.",
          displayResponse: "I couldn't find that bounty. Try a bounty ID like 'summarize bounty abc123'.",
        };
      }
      const desc = (bounty.description || '').replace(/\s+/g, ' ').trim();
      const summary = desc
        ? desc.length > 240 ? `${desc.slice(0, 240)}…` : desc
        : `A ${bounty.reward} STREAM bounty currently ${bounty.status}.`;
      return {
        intentResult: {
          kind: 'bounty',
          bountyId: bounty.id,
          title: bounty.title,
          reward: bounty.reward,
          status: bounty.status,
          summary,
        },
        spokenResponse: `${bounty.title}. ${summary.slice(0, 220)}`,
        displayResponse: `"${bounty.title}" · ${bounty.reward} STREAM · ${bounty.status}\n\n${summary}`,
      };
    }

    if (intent.type === 'navigate' && intent.path) {
      return { intentResult: { kind: 'navigate', path: intent.path } };
    }

    return { intentResult: null };
  }
}

const SYMBOL_ALIASES: Record<string, string> = {
  bitcoin: 'BTC', btc: 'BTC',
  ethereum: 'ETH', ether: 'ETH', eth: 'ETH',
  solana: 'SOL', sol: 'SOL',
  binance: 'BNB', bnb: 'BNB',
  ripple: 'XRP', xrp: 'XRP',
  dogecoin: 'DOGE', doge: 'DOGE',
  cardano: 'ADA', ada: 'ADA',
  avalanche: 'AVAX', avax: 'AVAX',
};

function extractSymbol(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  for (const [key, sym] of Object.entries(SYMBOL_ALIASES)) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) return sym;
  }
  // Look for a 3-5 letter uppercase ticker mention
  const match = transcript.match(/\b([A-Z]{2,5})\b/);
  return match ? match[1] : null;
}

function extractBountyId(transcript: string): string | undefined {
  // Match UUID, then a 6+ char alphanumeric id, then a number like "bounty 12"
  const uuid = transcript.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuid) return uuid[0];
  const id = transcript.match(/\b([a-zA-Z0-9]{6,})\b/);
  if (id && /\d/.test(id[1])) return id[1];
  const num = transcript.match(/\bbounty\s+(\d+)/i);
  return num ? num[1] : undefined;
}

export const voiceAssistantService = new VoiceAssistantService();
