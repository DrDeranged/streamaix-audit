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
import { modelGateway } from "../lib/modelGateway";
import { agentResearchService, type ResearchContext } from "./agentResearchService";

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
   * Analyze a market with grounded research context + agent memory.
   *
   * ABSTAIN is a first-class outcome: when research evidence is insufficient,
   * the agent declines to trade and callers must treat it as no-trade.
   *
   * `precomputedContext` lets the trading engine build the research context
   * once per market per cycle and reuse it across agents.
   */
  async analyzeMarket(
    market: PredictionMarket,
    agentId: string,
    precomputedContext?: ResearchContext
  ): Promise<{
    prediction: "YES" | "NO" | "ABSTAIN";
    confidence: number; // 0-100
    reasoning: string;
    analysisData: any;
  }> {
    if (process.env.PAUSE_ANTHROPIC_API === 'true') {
      return {
        prediction: "ABSTAIN",
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

    const [researchContext, trackRecord] = await Promise.all([
      precomputedContext
        ? Promise.resolve(precomputedContext)
        : agentResearchService.buildResearchContext(market),
      agentResearchService.getAgentTrackRecord(agentId),
    ]);

    const systemPrompt = `You are ${agentPersonality.name}, an AI trading agent with the following characteristics:
- Personality: ${agentPersonality.personality}
- Strategy: ${agentPersonality.strategy}
- Risk Tolerance: ${agentPersonality.riskTolerance}
- Description: ${agentPersonality.description}

TRACK RECORD (learn from it):
${agentResearchService.formatTrackRecordForPrompt(trackRecord)}

Your job is to analyze prediction markets and make evidence-grounded trading decisions.
Rules:
- Every item in keyEvidence MUST reference a specific fact from the provided research context (a price move, a headline, AMM pricing, or macro data). Never invent evidence.
- If the research context is insufficient to justify a position (missing sources, no relevant facts, or genuinely ambiguous evidence), you MUST respond with prediction "ABSTAIN". Abstaining is a valid, professional decision — do not force a trade.`;

    const userPrompt = `Analyze this prediction market and provide your trading decision:

Market Question: ${market.question}
${market.description ? `Description: ${market.description}` : ''}
Category: ${market.category}
Deadline: ${market.deadline}
${market.tags?.length ? `Tags: ${market.tags.join(', ')}` : ''}

${agentResearchService.formatContextForPrompt(researchContext)}

Based on your ${agentPersonality.personality} personality, your ${agentPersonality.riskTolerance} risk tolerance, your track record, and ONLY the research context above: should you predict YES, NO, or ABSTAIN?`;

    try {
      const analysis = await modelGateway.completeJson<{
        prediction: "YES" | "NO" | "ABSTAIN";
        confidence: number;
        reasoning: string;
        keyEvidence: string[];
        riskAssessment: string;
        wouldChangeMindIf: string;
      }>({
        tier: "reasoning",
        system: systemPrompt,
        user: userPrompt,
        temperature: agentPersonality.personality === "contrarian" ? 0.9 : 0.7,
        jsonSchema: {
          name: "trading_decision",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["prediction", "confidence", "reasoning", "keyEvidence", "riskAssessment", "wouldChangeMindIf"],
            properties: {
              prediction: { type: "string", enum: ["YES", "NO", "ABSTAIN"] },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reasoning: { type: "string" },
              keyEvidence: {
                type: "array",
                items: { type: "string" },
                description: "Each item must cite a specific fact from the research context"
              },
              riskAssessment: { type: "string" },
              wouldChangeMindIf: { type: "string" },
            },
          },
        },
      });

      return {
        prediction: analysis.prediction,
        confidence: analysis.confidence * 100, // Convert from 0-1 to 0-100 percentage
        reasoning: analysis.reasoning,
        analysisData: {
          keyEvidence: analysis.keyEvidence,
          riskAssessment: analysis.riskAssessment,
          wouldChangeMindIf: analysis.wouldChangeMindIf,
          researchSourcesUsed: researchContext.sourcesUsed,
          researchSourcesFailed: researchContext.sourcesFailed,
          trackRecordSnapshot: {
            wins: trackRecord.wins,
            losses: trackRecord.losses,
            netPnl: trackRecord.netPnl,
          },
          timestamp: new Date().toISOString(),
          modelUsed: analysis._model,
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
  async getMarketPredictions(marketId: string): Promise<Array<AiPrediction & { agent: AiAgent & { suspendedUntil?: string | null } }>> {
    const predictions = await db
      .select()
      .from(aiPredictions)
      .leftJoin(aiAgents, eq(aiPredictions.agentId, aiAgents.id))
      .where(eq(aiPredictions.marketId, marketId))
      .orderBy(desc(aiPredictions.confidence));

    // Surface active risk suspensions ("cooling off") on the agent payload
    const suspendedUntilByAgent = new Map<string, string>();
    try {
      const { riskEngine } = await import('./riskEngine');
      for (const s of await riskEngine.getActiveSuspensions()) {
        const until = s.suspendedUntil instanceof Date ? s.suspendedUntil.toISOString() : String(s.suspendedUntil);
        if (!suspendedUntilByAgent.has(s.agentId)) suspendedUntilByAgent.set(s.agentId, until);
      }
    } catch (err: any) {
      console.warn('Failed to load agent suspensions:', err?.message || err);
    }

    return predictions.map(p => ({
      ...p.ai_predictions,
      agent: {
        ...p.ai_agents!,
        suspendedUntil: p.ai_agents ? suspendedUntilByAgent.get(p.ai_agents.id) ?? null : null,
      }
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

    if (prediction.prediction === "ABSTAIN") {
      throw new Error("Agent abstained from this market — no trade");
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

    // Record decision in agent memory (settled when the market resolves)
    await agentResearchService.recordDecision({
      agentId,
      marketId,
      decision: outcome as "YES" | "NO",
      confidence: prediction.confidence / 100,
      stake: streamAmount + fee,
      reasoningSummary: prediction.reasoning || "",
    }).catch(err => console.error("⚠️ Failed to record agent memory:", err));

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
