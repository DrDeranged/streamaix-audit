import { db } from '../db';
import { 
  liveStreams, 
  knowledgeAvatars, 
  streamMessages, 
  users
} from '@shared/schema';
import { eq, and, desc, gt, sql } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ================== SESSION MEMORY ==================
interface SessionMemory {
  streamId: string;
  avatarId: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string; timestamp: number }[];
  mentionedTopics: string[];
  viewerInterests: Map<string, string[]>;
  marketEventsDiscussed: string[];
  sentimentHistory: { timestamp: number; sentiment: number; dominant: string }[];
  lastContextUpdate: number;
}

const sessionMemories = new Map<string, SessionMemory>();

export function getOrCreateSessionMemory(streamId: string, avatarId: string): SessionMemory {
  if (!sessionMemories.has(streamId)) {
    sessionMemories.set(streamId, {
      streamId,
      avatarId,
      conversationHistory: [],
      mentionedTopics: [],
      viewerInterests: new Map(),
      marketEventsDiscussed: [],
      sentimentHistory: [],
      lastContextUpdate: Date.now(),
    });
  }
  return sessionMemories.get(streamId)!;
}

export function addToSessionMemory(
  streamId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const memory = sessionMemories.get(streamId);
  if (memory) {
    memory.conversationHistory.push({ role, content, timestamp: Date.now() });
    // Keep last 50 messages for context
    if (memory.conversationHistory.length > 50) {
      memory.conversationHistory = memory.conversationHistory.slice(-50);
    }
    // Extract topics mentioned
    const topics = extractTopics(content);
    memory.mentionedTopics.push(...topics);
    memory.mentionedTopics = Array.from(new Set(memory.mentionedTopics)).slice(-30);
  }
}

function extractTopics(text: string): string[] {
  const cryptoRegex = /\b(BTC|ETH|SOL|AVAX|MATIC|LINK|DOT|ADA|XRP|DOGE|SHIB|UNI|AAVE|CRV|LDO|OP|ARB|BASE|BLAST)\b/gi;
  const defiRegex = /\b(defi|staking|yield|liquidity|swap|bridge|vault|lending|borrowing|amm)\b/gi;
  const conceptRegex = /\b(bullish|bearish|support|resistance|breakout|reversal|accumulation|distribution)\b/gi;
  
  const matches = [
    ...(text.match(cryptoRegex) || []),
    ...(text.match(defiRegex) || []),
    ...(text.match(conceptRegex) || []),
  ];
  return Array.from(new Set(matches.map(m => m.toUpperCase())));
}

export function buildContextAwarePrompt(streamId: string): string {
  const memory = sessionMemories.get(streamId);
  if (!memory) return '';
  
  const recentHistory = memory.conversationHistory.slice(-10);
  const topicsContext = memory.mentionedTopics.length > 0 
    ? `Topics discussed so far: ${memory.mentionedTopics.slice(-10).join(', ')}.` 
    : '';
  
  const historyContext = recentHistory.length > 0
    ? `Recent conversation:\n${recentHistory.map(h => `${h.role}: ${h.content.slice(0, 200)}`).join('\n')}`
    : '';
  
  return `${topicsContext}\n\n${historyContext}`;
}

export function clearSessionMemory(streamId: string) {
  sessionMemories.delete(streamId);
}

// ================== SENTIMENT ANALYSIS ==================
interface SentimentResult {
  overallSentiment: number; // -1 to 1
  dominantEmotion: string;
  energyLevel: number; // 0 to 1
  topKeywords: string[];
  messageCount: number;
}

const sentimentCache = new Map<string, { result: SentimentResult; timestamp: number }>();
const SENTIMENT_CACHE_TTL = 30000; // 30 seconds

export async function analyzeViewerSentiment(streamId: string): Promise<SentimentResult> {
  const cached = sentimentCache.get(streamId);
  if (cached && Date.now() - cached.timestamp < SENTIMENT_CACHE_TTL) {
    return cached.result;
  }
  
  try {
    const recentMessages = await db.select()
      .from(streamMessages)
      .where(and(
        eq(streamMessages.streamId, streamId),
        gt(streamMessages.createdAt, new Date(Date.now() - 5 * 60 * 1000))
      ))
      .orderBy(desc(streamMessages.createdAt))
      .limit(50);
    
    if (recentMessages.length === 0) {
      return { overallSentiment: 0, dominantEmotion: 'neutral', energyLevel: 0.5, topKeywords: [], messageCount: 0 };
    }
    
    const messageTexts = recentMessages.map(m => m.content).join('\n');
    
    // Simple keyword-based sentiment for efficiency
    const bullishWords = ['moon', 'bullish', 'pump', '🚀', 'lfg', 'buy', 'long', 'green', 'up'];
    const bearishWords = ['dump', 'bearish', 'crash', 'sell', 'short', 'red', 'down', 'rekt'];
    const excitedWords = ['!', '🔥', 'wow', 'amazing', 'love', 'insane', 'crazy', 'hype'];
    
    const lowerText = messageTexts.toLowerCase();
    let bullishScore = 0;
    let bearishScore = 0;
    let excitementScore = 0;
    
    bullishWords.forEach(w => bullishScore += (lowerText.match(new RegExp(w, 'gi')) || []).length);
    bearishWords.forEach(w => bearishScore += (lowerText.match(new RegExp(w, 'gi')) || []).length);
    excitedWords.forEach(w => excitementScore += (lowerText.match(new RegExp(w, 'gi')) || []).length);
    
    const total = bullishScore + bearishScore + 1;
    const sentiment = (bullishScore - bearishScore) / total;
    const energy = Math.min(1, excitementScore / (recentMessages.length * 0.5));
    
    const dominantEmotion = sentiment > 0.3 ? 'bullish' : sentiment < -0.3 ? 'bearish' : energy > 0.6 ? 'excited' : 'neutral';
    
    // Extract top keywords
    const words = messageTexts.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const wordFreq = new Map<string, number>();
    words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
    const topKeywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    const result: SentimentResult = {
      overallSentiment: sentiment,
      dominantEmotion,
      energyLevel: energy,
      topKeywords,
      messageCount: recentMessages.length,
    };
    
    sentimentCache.set(streamId, { result, timestamp: Date.now() });
    
    // Store in session memory
    const memory = sessionMemories.get(streamId);
    if (memory) {
      memory.sentimentHistory.push({ timestamp: Date.now(), sentiment, dominant: dominantEmotion });
      if (memory.sentimentHistory.length > 20) {
        memory.sentimentHistory = memory.sentimentHistory.slice(-20);
      }
    }
    
    return result;
  } catch (error) {
    console.error('[Sentiment] Analysis error:', error);
    return { overallSentiment: 0, dominantEmotion: 'neutral', energyLevel: 0.5, topKeywords: [], messageCount: 0 };
  }
}

// ================== PREDICTIVE MARKET COMMENTARY ==================
interface MarketPrediction {
  asset: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeframe: string;
  reasoning: string;
  generatedAt: number;
}

const predictionCache = new Map<string, MarketPrediction[]>();

export async function generateMarketPrediction(
  avatarId: string,
  asset: string,
  marketContext: string
): Promise<MarketPrediction | null> {
  if (process.env.PAUSE_OPENAI_API === 'true') {
    return null;
  }
  
  try {
    const [avatar] = await db.select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.id, avatarId))
      .limit(1);
    
    if (!avatar) return null;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are ${avatar.name}, a ${avatar.tradingStyle || 'balanced'} trader with ${avatar.riskTolerance || 'moderate'} risk tolerance and a ${avatar.marketOutlook || 'neutral'} outlook. Generate a brief market prediction.`
        },
        {
          role: 'user',
          content: `Based on current market conditions:\n${marketContext}\n\nGenerate a prediction for ${asset} over the next 24-48 hours. Respond in JSON format: {"direction": "bullish|bearish|neutral", "confidence": 0-100, "timeframe": "24h|48h|1w", "reasoning": "brief explanation"}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      asset,
      direction: parsed.direction,
      confidence: parsed.confidence,
      timeframe: parsed.timeframe,
      reasoning: parsed.reasoning,
      generatedAt: Date.now(),
    };
  } catch (error) {
    console.error('[Prediction] Error:', error);
    return null;
  }
}

// ================== DEBATE MODE ==================
interface DebateSession {
  streamId: string;
  avatar1Id: string;
  avatar2Id: string;
  topic: string;
  currentSpeaker: 1 | 2;
  exchanges: { speakerId: string; content: string; timestamp: number }[];
  startTime: number;
  isActive: boolean;
}

const debateSessions = new Map<string, DebateSession>();

export async function startDebateMode(
  streamId: string,
  avatar1Id: string,
  avatar2Id: string,
  topic: string
): Promise<DebateSession | null> {
  if (debateSessions.has(streamId)) {
    return debateSessions.get(streamId)!;
  }
  
  const session: DebateSession = {
    streamId,
    avatar1Id,
    avatar2Id,
    topic,
    currentSpeaker: 1,
    exchanges: [],
    startTime: Date.now(),
    isActive: true,
  };
  
  debateSessions.set(streamId, session);
  return session;
}

export async function generateDebateResponse(
  streamId: string,
  previousStatement?: string
): Promise<{ speakerName: string; response: string } | null> {
  if (process.env.PAUSE_OPENAI_API === 'true') return null;
  
  const session = debateSessions.get(streamId);
  if (!session || !session.isActive) return null;
  
  const currentAvatarId = session.currentSpeaker === 1 ? session.avatar1Id : session.avatar2Id;
  
  const [avatar] = await db.select()
    .from(knowledgeAvatars)
    .where(eq(knowledgeAvatars.id, currentAvatarId))
    .limit(1);
  
  if (!avatar) return null;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are ${avatar.name}. You're in a friendly debate about "${session.topic}". Your style: ${avatar.tradingStyle}, outlook: ${avatar.marketOutlook}. Be conversational, make your points clearly, and acknowledge the other side's valid points while defending your position.`
        },
        {
          role: 'user',
          content: previousStatement 
            ? `The other debater just said: "${previousStatement}"\n\nRespond with your perspective (2-3 sentences).`
            : `Start the debate with your opening statement on ${session.topic} (2-3 sentences).`
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    session.exchanges.push({
      speakerId: currentAvatarId,
      content,
      timestamp: Date.now(),
    });
    
    session.currentSpeaker = session.currentSpeaker === 1 ? 2 : 1;
    
    return { speakerName: avatar.name, response: content };
  } catch (error) {
    console.error('[Debate] Error:', error);
    return null;
  }
}

export function endDebateMode(streamId: string) {
  debateSessions.delete(streamId);
}

// ================== AVATAR TAG-IN SYSTEM ==================
interface TagInQueue {
  streamId: string;
  currentAvatarId: string;
  queue: { avatarId: string; topic?: string; requestedAt: number }[];
  tagHistory: { fromId: string; toId: string; timestamp: number }[];
}

const tagInQueues = new Map<string, TagInQueue>();

export function initializeTagInQueue(streamId: string, hostAvatarId: string) {
  tagInQueues.set(streamId, {
    streamId,
    currentAvatarId: hostAvatarId,
    queue: [],
    tagHistory: [],
  });
}

export function requestTagIn(streamId: string, avatarId: string, topic?: string): boolean {
  const queue = tagInQueues.get(streamId);
  if (!queue) return false;
  
  if (queue.queue.some(q => q.avatarId === avatarId)) return false;
  
  queue.queue.push({ avatarId, topic, requestedAt: Date.now() });
  return true;
}

export async function performTagIn(streamId: string): Promise<{ newAvatar: any; topic?: string } | null> {
  const queue = tagInQueues.get(streamId);
  if (!queue || queue.queue.length === 0) return null;
  
  const next = queue.queue.shift()!;
  
  const [avatar] = await db.select()
    .from(knowledgeAvatars)
    .where(eq(knowledgeAvatars.id, next.avatarId))
    .limit(1);
  
  if (!avatar) return null;
  
  queue.tagHistory.push({
    fromId: queue.currentAvatarId,
    toId: next.avatarId,
    timestamp: Date.now(),
  });
  
  queue.currentAvatarId = next.avatarId;
  
  return { newAvatar: avatar, topic: next.topic };
}

// ================== AVATAR EXPRESSIONS ==================
export type AvatarExpression = 'neutral' | 'thinking' | 'excited' | 'concerned' | 'laughing' | 'surprised' | 'confident';

interface ExpressionState {
  expression: AvatarExpression;
  intensity: number; // 0-1
  transitionDuration: number;
}

export function determineExpression(
  content: string,
  sentiment?: SentimentResult
): ExpressionState {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('?') || lowerContent.includes('hmm') || lowerContent.includes('interesting')) {
    return { expression: 'thinking', intensity: 0.7, transitionDuration: 300 };
  }
  
  if (lowerContent.includes('!') || lowerContent.includes('amazing') || lowerContent.includes('incredible') || lowerContent.includes('bullish')) {
    return { expression: 'excited', intensity: 0.8, transitionDuration: 200 };
  }
  
  if (lowerContent.includes('careful') || lowerContent.includes('risk') || lowerContent.includes('bearish') || lowerContent.includes('concern')) {
    return { expression: 'concerned', intensity: 0.6, transitionDuration: 300 };
  }
  
  if (lowerContent.includes('haha') || lowerContent.includes('lol') || lowerContent.includes('😂')) {
    return { expression: 'laughing', intensity: 0.9, transitionDuration: 150 };
  }
  
  if (lowerContent.includes('wow') || lowerContent.includes('unexpected') || lowerContent.includes('breaking')) {
    return { expression: 'surprised', intensity: 0.8, transitionDuration: 150 };
  }
  
  if (sentiment && sentiment.energyLevel > 0.7) {
    return { expression: 'confident', intensity: 0.7, transitionDuration: 300 };
  }
  
  return { expression: 'neutral', intensity: 0.5, transitionDuration: 500 };
}

// ================== LIVE POLLS ==================
interface LivePoll {
  id: string;
  streamId: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  voters: Set<string>;
}

const activePolls = new Map<string, LivePoll>();

export function createPoll(
  streamId: string,
  question: string,
  options: string[],
  createdBy: string,
  durationSeconds: number = 60
): LivePoll {
  const pollId = `poll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  const poll: LivePoll = {
    id: pollId,
    streamId,
    question,
    options: options.map((text, i) => ({ id: `opt-${i}`, text, votes: 0 })),
    createdBy,
    createdAt: Date.now(),
    expiresAt: Date.now() + durationSeconds * 1000,
    isActive: true,
    voters: new Set(),
  };
  
  activePolls.set(pollId, poll);
  
  // Auto-close poll
  setTimeout(() => {
    poll.isActive = false;
  }, durationSeconds * 1000);
  
  return poll;
}

export function votePoll(pollId: string, optionId: string, voterId: string): boolean {
  const poll = activePolls.get(pollId);
  if (!poll || !poll.isActive || poll.voters.has(voterId)) return false;
  
  const option = poll.options.find(o => o.id === optionId);
  if (!option) return false;
  
  option.votes++;
  poll.voters.add(voterId);
  return true;
}

export function getPollResults(pollId: string): LivePoll | null {
  return activePolls.get(pollId) || null;
}

export function getActivePolls(streamId: string): LivePoll[] {
  return Array.from(activePolls.values()).filter(p => p.streamId === streamId && p.isActive);
}

// ================== TRIVIA CHALLENGES ==================
interface TriviaQuestion {
  id: string;
  streamId: string;
  question: string;
  options: string[];
  correctIndex: number;
  pointsReward: number;
  timeLimit: number;
  createdAt: number;
  isActive: boolean;
  answers: Map<string, { answer: number; timestamp: number }>;
}

const activeTriviaQuestions = new Map<string, TriviaQuestion>();

export async function generateTriviaQuestion(
  streamId: string,
  category: 'crypto' | 'defi' | 'trading' | 'general'
): Promise<TriviaQuestion | null> {
  const questions: Record<string, { q: string; opts: string[]; correct: number }[]> = {
    crypto: [
      { q: 'What is the maximum supply of Bitcoin?', opts: ['21 million', '100 million', '18 million', 'Unlimited'], correct: 0 },
      { q: 'Who created Ethereum?', opts: ['Satoshi Nakamoto', 'Vitalik Buterin', 'Charles Hoskinson', 'Gavin Wood'], correct: 1 },
      { q: 'What consensus mechanism does Bitcoin use?', opts: ['Proof of Stake', 'Proof of Work', 'Delegated PoS', 'Proof of Authority'], correct: 1 },
    ],
    defi: [
      { q: 'What does AMM stand for?', opts: ['Automated Market Maker', 'Auto Money Manager', 'Algorithmic Money Mover', 'Asset Market Mediator'], correct: 0 },
      { q: 'What is impermanent loss?', opts: ['Temporary wallet loss', 'Loss from price divergence in LP', 'Network fee loss', 'Slippage loss'], correct: 1 },
      { q: 'Which was the first major DeFi protocol?', opts: ['Uniswap', 'MakerDAO', 'Compound', 'Aave'], correct: 1 },
    ],
    trading: [
      { q: 'What is a "stop loss"?', opts: ['Order to limit losses', 'A bearish pattern', 'Trading fee', 'Market close'], correct: 0 },
      { q: 'What does FOMO stand for?', opts: ['For Our Money Only', 'Fear Of Missing Out', 'First Order Market Option', 'Fund Operations Management'], correct: 1 },
      { q: 'What is a "bull trap"?', opts: ['Whale strategy', 'False breakout before drop', 'Leveraged position', 'Market manipulation'], correct: 1 },
    ],
    general: [
      { q: 'What year was Bitcoin launched?', opts: ['2008', '2009', '2010', '2011'], correct: 1 },
      { q: 'What is a "gas fee"?', opts: ['Mining reward', 'Transaction cost on Ethereum', 'Staking reward', 'Validator penalty'], correct: 1 },
      { q: 'What does HODL mean?', opts: ['Hold On for Dear Life', 'Misspelling of Hold', 'High Order Distributed Ledger', 'Both A and B'], correct: 3 },
    ],
  };
  
  const categoryQuestions = questions[category] || questions.general;
  const randomQ = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
  
  const triviaId = `trivia-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  const trivia: TriviaQuestion = {
    id: triviaId,
    streamId,
    question: randomQ.q,
    options: randomQ.opts,
    correctIndex: randomQ.correct,
    pointsReward: 50,
    timeLimit: 15,
    createdAt: Date.now(),
    isActive: true,
    answers: new Map(),
  };
  
  activeTriviaQuestions.set(triviaId, trivia);
  
  // Auto-close trivia
  setTimeout(() => {
    trivia.isActive = false;
  }, trivia.timeLimit * 1000);
  
  return trivia;
}

export function answerTrivia(
  triviaId: string,
  userId: string,
  answerIndex: number
): { correct: boolean; points: number; rank: number } | null {
  const trivia = activeTriviaQuestions.get(triviaId);
  if (!trivia || !trivia.isActive || trivia.answers.has(userId)) return null;
  
  trivia.answers.set(userId, { answer: answerIndex, timestamp: Date.now() });
  
  const correct = answerIndex === trivia.correctIndex;
  const correctAnswers = Array.from(trivia.answers.entries())
    .filter(([_, a]) => a.answer === trivia.correctIndex)
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const rank = correct ? correctAnswers.findIndex(([id]) => id === userId) + 1 : 0;
  const points = correct ? Math.max(10, trivia.pointsReward - (rank - 1) * 5) : 0;
  
  return { correct, points, rank };
}

export function getTriviaResults(triviaId: string): TriviaQuestion | null {
  return activeTriviaQuestions.get(triviaId) || null;
}

// ================== WATCH PARTIES ==================
interface WatchParty {
  id: string;
  hostStreamId: string;
  partyCode: string;
  hostId: string;
  members: Map<string, { username: string; joinedAt: number }>;
  syncState: { timestamp: number; isPlaying: boolean; position: number };
  chat: { userId: string; username: string; content: string; timestamp: number }[];
  createdAt: number;
  isActive: boolean;
}

const watchParties = new Map<string, WatchParty>();
const partyCodeToId = new Map<string, string>();

export function createWatchParty(
  streamId: string,
  hostId: string,
  hostUsername: string
): WatchParty {
  const partyId = `party-${Date.now()}`;
  const partyCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  
  const party: WatchParty = {
    id: partyId,
    hostStreamId: streamId,
    partyCode,
    hostId,
    members: new Map([[hostId, { username: hostUsername, joinedAt: Date.now() }]]),
    syncState: { timestamp: Date.now(), isPlaying: true, position: 0 },
    chat: [],
    createdAt: Date.now(),
    isActive: true,
  };
  
  watchParties.set(partyId, party);
  partyCodeToId.set(partyCode, partyId);
  
  return party;
}

export function joinWatchParty(
  partyCode: string,
  userId: string,
  username: string
): WatchParty | null {
  const partyId = partyCodeToId.get(partyCode.toUpperCase());
  if (!partyId) return null;
  
  const party = watchParties.get(partyId);
  if (!party || !party.isActive) return null;
  
  party.members.set(userId, { username, joinedAt: Date.now() });
  return party;
}

export function leaveWatchParty(partyCode: string, userId: string) {
  const partyId = partyCodeToId.get(partyCode.toUpperCase());
  if (!partyId) return;
  
  const party = watchParties.get(partyId);
  if (!party) return;
  
  party.members.delete(userId);
  
  if (party.members.size === 0) {
    party.isActive = false;
    watchParties.delete(partyId);
    partyCodeToId.delete(partyCode.toUpperCase());
  }
}

export function syncWatchParty(partyCode: string, position: number, isPlaying: boolean) {
  const partyId = partyCodeToId.get(partyCode.toUpperCase());
  if (!partyId) return;
  
  const party = watchParties.get(partyId);
  if (!party) return;
  
  party.syncState = { timestamp: Date.now(), isPlaying, position };
}

export function getWatchParty(partyCode: string): WatchParty | null {
  const partyId = partyCodeToId.get(partyCode.toUpperCase());
  if (!partyId) return null;
  return watchParties.get(partyId) || null;
}

// Export all functions
export const avatarStreamEnhancements = {
  // Session Memory
  getOrCreateSessionMemory,
  addToSessionMemory,
  buildContextAwarePrompt,
  clearSessionMemory,
  
  // Sentiment Analysis
  analyzeViewerSentiment,
  
  // Predictions
  generateMarketPrediction,
  
  // Debate Mode
  startDebateMode,
  generateDebateResponse,
  endDebateMode,
  
  // Tag-In System
  initializeTagInQueue,
  requestTagIn,
  performTagIn,
  
  // Expressions
  determineExpression,
  
  // Polls
  createPoll,
  votePoll,
  getPollResults,
  getActivePolls,
  
  // Trivia
  generateTriviaQuestion,
  answerTrivia,
  getTriviaResults,
  
  // Watch Parties
  createWatchParty,
  joinWatchParty,
  leaveWatchParty,
  syncWatchParty,
  getWatchParty,
};
