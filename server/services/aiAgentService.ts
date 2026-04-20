import { db } from "../db";
import { 
  aiAgents, 
  aiPredictions,
  aiPositions,
  aiTrades,
  predictionMarkets,
  type AiAgent,
  type AiPrediction,
  type AiPosition,
  type AiTrade,
  type PredictionMarket
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

export interface AgentPersonality {
  name: string;
  personality: string;
  description: string;
  avatar: string;
  strategy: string;
  riskTolerance: "low" | "medium" | "high";
  confidenceThreshold: number;
}

export const AI_AGENT_PERSONALITIES: AgentPersonality[] = [
  {
    name: "Atlas",
    personality: "conservative",
    description: "A cautious, risk-averse agent that prioritizes capital preservation. Only trades when confidence exceeds 75%.",
    avatar: "🛡️",
    strategy: "Conservative value investing with focus on high-confidence opportunities",
    riskTolerance: "low",
    confidenceThreshold: 0.75
  },
  {
    name: "Blitz",
    personality: "aggressive",
    description: "A bold, high-risk agent that seeks maximum returns. Takes positions on any market with 55%+ confidence.",
    avatar: "⚡",
    strategy: "Aggressive growth strategy with high-volume trading across multiple markets",
    riskTolerance: "high",
    confidenceThreshold: 0.55
  },
  {
    name: "Sage",
    personality: "data-driven",
    description: "An analytical agent that relies purely on data patterns and market signals. Trades at 65%+ confidence.",
    avatar: "📊",
    strategy: "Quantitative analysis with emphasis on statistical patterns and market trends",
    riskTolerance: "medium",
    confidenceThreshold: 0.65
  },
  {
    name: "Rebel",
    personality: "contrarian",
    description: "A contrarian agent that takes opposite positions from market consensus. Looks for mispriced opportunities.",
    avatar: "🎭",
    strategy: "Contrarian trading focused on identifying market inefficiencies and crowd psychology",
    riskTolerance: "high",
    confidenceThreshold: 0.60
  }
];

export class AIAgentService {
  /**
   * Initialize AI agents in the database
   */
  async initializeAgents(): Promise<AiAgent[]> {
    const agents: AiAgent[] = [];
    
    for (const personality of AI_AGENT_PERSONALITIES) {
      const [existing] = await db
        .select()
        .from(aiAgents)
        .where(eq(aiAgents.name, personality.name))
        .limit(1);
      
      if (!existing) {
        const [agent] = await db.insert(aiAgents).values({
          name: personality.name,
          personality: personality.personality,
          description: personality.description,
          avatar: personality.avatar,
          strategy: personality.strategy,
          riskTolerance: personality.riskTolerance,
          confidenceThreshold: personality.confidenceThreshold,
        }).returning();
        
        agents.push(agent);
        console.log(`✅ Initialized AI agent: ${agent.name}`);
      } else {
        agents.push(existing);
      }
    }
    
    return agents;
  }

  /**
   * Analyze a market and generate AI prediction using GPT-4
   */
  async analyzeMarket(market: PredictionMarket, agentId: string): Promise<{
    prediction: "YES" | "NO";
    confidence: number;
    reasoning: string;
    analysisData: any;
  }> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      return {
        prediction: "YES",
        confidence: 0,
        reasoning: "OpenAI API paused",
        analysisData: { paused: true }
      };
    }
    
    const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).limit(1);
    
    if (!agent[0]) {
      throw new Error("AI agent not found");
    }

    const agentPersonality = agent[0];

    const systemPrompt = `You are ${agentPersonality.name}, an AI trading agent with the following characteristics:
- Personality: ${agentPersonality.personality}
- Strategy: ${agentPersonality.strategy}
- Risk Tolerance: ${agentPersonality.riskTolerance}
- Description: ${agentPersonality.description}

Your job is to analyze prediction markets and make trading decisions based on your personality and strategy.`;

    const userPrompt = `Analyze this prediction market and provide your trading decision:

Market Question: ${market.question}
${market.description ? `Description: ${market.description}` : ''}
Category: ${market.category}
Deadline: ${market.deadline}
Current YES Price: ${(market.yesPrice / 100).toFixed(2)}%
Current NO Price: ${(market.noPrice / 100).toFixed(2)}%
${market.tags?.length ? `Tags: ${market.tags.join(', ')}` : ''}

Based on your ${agentPersonality.personality} personality and ${agentPersonality.riskTolerance} risk tolerance, should you predict YES or NO?

Provide your analysis in JSON format:
{
  "prediction": "YES" or "NO",
  "confidence": 0.0 to 1.0,
  "reasoning": "detailed explanation of your analysis",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskAssessment": "low/medium/high",
  "marketSentiment": "bullish/bearish/neutral"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // COST OPTIMIZATION: 90% cheaper for agent analysis
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: agentPersonality.personality === "contrarian" ? 0.9 : 0.7,
      });

      const analysis = JSON.parse(completion.choices[0].message.content || "{}");

      return {
        prediction: analysis.prediction,
        confidence: analysis.confidence * 100, // Convert from 0-1 to 0-100 percentage
        reasoning: analysis.reasoning,
        analysisData: {
          keyFactors: analysis.keyFactors,
          riskAssessment: analysis.riskAssessment,
          marketSentiment: analysis.marketSentiment,
          timestamp: new Date().toISOString(),
          modelUsed: "gpt-4o-mini"
        }
      };
    } catch (error) {
      console.error("Error analyzing market with AI:", error);
      throw error;
    }
  }

  /**
   * Generate predictions for all active agents on a specific market
   */
  async generatePredictionsForMarket(marketId: string): Promise<AiPrediction[]> {
    const [market] = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.id, marketId))
      .limit(1);

    if (!market) {
      throw new Error("Market not found");
    }

    const agents = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.isActive, true));

    const predictions: AiPrediction[] = [];

    for (const agent of agents) {
      try {
        const analysis = await this.analyzeMarket(market, agent.id);

        const existingPrediction = await db
          .select()
          .from(aiPredictions)
          .where(
            and(
              eq(aiPredictions.marketId, marketId),
              eq(aiPredictions.agentId, agent.id)
            )
          )
          .limit(1);

        if (existingPrediction.length > 0) {
          console.log(`⏭️  Skipping ${agent.name} - already has prediction for this market`);
          predictions.push(existingPrediction[0]);
          continue;
        }

        const [prediction] = await db.insert(aiPredictions).values({
          marketId,
          agentId: agent.id,
          prediction: analysis.prediction,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          analysisData: analysis.analysisData,
          marketDataSnapshot: {
            yesPrice: market.yesPrice,
            noPrice: market.noPrice,
            totalVolume: market.totalVolume,
            totalTrades: market.totalTrades
          }
        }).returning();

        predictions.push(prediction);
        console.log(`✅ ${agent.name} predicts ${analysis.prediction} with ${analysis.confidence.toFixed(1)}% confidence`);

      } catch (error) {
        console.error(`Error generating prediction for agent ${agent.name}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Get all predictions for a market
   */
  async getMarketPredictions(marketId: string): Promise<Array<AiPrediction & { agent: AiAgent }>> {
    const predictions = await db
      .select()
      .from(aiPredictions)
      .leftJoin(aiAgents, eq(aiPredictions.agentId, aiAgents.id))
      .where(eq(aiPredictions.marketId, marketId))
      .orderBy(desc(aiPredictions.confidence));

    return predictions.map(p => ({
      ...p.ai_predictions,
      agent: p.ai_agents!
    }));
  }

  /**
   * Execute autonomous trading for an agent based on their prediction
   */
  async executeTrade(
    agentId: string,
    marketId: string,
    predictionId: string,
    shares: number
  ): Promise<{ position: AiPosition; trade: AiTrade }> {
    const [prediction] = await db
      .select()
      .from(aiPredictions)
      .where(eq(aiPredictions.id, predictionId))
      .limit(1);

    if (!prediction) {
      throw new Error("Prediction not found");
    }

    const [agent] = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.id, agentId))
      .limit(1);

    if (!agent) {
      throw new Error("AI agent not found");
    }

    const [market] = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.id, marketId))
      .limit(1);

    if (!market) {
      throw new Error("Market not found");
    }

    if (prediction.confidence < agent.confidenceThreshold) {
      throw new Error(`Agent confidence (${prediction.confidence}) below threshold (${agent.confidenceThreshold})`);
    }

    const outcome = prediction.prediction;
    const price = outcome === "YES" ? market.yesPrice : market.noPrice;
    const streamAmount = Math.floor((shares * price) / 10000);
    const fee = Math.floor(streamAmount * 0.005);

    const [position] = await db.insert(aiPositions).values({
      marketId,
      agentId,
      predictionId,
      outcome,
      shares,
      averagePrice: price,
      totalInvested: streamAmount + fee,
      currentValue: streamAmount,
      status: "open"
    }).returning();

    const [trade] = await db.insert(aiTrades).values({
      marketId,
      agentId,
      positionId: position.id,
      tradeType: "buy",
      outcome,
      shares,
      price,
      streamAmount,
      fee,
      reasoning: `Automated trade based on ${agent.name}'s prediction: ${prediction.reasoning.substring(0, 200)}...`
    }).returning();

    await db
      .update(aiAgents)
      .set({
        totalPredictions: sql`${aiAgents.totalPredictions} + 1`,
        totalVolume: sql`${aiAgents.totalVolume} + ${streamAmount + fee}`,
      })
      .where(eq(aiAgents.id, agentId));

    console.log(`🤖 ${agent.name} bought ${shares} ${outcome} shares at ${(price / 100).toFixed(2)}%`);

    return { position, trade };
  }

  /**
   * Get AI agent leaderboard
   */
  async getAgentLeaderboard(): Promise<AiAgent[]> {
    return db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.isActive, true))
      .orderBy(desc(aiAgents.accuracyRate), desc(aiAgents.netProfit));
  }

  /**
   * Get AI agent statistics
   */
  async getAgentStats(agentId: string): Promise<{
    agent: AiAgent;
    recentPredictions: AiPrediction[];
    activePositions: AiPosition[];
    recentTrades: AiTrade[];
  }> {
    const [agent] = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.id, agentId))
      .limit(1);

    if (!agent) {
      throw new Error("AI agent not found");
    }

    const recentPredictions = await db
      .select()
      .from(aiPredictions)
      .where(eq(aiPredictions.agentId, agentId))
      .orderBy(desc(aiPredictions.createdAt))
      .limit(10);

    const activePositions = await db
      .select()
      .from(aiPositions)
      .where(
        and(
          eq(aiPositions.agentId, agentId),
          eq(aiPositions.status, "open")
        )
      )
      .orderBy(desc(aiPositions.createdAt));

    const recentTrades = await db
      .select()
      .from(aiTrades)
      .where(eq(aiTrades.agentId, agentId))
      .orderBy(desc(aiTrades.createdAt))
      .limit(20);

    return {
      agent,
      recentPredictions,
      activePositions,
      recentTrades
    };
  }
}

export const aiAgentService = new AIAgentService();
