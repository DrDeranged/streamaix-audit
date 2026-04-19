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

export interface VoiceAssistantResponse {
  transcript: string;
  spokenResponse: string;
  displayResponse: string;
  intent: VoiceIntent;
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
- Bounties claimed: ${ctx.bountiesCount ?? 0}
- STREAM token balance: ${ctx.walletBalance ?? 0}

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

    const { spokenResponse, displayResponse, intent } = await this.respond(transcript, context);
    const audio = await this.synthesize(spokenResponse).catch(() => null);

    return {
      transcript,
      spokenResponse,
      displayResponse,
      intent,
      audioBase64: audio ? audio.toString('base64') : null,
      audioMimeType: audio ? 'audio/mpeg' : null,
      modelUsed: 'whisper-1 + gpt-4o-mini + tts-1',
    };
  }
}

export const voiceAssistantService = new VoiceAssistantService();
