import { db } from "../db";
import { aiTrades } from "../../shared/schema";
import { sql } from "drizzle-orm";

async function migrateProbabilities() {
  console.log("🔄 Starting migration: Extracting confidence scores from trade reasoning...");
  
  try {
    // Get all trades that don't have probability set
    const trades = await db
      .select()
      .from(aiTrades)
      .where(sql`${aiTrades.probability} IS NULL`);
    
    console.log(`📊 Found ${trades.length} trades to update`);
    
    let updated = 0;
    let failed = 0;
    
    for (const trade of trades) {
      try {
        // Extract confidence from reasoning text
        // Format: "(Confidence: 65.0%)" or "(Confidence: 70%)"
        const reasoning = trade.reasoning || "";
        const confidenceMatch = reasoning.match(/\(Confidence:\s*(\d+(?:\.\d+)?)\s*%\)/i);
        
        if (confidenceMatch) {
          const probability = parseFloat(confidenceMatch[1]);
          
          await db
            .update(aiTrades)
            .set({ probability })
            .where(sql`${aiTrades.id} = ${trade.id}`);
          
          updated++;
          console.log(`✅ Updated trade ${trade.id}: ${probability}% confidence`);
        } else {
          console.log(`⚠️  No confidence found in trade ${trade.id}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Failed to update trade ${trade.id}:`, error);
        failed++;
      }
    }
    
    console.log("\n📈 Migration Summary:");
    console.log(`   ✅ Updated: ${updated} trades`);
    console.log(`   ⚠️  Skipped: ${failed} trades`);
    console.log(`   📊 Total: ${trades.length} trades processed`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateProbabilities();
