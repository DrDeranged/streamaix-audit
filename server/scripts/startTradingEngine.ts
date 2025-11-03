import { autonomousTradingEngine } from '../services/autonomousTradingEngine';

/**
 * Start the autonomous trading engine
 * Usage: tsx server/scripts/startTradingEngine.ts [intervalMinutes]
 */

async function startEngine() {
  try {
    const intervalMinutes = parseInt(process.argv[2]) || 1; // Default: 1 minute for testing
    
    console.log('🚀 Starting Autonomous Trading Engine...\n');
    console.log(`⏰ Trading interval: ${intervalMinutes} minute(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    autonomousTradingEngine.start(intervalMinutes);
    
    console.log('\n✅ Trading engine started successfully!');
    console.log('📊 AI agents will analyze and trade on active prediction markets');
    console.log('\n💡 Press Ctrl+C to stop the engine\n');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping trading engine...');
      autonomousTradingEngine.stop();
      console.log('✅ Engine stopped gracefully');
      process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
      const status = autonomousTradingEngine.getStatus();
      if (!status.isRunning) {
        console.log('⚠️  Engine stopped unexpectedly');
        process.exit(1);
      }
    }, 60000); // Check every minute
    
  } catch (error) {
    console.error('❌ Failed to start trading engine:', error);
    process.exit(1);
  }
}

startEngine();
