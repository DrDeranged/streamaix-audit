import { modelGateway } from "../lib/modelGateway";

/**
 * Avatar voice service — text generation only.
 *
 * Server-side TTS (OpenAI) has been removed. Avatar speech text is still
 * generated here (via the Anthropic model gateway); actual audio is produced
 * client-side with the Web Speech API (SpeakButton component). All audio
 * fields returned by this service are empty strings for backward
 * compatibility with existing callers/broadcast shapes.
 */

interface AvatarVoiceStyle {
  speed: number;
  style?: string;
}

const AVATAR_VOICE_STYLES: Record<string, AvatarVoiceStyle> = {
  'vitalik': { speed: 1.0, style: 'technical, thoughtful' },
  'elonmusk': { speed: 1.15, style: 'energetic, provocative' },
  'cz_binance': { speed: 1.0, style: 'calm, authoritative' },
  'sama': { speed: 1.05, style: 'measured, visionary' },
  'jack': { speed: 0.95, style: 'deliberate, passionate' },
  'cathiewood': { speed: 1.0, style: 'confident, analytical' },
  'balaji': { speed: 1.1, style: 'rapid-fire, intellectual' },
  'pmarca': { speed: 1.05, style: 'witty, incisive' },
  'haydenzadams': { speed: 1.0, style: 'enthusiastic, technical' },
  'starkness': { speed: 1.0, style: 'articulate, focused' },
  'RuneKek': { speed: 0.95, style: 'methodical, precise' },
  'peterthiel': { speed: 0.9, style: 'contrarian, deliberate' },
  'tylerwinklevoss': { speed: 1.0, style: 'professional, direct' },
  'cameronwinklevoss': { speed: 1.0, style: 'professional, measured' },
  'brianarmstrong': { speed: 1.0, style: 'calm, executive' },
  'dokwon': { speed: 1.1, style: 'confident, bold' },
  'justinsuntron': { speed: 1.05, style: 'energetic, promotional' },

  'Marc Andreessen': { speed: 1.05, style: 'witty, incisive' },
  'Chris Dixon': { speed: 1.0, style: 'thoughtful, analytical' },
  'Gavin Wood': { speed: 0.95, style: 'technical, precise' },
  'Anatoly Yakovenko': { speed: 1.1, style: 'fast, technical' },
  'Stani Kulechov': { speed: 1.0, style: 'calm, DeFi expert' },
  'Robert Leshner': { speed: 0.95, style: 'measured, analytical' },
  'Kain Warwick': { speed: 1.0, style: 'passionate, builder' },
  'Andre Cronje': { speed: 1.05, style: 'builder, direct' },
  'Do Kwon': { speed: 1.1, style: 'confident, bold' },
  'Sam Bankman-Fried': { speed: 1.15, style: 'rapid, analytical' },
  'Arthur Hayes': { speed: 1.0, style: 'bold, trading-focused' },
  'Su Zhu': { speed: 1.0, style: 'macro, analytical' },
  'Kyle Davies': { speed: 1.0, style: 'calm, trading' },
  'Raoul Pal': { speed: 0.95, style: 'macro, articulate' },
  'Michael Saylor': { speed: 0.9, style: 'evangelical, measured' },
  'Cathie Wood': { speed: 1.0, style: 'confident, analytical' },
  'Balaji Srinivasan': { speed: 1.1, style: 'rapid-fire, intellectual' },
};

const DEFAULT_VOICE_STYLE: AvatarVoiceStyle = { speed: 1.0, style: 'professional' };

function ttsRemovedError(): Error & { statusCode: number } {
  const err = new Error(
    'Server-side TTS has been removed. Avatar speech is text-only; audio is generated client-side via the Web Speech API.',
  ) as Error & { statusCode: number };
  err.statusCode = 410;
  return err;
}

export class AvatarVoiceService {
  static getVoiceForAvatar(avatarName: string): AvatarVoiceStyle {
    const mapping = AVATAR_VOICE_STYLES[avatarName];
    if (mapping) return mapping;

    for (const [key, value] of Object.entries(AVATAR_VOICE_STYLES)) {
      if (avatarName.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(avatarName.toLowerCase())) {
        return value;
      }
    }

    return DEFAULT_VOICE_STYLE;
  }

  /** @deprecated Server-side TTS removed — always throws. */
  static async textToSpeech(_text: string, _avatarName: string, _options?: unknown): Promise<Buffer> {
    throw ttsRemovedError();
  }

  /** @deprecated Server-side TTS removed — always throws. */
  static async textToSpeechBase64(_text: string, _avatarName: string, _options?: unknown): Promise<string> {
    throw ttsRemovedError();
  }

  /** @deprecated Server-side TTS removed — always throws. */
  static async streamTextToSpeech(_text: string, _avatarName: string): Promise<ReadableStream<Uint8Array>> {
    throw ttsRemovedError();
  }

  static async generatePodcastSegment(
    avatarName: string,
    topic: string,
    marketContext: string,
    segmentType: 'intro' | 'analysis' | 'alpha' | 'qa' | 'outro'
  ): Promise<{ text: string; audioBase64: string; duration: number }> {
    const voiceConfig = this.getVoiceForAvatar(avatarName);

    const prompts: Record<string, string> = {
      intro: `You are ${avatarName}, a renowned crypto thought leader. Generate a compelling 30-second podcast intro for your live stream about "${topic}". Be authentic to your known speaking style: ${voiceConfig.style}. Current ${marketContext}. Start with a hook that grabs attention.`,
      analysis: `You are ${avatarName}. Provide a 60-second market analysis segment on "${topic}". Be specific with price levels, key support/resistance, and actionable insights. Style: ${voiceConfig.style}. ${marketContext}`,
      alpha: `You are ${avatarName}. Drop some exclusive alpha on "${topic}" - share a specific trade setup, entry point, or hidden opportunity you're watching. Be bold and specific. 45 seconds max. Style: ${voiceConfig.style}. ${marketContext}`,
      qa: `You are ${avatarName}. A viewer asks about "${topic}". Give a thoughtful, expert response in your authentic voice. 30-45 seconds. Style: ${voiceConfig.style}.`,
      outro: `You are ${avatarName}. Close out this segment on "${topic}" with key takeaways and a call to action. Remind viewers to DYOR. 20 seconds. Style: ${voiceConfig.style}.`,
    };

    const completion = await modelGateway.complete({
      tier: 'fast',
      priority: 'background',
      tag: 'avatar-voice-service',
      system: `You are ${avatarName}. Speak naturally as if on a live podcast. Use conversational language, occasional filler words for authenticity, and your signature phrases. Never break character. Do not use markdown or formatting - just natural speech.`,
      user: prompts[segmentType],
      maxTokens: 300,
      temperature: 0.8,
    });

    const text = completion.content || '';
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    return {
      text,
      audioBase64: '',
      duration: Math.round(estimatedDuration),
    };
  }

  static async generateContinuousCommentary(
    avatarName: string,
    topic: string,
    marketContext: string,
    previousContext: string = ''
  ): Promise<{ text: string; audioBase64: string }> {
    const voiceConfig = this.getVoiceForAvatar(avatarName);

    const completion = await modelGateway.complete({
      tier: 'fast',
      priority: 'background',
      tag: 'avatar-voice-service',
      system: `You are ${avatarName}, hosting a live crypto podcast stream. Speak naturally and conversationally. Your style: ${voiceConfig.style}. Continue the conversation naturally, referencing previous points when relevant. Keep responses to 2-3 sentences (15-30 seconds of speech). Never use markdown.`,
      user: `Topic: ${topic}\nMarket: ${marketContext}\n${previousContext ? `Previous: ${previousContext}\n` : ''}Continue your live commentary...`,
      maxTokens: 150,
      temperature: 0.85,
    });

    return { text: completion.content || '', audioBase64: '' };
  }

  static async respondToViewerQuestion(
    avatarName: string,
    question: string,
    viewerName: string,
    marketContext: string
  ): Promise<{ text: string; audioBase64: string }> {
    const voiceConfig = this.getVoiceForAvatar(avatarName);

    const completion = await modelGateway.complete({
      tier: 'fast',
      priority: 'background',
      tag: 'avatar-voice-service',
      system: `You are ${avatarName} on a live stream. A viewer named ${viewerName} just asked a question. Acknowledge them by name, then answer thoughtfully in your authentic voice. Style: ${voiceConfig.style}. Keep response to 30-45 seconds. No markdown.`,
      user: `Viewer ${viewerName} asks: "${question}"\n\nMarket context: ${marketContext}`,
      maxTokens: 200,
      temperature: 0.8,
    });

    return { text: completion.content || '', audioBase64: '' };
  }

  static async reactToMarketMove(
    avatarName: string,
    asset: string,
    priceChange: number,
    currentPrice: number
  ): Promise<{ text: string; audioBase64: string }> {
    const voiceConfig = this.getVoiceForAvatar(avatarName);
    const direction = priceChange > 0 ? 'pumping' : 'dumping';
    const urgency = Math.abs(priceChange) > 5 ? 'breaking news' : 'notable move';

    const completion = await modelGateway.complete({
      tier: 'fast',
      priority: 'background',
      tag: 'avatar-voice-service',
      system: `You are ${avatarName} reacting live to a market move. Be authentic, show appropriate emotion for the magnitude of the move. Style: ${voiceConfig.style}. Keep it brief - 10-20 seconds. No markdown.`,
      user: `${urgency.toUpperCase()}: ${asset} is ${direction}! ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% to $${currentPrice.toLocaleString()}. React and provide quick analysis.`,
      maxTokens: 100,
      temperature: 0.9,
    });

    return { text: completion.content || '', audioBase64: '' };
  }
}

export const avatarVoiceService = new AvatarVoiceService();
