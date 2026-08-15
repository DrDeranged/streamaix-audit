import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock: FIFO queue of select results; inserts recorded ---------------
const dbState: {
  selectResults: any[][];
  inserted: Array<{ table: any; values: any }>;
} = { selectResults: [], inserted: [] };

function makeSelectChain() {
  const chain: any = {};
  const self = () => chain;
  for (const m of ["from", "where", "orderBy", "limit"]) chain[m] = self;
  chain.then = (resolve: any, reject: any) => {
    const next = dbState.selectResults.length ? dbState.selectResults.shift() : [];
    return Promise.resolve(next).then(resolve, reject);
  };
  return chain;
}

vi.mock("../../db", () => ({
  db: {
    select: () => makeSelectChain(),
    insert: (table: any) => ({
      values: (v: any) => {
        dbState.inserted.push({ table, values: v });
        return {
          returning: async () => [{ id: "row-1", createdAt: new Date(), ...v }],
          then: (resolve: any) => Promise.resolve(undefined).then(resolve),
        };
      },
    }),
  },
}));

import {
  SwapQuoteService,
  SwapsDisabledError,
  SwapValidationError,
  SwapRiskError,
  DEFAULT_SLIPPAGE_BPS,
  QUOTE_TTL_MS,
} from "../swapQuoteService";
import { riskEngine } from "../riskEngine";
import { riskEvents, userTrades } from "@shared/schema";

const TAKER = "0x1111111111111111111111111111111111111111";
const TOKENS = [
  { id: "t1", symbol: "ETH", name: "Ether", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18, enabled: true },
  { id: "t2", symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, enabled: true },
  { id: "t3", symbol: "DEGEN", name: "Degen", address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", decimals: 18, enabled: false },
];

function zeroExResponse(overrides: Record<string, any> = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      liquidityAvailable: true,
      buyAmount: "3000000000", // 3000 USDC
      minBuyAmount: "2985000000",
      estimatedPriceImpact: "0.5",
      issues: { allowance: { spender: "0xa11ce00000000000000000000000000000000000" } },
      fees: { integratorFee: { amount: "9000000" } },
      transaction: { to: "0xdef1000000000000000000000000000000000000", data: "0xabc", value: "0", gas: "250000" },
      ...overrides,
    }),
    text: async () => "",
  } as any;
}

let svc: SwapQuoteService;
let fetchMock: ReturnType<typeof vi.fn>;

function quoteParams(overrides: Record<string, any> = {}) {
  return {
    sellToken: "ETH",
    buyToken: "USDC",
    sellAmount: "1000000000000000000",
    takerAddress: TAKER,
    ...overrides,
  };
}

beforeEach(() => {
  dbState.selectResults.length = 0;
  dbState.inserted.length = 0;
  svc = new SwapQuoteService();
  fetchMock = vi.fn(async () => zeroExResponse());
  svc.fetchImpl = fetchMock as any;
  svc.txVerifier = async () => ({ from: TAKER, status: "success" });
  riskEngine.resetSwapVolumeTracker();
  delete process.env.SWAPS_ENABLED;
  process.env.ZEROEX_API_KEY = "test-key";
  process.env.TREASURY_ADDRESS = "0x2222222222222222222222222222222222222222";
  delete process.env.SWAP_FEE_BPS;
  delete process.env.SWAP_DAILY_QUOTE_CAP_USD;
});

describe("SWAPS_ENABLED gating (dormant by default)", () => {
  it("getQuote throws SwapsDisabledError when flag is off", async () => {
    await expect(svc.getQuote(quoteParams())).rejects.toBeInstanceOf(SwapsDisabledError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getAllowedTokens and recordTrade are also gated", async () => {
    await expect(svc.getAllowedTokens()).rejects.toBeInstanceOf(SwapsDisabledError);
    await expect(
      svc.recordTrade({
        walletAddress: TAKER,
        sellToken: "ETH",
        buyToken: "USDC",
        sellAmount: "1",
        buyAmount: "1",
        txHash: "0x" + "1".repeat(64),
      } as any)
    ).rejects.toBeInstanceOf(SwapsDisabledError);
    expect(dbState.inserted.length).toBe(0);
  });
});

describe("getQuote", () => {
  beforeEach(() => {
    process.env.SWAPS_ENABLED = "true";
  });

  it("includes affiliate fee params (default 30 bps) and taker in the 0x request", async () => {
    dbState.selectResults.push(TOKENS, TOKENS);
    await svc.getQuote(quoteParams());
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("swapFeeRecipient=0x2222222222222222222222222222222222222222");
    expect(url).toContain("swapFeeBps=30");
    expect(url).toContain(`taker=${TAKER}`);
    expect(url).toContain("chainId=8453");
    expect(url).toContain(`slippageBps=${DEFAULT_SLIPPAGE_BPS}`);
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["0x-api-key"]).toBe("test-key");
  });

  it("respects SWAP_FEE_BPS from env", async () => {
    process.env.SWAP_FEE_BPS = "45";
    dbState.selectResults.push(TOKENS, TOKENS);
    await svc.getQuote(quoteParams());
    expect(String(fetchMock.mock.calls[0][0])).toContain("swapFeeBps=45");
  });

  it("refuses tokens off the allowlist", async () => {
    dbState.selectResults.push(TOKENS);
    await expect(svc.getQuote(quoteParams({ sellToken: "PEPE" }))).rejects.toThrow(/not tradeable/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses disabled allowlist tokens", async () => {
    dbState.selectResults.push(TOKENS);
    await expect(svc.getQuote(quoteParams({ sellToken: "DEGEN" }))).rejects.toThrow(/not tradeable/i);
  });

  it("rejects slippage above the 3% max", async () => {
    dbState.selectResults.push(TOKENS, TOKENS);
    await expect(svc.getQuote(quoteParams({ slippageBps: 301 }))).rejects.toBeInstanceOf(SwapValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns normalized quote with allowance target, prices and expiry at the validity window", async () => {
    dbState.selectResults.push(TOKENS, TOKENS);
    const before = Date.now();
    const q = await svc.getQuote(quoteParams());
    expect(q.allowanceTarget).toBe("0xa11ce00000000000000000000000000000000000");
    expect(q.buyAmount).toBe("3000000000");
    expect(q.minBuyAmount).toBe("2985000000");
    expect(Number(q.price)).toBeCloseTo(3000, 6);
    expect(Number(q.guaranteedPrice)).toBeCloseTo(2985, 6);
    expect(q.fee.bps).toBe(30);
    expect(q.fee.buyTokenFeeAmount).toBe("9000000");
    expect(q.tx.to).toBe("0xdef1000000000000000000000000000000000000");
    expect(q.expiresAt).toBeGreaterThanOrEqual(before + QUOTE_TTL_MS - 5);
    expect(q.expiresAt).toBeLessThanOrEqual(Date.now() + QUOTE_TTL_MS + 5);
  });

  it("surfaces no-liquidity as a validation error", async () => {
    dbState.selectResults.push(TOKENS, TOKENS);
    fetchMock.mockResolvedValueOnce(zeroExResponse({ liquidityAvailable: false }));
    await expect(svc.getQuote(quoteParams())).rejects.toThrow(/liquidity/i);
  });
});

describe("risk checks", () => {
  beforeEach(() => {
    process.env.SWAPS_ENABLED = "true";
  });

  it("hard-blocks price impact above 8% and logs a risk event", async () => {
    dbState.selectResults.push(TOKENS, TOKENS);
    fetchMock.mockResolvedValueOnce(zeroExResponse({ estimatedPriceImpact: "9.2" }));
    await expect(svc.getQuote(quoteParams())).rejects.toBeInstanceOf(SwapRiskError);
    const events = dbState.inserted.filter((i) => i.table === riskEvents);
    expect(events.length).toBe(1);
    expect(events[0].values.type).toBe("swap_price_impact_block");
  });

  it("requires confirmation between 3-8% impact, allows with override (logged)", async () => {
    dbState.selectResults.push(TOKENS, TOKENS);
    fetchMock.mockResolvedValueOnce(zeroExResponse({ estimatedPriceImpact: "5.0" }));
    const err = await svc.getQuote(quoteParams()).catch((e) => e);
    expect(err).toBeInstanceOf(SwapRiskError);
    expect(err.requiresConfirmation).toBe(true);
    expect(err.type).toBe("swap_price_impact_confirm");

    dbState.selectResults.push(TOKENS, TOKENS);
    fetchMock.mockResolvedValueOnce(zeroExResponse({ estimatedPriceImpact: "5.0" }));
    const q = await svc.getQuote(quoteParams({ overrideHighImpact: true }));
    expect(q.buyAmount).toBe("3000000000");
    const overrides = dbState.inserted.filter(
      (i) => i.table === riskEvents && i.values.type === "swap_price_impact_override"
    );
    expect(overrides.length).toBe(1);
  });

  it("enforces the per-wallet daily quote-volume cap and logs the event", async () => {
    process.env.SWAP_DAILY_QUOTE_CAP_USD = "5000";
    dbState.selectResults.push(TOKENS, TOKENS);
    fetchMock.mockResolvedValueOnce(zeroExResponse({ sellAmountUsd: "4000" }));
    await svc.getQuote(quoteParams()); // uses 4000 of 5000

    dbState.selectResults.push(TOKENS, TOKENS);
    fetchMock.mockResolvedValueOnce(zeroExResponse({ sellAmountUsd: "2000" }));
    const err = await svc.getQuote(quoteParams()).catch((e) => e);
    expect(err).toBeInstanceOf(SwapRiskError);
    expect(err.type).toBe("swap_daily_cap");
    const events = dbState.inserted.filter(
      (i) => i.table === riskEvents && i.values.type === "swap_daily_cap"
    );
    expect(events.length).toBe(1);
  });
});

describe("daily-cap notional fail-safe", () => {
  beforeEach(() => {
    process.env.SWAPS_ENABLED = "true";
  });

  it("derives notional from the USDC leg when 0x omits USD fields", async () => {
    process.env.SWAP_DAILY_QUOTE_CAP_USD = "5000";
    // buyAmount is 3000 USDC and no sellAmountUsd -> counts 3000 toward the cap
    dbState.selectResults.push(TOKENS, TOKENS);
    await svc.getQuote(quoteParams());
    dbState.selectResults.push(TOKENS, TOKENS);
    const err = await svc.getQuote(quoteParams()).catch((e) => e);
    expect(err).toBeInstanceOf(SwapRiskError);
    expect(err.type).toBe("swap_daily_cap");
  });

  it("charges a conservative default when notional is unknown (no USD fields, no USDC leg)", async () => {
    process.env.SWAP_DAILY_QUOTE_CAP_USD = "1500";
    // ETH -> DEGEN-like pair with no USDC leg: enable DEGEN for this test
    const tokensAllEnabled = TOKENS.map((t) => ({ ...t, enabled: true }));
    dbState.selectResults.push(tokensAllEnabled, tokensAllEnabled);
    await svc.getQuote(quoteParams({ buyToken: "DEGEN" })); // charges default 1000
    dbState.selectResults.push(tokensAllEnabled, tokensAllEnabled);
    const err = await svc.getQuote(quoteParams({ buyToken: "DEGEN" })).catch((e) => e);
    expect(err).toBeInstanceOf(SwapRiskError);
    expect(err.type).toBe("swap_daily_cap");
  });
});

describe("recordTrade", () => {
  it("inserts a user_trades row when enabled and tx verifies on-chain", async () => {
    process.env.SWAPS_ENABLED = "true";
    const row = await svc.recordTrade({
      walletAddress: TAKER,
      sellToken: "ETH",
      buyToken: "USDC",
      sellAmount: "1000000000000000000",
      buyAmount: "3000000000",
      txHash: "0x" + "a".repeat(64),
      feeCollected: "9000000",
      quotedPrice: "3000",
      executedPrice: "2999.1",
    } as any);
    expect(row.txHash).toBe("0x" + "a".repeat(64));
    const rows = dbState.inserted.filter((i) => i.table === userTrades);
    expect(rows.length).toBe(1);
  });

  it("rejects when the tx is missing/unconfirmed on Base", async () => {
    process.env.SWAPS_ENABLED = "true";
    svc.txVerifier = async () => null;
    await expect(
      svc.recordTrade({
        walletAddress: TAKER,
        sellToken: "ETH",
        buyToken: "USDC",
        sellAmount: "1",
        buyAmount: "1",
        txHash: "0x" + "b".repeat(64),
      } as any)
    ).rejects.toThrow(/not found or not confirmed/i);
    expect(dbState.inserted.filter((i) => i.table === userTrades).length).toBe(0);
  });

  it("rejects when the tx sender does not match the claimed wallet", async () => {
    process.env.SWAPS_ENABLED = "true";
    svc.txVerifier = async () => ({ from: "0x9999999999999999999999999999999999999999", status: "success" });
    await expect(
      svc.recordTrade({
        walletAddress: TAKER,
        sellToken: "ETH",
        buyToken: "USDC",
        sellAmount: "1",
        buyAmount: "1",
        txHash: "0x" + "c".repeat(64),
      } as any)
    ).rejects.toThrow(/sender does not match/i);
    expect(dbState.inserted.filter((i) => i.table === userTrades).length).toBe(0);
  });
});
