// All "heavy" application setup lives here. This module is dynamically
// imported by server/index.ts AFTER the bootstrap has already bound the
// HTTP port and installed fatal handlers. That decoupling means any throw
// inside this import graph (or any of the ~80 transitive imports of
// ./routes) can no longer kill the process before a port is bound — the
// bootstrap http server keeps answering /_health with 200 / STARTING and
// other paths with 503, so Cloud Run's deploy probe always sees a live
// container.

import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import compression from "compression";
import type { Server as HttpServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { autoSeedDatabase } from "./auto-seed";
import { requireJsonObjectBody } from "./middleware/security";

export interface InitializeAppResult {
  /**
   * The Express app, ready to be used as the http.Server request handler.
   * The bootstrap swaps this in once the promise resolves.
   */
  handler: Express;
}

export async function initializeApp(
  httpServer: HttpServer,
  bootStartedAt: number,
): Promise<InitializeAppResult> {
  const app = express();

  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    }),
  );

  const SERVER_BUILD_TIME = new Date().toISOString();
  const SERVER_VERSION = `v${Date.now()}`;
  app.use((req, res, next) => {
    res.setHeader("X-Server-Version", SERVER_VERSION);
    res.setHeader("X-Server-Build-Time", SERVER_BUILD_TIME);
    res.setHeader("X-Server-Node-Env", process.env.NODE_ENV || "unknown");
    next();
  });

  // Voice assistant accepts base64 audio; needs a larger body limit than the
  // rest of the API. Mount BEFORE the global parser so it short-circuits.
  app.use("/api/assistant/voice", express.json({ limit: "4mb" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(requireJsonObjectBody);

  // /_health and /health are also handled by the bootstrap before the
  // handler is swapped in. We keep them on the Express app too so behaviour
  // stays consistent after handover.
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      ready: true,
      uptime: process.uptime(),
      bootMs: Date.now() - bootStartedAt,
      memory: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString(),
    });
  });
  app.get("/_health", (_req, res) => {
    res.status(200).send("OK");
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
        if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
        log(logLine);
      }
    });

    next();
  });

  // Boot-time env validation (loud, but never throws — boot-killing throws
  // would defeat the whole point of the bootstrap).
  console.log("\n🔐 ========== ENVIRONMENT VALIDATION ==========");
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error("❌ CRITICAL: OPENAI_API_KEY is NOT configured!");
    console.error("📍 AI content processing will fail without this key.");
    console.error("🔧 Please set OPENAI_API_KEY in your environment or .env file");
  } else {
    console.log(`✅ OPENAI_API_KEY configured (${openaiKey.length} characters)`);
  }
  const duneKey = process.env.DUNE_API_KEY;
  if (duneKey) {
    console.log(`✅ DUNE_API_KEY configured (${duneKey.length} characters)`);
  } else {
    console.log(`⚠️  DUNE_API_KEY not configured (optional, for advanced analytics)`);
  }
  console.log("========================================\n");

  // Boot-time on-chain / bridge flag state (loud, never throws).
  try {
    const { logContractServiceBootState } = await import("./services/contractService");
    logContractServiceBootState();
  } catch (e: any) {
    console.error("Failed to log on-chain/bridge flag state:", e?.message);
  }

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
    // Log but DO NOT re-throw — re-throwing inside an Express error handler
    // triggers our uncaughtException trap and would kill the process.
    console.error("[express] error handler caught:", err);
  });

  console.log(
    `✅ Routes registered and ready (total boot ${Date.now() - bootStartedAt}ms)`,
  );

  // Background services kick off after a delay in production so they can't
  // affect the deploy's readiness window. Their failures are non-fatal.
  const startupDelay = app.get("env") === "production" ? 10000 : 100;
  setTimeout(async () => {
    console.log("🔄 Starting background services...");
    const openaiKey = process.env.OPENAI_API_KEY;
    try {
      // Helper: fire-and-forget wrapper for background services. We deliberately
      // do NOT await `starter()` because most background services run an
      // infinite loop inside .start() (e.g. `while (this.isRunning) { ... }`)
      // and never resolve. Awaiting them would block all subsequent services
      // from launching. Instead we kick the promise off, attach a .catch so
      // any synchronous throw or async rejection is logged and swallowed
      // (defence in depth — even a future service that forgets its own
      // try/catch can no longer take the server down), and log activation
      // immediately. The "active" line means "scheduled and running", not
      // "completed".
      const safeStart = (
        label: string,
        starter: () => unknown | Promise<unknown>,
      ): void => {
        try {
          const result = starter();
          Promise.resolve(result).catch((err) => {
            console.error(
              `⚠️  ${label} crashed after start (non-fatal, server continues):`,
              err,
            );
          });
          console.log(`✅ ${label} active`);
        } catch (err) {
          console.error(
            `⚠️  ${label} failed to start (non-fatal, server continues):`,
            err,
          );
        }
      };

      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        console.log("📧 Starting newsletter scheduler...");
        const { newsletterScheduler } = await import(
          "./services/newsletterScheduler"
        );
        safeStart("Newsletter scheduler - Sends 8am & 4pm EST daily", () =>
          newsletterScheduler.start(),
        );
      } else {
        console.log("⚠️  Newsletter scheduler disabled (RESEND_API_KEY not configured)");
      }

      if (openaiKey) {
        console.log("🤖 Starting autonomous AI agent service...");
        const { getAutonomousAgentService } = await import(
          "./services/autonomousAgentService"
        );
        safeStart(
          "Autonomous AI agent service - 100 agents engaging with platform",
          () => getAutonomousAgentService().start(),
        );
      } else {
        console.log("⚠️  Autonomous AI agents disabled (requires OPENAI_API_KEY)");
      }

      if (openaiKey) {
        console.log("💹 Starting AI trading bot service...");
        const { getTradingBotService } = await import(
          "./services/aiTradingBotService"
        );
        safeStart(
          "AI trading bot service - 50 bots analyzing and trading on markets",
          () => getTradingBotService().start(),
        );
      } else {
        console.log("⚠️  AI trading bots disabled (requires OPENAI_API_KEY)");
      }

      if (openaiKey) {
        console.log("\n🌐 ========== AUTONOMOUS ECOSYSTEM STARTUP ==========");

        const { aiMarketResolver } = await import("./services/aiMarketResolver");
        safeStart("AI Market Resolver", () => aiMarketResolver.start());

        const { aiLiquidityProvider } = await import(
          "./services/aiLiquidityProvider"
        );
        safeStart("AI Liquidity Provider", () => aiLiquidityProvider.start());

        const { aiTrendSpotter } = await import("./services/aiTrendSpotter");
        safeStart("AI Trend Spotter", () => aiTrendSpotter.start());

        const { aiContentModerator } = await import(
          "./services/aiContentModerator"
        );
        safeStart("AI Content Moderator", () => aiContentModerator.start());

        const { aiCommunityManager } = await import(
          "./services/aiCommunityManager"
        );
        safeStart("AI Community Manager", () => aiCommunityManager.start());

        const { aiTreasuryManager } = await import(
          "./services/aiTreasuryManager"
        );
        safeStart("AI Treasury Manager", () => aiTreasuryManager.start());

        const { aiMetaTrader } = await import("./services/aiMetaTrader");
        safeStart("AI Meta-Trader", () => aiMetaTrader.start());

        const { marketIntelligenceNotifier } = await import(
          "./services/marketIntelligenceNotifier"
        );
        safeStart("Market Intelligence Notifier", () =>
          marketIntelligenceNotifier.start(),
        );

        const { portfolioSnapshotService } = await import(
          "./services/portfolioSnapshotService"
        );
        safeStart("Portfolio Snapshot Service", () =>
          portfolioSnapshotService.start(),
        );

        const { initScheduledMarketStreamService } = await import(
          "./services/scheduledMarketStreamService"
        );
        const scheduledStreamService = initScheduledMarketStreamService();
        safeStart("Scheduled Market Streams", () =>
          scheduledStreamService.start(),
        );

        console.log("🚀 FULL AUTONOMOUS ECOSYSTEM OPERATIONAL\n");
      } else {
        console.log("⚠️  Autonomous ecosystem disabled (requires OPENAI_API_KEY)");
      }

      console.log("🤖 Starting Bot Trading Simulator...");
      const { botTradingSimulator } = await import(
        "./services/botTradingSimulator"
      );
      safeStart("Bot Trading Simulator", () => botTradingSimulator.start());

      console.log("🌱 Starting background database seeding...");
      autoSeedDatabase()
        .then(() => console.log("✅ Auto-seed completed successfully"))
        .catch((error) =>
          console.error(
            "⚠️  Auto-seed encountered an error (non-critical):",
            error.message,
          ),
        );
    } catch (error) {
      console.error("⚠️  Error starting background services (non-fatal):", error);
    }
  }, startupDelay);

  return { handler: app };
}
