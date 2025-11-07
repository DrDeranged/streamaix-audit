import { db } from '../db';
import { users } from '../../shared/schema';
import { generateAgentPersonas } from '../services/agentPersonaGenerator';

async function initializeAiAgents() {
  console.log('🤖 Starting AI Agent initialization...');
  
  const NUM_AGENTS = 100;
  
  try {
    // Generate 100 unique agent personas
    console.log(`📝 Generating ${NUM_AGENTS} unique AI agent personas...`);
    const personas = generateAgentPersonas(NUM_AGENTS);
    
    console.log(`✅ Generated ${personas.length} personas`);
    console.log(`📊 Sample persona:`, {
      username: personas[0].username,
      bio: personas[0].bio,
      streamPoints: personas[0].streamPoints,
      riskTolerance: personas[0].personality.riskTolerance,
      activityLevel: personas[0].personality.activityLevel,
      expertise: personas[0].personality.expertise,
    });
    
    // Insert agents into database
    console.log(`\n💾 Inserting ${NUM_AGENTS} AI agents into database...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const persona of personas) {
      try {
        await db.insert(users).values({
          username: persona.username,
          bio: persona.bio,
          avatar: persona.avatar,
          isAiAgent: true,
          agentPersonality: persona.personality,
          agentMetadata: persona.metadata,
          streamPoints: persona.streamPoints,
          authProvider: 'ai-agent',
          // Generate a random wallet address for the agent
          walletAddress: `0x${Buffer.from(persona.username).toString('hex').padEnd(40, '0').substring(0, 40)}`,
        });
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`  ✓ Inserted ${successCount}/${NUM_AGENTS} agents...`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`  ✗ Failed to insert ${persona.username}:`, error.message);
      }
    }
    
    console.log(`\n✅ AI Agent initialization complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${errorCount}`);
    
    // Display distribution stats
    console.log(`\n📊 Agent Distribution:`);
    const whales = personas.filter(p => p.streamPoints >= 50000).length;
    const powerUsers = personas.filter(p => p.streamPoints >= 20000 && p.streamPoints < 50000).length;
    const activeUsers = personas.filter(p => p.streamPoints >= 5000 && p.streamPoints < 20000).length;
    const casualUsers = personas.filter(p => p.streamPoints < 5000).length;
    
    console.log(`   🐋 Whales (50k+ points): ${whales}`);
    console.log(`   ⭐ Power Users (20k-50k): ${powerUsers}`);
    console.log(`   👤 Active Users (5k-20k): ${activeUsers}`);
    console.log(`   🆕 Casual Users (<5k): ${casualUsers}`);
    
    // Total STREAM points distributed
    const totalPoints = personas.reduce((sum, p) => sum + p.streamPoints, 0);
    console.log(`\n💰 Total STREAM Points Distributed: ${totalPoints.toLocaleString()}`);
    
    // Personality distribution
    const riskDistribution = personas.reduce((acc, p) => {
      acc[p.personality.riskTolerance] = (acc[p.personality.riskTolerance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n🎯 Risk Tolerance Distribution:`);
    Object.entries(riskDistribution).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} agents`);
    });
    
    const activityDistribution = personas.reduce((acc, p) => {
      acc[p.personality.activityLevel] = (acc[p.personality.activityLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n⚡ Activity Level Distribution:`);
    Object.entries(activityDistribution).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} agents`);
    });
    
    console.log(`\n🎉 All done! The platform is now alive with ${successCount} autonomous AI agents!`);
    
  } catch (error) {
    console.error('❌ Fatal error during initialization:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the initialization
initializeAiAgents();
