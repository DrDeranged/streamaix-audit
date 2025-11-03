import { db } from '../db';
import { predictionMarkets } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed Liquidity Script
 * Initializes prediction markets with liquidity pools (5000 YES + 5000 NO tokens)
 * This allows AI agents and humans to start trading immediately
 */

const INITIAL_YES_LIQUIDITY = 5000;
const INITIAL_NO_LIQUIDITY = 5000;

async function seedLiquidity() {
  console.log('🌊 Starting liquidity seeding...\n');

  try {
    // Get all active markets
    const markets = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.status, 'active'));

    console.log(`📊 Found ${markets.length} active markets to seed\n`);

    let seededCount = 0;
    let skippedCount = 0;

    for (const market of markets) {
      // Skip if market already has liquidity
      if (market.yesLiquidity > 0 || market.noLiquidity > 0) {
        console.log(`⏭️  Skipping "${market.question.substring(0, 50)}..." - already has liquidity`);
        skippedCount++;
        continue;
      }

      // Add liquidity to market
      await db
        .update(predictionMarkets)
        .set({
          yesLiquidity: INITIAL_YES_LIQUIDITY,
          noLiquidity: INITIAL_NO_LIQUIDITY,
          totalVolume: 0, // Reset volume
          totalTrades: 0  // Reset trades
        })
        .where(eq(predictionMarkets.id, market.id));

      console.log(`✅ Seeded "${market.question.substring(0, 60)}..."`);
      console.log(`   💧 Added ${INITIAL_YES_LIQUIDITY} YES + ${INITIAL_NO_LIQUIDITY} NO tokens`);
      console.log(`   💰 Initial price: 50% YES / 50% NO\n`);
      
      seededCount++;
    }

    console.log('\n🎉 Liquidity seeding complete!');
    console.log(`   ✅ Seeded: ${seededCount} markets`);
    console.log(`   ⏭️  Skipped: ${skippedCount} markets (already had liquidity)`);
    console.log(`   💧 Total liquidity added: ${seededCount * (INITIAL_YES_LIQUIDITY + INITIAL_NO_LIQUIDITY)} tokens\n`);

  } catch (error) {
    console.error('❌ Error seeding liquidity:', error);
    throw error;
  }
}

// Run the script
seedLiquidity()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
