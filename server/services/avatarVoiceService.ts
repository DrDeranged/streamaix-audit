import OpenAI from 'openai';
import { db } from '../db';
import { knowledgeAvatars } from '@shared/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-missing-deploy-time-key" });

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface AvatarVoiceMapping {
  voice: OpenAIVoice;
  speed: number;
  pitch?: string;
  style?: string;
}

const AVATAR_VOICE_MAPPINGS: Record<string, AvatarVoiceMapping> = {
  'vitalik': { voice: 'echo', speed: 1.0, style: 'technical, thoughtful' },
  'elonmusk': { voice: 'onyx', speed: 1.15, style: 'energetic, provocative' },
  'cz_binance': { voice: 'fable', speed: 1.0, style: 'calm, authoritative' },
  'sama': { voice: 'alloy', speed: 1.05, style: 'measured, visionary' },
  'jack': { voice: 'echo', speed: 0.95, style: 'deliberate, passionate' },
  'cathiewood': { voice: 'nova', speed: 1.0, style: 'confident, analytical' },
  'balaji': { voice: 'onyx', speed: 1.1, style: 'rapid-fire, intellectual' },
  'pmarca': { voice: 'fable', speed: 1.05, style: 'witty, incisive' },
  'haydenzadams': { voice: 'alloy', speed: 1.0, style: 'enthusiastic, technical' },
  'starkness': { voice: 'shimmer', speed: 1.0, style: 'articulate, focused' },
  'RuneKek': { voice: 'echo', speed: 0.95, style: 'methodical, precise' },
  'peterthiel': { voice: 'onyx', speed: 0.9, style: 'contrarian, deliberate' },
  'tylerwinklevoss': { voice: 'alloy', speed: 1.0, style: 'professional, direct' },
  'cameronwinklevoss': { voice: 'fable', speed: 1.0, style: 'professional, measured' },
  'brianarmstrong': { voice: 'echo', speed: 1.0, style: 'calm, executive' },
  'dokwon': { voice: 'alloy', speed: 1.1, style: 'confident, bold' },
  'justinsuntron': { voice: 'shimmer', speed: 1.05, style: 'energetic, promotional' },
  
  'Marc Andreessen': { voice: 'fable', speed: 1.05, style: 'witty, incisive' },
  'Chris Dixon': { voice: 'echo', speed: 1.0, style: 'thoughtful, analytical' },
  'Gavin Wood': { voice: 'onyx', speed: 0.95, style: 'technical, precise' },
  'Anatoly Yakovenko': { voice: 'alloy', speed: 1.1, style: 'fast, technical' },
  'Stani Kulechov': { voice: 'fable', speed: 1.0, style: 'calm, DeFi expert' },
  'Robert Leshner': { voice: 'echo', speed: 0.95, style: 'measured, analytical' },
  'Kain Warwick': { voice: 'onyx', speed: 1.0, style: 'passionate, builder' },
  'Andre Cronje': { voice: 'alloy', speed: 1.05, style: 'builder, direct' },
  'Do Kwon': { voice: 'shimmer', speed: 1.1, style: 'confident, bold' },
  'Sam Bankman-Fried': { voice: 'echo', speed: 1.15, style: 'rapid, analytical' },
  'Arthur Hayes': { voice: 'onyx', speed: 1.0, style: 'bold, trading-focused' },
  'Su Zhu': { voice: 'fable', speed: 1.0, style: 'macro, analytical' },
  'Kyle Davies': { voice: 'alloy', speed: 1.0, style: 'calm, trading' },
  'Raoul Pal': { voice: 'onyx', speed: 0.95, style: 'macro, articulate' },
  'Michael Saylor': { voice: 'echo', speed: 0.9, style: 'evangelical, measured' },
  'Cathie Wood': { voice: 'nova', speed: 1.0, style: 'confident, analytical' },
  'Balaji Srinivasan': { voice: 'onyx', speed: 1.1, style: 'rapid-fire, intellectual' },
};

const DEFAULT_VOICE_MAPPING: AvatarVoiceMapping = { voice: 'alloy', speed: 1.0, style: 'professional' };

// Avatars allowed to use TTS even when PAUSE_OPENAI_API is true (for on-demand testing)
const TTS_ENABLED_AVATARS = new Set([
  'haydenzadams',
  'hayden adams',
  'Hayden Adams',
]);

export class AvatarVoiceService {
  // Check if an avatar is allowed to bypass the API pause
  static isAvatarTtsEnabled(avatarName: string): boolean {
    const normalized = avatarName.toLowerCase().replace(/\s+/g, '');
    return TTS_ENABLED_AVATARS.has(avatarName) || 
           TTS_ENABLED_AVATARS.has(normalized) ||
           normalized === 'haydenzadams' ||
           avatarName.toLowerCase().includes('hayden');
  }
  private static audioCache = new Map<string, Buffer>();
  private static cacheMaxSize = 100;

  static getVoiceForAvatar(avatarName: string): AvatarVoiceMapping {
    const mapping = AVATAR_VOICE_MAPPINGS[avatarName];
    if (mapping) return mapping;
    
    for (const [key, value] of Object.entries(AVATAR_VOICE_MAPPINGS)) {
      if (avatarName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(avatarName.toLowerCase())) {
        return value;
      }
    }
    
    return DEFAULT_VOICE_MAPPING;
  }

  static async textToSpeech(
    text: string, 
    avatarName: string,
    options?: { useCache?: boolean; forceGenerate?: boolean }
  ): Promise<Buffer> {
    // Check if TTS is explicitly disabled or API is paused
    // forceGenerate bypasses checks for scheduled streams and test streams
    if (!options?.forceGenerate) {
      if (process.env.DISABLE_OPENAI_TTS === 'true') {
        console.log(`[TTS] ⏸️ TTS is disabled - skipping TTS generation for ${avatarName}`);
        throw new Error('OpenAI TTS is disabled');
      }
      
      // Check if API is paused AND avatar is not in the allowed list
      if (process.env.PAUSE_OPENAI_API === 'true') {
        if (!this.isAvatarTtsEnabled(avatarName)) {
          console.log(`[TTS] ⏸️ OpenAI API paused - skipping TTS generation for ${avatarName}`);
          throw new Error('OpenAI API usage is paused');
        }
        console.log(`[TTS] 🎙️ ON-DEMAND: ${avatarName} is TTS-enabled, generating audio despite API pause`);
      }
    } else {
      console.log(`[TTS] 🎙️ SCHEDULED: Force generating TTS for ${avatarName}`);
    }

    const cacheKey = `${avatarName}:${text.substring(0, 100)}`;
    
    if (options?.useCache && this.audioCache.has(cacheKey)) {
      console.log(`[TTS] Cache hit for ${avatarName}`);
      return this.audioCache.get(cacheKey)!;
    }

    const voiceConfig = this.getVoiceForAvatar(avatarName);
    
    try {
      console.log(`[TTS] Generating speech for ${avatarName} (voice: ${voiceConfig.voice}, speed: ${voiceConfig.speed})`);
      
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voiceConfig.voice,
        input: text,
        speed: voiceConfig.speed,
        response_format: 'mp3',
      });

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      
      if (this.audioCache.size >= this.cacheMaxSize) {
        const firstKey = this.audioCache.keys().next().value;
        if (firstKey) this.audioCache.delete(firstKey);
      }
      this.audioCache.set(cacheKey, audioBuffer);
      
      console.log(`[TTS] Generated ${audioBuffer.length} bytes of audio for ${avatarName}`);
      return audioBuffer;
    } catch (error) {
      console.error(`[TTS] Error generating speech for ${avatarName}:`, error);
      throw error;
    }
  }

  static async textToSpeechBase64(
    text: string, 
    avatarName: string,
    options?: { forceGenerate?: boolean }
  ): Promise<string> {
    const audioBuffer = await this.textToSpeech(text, avatarName, { useCache: true, forceGenerate: options?.forceGenerate });
    return audioBuffer.toString('base64');
  }

  static async streamTextToSpeech(
    text: string,
    avatarName: string
  ): Promise<ReadableStream<Uint8Array>> {
    const voiceConfig = this.getVoiceForAvatar(avatarName);
    
    console.log(`[TTS] Streaming speech for ${avatarName}`);
    
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voiceConfig.voice,
      input: text,
      speed: voiceConfig.speed,
      response_format: 'mp3',
    });

    return response.body as unknown as ReadableStream<Uint8Array>;
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

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are ${avatarName}. Speak naturally as if on a live podcast. Use conversational language, occasional filler words for authenticity, and your signature phrases. Never break character. Do not use markdown or formatting - just natural speech.` 
          },
          { role: 'user', content: prompts[segmentType] }
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const text = completion.choices[0]?.message?.content || '';
      
      const audioBase64 = await this.textToSpeechBase64(text, avatarName);
      
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60;
      
      return {
        text,
        audioBase64,
        duration: Math.round(estimatedDuration),
      };
    } catch (error) {
      console.error(`[TTS] Error generating podcast segment:`, error);
      throw error;
    }
  }

  static async generateContinuousCommentary(
    avatarName: string,
    topic: string,
    marketContext: string,
    previousContext: string = ''
  ): Promise<{ text: string; audioBase64: string }> {
    const voiceConfig = this.getVoiceForAvatar(avatarName);
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are ${avatarName}, hosting a live crypto podcast stream. Speak naturally and conversationally. Your style: ${voiceConfig.style}. Continue the conversation naturally, referencing previous points when relevant. Keep responses to 2-3 sentences (15-30 seconds of speech). Never use markdown.` 
          },
          { 
            role: 'user', 
            content: `Topic: ${topic}\nMarket: ${marketContext}\n${previousContext ? `Previous: ${previousContext}\n` : ''}Continue your live commentary...` 
          }
        ],
        max_tokens: 150,
        temperature: 0.85,
      });

      const text = completion.choices[0]?.message?.content || '';
      const audioBase64 = await this.textToSpeechBase64(text, avatarName);
      
      return { text, audioBase64 };
    } catch (error) {
      console.error(`[TTS] Error generating commentary:`, error);
      throw error;
    }
  }

  static async respondToViewerQuestion(
    avatarName: string,
    question: string,
    viewerName: string,
    marketContext: string
  ): Promise<{ text: string; audioBase64: string }> {
    const voiceConfig = this.getVoiceForAvatar(avatarName);
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are ${avatarName} on a live stream. A viewer named ${viewerName} just asked a question. Acknowledge them by name, then answer thoughtfully in your authentic voice. Style: ${voiceConfig.style}. Keep response to 30-45 seconds. No markdown.` 
          },
          { 
            role: 'user', 
            content: `Viewer ${viewerName} asks: "${question}"\n\nMarket context: ${marketContext}` 
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      const text = completion.choices[0]?.message?.content || '';
      const audioBase64 = await this.textToSpeechBase64(text, avatarName);
      
      return { text, audioBase64 };
    } catch (error) {
      console.error(`[TTS] Error responding to question:`, error);
      throw error;
    }
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
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are ${avatarName} reacting live to a market move. Be authentic, show appropriate emotion for the magnitude of the move. Style: ${voiceConfig.style}. Keep it brief - 10-20 seconds. No markdown.` 
          },
          { 
            role: 'user', 
            content: `${urgency.toUpperCase()}: ${asset} is ${direction}! ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% to $${currentPrice.toLocaleString()}. React and provide quick analysis.` 
          }
        ],
        max_tokens: 100,
        temperature: 0.9,
      });

      const text = completion.choices[0]?.message?.content || '';
      const audioBase64 = await this.textToSpeechBase64(text, avatarName);
      
      return { text, audioBase64 };
    } catch (error) {
      console.error(`[TTS] Error reacting to market:`, error);
      throw error;
    }
  }

  static clearCache(): void {
    this.audioCache.clear();
    console.log('[TTS] Cache cleared');
  }

  // Test mode with short phrases for low-cost testing
  static readonly TEST_PHRASES = [
    "Bitcoin looks bullish today, traders.",
    "Ethereum breaking key resistance levels.",
    "Markets showing strong momentum here.",
    "Watch this support zone closely.",
    "Big moves coming, stay alert.",
  ];

  static async runTestMode(avatarName: string = 'Vitalik Buterin', maxSegments: number = 3): Promise<{
    success: boolean;
    segments: Array<{ text: string; audioBytes: number; durationMs: number }>;
    totalCost: string;
  }> {
    console.log(`[TTS TEST] 🧪 Starting test mode for ${avatarName} with ${maxSegments} segments`);
    const results: Array<{ text: string; audioBytes: number; durationMs: number }> = [];
    let totalCharacters = 0;

    const voiceConfig = this.getVoiceForAvatar(avatarName);

    for (let i = 0; i < Math.min(maxSegments, this.TEST_PHRASES.length); i++) {
      const phrase = this.TEST_PHRASES[i];
      totalCharacters += phrase.length;
      
      try {
        console.log(`[TTS TEST] 🎤 Segment ${i + 1}/${maxSegments}: "${phrase}"`);
        const startTime = Date.now();

        const response = await openai.audio.speech.create({
          model: 'tts-1',
          voice: voiceConfig.voice,
          input: phrase,
          speed: voiceConfig.speed,
          response_format: 'mp3',
        });

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);
        const durationMs = Date.now() - startTime;

        results.push({
          text: phrase,
          audioBytes: audioBuffer.length,
          durationMs,
        });

        console.log(`[TTS TEST] ✅ Generated ${audioBuffer.length} bytes in ${durationMs}ms`);
        
        // Small delay between segments
        if (i < maxSegments - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (error) {
        console.error(`[TTS TEST] ❌ Error on segment ${i + 1}:`, error);
        return { success: false, segments: results, totalCost: 'Error occurred' };
      }
    }

    // TTS-1 costs $0.015 per 1000 characters
    const estimatedCost = (totalCharacters / 1000) * 0.015;

    console.log(`[TTS TEST] 🎉 Test complete! ${results.length} segments, ${totalCharacters} chars, ~$${estimatedCost.toFixed(4)}`);

    return {
      success: true,
      segments: results,
      totalCost: `$${estimatedCost.toFixed(4)} (${totalCharacters} characters)`,
    };
  }

  // Generate test audio and broadcast to a stream (for full pipeline test)
  static async testStreamBroadcast(streamId: string, avatarName: string = 'Vitalik Buterin'): Promise<{
    success: boolean;
    audioBase64: string;
    text: string;
  }> {
    const phrase = this.TEST_PHRASES[Math.floor(Math.random() * this.TEST_PHRASES.length)];
    console.log(`[TTS TEST] 📡 Testing broadcast to stream ${streamId.slice(0, 8)}...`);

    try {
      const voiceConfig = this.getVoiceForAvatar(avatarName);
      
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voiceConfig.voice,
        input: phrase,
        speed: voiceConfig.speed,
        response_format: 'mp3',
      });

      const arrayBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

      console.log(`[TTS TEST] ✅ Audio ready for broadcast (${arrayBuffer.byteLength} bytes)`);

      return { success: true, audioBase64, text: phrase };
    } catch (error) {
      console.error(`[TTS TEST] ❌ Broadcast test failed:`, error);
      return { success: false, audioBase64: '', text: phrase };
    }
  }
}

export const avatarVoiceService = new AvatarVoiceService();
