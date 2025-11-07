import OpenAI from "openai";
import { db } from "../db";
import { predictionMarkets, users, type PredictionMarket, type User } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MarketAnalysis {
  shouldTrade: boolean;
  outcome: "YES" | "NO";
  confidence: number;
  reasoning: string;
  positionSize: number; // STREAM points
  riskLevel: "low" | "medium" | "high";
}

export interface AgentTradingProfile {
  tier: "whale" | "power" | "active" | "casual";
  riskTolerance: "conservative" | "moderate" | "aggressive";
  tradingStyle: string;
  expertise: string[];
}

export class AgentMarketAnalyzer {
  /**
   * Determine agent's trading profile based on personality and STREAM balance
   */
  getAgentProfile(agent: User): AgentTradingProfile {
    const streamPoints = agent.streamPoints || 0;
    const personality = agent.agentPersonality || "moderate";

    // Determine tier based on STREAM points
    let tier: "whale" | "power" | "active" | "casual";
    if (streamPoints >= 50000) tier = "whale";
    else if (streamPoints >= 20000) tier = "power";
    else if (streamPoints >= 5000) tier = "active";
    else tier = "casual";

    // Parse personality traits
    let riskTolerance: "conservative" | "moderate" | "aggressive" = "moderate";
    let tradingStyle = "balanced trader";
    let expertise: string[] = [];

    if (personality) {
      const lowerPersonality = personality.toLowerCase();
      
      // Risk tolerance
      if (lowerPersonality.includes("conservative") || lowerPersonality.includes("cautious")) {
        riskTolerance = "conservative";
      } else if (lowerPersonality.includes("aggressive") || lowerPersonality.includes("risk-taking")) {
        riskTolerance = "aggressive";
      }

      // Trading style
      if (lowerPersonality.includes("contrarian")) tradingStyle = "contrarian trader";
      else if (lowerPersonality.includes("data-driven") || lowerPersonality.includes("analytical")) tradingStyle = "quantitative trader";
      else if (lowerPersonality.includes("momentum")) tradingStyle = "momentum trader";
      
      // Expertise
      if (lowerPersonality.includes("defi")) expertise.push("DeFi");
      if (lowerPersonality.includes("nft")) expertise.push("NFTs");
      if (lowerPersonality.includes("layer 2") || lowerPersonality.includes("scaling")) expertise.push("Layer 2");
      if (lowerPersonality.includes("bitcoin") || lowerPersonality.includes("btc")) expertise.push("Bitcoin");
      if (lowerPersonality.includes("ethereum") || lowerPersonality.includes("eth")) expertise.push("Ethereum");
    }

    return { tier, riskTolerance, tradingStyle, expertise };
  }

  /**
   * Calculate position size based on agent tier and risk tolerance
   */
  calculatePositionSize(
    streamBalance: number,
    tier: "whale" | "power" | "active" | "casual",
    riskTolerance: "conservative" | "moderate" | "aggressive"
  ): number {
    // Base allocation percentage by tier
    const tierAllocations = {
      whale: { min: 0.05, max: 0.10 },      // 5-10% of balance
      power: { min: 0.03, max: 0.07 },      // 3-7% of balance
      active: { min: 0.02, max: 0.05 },     // 2-5% of balance
      casual: { min: 0.01, max: 0.03 }      // 1-3% of balance
    };

    // Risk tolerance multiplier
    const riskMultipliers = {
      conservative: 0.5,  // Use lower end
      moderate: 0.75,     // Use mid range
      aggressive: 1.0     // Use upper end
    };

    const allocation = tierAllocations[tier];
    const multiplier = riskMultipliers[riskTolerance];
    
    const basePercent = allocation.min + (allocation.max - allocation.min) * multiplier;
    const positionSize = Math.floor(streamBalance * basePercent);
    
    // Minimum position size: 10 STREAM
    // Maximum position size: Don't exceed 10% of balance regardless
    return Math.min(Math.max(positionSize, 10), Math.floor(streamBalance * 0.10));
  }

  /**
   * Analyze market and generate trading decision using GPT-4
   */
  async analyzeMarket(
    agent: User,
    market: PredictionMarket
  ): Promise<MarketAnalysis> {
    const profile = this.getAgentProfile(agent);
    const streamBalance = agent.streamPoints || 0;

    // Don't trade if balance too low
    if (streamBalance < 50) {
      return {
        shouldTrade: false,
        outcome: "YES",
        confidence: 0,
        reasoning: "Insufficient STREAM balance for trading",
        positionSize: 0,
        riskLevel: "low"
      };
    }

    const systemPrompt = `You are ${agent.username}, an autonomous AI trader on a prediction market platform.

Your Profile:
- Tier: ${profile.tier.toUpperCase()} (${streamBalance} STREAM points available)
- Risk Tolerance: ${profile.riskTolerance}
- Trading Style: ${profile.tradingStyle}
- Expertise: ${profile.expertise.length > 0 ? profile.expertise.join(", ") : "General markets"}
- Personality: ${agent.agentPersonality}

You analyze prediction markets and make data-driven trading decisions based on your unique perspective.`;

    const userPrompt = `Analyze this prediction market and decide whether to trade:

Market: "${market.question}"
${market.description ? `Description: ${market.description}` : ''}
Category: ${market.category}
Deadline: ${new Date(market.deadline).toLocaleDateString()}
Current Odds: YES ${(market.yesPrice / 100).toFixed(1)}% / NO ${(market.noPrice / 100).toFixed(1)}%
Total Volume: ${market.totalVolume || 0} STREAM
${market.tags?.length ? `Tags: ${market.tags.join(', ')}` : ''}

Based on your ${profile.riskTolerance} risk tolerance and ${profile.tradingStyle} approach, should you trade this market?

Consider:
1. Does this market align with your expertise (${profile.expertise.length > 0 ? profile.expertise.join(", ") : "general"})
2. Are the current odds favorable?
3. Is there enough liquidity?
4. Does it match your risk tolerance?

Respond in JSON format:
{
  "shouldTrade": true/false,
  "outcome": "YES" or "NO" (if trading),
  "confidence": 0-100 (percentage),
  "reasoning": "brief explanation of your decision",
  "riskLevel": "low/medium/high"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const analysis = JSON.parse(completion.choices[0].message.content || "{}");
      
      // Calculate position size if trading
      const positionSize = analysis.shouldTrade
        ? this.calculatePositionSize(streamBalance, profile.tier, profile.riskTolerance)
        : 0;

      return {
        shouldTrade: analysis.shouldTrade || false,
        outcome: analysis.outcome || "YES",
        confidence: analysis.confidence || 0,
        reasoning: analysis.reasoning || "No analysis provided",
        positionSize,
        riskLevel: analysis.riskLevel || "medium"
      };
    } catch (error) {
      console.error("Error analyzing market:", error);
      return {
        shouldTrade: false,
        outcome: "YES",
        confidence: 0,
        reasoning: "Analysis error occurred",
        positionSize: 0,
        riskLevel: "low"
      };
    }
  }

  /**
   * Select suitable markets for an agent to trade
   */
  async selectMarketsForAgent(agent: User, maxMarkets = 3): Promise<PredictionMarket[]> {
    const profile = this.getAgentProfile(agent);
    
    // Get active markets
    const markets = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.status, "active"))
      .orderBy(desc(predictionMarkets.totalVolume))
      .limit(20);

    if (!markets || markets.length === 0) {
      return [];
    }

    // Filter markets based on agent expertise and category preferences
    let filteredMarkets = markets;
    
    // If agent has expertise, prefer those categories
    if (profile.expertise.length > 0) {
      const expertiseMarkets = markets.filter(m => 
        profile.expertise.some(exp => 
          m.category?.toLowerCase().includes(exp.toLowerCase()) ||
          m.question.toLowerCase().includes(exp.toLowerCase()) ||
          m.tags?.some(tag => tag.toLowerCase().includes(exp.toLowerCase()))
        )
      );
      
      if (expertiseMarkets.length > 0) {
        filteredMarkets = expertiseMarkets;
      }
    }

    // Randomize selection to add variety
    const shuffled = filteredMarkets.sort(() => 0.5 - Math.random());
    
    return shuffled.slice(0, maxMarkets);
  }
}

export const agentMarketAnalyzer = new AgentMarketAnalyzer();
