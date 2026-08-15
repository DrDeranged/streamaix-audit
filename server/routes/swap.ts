import type { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { tradeableTokens, insertTradeableTokenSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  swapQuoteService,
  swapsEnabled,
  SwapsDisabledError,
  SwapValidationError,
  SwapRiskError,
  NATIVE_ETH_ADDRESS,
} from "../services/swapQuoteService";
import { requireAdminFlexible, mediumLimit, validateBody } from "../middleware/security";
import { authenticateToken } from "../auth";
import { asyncHandler } from "./_shared";

/**
 * Non-custodial swap rail (Base). Dormant by default: SWAPS_ENABLED=false
 * makes every public route below return 403 — same discipline as the bridge.
 * StreamAiX never holds keys or funds; the user's wallet signs.
 *
 * Admin token-allowlist CRUD lives under /api/admin/swap/tokens and is NOT
 * gated by SWAPS_ENABLED so admins can curate the list before launch; it is
 * guarded by authenticateToken + requireAdminFlexible.
 */

const quoteBodySchema = z.object({
  sellToken: z.string().min(1).max(64),
  buyToken: z.string().min(1).max(64),
  sellAmount: z.string().regex(/^\d+$/),
  takerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  slippageBps: z.number().int().min(1).max(300).optional(),
  overrideHighImpact: z.boolean().optional(),
});

const recordTradeBodySchema = z.object({
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  sellToken: z.string().min(1).max(64),
  buyToken: z.string().min(1).max(64),
  sellAmount: z.string().regex(/^\d+$/),
  buyAmount: z.string().regex(/^\d+$/),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  feeCollected: z.string().optional(),
  quotedPrice: z.string().optional(),
  executedPrice: z.string().optional(),
});

const DEFAULT_BASE_TOKENS = [
  { symbol: "ETH", name: "Ether", address: NATIVE_ETH_ADDRESS, decimals: 18 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "cbBTC", name: "Coinbase Wrapped BTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  { symbol: "AERO", name: "Aerodrome", address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18 },
  { symbol: "DEGEN", name: "Degen", address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", decimals: 18 },
] as const;

/** Idempotent seed: insert the starter allowlist when the table is empty. */
async function ensureDefaultTokens(): Promise<void> {
  try {
    const existing = await db.select().from(tradeableTokens).limit(1);
    if (existing.length > 0) return;
    for (const t of DEFAULT_BASE_TOKENS) {
      await db.insert(tradeableTokens).values({ ...t, enabled: true });
    }
    console.log("[swap] seeded default Base token allowlist");
  } catch (err: any) {
    console.warn("[swap] allowlist seed skipped:", err?.message || err);
  }
}

function gate(res: Response): boolean {
  if (!swapsEnabled()) {
    res.status(403).json({ error: "swaps not yet enabled" });
    return false;
  }
  return true;
}

function handleSwapError(res: Response, err: unknown): void {
  if (err instanceof SwapsDisabledError) {
    res.status(403).json({ error: "swaps not yet enabled" });
  } else if (err instanceof SwapRiskError) {
    res.status(err.requiresConfirmation ? 409 : 403).json({
      error: err.message,
      type: err.type,
      requiresConfirmation: err.requiresConfirmation,
    });
  } else if (err instanceof SwapValidationError) {
    res.status(400).json({ error: err.message });
  } else {
    throw err;
  }
}

export async function registerSwapRoutes(app: Express): Promise<void> {
  await ensureDefaultTokens();

  // --- Public (gated by SWAPS_ENABLED) -----------------------------------
  app.get("/api/swap/tokens", asyncHandler(async (_req: Request, res: Response) => {
    if (!gate(res)) return;
    try {
      const tokens = await swapQuoteService.getAllowedTokens();
      res.json({ tokens });
    } catch (err) {
      handleSwapError(res, err);
    }
  }));

  app.post("/api/swap/quote", mediumLimit, validateBody(quoteBodySchema), asyncHandler(async (req: Request, res: Response) => {
    if (!gate(res)) return;
    try {
      const quote = await swapQuoteService.getQuote(req.body);
      res.json({ quote });
    } catch (err) {
      handleSwapError(res, err);
    }
  }));

  app.post("/api/swap/record", mediumLimit, validateBody(recordTradeBodySchema), asyncHandler(async (req: Request, res: Response) => {
    if (!gate(res)) return;
    try {
      const row = await swapQuoteService.recordTrade(req.body);
      res.json({ trade: row });
    } catch (err: any) {
      if (err?.code === "23505" || /duplicate|unique/i.test(err?.message || "")) {
        res.status(409).json({ error: "trade already recorded" });
        return;
      }
      handleSwapError(res, err);
    }
  }));

  // --- Admin allowlist CRUD (admin-guarded, available while dormant) -----
  app.get("/api/admin/swap/tokens", authenticateToken, requireAdminFlexible, asyncHandler(async (_req: Request, res: Response) => {
    const tokens = await db.select().from(tradeableTokens);
    res.json({ tokens });
  }));

  app.post("/api/admin/swap/tokens", mediumLimit, authenticateToken, requireAdminFlexible, validateBody(insertTradeableTokenSchema), asyncHandler(async (req: Request, res: Response) => {
    const [token] = await db.insert(tradeableTokens).values(req.body).returning();
    res.json({ token });
  }));

  app.patch("/api/admin/swap/tokens/:id", mediumLimit, authenticateToken, requireAdminFlexible, validateBody(insertTradeableTokenSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const [token] = await db
      .update(tradeableTokens)
      .set(req.body)
      .where(eq(tradeableTokens.id, req.params.id))
      .returning();
    if (!token) {
      res.status(404).json({ error: "token not found" });
      return;
    }
    res.json({ token });
  }));

  app.delete("/api/admin/swap/tokens/:id", mediumLimit, authenticateToken, requireAdminFlexible, asyncHandler(async (req: Request, res: Response) => {
    const [token] = await db
      .delete(tradeableTokens)
      .where(eq(tradeableTokens.id, req.params.id))
      .returning();
    if (!token) {
      res.status(404).json({ error: "token not found" });
      return;
    }
    res.json({ token });
  }));
}
