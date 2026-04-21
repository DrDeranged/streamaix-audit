// =====================================================================
// MINIMAL BOOTSTRAP — DO NOT ADD HEAVY IMPORTS HERE.
//
// This file is the production entry point. Its single job is to:
//   1. write a boot line to stderr SYNCHRONOUSLY so deploy logs always
//      show that the container started
//   2. install fatal handlers for uncaughtException / unhandledRejection
//   3. open a TCP port immediately so Cloud Run's deploy probe sees a
//      live container within the first few hundred ms
//   4. answer /_health and /health with 200 (and any other path with
//      503 + Retry-After) until the real app finishes loading
//   5. ONLY THEN dynamically import the real Express app from ./app
//
// The dynamic import is what makes this bootstrap robust: any throw or
// hang inside the ~80-module import graph rooted at ./routes can no
// longer kill the process before a port is bound. The bootstrap stays
// alive and keeps answering health probes, while the FATAL log line
// makes the underlying problem visible in the deploy logs instead of
// silently disappearing.
//
// Adding a static `import` from ./app, ./routes, or any heavy module
// here would defeat that guarantee, because ES module evaluation
// resolves all imports BEFORE running this file's top-level code.
// =====================================================================

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const __bootStartedAt = Date.now();

// Synchronous stderr write — survives even if the process is killed
// before a normal `console.log` flush would happen.
process.stderr.write(
  `[boot] streamaix bootstrap at ${new Date().toISOString()} ` +
    `(pid=${process.pid}, node=${process.version}, env=${process.env.NODE_ENV ?? "unknown"})\n`,
);

// Fatal-vs-warn policy:
//   - BEFORE the app is ready (i.e. during the bootstrap window), any
//     uncaughtException / unhandledRejection is treated as FATAL and we
//     exit(1). This preserves the safety net from #36: a silent boot crash
//     must never disappear into empty logs.
//   - AFTER the app is ready, the same kinds of errors are demoted to a
//     loud WARN. Transient external-API blips (Neon socket hang-ups,
//     OpenAI timeouts, etc.) are normal in steady-state production and
//     must NOT take the server down — that was the cause of the
//     "Internal Server Error" the user saw on streamaix.com. The error is
//     still logged loudly with the full stack so the underlying issue
//     remains diagnosable.
let appReady = false;

process.on("uncaughtException", (err: unknown) => {
  const stack = (err as Error)?.stack ?? String(err);
  if (!appReady) {
    process.stderr.write(`[boot] FATAL uncaughtException: ${stack}\n`);
    // Give the log stream a tick to flush before exiting.
    setTimeout(() => process.exit(1), 50);
    return;
  }
  process.stderr.write(`[boot] WARN post-boot uncaughtException (non-fatal): ${stack}\n`);
});

process.on("unhandledRejection", (reason: unknown) => {
  const stack = (reason as Error)?.stack ?? String(reason);
  if (!appReady) {
    process.stderr.write(`[boot] FATAL unhandledRejection: ${stack}\n`);
    setTimeout(() => process.exit(1), 50);
    return;
  }
  process.stderr.write(`[boot] WARN post-boot unhandledRejection (non-fatal): ${stack}\n`);
});

let realHandler:
  | ((req: IncomingMessage, res: ServerResponse) => void)
  | null = null;

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function bootstrapHandler(req: IncomingMessage, res: ServerResponse): void {
  const url = (req.url || "/").split("?")[0];

  if (url === "/_health") {
    res.statusCode = 200;
    res.setHeader("content-type", "text/plain");
    res.end(appReady ? "OK" : "STARTING");
    return;
  }

  if (url === "/health") {
    writeJson(res, 200, {
      status: appReady ? "ok" : "starting",
      ready: appReady,
      uptime: process.uptime(),
      bootMs: Date.now() - __bootStartedAt,
      memory: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Anything else during the warmup window gets a clear 503 + Retry-After
  // so callers don't hang.
  res.setHeader("Retry-After", "5");
  writeJson(res, 503, {
    status: "starting",
    message: "Server is still warming up. Try again in a few seconds.",
    bootMs: Date.now() - __bootStartedAt,
  });
}

const httpServer = createServer((req, res) => {
  if (realHandler) return realHandler(req, res);
  return bootstrapHandler(req, res);
});

const PORT = parseInt(process.env.PORT || "5000", 10);
httpServer.listen({ port: PORT, host: "0.0.0.0", reusePort: true }, () => {
  process.stderr.write(
    `[boot] port ${PORT} bound at boot+${Date.now() - __bootStartedAt}ms\n`,
  );

  // Dynamically import the heavy app code AFTER the port is bound.
  // A throw anywhere in this import graph now leaves the bootstrap
  // server alive and answering 503 / health, instead of killing the
  // process silently before any port is open.
  import("./app")
    .then(async ({ initializeApp }) => {
      const { handler } = await initializeApp(httpServer, __bootStartedAt);
      realHandler = handler as unknown as (
        req: IncomingMessage,
        res: ServerResponse,
      ) => void;
      appReady = true;
      process.stderr.write(
        `[boot] app ready at boot+${Date.now() - __bootStartedAt}ms\n`,
      );
    })
    .catch((err: unknown) => {
      const stack = (err as Error)?.stack ?? String(err);
      process.stderr.write(`[boot] FATAL during dynamic app import: ${stack}\n`);
      // Keep the bootstrap server alive briefly so the platform's log
      // collector sees the FATAL line and any pending /_health probe
      // gets a 200/STARTING (which is more diagnostic than a dead
      // socket), then exit so the platform can restart cleanly.
      setTimeout(() => process.exit(1), 250);
    });
});
