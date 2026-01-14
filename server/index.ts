import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { autoSeedDatabase } from "./auto-seed";

const app = express();

// Enable GZIP compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

const SERVER_BUILD_TIME = new Date().toISOString();
const SERVER_VERSION = `v${Date.now()}`;
app.use((req, res, next) => {
  res.setHeader('X-Server-Version', SERVER_VERSION);
  res.setHeader('X-Server-Build-Time', SERVER_BUILD_TIME);
  res.setHeader('X-Server-Node-Env', process.env.NODE_ENV || 'unknown');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint - responds immediately, no dependencies
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
  });
});

// Root health check for Cloud Run
app.get('/_health', (_req, res) => {
  res.status(200).send('OK');
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log('\n🔐 ========== ENVIRONMENT VALIDATION ==========');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error('❌ CRITICAL: OPENAI_API_KEY is NOT configured!');
    console.error('📍 AI content processing will fail without this key.');
    console.error('🔧 Please set OPENAI_API_KEY in your environment or .env file');
  } else {
    console.log(`✅ OPENAI_API_KEY configured (${openaiKey.length} characters)`);
    console.log(`🔑 Key preview: ${openaiKey.substring(0, 10)}...${openaiKey.substring(openaiKey.length - 4)}`);
  }
  
  const duneKey = process.env.DUNE_API_KEY;
  if (duneKey) {
    console.log(`✅ DUNE_API_KEY configured (${duneKey.length} characters)`);
  } else {
    console.log(`⚠️  DUNE_API_KEY not configured (optional, for advanced analytics)`);
  }
  
  console.log('========================================\n');
  
  const server = await registerRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server listening on port ${port}`);
    console.log(`✅ Server ready to accept requests on port ${port}`);
  });

  // Delay background services in production to ensure server starts first
  const startupDelay = app.get("env") === "production" ? 10000 : 100;
  setTimeout(async () => {
    console.log('🔄 Starting background services...');
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        console.log('📧 Starting newsletter scheduler...');
        const { newsletterScheduler } = await import('./services/newsletterScheduler');
        newsletterScheduler.start();
        console.log('✅ Newsletter scheduler active - Sends Monday & Friday 8am EST');
      } else {
        console.log('⚠️  Newsletter scheduler disabled (RESEND_API_KEY not configured)');
      }

      if (openaiKey) {
        console.log('🤖 Starting autonomous AI agent service...');
        const { getAutonomousAgentService } = await import('./services/autonomousAgentService');
        const agentService = getAutonomousAgentService();
        agentService.start();
        console.log('✅ Autonomous AI agent service active - 100 agents engaging with platform');
      } else {
        console.log('⚠️  Autonomous AI agents disabled (requires OPENAI_API_KEY)');
      }

      if (openaiKey) {
        console.log('💹 Starting AI trading bot service...');
        const { getTradingBotService } = await import('./services/aiTradingBotService');
        const tradingService = getTradingBotService();
        tradingService.start();
        console.log('✅ AI trading bot service active - 50 bots analyzing and trading on markets');
      } else {
        console.log('⚠️  AI trading bots disabled (requires OPENAI_API_KEY)');
      }

      if (openaiKey) {
        console.log('\n🌐 ========== AUTONOMOUS ECOSYSTEM STARTUP ==========');
        
        console.log('🎯 Starting AI Market Resolver...');
        const { aiMarketResolver } = await import('./services/aiMarketResolver');
        aiMarketResolver.start();
        console.log('✅ AI Market Resolver active - auto-resolving expired markets');

        console.log('💧 Starting AI Liquidity Provider...');
        const { aiLiquidityProvider } = await import('./services/aiLiquidityProvider');
        aiLiquidityProvider.start();
        console.log('✅ AI Liquidity Provider active - seeding markets with liquidity');

        console.log('🔍 Starting AI Trend Spotter...');
        const { aiTrendSpotter } = await import('./services/aiTrendSpotter');
        aiTrendSpotter.start();
        console.log('✅ AI Trend Spotter active - creating markets from crypto trends');

        console.log('🛡️ Starting AI Content Moderator...');
        const { aiContentModerator } = await import('./services/aiContentModerator');
        aiContentModerator.start();
        console.log('✅ AI Content Moderator active - auto-scoring submissions');

        console.log('👥 Starting AI Community Manager...');
        const { aiCommunityManager } = await import('./services/aiCommunityManager');
        aiCommunityManager.start();
        console.log('✅ AI Community Manager active - engaging with community');

        console.log('💰 Starting AI Treasury Manager...');
        const { aiTreasuryManager } = await import('./services/aiTreasuryManager');
        aiTreasuryManager.start();
        console.log('✅ AI Treasury Manager active - managing platform treasury');

        console.log('🎯 Starting AI Meta-Trader...');
        const { aiMetaTrader } = await import('./services/aiMetaTrader');
        aiMetaTrader.start();
        console.log('✅ AI Meta-Trader active - exploiting market inefficiencies');

        console.log('📡 Starting Market Intelligence Notifier...');
        const { marketIntelligenceNotifier } = await import('./services/marketIntelligenceNotifier');
        marketIntelligenceNotifier.start();
        console.log('✅ Market Intelligence Notifier active - real-time market alerts');

        console.log('📸 Starting Portfolio Snapshot Service...');
        const { portfolioSnapshotService } = await import('./services/portfolioSnapshotService');
        portfolioSnapshotService.start();
        console.log('✅ Portfolio Snapshot Service active - capturing every 6 hours');

        console.log('📅 Starting Scheduled Market Stream Service...');
        const { initScheduledMarketStreamService } = await import('./services/scheduledMarketStreamService');
        const scheduledStreamService = initScheduledMarketStreamService();
        await scheduledStreamService.start();
        console.log('✅ Scheduled Market Streams active - 8am & 4pm EST daily');

        console.log('========================================');
        console.log('🚀 FULL AUTONOMOUS ECOSYSTEM OPERATIONAL');
        console.log('   • 100 AI Social Agents (bounties, summaries, social)');
        console.log('   • 50 AI Trading Bots (prediction markets)');
        console.log('   • Market Resolver (auto-resolve expired markets)');
        console.log('   • Liquidity Provider (seed new markets)');
        console.log('   • Trend Spotter (create markets from trends)');
        console.log('   • Content Moderator (auto-score quality)');
        console.log('   • Community Manager (answer questions)');
        console.log('   • Treasury Manager (manage platform fees)');
        console.log('   • Meta-Trader (arbitrage & efficiency)');
        console.log('   • Newsletter (Mon/Fri 8am EST)');
        console.log('   • Market Intelligence (real-time alerts)');
        console.log('   • Scheduled Streams (8am & 4pm EST)');
        console.log('========================================\n');
      } else {
        console.log('⚠️  Autonomous ecosystem disabled (requires OPENAI_API_KEY)');
      }

      console.log('🌱 Starting background database seeding...');
      autoSeedDatabase().then(() => {
        console.log('✅ Auto-seed completed successfully');
      }).catch(error => {
        console.error('⚠️  Auto-seed encountered an error (non-critical):', error.message);
      });

    } catch (error) {
      console.error('⚠️  Error starting background services:', error);
    }
  }, startupDelay);
})();
