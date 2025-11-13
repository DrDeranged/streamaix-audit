import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { autoSeedDatabase } from "./auto-seed";

const app = express();

// CRITICAL: Server version middleware - adds headers visible in browser DevTools
const SERVER_BUILD_TIME = new Date().toISOString();
const SERVER_VERSION = `v${Date.now()}`; // Unique build identifier
app.use((req, res, next) => {
  res.setHeader('X-Server-Version', SERVER_VERSION);
  res.setHeader('X-Server-Build-Time', SERVER_BUILD_TIME);
  res.setHeader('X-Server-Node-Env', process.env.NODE_ENV || 'unknown');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  // Validate critical environment variables on startup
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

  // Start background services FIRST (before auto-seed to prevent blocking)
  // This ensures services are running even if seeding takes time or fails
  
  // Start newsletter scheduler for automated sends
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    console.log('📧 Starting newsletter scheduler...');
    const { newsletterScheduler } = await import('./services/newsletterScheduler');
    newsletterScheduler.start();
    console.log('✅ Newsletter scheduler active - Sends Monday & Friday 8am EST');
  } else {
    console.log('⚠️  Newsletter scheduler disabled (RESEND_API_KEY not configured)');
  }

  // Start autonomous AI agent service (100 agents)
  if (openaiKey) {
    console.log('🤖 Starting autonomous AI agent service...');
    const { getAutonomousAgentService } = await import('./services/autonomousAgentService');
    const agentService = getAutonomousAgentService();
    agentService.start(); // Runs continuously with 20-40 min intervals
    console.log('✅ Autonomous AI agent service active - 100 agents engaging with platform');
  } else {
    console.log('⚠️  Autonomous AI agents disabled (requires OPENAI_API_KEY)');
  }

  // Start AI trading bot service (50 trading bots)
  if (openaiKey) {
    console.log('💹 Starting AI trading bot service...');
    const { getTradingBotService } = await import('./services/aiTradingBotService');
    const tradingService = getTradingBotService();
    tradingService.start(); // Runs continuously with 15-30 min intervals
    console.log('✅ AI trading bot service active - 50 bots analyzing and trading on markets');
  } else {
    console.log('⚠️  AI trading bots disabled (requires OPENAI_API_KEY)');
  }

  // Auto-seed database in background (non-blocking)
  // Runs asynchronously so it doesn't delay server startup
  console.log('🌱 Starting background database seeding...');
  autoSeedDatabase().then(() => {
    console.log('✅ Auto-seed completed successfully');
  }).catch(error => {
    console.error('⚠️  Auto-seed encountered an error (non-critical):', error.message);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handler must come LAST, after all routes and static serving
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
