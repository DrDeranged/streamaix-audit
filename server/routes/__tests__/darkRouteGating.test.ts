import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import type { Server } from "http";

// Heavy dependencies are mocked so the route modules load offline.
vi.mock("../../db", () => ({
  db: {
    select: () => ({ from: () => ({ limit: async () => [{ id: "x" }], where: () => ({ limit: async () => [{ id: "x" }] }) }) }),
    insert: () => ({ values: async () => undefined }),
  },
}));
vi.mock("../../auth", () => ({
  authenticateToken: (_req: any, _res: any, next: any) => {
    _req.user = { id: "u1", username: "tester" };
    next();
  },
}));
vi.mock("../../services/bridgeService", () => ({
  bridgeService: {},
  bridgeEnabled: () => process.env.BRIDGE_ENABLED === "true",
  BridgeDisabledError: class BridgeDisabledError extends Error {},
}));

import { registerBridgeRoutes } from "../bridge";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  delete process.env.BRIDGE_ENABLED;
  const app = express();
  app.use(express.json());
  await registerBridgeRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server?.close();
});

describe("dark-route gating: flag check runs BEFORE Zod validation", () => {
  it("bridge withdraw with an INVALID body returns 403 (not 400) while BRIDGE_ENABLED is off", async () => {
    const res = await fetch(`${baseUrl}/api/bridge/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nonsense: true }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/not yet enabled/i);
  });

  it("bridge withdraw with a VALID-shaped body still returns 403 while dark", async () => {
    const res = await fetch(`${baseUrl}/api/bridge/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: 100 }),
    });
    expect(res.status).toBe(403);
  });
});
