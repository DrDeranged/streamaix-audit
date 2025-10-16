import { aiPredictionBackfillService } from '../services/aiPredictionBackfillService';

async function main() {
  try {
    console.log('🚀 Starting AI prediction backfill script...');
    const result = await aiPredictionBackfillService.backfillAllMarkets();
    
    console.log('\n📊 Backfill Results:');
    console.log(`   Total markets: ${result.total}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Failed: ${result.failed}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backfill script failed:', error);
    process.exit(1);
  }
}

main();
