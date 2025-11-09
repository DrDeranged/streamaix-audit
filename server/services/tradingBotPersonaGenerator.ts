/**
 * Trading Bot Persona Generator
 * Generates 50 unique AI trading bots with realistic names, personalities, and trading parameters
 */

export interface TradingBotPersona {
  name: string;
  personality: string;
  description: string;
  strategy: string;
  riskTolerance: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  confidenceThreshold: number;
  positionSize: 'micro' | 'small' | 'medium' | 'large' | 'whale';
  tradingFrequency: 'hourly' | 'daily' | 'opportunistic' | 'aggressive';
  streamPoints: number;
  avatar: string;
}

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Blake', 'Dakota', 'Skyler', 'Rowan', 'Sage', 'River', 'Phoenix', 'Kai',
  'Sarah', 'David', 'Emma', 'Michael', 'Olivia', 'James', 'Sophia', 'William',
  'Isabella', 'Benjamin', 'Mia', 'Lucas', 'Charlotte', 'Henry', 'Amelia', 'Alexander',
  'Harper', 'Daniel', 'Evelyn', 'Matthew', 'Abigail', 'Jackson', 'Emily', 'Sebastian',
  'Luna', 'Jack', 'Nova', 'Owen', 'Aria', 'Leo', 'Chloe', 'Theodore', 'Zoe', 'Ethan'
];

const LAST_NAMES = [
  'Chen', 'Martinez', 'Kim', 'Patel', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Rodriguez', 'Lee', 'Nguyen', 'Singh', 'Ali', 'Cohen', 'OConnor',
  'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Thompson', 'White',
  'Lopez', 'Gonzalez', 'Wilson', 'Davis', 'Harris', 'Clark', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Hall', 'Allen', 'King', 'Wright', 'Scott', 'Green',
  'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell'
];

const PERSONALITIES = [
  {
    type: 'conservative',
    description: 'Risk-averse value investor. Only trades high-confidence opportunities with strong fundamentals.',
    strategy: 'Conservative value investing with focus on capital preservation',
    riskTolerance: 'low' as const,
    confidenceThreshold: 0.75,
    positionSize: 'small' as const,
    tradingFrequency: 'opportunistic' as const,
    avatar: '🛡️'
  },
  {
    type: 'aggressive',
    description: 'Bold momentum trader seeking maximum returns. Takes large positions on volatile markets.',
    strategy: 'Aggressive growth strategy with high-volume trading',
    riskTolerance: 'very-high' as const,
    confidenceThreshold: 0.55,
    positionSize: 'large' as const,
    tradingFrequency: 'aggressive' as const,
    avatar: '⚡'
  },
  {
    type: 'quantitative',
    description: 'Data-driven analyst using statistical models and pattern recognition.',
    strategy: 'Quantitative analysis with emphasis on statistical patterns',
    riskTolerance: 'medium' as const,
    confidenceThreshold: 0.68,
    positionSize: 'medium' as const,
    tradingFrequency: 'daily' as const,
    avatar: '📊'
  },
  {
    type: 'contrarian',
    description: 'Goes against market consensus to find mispriced opportunities.',
    strategy: 'Contrarian trading focused on market inefficiencies',
    riskTolerance: 'high' as const,
    confidenceThreshold: 0.62,
    positionSize: 'medium' as const,
    tradingFrequency: 'opportunistic' as const,
    avatar: '🔄'
  },
  {
    type: 'momentum',
    description: 'Rides market trends and follows strong directional moves.',
    strategy: 'Momentum-based trading following trend strength',
    riskTolerance: 'high' as const,
    confidenceThreshold: 0.65,
    positionSize: 'medium' as const,
    tradingFrequency: 'daily' as const,
    avatar: '🚀'
  },
  {
    type: 'swing-trader',
    description: 'Captures medium-term price swings with calculated entries.',
    strategy: 'Swing trading with focus on price action patterns',
    riskTolerance: 'medium' as const,
    confidenceThreshold: 0.70,
    positionSize: 'medium' as const,
    tradingFrequency: 'daily' as const,
    avatar: '📈'
  },
  {
    type: 'day-trader',
    description: 'Fast-paced intraday trading with quick entries and exits.',
    strategy: 'High-frequency day trading with rapid position turnover',
    riskTolerance: 'high' as const,
    confidenceThreshold: 0.60,
    positionSize: 'small' as const,
    tradingFrequency: 'aggressive' as const,
    avatar: '⚡'
  },
  {
    type: 'scalper',
    description: 'Exploits small price discrepancies with many micro-trades.',
    strategy: 'Scalping strategy targeting tiny price movements',
    riskTolerance: 'medium' as const,
    confidenceThreshold: 0.58,
    positionSize: 'micro' as const,
    tradingFrequency: 'aggressive' as const,
    avatar: '🎯'
  },
  {
    type: 'hodler',
    description: 'Long-term investor with conviction. Rarely trades, holds positions.',
    strategy: 'Buy and hold strategy with long-term conviction',
    riskTolerance: 'very-low' as const,
    confidenceThreshold: 0.80,
    positionSize: 'large' as const,
    tradingFrequency: 'opportunistic' as const,
    avatar: '💎'
  },
  {
    type: 'arbitrage',
    description: 'Seeks risk-free profits from market inefficiencies.',
    strategy: 'Arbitrage strategy exploiting price discrepancies',
    riskTolerance: 'low' as const,
    confidenceThreshold: 0.72,
    positionSize: 'medium' as const,
    tradingFrequency: 'hourly' as const,
    avatar: '⚖️'
  }
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateStreamPoints(positionSize: string): number {
  switch (positionSize) {
    case 'micro':
      return 500 + Math.floor(Math.random() * 500); // 500-1000
    case 'small':
      return 1000 + Math.floor(Math.random() * 1000); // 1000-2000
    case 'medium':
      return 2000 + Math.floor(Math.random() * 1500); // 2000-3500
    case 'large':
      return 3500 + Math.floor(Math.random() * 2000); // 3500-5500
    case 'whale':
      return 5000 + Math.floor(Math.random() * 5000); // 5000-10000
    default:
      return 2000;
  }
}

export function generateTradingBotPersonas(count: number = 50): TradingBotPersona[] {
  const bots: TradingBotPersona[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let fullName: string;
    
    // Generate unique name
    do {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      fullName = `${firstName} ${lastName}`;
    } while (usedNames.has(fullName));
    
    usedNames.add(fullName);

    // Select personality (distribute evenly)
    const personalityIndex = i % PERSONALITIES.length;
    const personality = PERSONALITIES[personalityIndex];

    // Add some variation to thresholds and sizing
    const variationFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    const confidenceThreshold = Math.min(0.85, Math.max(0.50, personality.confidenceThreshold * variationFactor));

    const bot: TradingBotPersona = {
      name: fullName,
      personality: personality.type,
      description: personality.description,
      strategy: personality.strategy,
      riskTolerance: personality.riskTolerance,
      confidenceThreshold: parseFloat(confidenceThreshold.toFixed(2)),
      positionSize: personality.positionSize,
      tradingFrequency: personality.tradingFrequency,
      streamPoints: generateStreamPoints(personality.positionSize),
      avatar: personality.avatar
    };

    bots.push(bot);
  }

  return bots;
}

// Generate and export the 50 bots
export const TRADING_BOTS = generateTradingBotPersonas(50);

// Distribution stats helper
export function getBotDistributionStats() {
  const stats = {
    totalBots: TRADING_BOTS.length,
    totalStreamPoints: TRADING_BOTS.reduce((sum, bot) => sum + bot.streamPoints, 0),
    byPersonality: {} as Record<string, number>,
    byRiskTolerance: {} as Record<string, number>,
    byPositionSize: {} as Record<string, number>,
    byTradingFrequency: {} as Record<string, number>
  };

  TRADING_BOTS.forEach(bot => {
    stats.byPersonality[bot.personality] = (stats.byPersonality[bot.personality] || 0) + 1;
    stats.byRiskTolerance[bot.riskTolerance] = (stats.byRiskTolerance[bot.riskTolerance] || 0) + 1;
    stats.byPositionSize[bot.positionSize] = (stats.byPositionSize[bot.positionSize] || 0) + 1;
    stats.byTradingFrequency[bot.tradingFrequency] = (stats.byTradingFrequency[bot.tradingFrequency] || 0) + 1;
  });

  return stats;
}
