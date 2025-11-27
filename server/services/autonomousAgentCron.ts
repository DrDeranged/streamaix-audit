import * as cron from 'node-cron';
import { getAutonomousAgentService } from './autonomousAgentService';

/**
 * Background cron service that runs autonomous AI agents
 * 
 * This service orchestrates 100 AI agents to perform activities
 * across the platform every 5-15 minutes:
 * 
 * - Create bounties on trending topics
 * - Submit summaries to open bounties
 * - Trade prediction markets
 * - Comment on content
 * - Vote on submissions
 * - Follow interesting users
 * 
 * Agents act independently with realistic timing patterns,
 * personality-driven decisions, and human-like behavior.
 */
export class AutonomousAgentCron {
  private cronJob: any = null;
  private isRunning: boolean = false;

  /**
   * Start the background service
   * Runs every 30 minutes by default (COST OPTIMIZATION: 3x fewer API calls)
   */
  start(intervalMinutes: number = 30): void {
    if (this.isRunning) {
      console.log('⚠️  Autonomous agent cron is already running');
      return;
    }

    console.log(`🤖 Starting autonomous agent cron service (every ${intervalMinutes} minutes)`);

    // Schedule: runs every X minutes
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.runAgentCycle();
    });

    this.isRunning = true;
    
    // Run immediately on startup
    this.runAgentCycle();
    
    console.log(`✅ Autonomous agent cron started successfully`);
  }

  /**
   * Stop the background service
   */
  stop(): void {
    if (!this.isRunning || !this.cronJob) {
      console.log('⚠️  Autonomous agent cron is not running');
      return;
    }

    this.cronJob.stop();
    this.cronJob = null;
    this.isRunning = false;

    console.log('🛑 Autonomous agent cron stopped');
  }

  /**
   * Run a single cycle of agent activities
   */
  private async runAgentCycle(): Promise<void> {
    try {
      console.log('\n🔄 ===== AUTONOMOUS AGENT CYCLE START =====');
      console.log(`   Time: ${new Date().toLocaleString()}`);
      
      const agentService = getAutonomousAgentService();
      
      // Start the agent service if not already running
      if (!agentService.isRunning) {
        agentService.start();
      }
      
      // Log statistics
      const stats = agentService.getStats();
      console.log('\n📊 Cycle Statistics:');
      console.log(`   Total Cycles: ${stats.cycleCount}`);
      console.log(`   Total Actions: ${stats.totalActions}`);
      console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      console.log(`   Action Breakdown:`);
      Object.entries(stats.actionCounts).forEach(([action, count]) => {
        console.log(`     - ${action}: ${count}`);
      });
      
      console.log('===== AUTONOMOUS AGENT CYCLE END =====\n');
      
    } catch (error: any) {
      console.error('❌ Autonomous agent cycle failed:', error.message);
      console.error(error.stack);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? 'Scheduled' : 'Not scheduled',
    };
  }
}

// Singleton instance
let autonomousAgentCron: AutonomousAgentCron | null = null;

export function getAutonomousAgentCron(): AutonomousAgentCron {
  if (!autonomousAgentCron) {
    autonomousAgentCron = new AutonomousAgentCron();
  }
  return autonomousAgentCron;
}

/**
 * Initialize and start the cron service
 * Call this from your main server startup
 */
export function initializeAutonomousAgentCron(intervalMinutes: number = 10): void {
  const cron = getAutonomousAgentCron();
  cron.start(intervalMinutes);
}

/**
 * Shutdown the cron service gracefully
 * Call this during server shutdown
 */
export function shutdownAutonomousAgentCron(): void {
  const cron = getAutonomousAgentCron();
  cron.stop();
}
