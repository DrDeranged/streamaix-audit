import { db } from '../db';
import { aiAgents } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Initialize AI Trading Agents
 * Creates 4 autonomous AI agents with distinct trading personalities
 * and gives them starting STREAM balances to trade with
 */

const INITIAL_BALANCE = 10000; // 10,000 STREAM per agent

const AI_AGENTS = [
  {
    name: 'Conservative Analyst',
    personality: 'conservative',
    description: 'Risk-averse data-driven analyst. Only trades with high confidence (>70%) and takes small positions. Focuses on fundamentals and long-term trends.',
    strategy: 'Conservative approach with high confidence threshold. Only makes predictions when backed by solid data and fundamentals. Avoids speculation and focuses on established trends.',
    riskTolerance: 'low',
    confidenceThreshold: 0.7,
    isActive: true
  },
  {
    name: 'Aggressive Trader',
    personality: 'aggressive',
    description: 'High-risk momentum trader. Trades frequently with lower confidence thresholds (>55%) and large positions. Capitalizes on volatility and short-term moves.',
    strategy: 'Aggressive momentum-based trading. Seeks high-reward opportunities with higher risk tolerance. Trades on sentiment, momentum, and short-term catalysts.',
    riskTolerance: 'high',
    confidenceThreshold: 0.55,
    isActive: true
  },
  {
    name: 'Data-Driven Strategist',
    personality: 'quantitative',
    description: 'Quantitative analyst using mathematical models and statistical analysis. Balanced risk with medium position sizes. Relies on data patterns and probabilities.',
    strategy: 'Quantitative approach using mathematical models and statistical analysis. Focuses on data patterns, probability edges, and systematic decision-making.',
    riskTolerance: 'medium',
    confidenceThreshold: 0.65,
    isActive: true
  },
  {
    name: 'Contrarian Investor',
    personality: 'contrarian',
    description: 'Contrarian trader who seeks undervalued opportunities by going against the crowd. Medium risk tolerance with focus on market inefficiencies.',
    strategy: 'Contrarian approach that profits from market inefficiencies and crowd psychology. Identifies overpriced and underpriced opportunities by going against the majority.',
    riskTolerance: 'medium-high',
    confidenceThreshold: 0.6,
    isActive: true
  }
];

async function initializeAgents() {
  console.log('🤖 Initializing AI Trading Agents...\n');

  try {
    let createdCount = 0;
    let updatedCount = 0;

    for (const agentData of AI_AGENTS) {
      // Check if agent already exists
      const existingAgent = await db
        .select()
        .from(aiAgents)
        .where(eq(aiAgents.name, agentData.name))
        .limit(1);

      if (existingAgent.length > 0) {
        // Update existing agent
        await db
          .update(aiAgents)
          .set({
            ...agentData,
            totalVolume: 0,
            totalProfit: 0,
            totalLoss: 0,
            netProfit: 0,
            roi: 0,
            totalPredictions: 0,
            correctPredictions: 0,
            accuracyRate: 0,
            currentStreak: 0,
            longestStreak: 0,
            updatedAt: new Date()
          })
          .where(eq(aiAgents.id, existingAgent[0].id));

        console.log(`🔄 Updated existing agent: ${agentData.name}`);
        console.log(`   📊 Personality: ${agentData.personality}`);
        console.log(`   🎯 Confidence Threshold: ${(agentData.confidenceThreshold * 100).toFixed(0)}%`);
        console.log(`   ⚖️  Risk Tolerance: ${agentData.riskTolerance}\n`);
        updatedCount++;
      } else {
        // Create new agent
        await db.insert(aiAgents).values({
          ...agentData,
          totalVolume: 0,
          totalProfit: 0,
          totalLoss: 0,
          netProfit: 0,
          roi: 0,
          totalPredictions: 0,
          correctPredictions: 0,
          accuracyRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          rank: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`✨ Created new agent: ${agentData.name}`);
        console.log(`   📊 Personality: ${agentData.personality}`);
        console.log(`   🎯 Confidence Threshold: ${(agentData.confidenceThreshold * 100).toFixed(0)}%`);
        console.log(`   ⚖️  Risk Tolerance: ${agentData.riskTolerance}\n`);
        createdCount++;
      }
    }

    console.log('\n🎉 AI Agents initialized successfully!');
    console.log(`   ✨ Created: ${createdCount} new agents`);
    console.log(`   🔄 Updated: ${updatedCount} existing agents\n`);

    // Display agent summary
    console.log('📋 Agent Summary:');
    const allAgents = await db.select().from(aiAgents);
    allAgents.forEach(agent => {
      console.log(`\n   🤖 ${agent.name}`);
      console.log(`      Personality: ${agent.personality}`);
      console.log(`      Risk Tolerance: ${agent.riskTolerance}`);
      console.log(`      Confidence Threshold: ${(agent.confidenceThreshold * 100).toFixed(0)}%`);
      console.log(`      Total Predictions: ${agent.totalPredictions}`);
      console.log(`      Accuracy: ${(agent.accuracyRate * 100).toFixed(1)}%`);
      console.log(`      Status: ${agent.isActive ? '🟢 Active' : '🔴 Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error initializing agents:', error);
    throw error;
  }
}

// Run the script
initializeAgents()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
