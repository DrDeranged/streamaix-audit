import { db } from '../db';
import { knowledgeAvatars, predictionMarkets, marketPositions, marketTrades, avatarTrades, avatarPositions } from '@shared/schema';
import { eq, and, gt, lt, desc, sql, isNull, ne } from 'drizzle-orm';

type TradingStyle = 'dip_buyer' | 'momentum' | 'swing_trader' | 'contrarian' | 'value' | 'growth';
type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
type DecisionBias = 'fundamental' | 'technical' | 'sentiment' | 'news_driven';
type TradingFrequency = 'daily' | 'weekly' | 'opportunistic';

interface AvatarTradeDecision {
  avatarId: string;
  avatarName: string;
  marketId: string;
  marketQuestion: string;
  decision: 'YES' | 'NO' | 'PASS';
  confidence: number;
  positionSize: number;
  reasoning: string;
}

interface AvatarTradingPersona {
  id: string;
  name: string;
  tradingStyle: TradingStyle;
  expertiseDomains: string[];
  riskTolerance: RiskTolerance;
  maxPositionPct: number;
  decisionBias: DecisionBias;
  tradingFrequency: TradingFrequency;
  streamBalance: number;
}

class AvatarMarketParticipationService {
  private lastTradeTime: Map<string, Date> = new Map();
  private dailyTradeCount: Map<string, number> = new Map();

  async getActiveAvatars(): Promise<AvatarTradingPersona[]> {
    const avatars = await db.query.knowledgeAvatars.findMany({
      where: and(
        eq(knowledgeAvatars.isActive, true),
        gt(knowledgeAvatars.streamBalance, 0)
      ),
    });

    return avatars.map(a => ({
      id: a.id,
      name: a.name,
      tradingStyle: (a.tradingStyle || 'value') as TradingStyle,
      expertiseDomains: (a.expertiseDomains as string[]) || [],
      riskTolerance: (a.riskTolerance || 'moderate') as RiskTolerance,
      maxPositionPct: a.maxPositionPct || 10,
      decisionBias: (a.decisionBias || 'fundamental') as DecisionBias,
      tradingFrequency: (a.tradingFrequency || 'weekly') as TradingFrequency,
      streamBalance: a.streamBalance || 100000,
    }));
  }

  async getActiveMarkets() {
    return db.query.predictionMarkets.findMany({
      where: and(
        eq(predictionMarkets.status, 'active'),
        gt(predictionMarkets.deadline, new Date())
      ),
      orderBy: [desc(predictionMarkets.totalVolume)],
    });
  }

  isMarketRelevantToAvatar(market: any, avatar: AvatarTradingPersona): boolean {
    const marketText = `${market.question} ${market.description || ''} ${market.category || ''}`.toLowerCase();
    const tags = market.tags || [];

    for (const domain of avatar.expertiseDomains) {
      if (marketText.includes(domain.toLowerCase()) || tags.includes(domain)) {
        return true;
      }
    }

    const categoryMatches: Record<string, string[]> = {
      'bitcoin': ['btc', 'bitcoin', 'saylor', 'etf'],
      'defi': ['defi', 'uniswap', 'aave', 'maker', 'dai', 'liquidity'],
      'l2': ['layer 2', 'l2', 'base', 'optimism', 'arbitrum', 'rollup'],
      'l1': ['layer 1', 'l1', 'ethereum', 'solana', 'bsc', 'chain'],
      'stablecoins': ['stablecoin', 'usdc', 'usdt', 'dai', 'peg'],
      'memecoins': ['doge', 'shiba', 'meme', 'pepe'],
      'nft': ['nft', 'opensea', 'blur', 'jpeg'],
      'ai_tokens': ['ai', 'artificial intelligence', 'fetch', 'ocean'],
      'infrastructure': ['infrastructure', 'oracle', 'chainlink'],
      'exchange': ['exchange', 'cex', 'binance', 'coinbase'],
      'governance': ['governance', 'dao', 'vote', 'proposal'],
    };

    for (const domain of avatar.expertiseDomains) {
      const keywords = categoryMatches[domain] || [domain];
      if (keywords.some(kw => marketText.includes(kw))) {
        return true;
      }
    }

    return false;
  }

  canAvatarTrade(avatar: AvatarTradingPersona): boolean {
    const now = new Date();
    const lastTrade = this.lastTradeTime.get(avatar.id);
    const dailyCount = this.dailyTradeCount.get(avatar.id) || 0;

    const maxDailyTrades: Record<TradingFrequency, number> = {
      'daily': 5,
      'weekly': 2,
      'opportunistic': 1,
    };

    if (dailyCount >= maxDailyTrades[avatar.tradingFrequency]) {
      return false;
    }

    const minTimeBetweenTrades: Record<TradingFrequency, number> = {
      'daily': 4 * 60 * 60 * 1000,
      'weekly': 24 * 60 * 60 * 1000,
      'opportunistic': 12 * 60 * 60 * 1000,
    };

    if (lastTrade && (now.getTime() - lastTrade.getTime()) < minTimeBetweenTrades[avatar.tradingFrequency]) {
      return false;
    }

    return true;
  }

  makeTradeDecision(market: any, avatar: AvatarTradingPersona): AvatarTradeDecision {
    const yesPrice = market.yesPrice / 100;
    const noPrice = market.noPrice / 100;
    const aiProbability = market.aiProbability || 50;

    let decision: 'YES' | 'NO' | 'PASS' = 'PASS';
    let confidence = 0;
    let reasoning = '';

    switch (avatar.tradingStyle) {
      case 'dip_buyer':
        if (yesPrice < 35 && aiProbability > 50) {
          decision = 'YES';
          confidence = Math.min(90, aiProbability + 20);
          reasoning = `${avatar.name} sees undervalued YES at ${yesPrice}% (AI prob: ${aiProbability}%). Classic dip-buying opportunity.`;
        } else if (noPrice < 35 && aiProbability < 50) {
          decision = 'NO';
          confidence = Math.min(90, (100 - aiProbability) + 20);
          reasoning = `${avatar.name} sees undervalued NO at ${noPrice}%. Buying the dip on skepticism.`;
        }
        break;

      case 'momentum':
        if (yesPrice > 65 && yesPrice < 85) {
          decision = 'YES';
          confidence = yesPrice;
          reasoning = `${avatar.name} follows momentum - YES at ${yesPrice}% showing strong conviction.`;
        } else if (noPrice > 65 && noPrice < 85) {
          decision = 'NO';
          confidence = noPrice;
          reasoning = `${avatar.name} follows momentum - NO at ${noPrice}% showing market skepticism.`;
        }
        break;

      case 'contrarian':
        if (yesPrice > 80) {
          decision = 'NO';
          confidence = 70;
          reasoning = `${avatar.name} takes contrarian view against ${yesPrice}% YES consensus. Markets often overestimate certainty.`;
        } else if (noPrice > 80) {
          decision = 'YES';
          confidence = 70;
          reasoning = `${avatar.name} takes contrarian view against ${noPrice}% NO consensus. Looking for asymmetric upside.`;
        }
        break;

      case 'value':
        if (Math.abs(aiProbability - yesPrice) > 20) {
          decision = aiProbability > yesPrice ? 'YES' : 'NO';
          confidence = Math.abs(aiProbability - yesPrice) + 40;
          reasoning = `${avatar.name} spots value mispricing: AI says ${aiProbability}% but market at ${yesPrice}%.`;
        }
        break;

      case 'growth':
        const hoursToDeadline = (new Date(market.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursToDeadline > 72 && market.totalVolume < 50000) {
          decision = aiProbability > 50 ? 'YES' : 'NO';
          confidence = 55;
          reasoning = `${avatar.name} takes early position in emerging market before volume picks up.`;
        }
        break;

      case 'swing_trader':
        if (yesPrice >= 40 && yesPrice <= 60) {
          const bias = Math.random() > 0.5 ? 'YES' : 'NO';
          decision = bias;
          confidence = 60;
          reasoning = `${avatar.name} swing trading balanced market. Taking ${bias} position at fair value.`;
        }
        break;
    }

    if (decision === 'PASS') {
      reasoning = `${avatar.name} passes - no clear signal matching ${avatar.tradingStyle} strategy.`;
    }

    const positionMultiplier: Record<RiskTolerance, number> = {
      'conservative': 0.5,
      'moderate': 1.0,
      'aggressive': 1.5,
    };

    const maxPosition = Math.floor(avatar.streamBalance * (avatar.maxPositionPct / 100) * positionMultiplier[avatar.riskTolerance]);
    const positionSize = decision !== 'PASS' ? Math.min(maxPosition, Math.floor(confidence * 100)) : 0;

    return {
      avatarId: avatar.id,
      avatarName: avatar.name,
      marketId: market.id,
      marketQuestion: market.question,
      decision,
      confidence,
      positionSize,
      reasoning,
    };
  }

  async getAvatarPositions(avatarId: string): Promise<any[]> {
    return db.query.marketPositions.findMany({
      where: eq(marketPositions.userWallet, `avatar:${avatarId}`),
    });
  }

  async hasExistingPosition(avatarId: string, marketId: string): Promise<boolean> {
    const existing = await db.query.marketPositions.findFirst({
      where: and(
        eq(marketPositions.userWallet, `avatar:${avatarId}`),
        eq(marketPositions.marketId, marketId)
      ),
    });
    return !!existing;
  }

  async executeTrade(decision: AvatarTradeDecision): Promise<{ success: boolean; message: string }> {
    if (decision.decision === 'PASS' || decision.positionSize <= 0) {
      return { success: false, message: 'No trade to execute' };
    }

    try {
      const hasPosition = await this.hasExistingPosition(decision.avatarId, decision.marketId);
      if (hasPosition) {
        return { success: false, message: 'Avatar already has position in this market' };
      }

      const price = decision.decision === 'YES' ? 50 : 50;
      const shares = Math.floor(decision.positionSize / (price / 100));

      await db.insert(marketTrades).values({
        marketId: decision.marketId,
        userWallet: `avatar:${decision.avatarId}`,
        tradeType: 'buy',
        outcome: decision.decision,
        shares: shares,
        price: price * 100,
        streamAmount: decision.positionSize,
        fee: Math.floor(decision.positionSize * 0.005),
      });

      // Also save to avatar_trades for historical tracking
      await db.insert(avatarTrades).values({
        avatarId: decision.avatarId,
        marketId: decision.marketId,
        tradeType: 'BUY',
        outcome: decision.decision,
        shares: shares,
        price: price * 100,
        streamAmount: decision.positionSize,
        reasoning: decision.reasoning,
        tradingStyle: 'value',
      }).catch(() => {
        // Silently fail if avatar_trades table doesn't exist yet
      });

      // Update avatar_positions table
      const existingAvatarPosition = await db.query.avatarPositions.findFirst({
        where: and(
          eq(avatarPositions.avatarId, decision.avatarId),
          eq(avatarPositions.marketId, decision.marketId)
        ),
      }).catch(() => null);

      if (existingAvatarPosition) {
        await db.update(avatarPositions)
          .set({
            shares: sql`${avatarPositions.shares} + ${shares}`,
            totalInvested: sql`${avatarPositions.totalInvested} + ${decision.positionSize}`,
            updatedAt: new Date(),
          })
          .where(eq(avatarPositions.id, existingAvatarPosition.id))
          .catch(() => {});
      } else {
        await db.insert(avatarPositions).values({
          avatarId: decision.avatarId,
          marketId: decision.marketId,
          outcome: decision.decision,
          shares: shares,
          averagePrice: price * 100,
          totalInvested: decision.positionSize,
        }).catch(() => {});
      }

      const existingPosition = await db.query.marketPositions.findFirst({
        where: and(
          eq(marketPositions.userWallet, `avatar:${decision.avatarId}`),
          eq(marketPositions.marketId, decision.marketId)
        ),
      });

      if (existingPosition) {
        await db.update(marketPositions)
          .set({
            shares: sql`${marketPositions.shares} + ${shares}`,
            totalInvested: sql`${marketPositions.totalInvested} + ${decision.positionSize}`,
            updatedAt: new Date(),
          })
          .where(eq(marketPositions.id, existingPosition.id));
      } else {
        await db.insert(marketPositions).values({
          marketId: decision.marketId,
          userWallet: `avatar:${decision.avatarId}`,
          outcome: decision.decision,
          shares: shares,
          averagePrice: price * 100,
          totalInvested: decision.positionSize,
          currentValue: decision.positionSize,
        });
      }

      await db.update(knowledgeAvatars)
        .set({
          streamBalance: sql`${knowledgeAvatars.streamBalance} - ${decision.positionSize}`,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeAvatars.id, decision.avatarId));

      await db.update(predictionMarkets)
        .set({
          totalVolume: sql`${predictionMarkets.totalVolume} + ${decision.positionSize}`,
          totalTrades: sql`${predictionMarkets.totalTrades} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(predictionMarkets.id, decision.marketId));

      this.lastTradeTime.set(decision.avatarId, new Date());
      this.dailyTradeCount.set(decision.avatarId, (this.dailyTradeCount.get(decision.avatarId) || 0) + 1);

      console.log(`[Avatar Trade] ${decision.avatarName} bought ${shares} ${decision.decision} shares for ${decision.positionSize} STREAM`);
      console.log(`[Avatar Trade] Reasoning: ${decision.reasoning}`);

      // Surface trade to the live avatar commentary feed (fail-soft).
      try {
        const { recordTradeAsPost } = await import('./avatarCommentaryService');
        recordTradeAsPost({
          avatarId: decision.avatarId,
          avatarName: decision.avatarName,
          marketId: decision.marketId,
          outcome: decision.decision as 'YES' | 'NO',
          shares,
          positionSize: decision.positionSize,
          reasoning: decision.reasoning,
        }).catch(() => {});
      } catch {}

      return { success: true, message: `${decision.avatarName} bought ${shares} ${decision.decision} shares` };
    } catch (error) {
      console.error(`[Avatar Trade Error]`, error);
      return { success: false, message: `Trade failed: ${error}` };
    }
  }

  async runTradingCycle(): Promise<{ trades: number; decisions: AvatarTradeDecision[] }> {
    console.log('[Avatar Market] Starting trading cycle...');

    const avatars = await this.getActiveAvatars();
    const markets = await this.getActiveMarkets();

    console.log(`[Avatar Market] ${avatars.length} active avatars, ${markets.length} active markets`);

    const decisions: AvatarTradeDecision[] = [];
    let trades = 0;

    for (const avatar of avatars) {
      if (!this.canAvatarTrade(avatar)) {
        continue;
      }

      const relevantMarkets = markets.filter(m => this.isMarketRelevantToAvatar(m, avatar));
      if (relevantMarkets.length === 0) {
        continue;
      }

      const market = relevantMarkets[Math.floor(Math.random() * Math.min(3, relevantMarkets.length))];

      const decision = this.makeTradeDecision(market, avatar);
      decisions.push(decision);

      if (decision.decision !== 'PASS') {
        const result = await this.executeTrade(decision);
        if (result.success) {
          trades++;
        }
      }
    }

    console.log(`[Avatar Market] Trading cycle complete: ${trades} trades from ${decisions.length} decisions`);
    return { trades, decisions };
  }

  async getAvatarTradingStats(avatarId: string): Promise<{
    avatarId: string;
    totalTrades: number;
    totalVolume: number;
    activePositions: number;
    winRate: number;
    avgTradeRoi: number;
    tradingPersona: {
      tradingStyle: string;
      riskTolerance: string;
      expertiseDomains: string[];
      decisionBias: string;
    };
    recentTrades: Array<{
      id: string;
      marketId: string;
      marketQuestion: string;
      outcome: string;
      shares: number;
      entryPrice: number;
      invested: number;
      reasoning: string;
      createdAt: string;
    }>;
    positions: Array<{
      marketId: string;
      marketQuestion: string;
      outcome: string;
      shares: number;
      invested: number;
    }>;
  }> {
    // Get avatar info including trading persona
    const avatar = await db.query.knowledgeAvatars.findFirst({
      where: eq(knowledgeAvatars.id, avatarId),
    });

    // Get all positions for this avatar
    const positions = await db.query.marketPositions.findMany({
      where: eq(marketPositions.userWallet, `avatar:${avatarId}`),
    });

    // Get all trades for this avatar
    const trades = await db.query.marketTrades.findMany({
      where: eq(marketTrades.userWallet, `avatar:${avatarId}`),
      orderBy: (trades, { desc }) => [desc(trades.createdAt)],
      limit: 20,
    });

    // Get market questions for positions and trades
    const allMarketIds = [
      ...positions.map(p => p.marketId),
      ...trades.map(t => t.marketId)
    ];
    const marketIds = Array.from(new Set(allMarketIds));

    const markets = await db.query.predictionMarkets.findMany({
      where: sql`${predictionMarkets.id} IN ${marketIds.length > 0 ? sql`(${sql.join(marketIds.map(id => sql`${id}`), sql`, `)})` : sql`('')`}`,
    });

    const marketMap = new Map(markets.map(m => [m.id, m]));

    const totalVolume = trades.reduce((sum, t) => sum + (t.streamAmount || 0), 0);
    const activePositions = positions.filter(p => p.shares > 0).length;

    // Calculate win rate from avatar's stored stats
    const winRate = (avatar as any)?.winRate || 0;
    const avgTradeRoi = (avatar as any)?.avgTradeRoi || 0;

    // Build trading persona from avatar data
    const tradingPersona = {
      tradingStyle: (avatar as any)?.tradingStyle || 'value',
      riskTolerance: (avatar as any)?.riskTolerance || 'moderate',
      expertiseDomains: (avatar as any)?.expertiseDomains || avatar?.primaryInterests || [],
      decisionBias: (avatar as any)?.decisionBias || 'fundamental',
    };

    // Map recent trades with market questions and reasoning
    const recentTrades = trades.slice(0, 10).map(trade => {
      const market = marketMap.get(trade.marketId);
      return {
        id: trade.id,
        marketId: trade.marketId,
        marketQuestion: market?.question || 'Unknown market',
        outcome: trade.outcome,
        shares: trade.shares,
        entryPrice: trade.price,
        invested: trade.streamAmount || 0,
        reasoning: (trade as any).reasoning || '',
        createdAt: trade.createdAt?.toISOString() || new Date().toISOString(),
      };
    });

    // Map positions with market questions
    const positionsWithMarkets = positions.filter(p => p.shares > 0).map(pos => {
      const market = marketMap.get(pos.marketId);
      return {
        marketId: pos.marketId,
        marketQuestion: market?.question || 'Unknown market',
        outcome: pos.outcome,
        shares: pos.shares,
        invested: pos.totalInvested || 0,
      };
    });

    return {
      avatarId,
      totalTrades: trades.length,
      totalVolume,
      activePositions,
      winRate,
      avgTradeRoi,
      tradingPersona,
      recentTrades,
      positions: positionsWithMarkets,
    };
  }

  async getMarketAvatarPositions(marketId: string): Promise<{
    avatar: { id: string; name: string; imageUrl: string | null };
    outcome: string;
    shares: number;
    invested: number;
  }[]> {
    const positions = await db.query.marketPositions.findMany({
      where: and(
        eq(marketPositions.marketId, marketId),
        sql`${marketPositions.userWallet} LIKE 'avatar:%'`
      ),
    });

    const avatarPositions = await Promise.all(
      positions.map(async (pos) => {
        const avatarId = pos.userWallet.replace('avatar:', '');
        const avatar = await db.query.knowledgeAvatars.findFirst({
          where: eq(knowledgeAvatars.id, avatarId),
        });

        return {
          avatar: {
            id: avatarId,
            name: avatar?.name || 'Unknown Avatar',
            imageUrl: avatar?.imageUrl || null,
          },
          outcome: pos.outcome,
          shares: pos.shares,
          invested: pos.totalInvested || 0,
        };
      })
    );

    return avatarPositions;
  }

  resetDailyCounts() {
    this.dailyTradeCount.clear();
    console.log('[Avatar Market] Daily trade counts reset');
  }
}

export const avatarMarketParticipationService = new AvatarMarketParticipationService();
