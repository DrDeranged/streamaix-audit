// Autonomous AI Agent Type Definitions

export type RiskTolerance = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
export type ActivityLevel = 'inactive' | 'casual' | 'regular' | 'active' | 'hyperactive';
export type TradingStyle = 'scalper' | 'swing' | 'position' | 'hodl' | 'degen' | 'conservative' | 'balanced';
export type ContentFocus = 'technical' | 'fundamental' | 'narrative' | 'onchain' | 'sentiment' | 'mixed';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AgentPersonality {
  riskTolerance: RiskTolerance;
  activityLevel: ActivityLevel;
  expertise: string[]; // e.g., ['DeFi', 'NFTs', 'Layer 2']
  tradingStyle: TradingStyle;
  contentFocus: ContentFocus;
  confidenceBias: number; // 0-1, affects how confident they are in decisions
  fomoProne: boolean; // Susceptible to FOMO?
  contrarian: boolean; // Goes against the crowd?
  longTermOriented: boolean; // Prefers long-term positions?
}

export interface SleepSchedule {
  start: number; // Hour (0-23)
  end: number; // Hour (0-23)
}

export interface BehaviorPatterns {
  averageSessionLength: number; // minutes
  actionsPerSession: number; // number of actions per session
  preferredTimeSlots: number[]; // Array of hours [9, 10, 14, 18, 20]
  weekendActivity: boolean; // More active on weekends?
}

export interface AgentMetadata {
  timezone: string; // e.g., 'America/New_York'
  sleepSchedule: SleepSchedule;
  skillLevel: SkillLevel;
  behaviorPatterns: BehaviorPatterns;
  createdTimestamp: number; // Unix timestamp
}

export interface AgentAction {
  type: 'create_bounty' | 'submit_summary' | 'trade_market' | 'comment' | 'vote' | 'follow';
  agentId: string;
  targetId?: string; // bountyId, marketId, etc.
  metadata?: Record<string, any>;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface AgentStats {
  totalActions: number;
  totalBountiesCreated: number;
  totalSummariesSubmitted: number;
  totalTrades: number;
  totalComments: number;
  totalVotes: number;
  streamPointsEarned: number;
  streamPointsSpent: number;
  currentBalance: number;
  reputation: number;
  followers: number;
  following: number;
  lastActiveAt: number;
}

export interface AgentDecision {
  action: string;
  confidence: number; // 0-1
  reasoning: string;
  estimatedValue: number; // Expected utility
  riskLevel: RiskTolerance;
  timestamp: number;
}
