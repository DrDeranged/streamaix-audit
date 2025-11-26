import { db } from '../db';
import { users, predictionLeagues, leagueParticipants } from '../../shared/schema';
import { eq, and, sql, inArray, or, gt, lt } from 'drizzle-orm';

interface LeagueStats {
  totalLeagues: number;
  activeLeagues: number;
  aiParticipants: number;
  recentJoins: number;
}

export class AILeagueManager {
  private static instance: AILeagueManager;
  private lastRunTime: Date | null = null;
  private stats: LeagueStats = {
    totalLeagues: 0,
    activeLeagues: 0,
    aiParticipants: 0,
    recentJoins: 0,
  };

  static getInstance(): AILeagueManager {
    if (!AILeagueManager.instance) {
      AILeagueManager.instance = new AILeagueManager();
    }
    return AILeagueManager.instance;
  }

  async runAutoJoinCycle(): Promise<{ joined: number; errors: number }> {
    console.log('\n🏆 === AI LEAGUE AUTO-JOIN CYCLE ===');
    
    let joined = 0;
    let errors = 0;

    try {
      const activeLeagues = await db
        .select()
        .from(predictionLeagues)
        .where(
          or(
            eq(predictionLeagues.status, 'active'),
            eq(predictionLeagues.status, 'upcoming')
          )
        );

      console.log(`📊 Found ${activeLeagues.length} active/upcoming leagues`);
      this.stats.activeLeagues = activeLeagues.length;

      const aiAgents = await db
        .select({
          id: users.id,
          username: users.username,
          streamPoints: users.streamPoints,
        })
        .from(users)
        .where(eq(users.isAiAgent, true));

      console.log(`🤖 Found ${aiAgents.length} AI agents`);

      for (const league of activeLeagues) {
        const existingParticipants = await db
          .select({ userId: leagueParticipants.userId })
          .from(leagueParticipants)
          .where(eq(leagueParticipants.leagueId, league.id));

        const participantIds = new Set(existingParticipants.map(p => p.userId));
        const currentCount = existingParticipants.length;

        const maxParticipants = league.maxParticipants || 100;
        const targetAiCount = Math.floor(maxParticipants * 0.3);

        const aiAlreadyJoined = aiAgents.filter(a => participantIds.has(a.id)).length;
        const aiToJoin = Math.min(targetAiCount - aiAlreadyJoined, 5);

        if (aiToJoin <= 0) {
          console.log(`  ✓ League "${league.name}" already has enough AI participants (${aiAlreadyJoined}/${targetAiCount})`);
          continue;
        }

        if (league.maxParticipants && currentCount >= league.maxParticipants) {
          console.log(`  ⚠️ League "${league.name}" is full`);
          continue;
        }

        const eligibleAgents = aiAgents
          .filter(a => !participantIds.has(a.id))
          .filter(a => a.streamPoints >= (league.entryFee || 0))
          .sort(() => Math.random() - 0.5)
          .slice(0, aiToJoin);

        for (const agent of eligibleAgents) {
          try {
            await db.insert(leagueParticipants).values({
              leagueId: league.id,
              userId: agent.id,
              entryFeePaid: league.entryFee || 0,
              totalTrades: 0,
              totalVolume: 0,
              netProfit: 0,
              winningTrades: 0,
              losingTrades: 0,
              winRate: 0,
              roi: 0,
            });

            if (league.entryFee && league.entryFee > 0) {
              await db
                .update(users)
                .set({
                  streamPoints: sql`${users.streamPoints} - ${league.entryFee}`,
                })
                .where(eq(users.id, agent.id));
            }

            await db
              .update(predictionLeagues)
              .set({
                totalParticipants: sql`${predictionLeagues.totalParticipants} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(predictionLeagues.id, league.id));

            joined++;
            console.log(`  ✅ ${agent.username} joined "${league.name}"`);
          } catch (error: any) {
            if (error.code === '23505') {
              console.log(`  ⚠️ ${agent.username} already in "${league.name}"`);
            } else {
              console.error(`  ❌ Failed to add ${agent.username} to "${league.name}":`, error.message);
              errors++;
            }
          }
        }
      }

      this.stats.recentJoins = joined;
      this.lastRunTime = new Date();

      console.log(`\n📊 Cycle Complete: ${joined} agents joined, ${errors} errors`);
      console.log('===================================\n');

    } catch (error) {
      console.error('❌ AI League Manager cycle failed:', error);
      errors++;
    }

    return { joined, errors };
  }

  async getLeagueAIStats(): Promise<{
    totalAiInLeagues: number;
    activeLeagues: number;
    aiByLeague: { leagueId: string; leagueName: string; aiCount: number; totalParticipants: number }[];
  }> {
    try {
      const leagues = await db
        .select({
          id: predictionLeagues.id,
          name: predictionLeagues.name,
          totalParticipants: predictionLeagues.totalParticipants,
        })
        .from(predictionLeagues)
        .where(
          or(
            eq(predictionLeagues.status, 'active'),
            eq(predictionLeagues.status, 'upcoming')
          )
        );

      const aiByLeague: { leagueId: string; leagueName: string; aiCount: number; totalParticipants: number }[] = [];
      let totalAiInLeagues = 0;

      for (const league of leagues) {
        const aiCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(leagueParticipants)
          .innerJoin(users, eq(leagueParticipants.userId, users.id))
          .where(
            and(
              eq(leagueParticipants.leagueId, league.id),
              eq(users.isAiAgent, true)
            )
          );

        const count = aiCount[0]?.count || 0;
        totalAiInLeagues += count;

        aiByLeague.push({
          leagueId: league.id,
          leagueName: league.name,
          aiCount: count,
          totalParticipants: league.totalParticipants || 0,
        });
      }

      return {
        totalAiInLeagues,
        activeLeagues: leagues.length,
        aiByLeague,
      };
    } catch (error) {
      console.error('Error getting AI league stats:', error);
      return { totalAiInLeagues: 0, activeLeagues: 0, aiByLeague: [] };
    }
  }

  getStats(): LeagueStats & { lastRunTime: Date | null } {
    return {
      ...this.stats,
      lastRunTime: this.lastRunTime,
    };
  }
}

export const aiLeagueManager = AILeagueManager.getInstance();

export async function initializeAILeagueParticipation(): Promise<void> {
  console.log('🏆 Initializing AI League Participation...');
  await aiLeagueManager.runAutoJoinCycle();
}
