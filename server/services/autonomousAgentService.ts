import { db } from '../db';
import { users, autonomousSystemLogs } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { AgentPersonality, AgentMetadata, AgentAction } from '../types/agents';
import { getAgentBountyEngine } from './agentBountyEngine';
import { getAgentSocialEngine } from './agentSocialEngine';
import { agentMarketTrader } from './agentMarketTrader';

interface AgentUser {
  id: string;
  username: string;
  streamPoints: number;
  agentPersonality: AgentPersonality;
  agentMetadata: AgentMetadata;
}

export class AutonomousAgentService {
  private isRunning: boolean = false;
  private cycleCount: number = 0;
  private actionLog: AgentAction[] = [];
  
  constructor() {
    console.log('🤖 Autonomous Agent Service initialized');
  }
  
  /**
   * Main orchestration loop - runs continuously
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Agent service already running');
      return;
    }
    
    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log('🤖 [Autonomous Agents] ⏸️ OpenAI API paused - agent service disabled');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Starting autonomous agent service...');
    
    while (this.isRunning) {
      try {
        await this.runCycle();
        
        // Random delay between 5-7 hours (MAJOR COST OPTIMIZATION: ~80% reduction)
        const delayMinutes = 300 + Math.random() * 120;
        const delayMs = delayMinutes * 60 * 1000;
        
        console.log(`⏱️  Cycle ${this.cycleCount} complete. Next cycle in ${Math.round(delayMinutes / 60)} hours.`);
        await this.sleep(delayMs);
        
      } catch (error) {
        console.error('❌ Error in agent service cycle:', error);
        // Wait 30 seconds before retrying on error
        await this.sleep(30000);
      }
    }
  }
  
  /**
   * Stop the orchestration loop
   */
  stop() {
    console.log('🛑 Stopping autonomous agent service...');
    this.isRunning = false;
  }
  
  /**
   * Run a single cycle of agent activities
   */
  private async runCycle() {
    this.cycleCount++;
    console.log(`\n🔄 === Cycle ${this.cycleCount} Starting ===`);
    
    // Fetch all AI agents
    const agents = await this.getActiveAgents();
    console.log(`👥 Found ${agents.length} AI agents`);
    
    if (agents.length === 0) {
      console.log('⚠️  No AI agents found. Run initialization script first.');
      return;
    }
    
    // Determine which agents should be active this cycle
    const activeAgents = this.selectActiveAgents(agents);
    console.log(`✅ ${activeAgents.length} agents selected for this cycle`);
    
    // Execute actions for each active agent
    const actions: Promise<void>[] = [];
    
    for (const agent of activeAgents) {
      // Each agent gets a chance to perform multiple actions
      const actionsToPerform = this.selectActionsForAgent(agent);
      
      for (const action of actionsToPerform) {
        actions.push(this.executeAction(agent, action));
      }
    }
    
    // Execute all actions in parallel
    await Promise.all(actions);
    
    console.log(`✅ Cycle ${this.cycleCount} completed with ${actions.length} actions`);
  }
  
  /**
   * Fetch all active AI agents from database
   */
  private async getActiveAgents(): Promise<AgentUser[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        streamPoints: users.streamPoints,
        agentPersonality: users.agentPersonality,
        agentMetadata: users.agentMetadata,
      })
      .from(users)
      .where(eq(users.isAiAgent, true));
    
    return result as AgentUser[];
  }
  
  /**
   * Determine which agents should be active this cycle based on:
   * - Current time vs their timezone
   * - Sleep schedule
   * - Activity level
   * - Random variation
   */
  private selectActiveAgents(agents: AgentUser[]): AgentUser[] {
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return agents.filter(agent => {
      const metadata = agent.agentMetadata;
      const personality = agent.agentPersonality;
      
      // Skip if missing required data
      if (!metadata || !personality) return false;
      
      // Check if agent is sleeping
      if (metadata.sleepSchedule) {
        const { start, end } = metadata.sleepSchedule;
        const isSleeping = this.isInSleepWindow(currentHour, start, end);
        if (isSleeping) return false;
      }
      
      // Weekend activity check
      if (isWeekend && !metadata.behaviorPatterns.weekendActivity) {
        // Less likely to be active on weekends
        if (Math.random() > 0.3) return false;
      }
      
      // Preferred time slot bonus
      const isPreferredTime = metadata.behaviorPatterns.preferredTimeSlots.includes(currentHour);
      const preferredBonus = isPreferredTime ? 0.3 : 0;
      
      // Activity level determines probability of being active
      const activityProbabilities = {
        'inactive': 0.05,
        'casual': 0.15,
        'regular': 0.35,
        'active': 0.55,
        'hyperactive': 0.85,
      };
      
      const baseProbability = activityProbabilities[personality.activityLevel];
      const finalProbability = Math.min(baseProbability + preferredBonus, 0.95);
      
      return Math.random() < finalProbability;
    });
  }
  
  /**
   * Check if current hour is within sleep window
   */
  private isInSleepWindow(currentHour: number, start: number, end: number): boolean {
    if (start < end) {
      return currentHour >= start && currentHour < end;
    } else {
      // Sleep window wraps around midnight
      return currentHour >= start || currentHour < end;
    }
  }
  
  /**
   * Select which actions an agent should perform this cycle
   */
  private selectActionsForAgent(agent: AgentUser): string[] {
    const actions: string[] = [];
    const personality = agent.agentPersonality;
    const metadata = agent.agentMetadata;
    
    const maxActions = Math.min(
      metadata.behaviorPatterns.actionsPerSession,
      5 // Cap at 5 actions per cycle
    );
    
    // Action probabilities based on personality
    const actionProbabilities = {
      'create_bounty': this.getBountyCreationProbability(personality, agent.streamPoints),
      'create_knowledge_question': this.getKnowledgeQuestionProbability(personality, agent.streamPoints),
      'submit_summary': this.getSummarySubmissionProbability(personality, metadata.skillLevel),
      'trade_market': this.getMarketTradingProbability(personality, agent.streamPoints),
      'comment': this.getCommentProbability(personality),
      'vote': this.getVoteProbability(personality),
      'follow': this.getFollowProbability(personality),
    };
    
    // Select actions based on probabilities
    for (const [action, probability] of Object.entries(actionProbabilities)) {
      if (actions.length >= maxActions) break;
      
      if (Math.random() < probability) {
        actions.push(action);
      }
    }
    
    // Ensure at least one action if none selected
    if (actions.length === 0 && Math.random() > 0.3) {
      const availableActions = Object.keys(actionProbabilities);
      actions.push(availableActions[Math.floor(Math.random() * availableActions.length)]);
    }
    
    return actions;
  }
  
  /**
   * Calculate probability of creating a bounty
   */
  private getBountyCreationProbability(personality: AgentPersonality, streamPoints: number): number {
    let probability = 0.05; // Base 5%
    
    // Higher STREAM points = more likely to create bounties
    if (streamPoints > 50000) probability += 0.15;
    else if (streamPoints > 20000) probability += 0.10;
    else if (streamPoints > 5000) probability += 0.05;
    
    // Activity level bonus
    const activityBonus = {
      'inactive': 0,
      'casual': 0.02,
      'regular': 0.05,
      'active': 0.08,
      'hyperactive': 0.12,
    };
    probability += activityBonus[personality.activityLevel];
    
    return Math.min(probability, 0.35);
  }
  
  /**
   * Calculate probability of submitting a summary
   */
  private getSummarySubmissionProbability(personality: AgentPersonality, skillLevel: string): number {
    let probability = 0.15; // Base 15%
    
    // Skill level affects submission probability
    const skillBonus = {
      'beginner': -0.05,
      'intermediate': 0,
      'advanced': 0.08,
      'expert': 0.15,
    };
    probability += skillBonus[skillLevel as keyof typeof skillBonus];
    
    // Activity level bonus
    const activityBonus = {
      'inactive': -0.05,
      'casual': 0,
      'regular': 0.05,
      'active': 0.10,
      'hyperactive': 0.15,
    };
    probability += activityBonus[personality.activityLevel];
    
    return Math.max(0.05, Math.min(probability, 0.45));
  }
  
  /**
   * Calculate probability of trading markets
   */
  private getMarketTradingProbability(personality: AgentPersonality, streamPoints: number): number {
    let probability = 0.20; // Base 20%
    
    // Risk tolerance affects trading frequency
    const riskBonus = {
      'very-low': -0.10,
      'low': -0.05,
      'medium': 0,
      'high': 0.10,
      'very-high': 0.20,
    };
    probability += riskBonus[personality.riskTolerance];
    
    // Trading style affects frequency
    const styleBonus = {
      'scalper': 0.25,
      'swing': 0.15,
      'position': 0.05,
      'hodl': -0.05,
      'degen': 0.30,
      'conservative': -0.08,
      'balanced': 0.08,
    };
    probability += styleBonus[personality.tradingStyle];
    
    // Need sufficient STREAM points to trade
    if (streamPoints < 500) probability *= 0.3;
    
    return Math.max(0.05, Math.min(probability, 0.70));
  }
  
  /**
   * Calculate probability of commenting
   */
  private getCommentProbability(personality: AgentPersonality): number {
    let probability = 0.25; // Base 25%
    
    // Content focus affects commenting
    if (personality.contentFocus === 'mixed' || personality.contentFocus === 'narrative') {
      probability += 0.15;
    }
    
    // Activity bonus
    const activityBonus = {
      'inactive': -0.10,
      'casual': 0,
      'regular': 0.08,
      'active': 0.15,
      'hyperactive': 0.25,
    };
    probability += activityBonus[personality.activityLevel];
    
    return Math.max(0.05, Math.min(probability, 0.60));
  }
  
  /**
   * Calculate probability of voting
   */
  private getVoteProbability(personality: AgentPersonality): number {
    let probability = 0.30; // Base 30% (most common action)
    
    // Contrarians vote more to express opinions
    if (personality.contrarian) probability += 0.15;
    
    // Activity bonus
    const activityBonus = {
      'inactive': -0.15,
      'casual': 0,
      'regular': 0.10,
      'active': 0.18,
      'hyperactive': 0.30,
    };
    probability += activityBonus[personality.activityLevel];
    
    return Math.max(0.10, Math.min(probability, 0.75));
  }
  
  /**
   * Calculate probability of following users
   */
  private getFollowProbability(personality: AgentPersonality): number {
    let probability = 0.10; // Base 10%
    
    // Long-term oriented agents build networks
    if (personality.longTermOriented) probability += 0.10;
    
    // Activity bonus
    const activityBonus = {
      'inactive': -0.05,
      'casual': 0,
      'regular': 0.03,
      'active': 0.05,
      'hyperactive': 0.08,
    };
    probability += activityBonus[personality.activityLevel];
    
    return Math.max(0.02, Math.min(probability, 0.30));
  }

  /**
   * Calculate probability of creating knowledge question bounties
   */
  private getKnowledgeQuestionProbability(personality: AgentPersonality, streamPoints: number): number {
    let probability = 0.08; // Base 8%
    
    // Expertise-based agents more likely to ask educational questions
    if (personality.expertise && personality.expertise.length >= 2) probability += 0.10;
    
    // Long-term oriented agents invest in education
    if (personality.longTermOriented) probability += 0.05;
    
    // Need enough points to fund bounties
    if (streamPoints > 10000) probability += 0.05;
    else if (streamPoints < 1000) probability -= 0.05;
    
    return Math.max(0.03, Math.min(probability, 0.25));
  }
  
  /**
   * Execute a specific action for an agent
   */
  private async executeAction(agent: AgentUser, actionType: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  🎬 ${agent.username} -> ${actionType}`);
      
      // Add random delay to simulate human behavior (0-5 seconds)
      await this.sleep(Math.random() * 5000);
      
      switch (actionType) {
        case 'create_bounty':
          await this.createBountyAction(agent);
          break;
        case 'create_knowledge_question':
          await this.createKnowledgeQuestionAction(agent);
          break;
        case 'submit_summary':
          await this.submitSummaryAction(agent);
          break;
        case 'trade_market':
          await this.tradeMarketAction(agent);
          break;
        case 'comment':
          await this.commentAction(agent);
          break;
        case 'vote':
          await this.voteAction(agent);
          break;
        case 'follow':
          await this.followAction(agent);
          break;
        default:
          console.log(`    ⚠️  Unknown action: ${actionType}`);
      }
      
      const duration = Date.now() - startTime;
      console.log(`    ✅ Completed in ${duration}ms`);
      
      // Log the action
      this.logAction({
        type: actionType as any,
        agentId: agent.id,
        timestamp: Date.now(),
        success: true,
      });
      
    } catch (error: any) {
      console.error(`    ❌ Failed: ${error.message}`);
      
      this.logAction({
        type: actionType as any,
        agentId: agent.id,
        timestamp: Date.now(),
        success: false,
        error: error.message,
      });
    }
  }
  
  /**
   * Action implementations using specialized services
   */
  private async createBountyAction(agent: AgentUser): Promise<void> {
    const bountyEngine = getAgentBountyEngine();
    await bountyEngine.createBounty({
      agentId: agent.id,
      username: agent.username,
      streamPoints: agent.streamPoints,
      personality: agent.agentPersonality,
    });
  }
  
  private async submitSummaryAction(agent: AgentUser): Promise<void> {
    const { getAgentSummarySubmitter } = await import('./agentSummarySubmitter');
    const submitter = getAgentSummarySubmitter();
    await submitter.submitSummary({
      agentId: agent.id,
      username: agent.username,
      personality: agent.agentPersonality,
      streamPoints: agent.streamPoints,
    });
  }
  
  private async tradeMarketAction(agent: AgentUser): Promise<void> {
    try {
      const result = await agentMarketTrader.tradeMultipleMarkets(agent as any);
      
      if (result.succeeded > 0) {
        const successTrade = result.trades.find(t => t.success);
        if (successTrade) {
          console.log(`    ✅ ${successTrade.message}`);
        }
      } else if (result.attempted > 0) {
        console.log(`    ⏭️  Skipped trading - no favorable markets`);
      } else {
        console.log(`    ⚠️  No markets available`);
      }
    } catch (error: any) {
      console.error(`    ❌ Trade error:`, error.message);
    }
  }
  
  private async commentAction(agent: AgentUser): Promise<void> {
    const socialEngine = getAgentSocialEngine();
    await socialEngine.commentAction(agent.id, agent.username, agent.agentPersonality);
  }
  
  private async voteAction(agent: AgentUser): Promise<void> {
    const socialEngine = getAgentSocialEngine();
    await socialEngine.voteAction(agent.id, agent.agentPersonality);
  }
  
  private async followAction(agent: AgentUser): Promise<void> {
    const socialEngine = getAgentSocialEngine();
    await socialEngine.followAction(agent.id, agent.agentPersonality);
  }

  private async createKnowledgeQuestionAction(agent: AgentUser): Promise<void> {
    const { knowledgeQuestionService } = await import('./knowledgeQuestionService');
    await knowledgeQuestionService.generateKnowledgeQuestion(
      agent.id,
      agent.username,
      agent.streamPoints
    );
  }
  
  /**
   * Log an action for analytics - stores in memory and database
   */
  private async logAction(action: AgentAction): Promise<void> {
    this.actionLog.push(action);
    
    // Keep only last 1000 actions in memory
    if (this.actionLog.length > 1000) {
      this.actionLog = this.actionLog.slice(-1000);
    }
    
    // Also log to database for admin dashboard
    try {
      await db.insert(autonomousSystemLogs).values({
        systemName: 'social_agents',
        actionType: action.type,
        status: action.success ? 'success' : 'failed',
        targetId: action.agentId,
        reasoning: action.type,
        errorMessage: action.error || null,
        executionTimeMs: 0,
        metadata: { agentId: action.agentId, timestamp: action.timestamp },
      });
    } catch (dbError) {
      // Don't let logging failures break the main flow
      console.error('Failed to log action to database:', dbError);
    }
  }
  
  /**
   * Get action statistics
   */
  getStats() {
    const successCount = this.actionLog.filter(a => a.success).length;
    const failureCount = this.actionLog.filter(a => !a.success).length;
    
    const actionCounts = this.actionLog.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      cycleCount: this.cycleCount,
      totalActions: this.actionLog.length,
      successCount,
      failureCount,
      successRate: this.actionLog.length > 0 ? successCount / this.actionLog.length : 0,
      actionCounts,
      isRunning: this.isRunning,
    };
  }
  
  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let agentServiceInstance: AutonomousAgentService | null = null;

export function getAutonomousAgentService(): AutonomousAgentService {
  if (!agentServiceInstance) {
    agentServiceInstance = new AutonomousAgentService();
  }
  return agentServiceInstance;
}
