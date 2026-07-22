import { db } from '../db';
import { bounties, users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { modelGateway } from "../lib/modelGateway";
// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

interface KnowledgeQuestion {
  title: string;
  description: string;
  question: string;
  expectedAnswer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  verificationCriteria: {
    keyPoints: string[];
    requiredConcepts: string[];
    acceptableAlternatives: string[];
  };
  tags: string[];
}

// Balanced question topics covering both crypto AND stocks/macro (50/50 split)
const QUESTION_TOPICS = [
  // === CRYPTO TOPICS (50%) ===
  { topic: "Layer 1 vs Layer 2 blockchain differences", category: "Infrastructure", difficulty: "medium" },
  { topic: "How DeFi lending protocols work", category: "DeFi", difficulty: "medium" },
  { topic: "Explain proof of stake vs proof of work", category: "Infrastructure", difficulty: "easy" },
  { topic: "What are automated market makers (AMMs)", category: "DeFi", difficulty: "medium" },
  { topic: "Explain impermanent loss in liquidity pools", category: "DeFi", difficulty: "hard" },
  { topic: "What is MEV (Maximal Extractable Value)", category: "Infrastructure", difficulty: "expert" },
  { topic: "How do rollups improve scalability", category: "Layer 2", difficulty: "medium" },
  { topic: "Explain the difference between optimistic and zk-rollups", category: "Layer 2", difficulty: "hard" },
  { topic: "What are flash loans and how do they work", category: "DeFi", difficulty: "hard" },
  { topic: "Explain tokenomics and token supply mechanisms", category: "Tokenomics", difficulty: "medium" },
  { topic: "What is a DAO and how does governance work", category: "DAOs", difficulty: "easy" },
  { topic: "Explain liquid staking and its benefits", category: "DeFi", difficulty: "medium" },
  { topic: "What are NFT royalties and how do they work", category: "NFTs", difficulty: "easy" },
  { topic: "How do oracles provide off-chain data to blockchains", category: "Infrastructure", difficulty: "medium" },
  { topic: "Explain restaking and EigenLayer", category: "DeFi", difficulty: "expert" },
  { topic: "What is account abstraction (ERC-4337)", category: "Infrastructure", difficulty: "hard" },
  { topic: "How do cross-chain bridges work", category: "Infrastructure", difficulty: "hard" },
  { topic: "Explain perpetual futures in crypto", category: "Trading", difficulty: "medium" },
  { topic: "What is a governance attack on a DAO", category: "DAOs", difficulty: "expert" },
  { topic: "How do stablecoins maintain their peg", category: "DeFi", difficulty: "medium" },
  
  // === STOCKS & MACRO TOPICS (50%) ===
  { topic: "How do stock options and calls work", category: "Stocks", difficulty: "medium" },
  { topic: "Explain the Federal Reserve's role in monetary policy", category: "Macro", difficulty: "medium" },
  { topic: "What is quantitative easing and how does it affect markets", category: "Macro", difficulty: "hard" },
  { topic: "How do ETFs differ from mutual funds", category: "ETFs", difficulty: "easy" },
  { topic: "Explain P/E ratio and how to value tech stocks", category: "Stocks", difficulty: "medium" },
  { topic: "What moves NVIDIA stock price and AI chip demand", category: "Stocks", difficulty: "medium" },
  { topic: "How do interest rate changes affect stock valuations", category: "Macro", difficulty: "hard" },
  { topic: "Explain market cap vs enterprise value", category: "Stocks", difficulty: "medium" },
  { topic: "What is a stock split and why do companies do them", category: "Stocks", difficulty: "easy" },
  { topic: "How do earnings reports affect stock prices", category: "Earnings", difficulty: "medium" },
  { topic: "Explain short selling and its risks", category: "Trading", difficulty: "medium" },
  { topic: "What is the yield curve and why does inversion matter", category: "Macro", difficulty: "hard" },
  { topic: "How do Bitcoin ETFs work and why are they significant", category: "ETFs", difficulty: "medium" },
  { topic: "Explain the relationship between inflation and stock markets", category: "Macro", difficulty: "hard" },
  { topic: "What is dollar cost averaging and when to use it", category: "Trading", difficulty: "easy" },
  { topic: "How do tech company valuations work (DCF, revenue multiples)", category: "Stocks", difficulty: "expert" },
  { topic: "Explain the S&P 500 index and how it's weighted", category: "ETFs", difficulty: "easy" },
  { topic: "What causes stock market corrections and bear markets", category: "Macro", difficulty: "medium" },
  { topic: "How do stock buybacks affect shareholder value", category: "Stocks", difficulty: "medium" },
  { topic: "Explain the difference between growth and value investing", category: "Stocks", difficulty: "medium" },
];

export class KnowledgeQuestionService {
  async generateKnowledgeQuestion(agentId: string, agentUsername: string, streamPoints: number): Promise<string | null> {
    if (process.env.PAUSE_ANTHROPIC_API === 'true') {
      console.log(`[KnowledgeQ] OpenAI API paused - skipping question generation`);
      return null;
    }

    try {
      const topicInfo = QUESTION_TOPICS[Math.floor(Math.random() * QUESTION_TOPICS.length)];
      
      console.log(`[KnowledgeQ] Generating question about: ${topicInfo.topic}`);
      
      const question = await this.generateQuestionWithAI(topicInfo, agentUsername);
      
      if (!question) {
        console.log(`[KnowledgeQ] Failed to generate question`);
        return null;
      }

      const reward = this.calculateReward(topicInfo.difficulty, streamPoints);
      
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      
      const [bounty] = await db.insert(bounties).values({
        title: question.title,
        description: question.description,
        contentUrl: 'knowledge-question',
        bountyType: 'knowledge_question',
        expectedAnswer: question.expectedAnswer,
        verificationCriteria: question.verificationCriteria,
        reward,
        tokenType: 'STREAM',
        deadline,
        difficulty: question.difficulty,
        category: question.category,
        tags: question.tags,
        creatorId: agentId,
        creatorWallet: await this.getAgentWallet(agentId),
        status: 'open',
        engagementTier: 'analysis',
      }).returning();
      
      await db
        .update(users)
        .set({
          streamPoints: streamPoints - reward,
        })
        .where(eq(users.id, agentId));
      
      console.log(`[KnowledgeQ] Created knowledge question: "${question.title}" (${reward} STREAM)`);
      
      return bounty.id;
    } catch (error: any) {
      console.error(`[KnowledgeQ] Failed to create question:`, error.message);
      return null;
    }
  }

  private async generateQuestionWithAI(
    topicInfo: { topic: string; category: string; difficulty: string },
    agentUsername: string
  ): Promise<KnowledgeQuestion | null> {
    try {
      const prompt = `You are ${agentUsername}, an AI agent on the StreamAiX platform creating educational knowledge bounties about crypto, stocks, and macro economics.

Generate a challenging but fair knowledge question about: ${topicInfo.topic}
Category: ${topicInfo.category}

The question should:
1. Test understanding, not just memorization
2. Have a clear, verifiable answer
3. Be appropriate for ${topicInfo.difficulty} difficulty
4. Encourage detailed explanations

Respond in JSON format:
{
  "title": "A bounty-style title like 'Explain X for Y STREAM points'",
  "description": "A detailed description of what you want explained and why",
  "question": "The specific question to answer",
  "expectedAnswer": "The key points that a correct answer should include (for AI verification)",
  "category": "${topicInfo.category}",
  "difficulty": "${topicInfo.difficulty}",
  "verificationCriteria": {
    "keyPoints": ["point1", "point2", "point3"],
    "requiredConcepts": ["concept1", "concept2"],
    "acceptableAlternatives": ["alternative valid answers or phrasings"]
  },
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const data = await modelGateway.completeJson<any>({
        tier: "fast",
        system: 'You are a helpful assistant that generates crypto education bounty questions. Always respond with valid JSON.',
        user: prompt,
        temperature: 0.7,
        maxTokens: 600,
      });
      
      return {
        title: data.title,
        description: data.description,
        question: data.question,
        expectedAnswer: data.expectedAnswer,
        category: data.category,
        difficulty: data.difficulty,
        verificationCriteria: data.verificationCriteria,
        tags: data.tags,
      };
    } catch (error: any) {
      console.error(`[KnowledgeQ] AI generation failed:`, error.message);
      return null;
    }
  }

  async verifyAnswer(bountyId: string, submittedAnswer: string): Promise<{
    isCorrect: boolean;
    score: number;
    feedback: string;
    missingPoints: string[];
  }> {
    if (process.env.PAUSE_ANTHROPIC_API === 'true') {
      return {
        isCorrect: true,
        score: 70,
        feedback: "Verification paused - answer accepted with default score",
        missingPoints: [],
      };
    }

    try {
      const [bounty] = await db.select().from(bounties).where(eq(bounties.id, bountyId)).limit(1);
      
      if (!bounty || bounty.bountyType !== 'knowledge_question') {
        throw new Error('Invalid bounty or not a knowledge question');
      }

      const criteria = bounty.verificationCriteria as {
        keyPoints: string[];
        requiredConcepts: string[];
        acceptableAlternatives: string[];
      };

      const prompt = `You are an expert evaluator for crypto education content.

QUESTION: ${bounty.title}
${bounty.description}

EXPECTED ANSWER CRITERIA:
Key Points to Cover: ${criteria?.keyPoints?.join(', ') || 'comprehensive explanation'}
Required Concepts: ${criteria?.requiredConcepts?.join(', ') || 'relevant concepts'}
Acceptable Alternatives: ${criteria?.acceptableAlternatives?.join(', ') || 'any valid interpretation'}

Expected Answer Guidelines:
${bounty.expectedAnswer}

USER'S SUBMITTED ANSWER:
${submittedAnswer}

Evaluate the answer and respond in JSON:
{
  "isCorrect": true/false (must cover most key points and be factually accurate),
  "score": 0-100 (0=completely wrong, 50=partial, 70+=good, 90+=excellent),
  "feedback": "Constructive feedback for the user",
  "missingPoints": ["any key points that were missed"]
}

Be fair but rigorous. Partial credit is acceptable for answers that demonstrate understanding even if incomplete.`;

      const result = await modelGateway.completeJson<any>({
        tier: "fast",
        system: 'You are a fair and knowledgeable crypto educator evaluating student answers. Respond only with valid JSON.',
        user: prompt,
        temperature: 0.3,
        maxTokens: 400,
      });
      
      return {
        isCorrect: result.isCorrect && result.score >= 60,
        score: result.score,
        feedback: result.feedback,
        missingPoints: result.missingPoints || [],
      };
    } catch (error: any) {
      console.error(`[KnowledgeQ] Verification failed:`, error.message);
      return {
        isCorrect: false,
        score: 0,
        feedback: "Verification encountered an error. Please try again.",
        missingPoints: [],
      };
    }
  }

  private calculateReward(difficulty: string, agentPoints: number): number {
    const baseRewards: Record<string, number> = {
      easy: 100,
      medium: 200,
      hard: 400,
      expert: 800,
    };

    const base = baseRewards[difficulty] || 200;
    const variance = Math.floor(base * 0.3);
    const reward = base + Math.floor(Math.random() * variance);
    
    const maxAffordable = Math.floor(agentPoints * 0.25);
    return Math.max(50, Math.min(reward, maxAffordable));
  }

  private async getAgentWallet(agentId: string): Promise<string> {
    const [agent] = await db.select({ walletAddress: users.walletAddress })
      .from(users)
      .where(eq(users.id, agentId))
      .limit(1);
    
    return agent?.walletAddress || `0x${agentId.replace(/-/g, '').slice(0, 40)}`;
  }
}

export const knowledgeQuestionService = new KnowledgeQuestionService();
