import { db } from "../db";
import { 
  users, 
  predictionMarkets,
  marketPositions,
  marketTrades,
  type User,
  type PredictionMarket,
  type MarketPosition,
  type MarketTrade
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { agentMarketAnalyzer, type MarketAnalysis } from "./agentMarketAnalyzer";

export interface TradeResult {
  success: boolean;
  position?: MarketPosition;
  trade?: MarketTrade;
  error?: string;
  message: string;
}

export class AgentMarketTrader {
  /**
   * Execute a trade for an autonomous agent
   */
  async executeTrade(
    agent: User,
    market: PredictionMarket,
    analysis: MarketAnalysis
  ): Promise<TradeResult> {
    // Validate agent has enough STREAM points
    const streamBalance = agent.streamPoints || 0;
    const positionSize = analysis.positionSize;
    const platformFee = Math.floor(positionSize * 0.005); // 0.5% fee
    const totalCost = positionSize + platformFee;

    if (streamBalance < totalCost) {
      return {
        success: false,
        error: "Insufficient STREAM balance",
        message: `Need ${totalCost} STREAM, have ${streamBalance} STREAM`
      };
    }

    // Validate market is active
    if (market.status !== "active") {
      return {
        success: false,
        error: "Market not active",
        message: `Market status: ${market.status}`
      };
    }

    // Validate deadline hasn't passed
    if (new Date(market.deadline) < new Date()) {
      return {
        success: false,
        error: "Market deadline passed",
        message: `Deadline was ${market.deadline}`
      };
    }

    try {
      // Calculate shares based on AMM pricing
      const outcome = analysis.outcome;
      const currentPrice = outcome === "YES" ? market.yesPrice : market.noPrice;
      const shares = Math.floor((positionSize * 10000) / currentPrice);

      if (shares <= 0) {
        return {
          success: false,
          error: "Invalid share calculation",
          message: `Calculated ${shares} shares`
        };
      }

      // Check if agent already has a position in this market
      const [existingPosition] = await db
        .select()
        .from(marketPositions)
        .where(
          and(
            eq(marketPositions.marketId, market.id),
            eq(marketPositions.userId, agent.id),
            eq(marketPositions.outcome, outcome)
          )
        )
        .limit(1);

      let position: MarketPosition;

      if (existingPosition) {
        // Update existing position (average price)
        const newShares = existingPosition.shares + shares;
        const newTotalInvested = existingPosition.totalInvested + positionSize;
        const newAveragePrice = Math.floor((newTotalInvested * 10000) / newShares);

        const [updatedPosition] = await db
          .update(marketPositions)
          .set({
            shares: newShares,
            totalInvested: newTotalInvested,
            averagePrice: newAveragePrice,
            currentValue: Math.floor((newShares * currentPrice) / 10000),
            updatedAt: new Date()
          })
          .where(eq(marketPositions.id, existingPosition.id))
          .returning();

        position = updatedPosition;
      } else {
        // Create new position
        const [newPosition] = await db
          .insert(marketPositions)
          .values({
            marketId: market.id,
            userId: agent.id,
            userWallet: agent.walletAddress || `agent-${agent.id}`,
            outcome,
            shares,
            averagePrice: currentPrice,
            totalInvested: positionSize,
            currentValue: positionSize
          })
          .returning();

        position = newPosition;
      }

      // Record the trade
      const [trade] = await db
        .insert(marketTrades)
        .values({
          marketId: market.id,
          userId: agent.id,
          userWallet: agent.walletAddress || `agent-${agent.id}`,
          tradeType: "buy",
          outcome,
          shares,
          price: currentPrice,
          streamAmount: positionSize,
          fee: platformFee
        })
        .returning();

      // Deduct STREAM points from agent
      await db
        .update(users)
        .set({
          streamPoints: sql`${users.streamPoints} - ${totalCost}`
        })
        .where(eq(users.id, agent.id));

      // Update market stats
      await db
        .update(predictionMarkets)
        .set({
          totalVolume: sql`${predictionMarkets.totalVolume} + ${positionSize}`,
          totalTrades: sql`${predictionMarkets.totalTrades} + 1`,
          yesLiquidity: outcome === "YES" 
            ? sql`${predictionMarkets.yesLiquidity} + ${positionSize}`
            : predictionMarkets.yesLiquidity,
          noLiquidity: outcome === "NO" 
            ? sql`${predictionMarkets.noLiquidity} + ${positionSize}`
            : predictionMarkets.noLiquidity,
          updatedAt: new Date()
        })
        .where(eq(predictionMarkets.id, market.id));

      console.log(`      💰 ${agent.username} bought ${shares} ${outcome} shares @ ${(currentPrice / 100).toFixed(1)}% for ${positionSize} STREAM`);

      return {
        success: true,
        position,
        trade,
        message: `Bought ${shares} ${outcome} shares for ${positionSize} STREAM`
      };

    } catch (error: any) {
      console.error(`      ❌ Trade execution failed:`, error);
      return {
        success: false,
        error: error.message || "Trade execution failed",
        message: `Error: ${error.message || "Unknown error"}`
      };
    }
  }

  /**
   * Analyze and trade a market if conditions are favorable
   */
  async analyzeAndTrade(agent: User, market: PredictionMarket): Promise<TradeResult> {
    // Analyze the market
    const analysis = await agentMarketAnalyzer.analyzeMarket(agent, market);

    // Don't trade if analysis says no
    if (!analysis.shouldTrade) {
      return {
        success: false,
        message: `Skipped - ${analysis.reasoning}`
      };
    }

    // Minimum confidence threshold based on tier
    const profile = agentMarketAnalyzer.getAgentProfile(agent);
    const minConfidence = {
      whale: 60,
      power: 65,
      active: 70,
      casual: 75
    }[profile.tier];

    if (analysis.confidence < minConfidence) {
      return {
        success: false,
        message: `Confidence too low (${analysis.confidence}% < ${minConfidence}% threshold)`
      };
    }

    // Execute the trade
    return await this.executeTrade(agent, market, analysis);
  }

  /**
   * Trade multiple markets for an agent
   */
  async tradeMultipleMarkets(agent: User): Promise<{
    attempted: number;
    succeeded: number;
    failed: number;
    trades: TradeResult[];
  }> {
    // Select suitable markets
    const markets = await agentMarketAnalyzer.selectMarketsForAgent(agent, 3);

    if (markets.length === 0) {
      return {
        attempted: 0,
        succeeded: 0,
        failed: 0,
        trades: []
      };
    }

    const results: TradeResult[] = [];

    for (const market of markets) {
      const result = await this.analyzeAndTrade(agent, market);
      results.push(result);

      // If successful, break to avoid over-trading in one cycle
      if (result.success) {
        break;
      }
    }

    return {
      attempted: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      trades: results
    };
  }
}

export const agentMarketTrader = new AgentMarketTrader();
