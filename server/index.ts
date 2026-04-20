// IMPORTANT: keep this block at the very top of the file. Anything above
// this — including `import` statements — runs BEFORE these handlers, so a
// throw during import resolution would still vanish into empty logs. We
// can't avoid the import block being hoisted above this in TS source, but
// we can at least make sure that the moment ANY of our own code runs, we
// have a flushed boot line, an unhandled-rejection trap, and an uncaught-
// exception trap so deploy logs always show something.
const __bootStartedAt = Date.now();
console.log(
  `[boot] streamaix server starting at ${new Date().toISOString()} ` +
  `(pid=${process.pid}, node=${process.version}, env=${process.env.NODE_ENV ?? 'unknown'})`,
);
process.on('uncaughtException', (err) => {
  console.error('[boot] FATAL uncaughtException:', err);
  // Give the log stream a tick to flush before exiting.
  setTimeout(() => process.exit(1), 50);
});
process.on('unhandledRejection', (reason) => {
  console.error('[boot] FATAL unhandledRejection:', reason);
  setTimeout(() => process.exit(1), 50);
});

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
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

// Voice assistant endpoint accepts base64-encoded audio (~50-500KB), so it
// needs a larger JSON body limit than the rest of the API. Mount this BEFORE
// the global parser so it short-circuits the default 100KB limit for that path.
app.use('/api/assistant/voice', express.json({ limit: '4mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global mutation-body validator: enforces that every POST/PUT/PATCH body is
// a plain JSON object (or empty), rejecting bare arrays/primitives and root-
// level prototype-pollution payloads. Per-route Zod schemas further constrain
// individual fields. See server/middleware/security.ts for skip rules.
import { requireJsonObjectBody } from './middleware/security';
app.use(requireJsonObjectBody);

// Health check endpoints — registered FIRST so they always answer, even
// while route registration is still in flight. Cloud Run only needs the
// container to bind a port and answer 200 on a health probe within its
// first ~60s; everything else can warm up after.
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: routesReady ? 'ok' : 'starting',
    ready: routesReady,
    uptime: process.uptime(),
    bootMs: Date.now() - __bootStartedAt,
    memory: process.memoryUsage().heapUsed,
    timestamp: new Date().toISOString(),
  });
});
app.get('/_health', (_req, res) => {
  res.status(200).send(routesReady ? 'OK' : 'STARTING');
});

// Request logger
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
        const safe: Record<string, any> = {};
        for (const [k, v] of Object.entries(capturedJsonResponse)) {
          if (typeof v === "string" && v.length > 200) {
            safe[k] = `[${v.length} chars]`;
          } else {
            safe[k] = v;
          }
        }
        logLine += ` :: ${JSON.stringify(safe)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Until registerRoutes() resolves, return 503 for any non-health request so
// callers (and Cloud Run probes targeting other paths) get a clear signal
// instead of a hang. This middleware short-circuits with `next()` once
// `routesReady` flips, so the real routes take over without restarting.
let routesReady = false;
app.use((req, res, next) => {
  if (routesReady) return next();
  // Health endpoints already matched above. Any other request hits this
  // before the real routes are mounted.
  res.setHeader('Retry-After', '5');
  res.status(503).json({
    status: 'starting',
    message: 'Server is still warming up. Try again in a few seconds.',
    bootMs: Date.now() - __bootStartedAt,
  });
});

// Bind the port IMMEDIATELY so Cloud Run's health probe sees a live
// container within the first second. Route registration can then take as
// long as it needs without breaking the deploy.
const port = parseInt(process.env.PORT || '5000', 10);
const httpServer = createServer(app);
httpServer.listen({ port, host: '0.0.0.0', reusePort: true }, () => {
  log(`🚀 Server listening on port ${port} (boot ${Date.now() - __bootStartedAt}ms)`);
  console.log(`✅ Port ${port} bound; route registration starting…`);
});

(async () => {
  try {
    console.log('\n🔐 ========== ENVIRONMENT VALIDATION ==========');

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error('❌ CRITICAL: OPENAI_API_KEY is NOT configured!');
      console.error('📍 AI content processing will fail without this key.');
      console.error('🔧 Please set OPENAI_API_KEY in your environment or .env file');
    } else {
      console.log(`✅ OPENAI_API_KEY configured (${openaiKey.length} characters)`);
    }

    const duneKey = process.env.DUNE_API_KEY;
    if (duneKey) {
      console.log(`✅ DUNE_API_KEY configured (${duneKey.length} characters)`);
    } else {
      console.log(`⚠️  DUNE_API_KEY not configured (optional, for advanced analytics)`);
    }

    console.log('========================================\n');

    // registerRoutes attaches the websocket server to httpServer and mounts
    // every domain route. We pass the already-listening httpServer so the
    // websocket upgrade handler binds to the same port.
    await registerRoutes(app, httpServer);

    if (app.get("env") === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      // Log but DO NOT re-throw — re-throwing inside an Express error
      // handler triggers our uncaughtException trap and kills the process,
      // which used to silently nuke the server on any handler-thrown error.
      console.error('[express] error handler caught:', err);
    });

    routesReady = true;
    console.log(
      `✅ Routes registered and ready (total boot ${Date.now() - __bootStartedAt}ms)`,
    );
  } catch (err) {
    console.error('[boot] FATAL during async startup', err);
    // Keep the process alive long enough for Cloud Run to capture the log,
    // then exit so the platform restarts with a clean state.
    setTimeout(() => process.exit(1), 250);
    return;
  }

  // Delay background services in production to ensure server is responsive
  // first. They are non-critical for serving traffic and must never block
  // the deploy from going green.
  const startupDelay = app.get("env") === "production" ? 10000 : 100;
  setTimeout(async () => {
    console.log('🔄 Starting background services...');
    const openaiKey = process.env.OPENAI_API_KEY;
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        console.log('📧 Starting newsletter scheduler...');
        const { newsletterScheduler } = await import('./services/newsletterScheduler');
        newsletterScheduler.start();
        console.log('✅ Newsletter scheduler active - Sends 8am & 4pm EST daily');
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

        const { aiMarketResolver } = await import('./services/aiMarketResolver');
        aiMarketResolver.start();
        console.log('✅ AI Market Resolver active');

        const { aiLiquidityProvider } = await import('./services/aiLiquidityProvider');
        aiLiquidityProvider.start();
        console.log('✅ AI Liquidity Provider active');

        const { aiTrendSpotter } = await import('./services/aiTrendSpotter');
        aiTrendSpotter.start();
        console.log('✅ AI Trend Spotter active');

        const { aiContentModerator } = await import('./services/aiContentModerator');
        aiContentModerator.start();
        console.log('✅ AI Content Moderator active');

        const { aiCommunityManager } = await import('./services/aiCommunityManager');
        aiCommunityManager.start();
        console.log('✅ AI Community Manager active');

        const { aiTreasuryManager } = await import('./services/aiTreasuryManager');
        aiTreasuryManager.start();
        console.log('✅ AI Treasury Manager active');

        const { aiMetaTrader } = await import('./services/aiMetaTrader');
        aiMetaTrader.start();
        console.log('✅ AI Meta-Trader active');

        const { marketIntelligenceNotifier } = await import('./services/marketIntelligenceNotifier');
        marketIntelligenceNotifier.start();
        console.log('✅ Market Intelligence Notifier active');

        const { portfolioSnapshotService } = await import('./services/portfolioSnapshotService');
        portfolioSnapshotService.start();
        console.log('✅ Portfolio Snapshot Service active');

        const { initScheduledMarketStreamService } = await import('./services/scheduledMarketStreamService');
        const scheduledStreamService = initScheduledMarketStreamService();
        await scheduledStreamService.start();
        console.log('✅ Scheduled Market Streams active');

        console.log('🚀 FULL AUTONOMOUS ECOSYSTEM OPERATIONAL\n');
      } else {
        console.log('⚠️  Autonomous ecosystem disabled (requires OPENAI_API_KEY)');
      }

      console.log('🤖 Starting Bot Trading Simulator...');
      const { botTradingSimulator } = await import('./services/botTradingSimulator');
      await botTradingSimulator.start();
      console.log('✅ Bot Trading Simulator active');

      console.log('🌱 Starting background database seeding...');
      autoSeedDatabase().then(() => {
        console.log('✅ Auto-seed completed successfully');
      }).catch(error => {
        console.error('⚠️  Auto-seed encountered an error (non-critical):', error.message);
      });

    } catch (error) {
      // Background-service failures must NEVER take the server down. Log
      // and keep serving traffic.
      console.error('⚠️  Error starting background services (non-fatal):', error);
    }
  }, startupDelay);
})();
