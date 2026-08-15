import { db } from "../db";
import { tradeableTokens, userTrades, type TradeableToken, type InsertUserTrade } from "@shared/schema";
import { eq } from "drizzle-orm";
import { riskEngine, type SwapRiskResult } from "./riskEngine";

/**
 * Swap quote service — wraps the 0x Swap API (Base, chainId 8453) behind our
 * server. StreamAiX never holds keys or funds: this service only quotes; the
 * user's wallet signs and submits.
 *
 * Dormant by default: every call throws SwapsDisabledError unless
 * SWAPS_ENABLED === "true" (same discipline as the bridge).
 *
 * Fee: affiliate fee params are attached to every quote —
 * swapFeeRecipient = TREASURY_ADDRESS, swapFeeBps = SWAP_FEE_BPS (default 30).
 */

export const BASE_CHAIN_ID = 8453;
export const NATIVE_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const ZEROEX_BASE_URL = "https://api.0x.org";
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const MAX_SLIPPAGE_BPS = 300; // 3%
/** Client-side quotes expire at the 0x validity window. */
export const QUOTE_TTL_MS = 30_000;

export function swapsEnabled(): boolean {
  return process.env.SWAPS_ENABLED === "true";
}

export class SwapsDisabledError extends Error {
  constructor() {
    super("swaps not yet enabled");
    this.name = "SwapsDisabledError";
  }
}

export class SwapValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SwapValidationError";
  }
}

export class SwapRiskError extends Error {
  type: string;
  requiresConfirmation: boolean;
  constructor(result: Extract<SwapRiskResult, { allowed: false }>) {
    super(result.reason);
    this.name = "SwapRiskError";
    this.type = result.type;
    this.requiresConfirmation = !!result.requiresConfirmation;
  }
}

function assertSwapsEnabled(): void {
  if (!swapsEnabled()) throw new SwapsDisabledError();
}

export interface GetQuoteParams {
  sellToken: string; // symbol or address (must be on the allowlist)
  buyToken: string;
  sellAmount: string; // base units, stringified integer
  takerAddress: string;
  slippageBps?: number;
  overrideHighImpact?: boolean;
}

export interface SwapQuote {
  sellToken: { symbol: string; address: string; decimals: number };
  buyToken: { symbol: string; address: string; decimals: number };
  sellAmount: string;
  buyAmount: string;
  minBuyAmount: string;
  /** buyAmount / sellAmount, decimal-adjusted. */
  price: string;
  /** minBuyAmount / sellAmount, decimal-adjusted — the guaranteed price. */
  guaranteedPrice: string;
  /** Spender to approve (null when selling native ETH or no allowance needed). */
  allowanceTarget: string | null;
  priceImpactPct: number | null;
  fee: { recipient: string; bps: number; buyTokenFeeAmount: string | null };
  tx: { to: string; data: string; value: string; gas: string | null };
  slippageBps: number;
  /** Epoch ms after which the client must refresh the quote. */
  expiresAt: number;
  liquidityAvailable: boolean;
}

export class SwapQuoteService {
  /** Injectable fetch for tests. */
  fetchImpl: typeof fetch = (...args) => fetch(...args);

  async getAllowedTokens(): Promise<TradeableToken[]> {
    assertSwapsEnabled();
    return db.select().from(tradeableTokens).where(eq(tradeableTokens.enabled, true));
  }

  /** Resolve a symbol-or-address to an enabled allowlisted token, else throw. */
  private async resolveToken(symbolOrAddress: string): Promise<TradeableToken> {
    const rows: TradeableToken[] = await db.select().from(tradeableTokens);
    const needle = symbolOrAddress.trim().toLowerCase();
    const match = rows.find(
      (t) => t.symbol.toLowerCase() === needle || t.address.toLowerCase() === needle
    );
    if (!match || !match.enabled) {
      throw new SwapValidationError(`Token not tradeable: ${symbolOrAddress}`);
    }
    return match;
  }

  async getQuote(params: GetQuoteParams): Promise<SwapQuote> {
    assertSwapsEnabled();

    const apiKey = process.env.ZEROEX_API_KEY;
    if (!apiKey) throw new SwapValidationError("Swap service misconfigured: missing 0x API key");
    const feeRecipient = process.env.TREASURY_ADDRESS;
    if (!feeRecipient) throw new SwapValidationError("Swap service misconfigured: missing treasury address");
    const feeBps = clampInt(process.env.SWAP_FEE_BPS, 30, 0, 1000);

    // Allowlist enforcement
    const sellToken = await this.resolveToken(params.sellToken);
    const buyToken = await this.resolveToken(params.buyToken);
    if (sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
      throw new SwapValidationError("sellToken and buyToken must differ");
    }
    if (!/^\d+$/.test(params.sellAmount) || BigInt(params.sellAmount) <= BigInt(0)) {
      throw new SwapValidationError("sellAmount must be a positive integer in base units");
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(params.takerAddress)) {
      throw new SwapValidationError("takerAddress must be a valid address");
    }

    // Slippage: default 0.5%, max 3%
    const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS;
    if (!Number.isInteger(slippageBps) || slippageBps < 1 || slippageBps > MAX_SLIPPAGE_BPS) {
      throw new SwapValidationError(`slippageBps must be an integer between 1 and ${MAX_SLIPPAGE_BPS}`);
    }

    // 0x Swap API v2 (AllowanceHolder: approve-then-swap; Permit2 routes are
    // surfaced by 0x through the same allowance spender where supported).
    const qs = new URLSearchParams({
      chainId: String(BASE_CHAIN_ID),
      sellToken: sellToken.address,
      buyToken: buyToken.address,
      sellAmount: params.sellAmount,
      taker: params.takerAddress,
      slippageBps: String(slippageBps),
      swapFeeRecipient: feeRecipient,
      swapFeeBps: String(feeBps),
      swapFeeToken: buyToken.address,
    });
    const res = await this.fetchImpl(`${ZEROEX_BASE_URL}/swap/allowance-holder/quote?${qs}`, {
      headers: { "0x-api-key": apiKey, "0x-version": "v2" },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new SwapValidationError(`0x quote failed (${res.status}): ${body.slice(0, 300)}`);
    }
    const quote: any = await res.json();
    if (quote.liquidityAvailable === false) {
      throw new SwapValidationError("No liquidity available for this pair/size");
    }

    const buyAmount: string = String(quote.buyAmount);
    const minBuyAmount: string = String(quote.minBuyAmount ?? quote.buyAmount);
    const priceImpactPct = parsePriceImpact(quote);

    // Risk checks (daily volume soft cap + price impact rules)
    const notionalUsd = parseNotionalUsd(quote, sellToken, params.sellAmount);
    const risk = await riskEngine.checkSwap({
      wallet: params.takerAddress,
      notionalUsd,
      priceImpactPct,
      overrideHighImpact: params.overrideHighImpact,
    });
    if (!risk.allowed) throw new SwapRiskError(risk);

    const price = ratio(buyAmount, buyToken.decimals, params.sellAmount, sellToken.decimals);
    const guaranteedPrice = ratio(minBuyAmount, buyToken.decimals, params.sellAmount, sellToken.decimals);

    const allowanceTarget: string | null =
      quote.issues?.allowance?.spender ?? quote.allowanceTarget ?? null;

    return {
      sellToken: pickToken(sellToken),
      buyToken: pickToken(buyToken),
      sellAmount: params.sellAmount,
      buyAmount,
      minBuyAmount,
      price,
      guaranteedPrice,
      allowanceTarget,
      priceImpactPct,
      fee: {
        recipient: feeRecipient,
        bps: feeBps,
        buyTokenFeeAmount: quote.fees?.integratorFee?.amount ?? null,
      },
      tx: {
        to: quote.transaction?.to ?? "",
        data: quote.transaction?.data ?? "",
        value: quote.transaction?.value ?? "0",
        gas: quote.transaction?.gas ?? null,
      },
      slippageBps,
      expiresAt: Date.now() + QUOTE_TTL_MS,
      liquidityAvailable: quote.liquidityAvailable !== false,
    };
  }

  /** Record a confirmed on-chain swap the user's wallet executed. */
  async recordTrade(trade: InsertUserTrade) {
    assertSwapsEnabled();
    const [row] = await db.insert(userTrades).values(trade).returning();
    return row;
  }
}

function pickToken(t: TradeableToken) {
  return { symbol: t.symbol, address: t.address, decimals: t.decimals };
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = parseInt(raw || "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function parsePriceImpact(quote: any): number | null {
  const raw = quote.estimatedPriceImpact ?? quote.priceImpact ?? null;
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Best-effort USD notional from the 0x response (null when unavailable). */
function parseNotionalUsd(quote: any, sellToken: TradeableToken, sellAmount: string): number | null {
  const raw = quote.sellAmountUsd ?? quote.estimatedSellAmountUsd ?? null;
  if (raw !== null && raw !== undefined) {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Decimal-adjusted a/b as a fixed string. */
function ratio(a: string, aDecimals: number, b: string, bDecimals: number): string {
  const pow10 = (n: number) => BigInt("1" + "0".repeat(n));
  const scale = pow10(18);
  const num = BigInt(a) * scale * pow10(bDecimals);
  const den = BigInt(b) * pow10(aDecimals);
  if (den === BigInt(0)) return "0";
  const q = num / den;
  const whole = q / scale;
  const frac = (q % scale).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

export const swapQuoteService = new SwapQuoteService();
