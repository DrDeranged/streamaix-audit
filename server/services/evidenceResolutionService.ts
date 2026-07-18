import { db } from "../db";
import { predictionMarkets, marketResolutionsAudit, users } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { modelGateway } from "../lib/modelGateway";

/**
 * Evidence Resolution Service
 *
 * Replaces bare-LLM market resolution with an evidence-gathering pipeline:
 * 1. Gather concrete evidence (prices, headlines, macro data) with provenance.
 * 2. Ask the model gateway (tier 'reasoning') to resolve, forcing it to cite
 *    the evidence items that justify the outcome.
 * 3. Auto-resolve ONLY when confident, cited, and resolvable. Otherwise the
 *    market escalates to 'pending_review' and admins are notified.
 *
 * EVERY resolution or escalation assessment writes a market_resolutions_audit row.
 */

export interface EvidenceItem {
  source: string;
  fetchedAt: string;
  claim: string;
  rawValue: unknown;
}

export interface EvidenceAssessment {
  resolution: "YES" | "NO" | "UNRESOLVABLE";
  confidence: number;
  citedEvidence: number[];
  reasoning: string;
}

export type ResolveWithEvidenceResult =
  | { action: "resolved"; assessment: EvidenceAssessment; evidence: EvidenceItem[] }
  | { action: "escalated"; assessment: EvidenceAssessment; evidence: EvidenceItem[]; escalationReason: string };

const CRYPTO_KEYWORDS: Record<string, string> = {
  bitcoin: "BTC", btc: "BTC",
  ethereum: "ETH", eth: "ETH",
  solana: "SOL", sol: "SOL",
  cardano: "ADA", ada: "ADA",
  polkadot: "DOT", dot: "DOT",
  chainlink: "LINK", link: "LINK",
  avalanche: "AVAX", avax: "AVAX",
  polygon: "MATIC", matic: "MATIC",
  uniswap: "UNI", uni: "UNI",
  aave: "AAVE",
  toncoin: "TON", ton: "TON",
  dogecoin: "DOGE", doge: "DOGE",
  ripple: "XRP", xrp: "XRP",
  litecoin: "LTC", ltc: "LTC",
  monero: "XMR", xmr: "XMR",
  zcash: "ZEC", zec: "ZEC",
  filecoin: "FIL", fil: "FIL",
  tron: "TRX", trx: "TRX",
};

const MACRO_KEYWORDS = [
  "fed", "federal reserve", "interest rate", "rate cut", "rate hike", "inflation",
  "cpi", "treasury", "yield", "s&p", "sp500", "nasdaq", "dow", "recession", "gdp",
];

function getThreshold(): number {
  const raw = Number(process.env.RESOLUTION_CONFIDENCE_THRESHOLD);
  return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : 0.85;
}

export class EvidenceResolutionService {
  /**
   * Resolve a market with evidence, or escalate it to admin review.
   * Performs all DB side effects (settlement via resolutionService on success,
   * status change + admin notification on escalation, audit row always).
   */
  async resolveWithEvidence(market: {
    id: string;
    question: string;
    description?: string | null;
    category: string;
    ticker?: string | null;
    deadline: Date | string;
  }): Promise<ResolveWithEvidenceResult> {
    const evidence = await this.gatherEvidence(market);
    const assessment = await this.assessWithModel(market, evidence);

    const threshold = getThreshold();
    const validCitations = assessment.citedEvidence.filter(
      (i) => Number.isInteger(i) && i >= 0 && i < evidence.length
    );

    const confident = assessment.confidence >= threshold;
    const cited = validCitations.length > 0;
    const resolvable = assessment.resolution !== "UNRESOLVABLE";

    if (confident && cited && resolvable) {
      const resolution = assessment.resolution.toLowerCase() as "yes" | "no";
      const { resolutionService } = await import("./resolutionService");
      await resolutionService.resolveMarket(
        market.id,
        resolution,
        undefined,
        "ai_evidence_pipeline",
        {
          reasoning: assessment.reasoning,
          confidence: assessment.confidence,
          citedEvidence: validCitations,
          evidence,
        },
        undefined,
        {
          resolvedBy: "ai",
          autoResolved: true,
          confidence: assessment.confidence,
          evidence: { items: evidence, citedEvidence: validCitations },
          reasoning: assessment.reasoning,
        }
      );
      return { action: "resolved", assessment: { ...assessment, citedEvidence: validCitations }, evidence };
    }

    const escalationReason = !resolvable
      ? "Model judged the market unresolvable"
      : !cited
        ? "Model cited no supporting evidence"
        : `Confidence ${assessment.confidence.toFixed(2)} below threshold ${threshold}`;

    await this.escalateToReview(market, assessment, evidence, validCitations, escalationReason);
    return { action: "escalated", assessment: { ...assessment, citedEvidence: validCitations }, evidence, escalationReason };
  }

  /** Gather evidence items with provenance. Every fetch is best-effort. */
  async gatherEvidence(market: {
    question: string;
    description?: string | null;
    category: string;
    ticker?: string | null;
  }): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = [];
    const text = `${market.question} ${market.description || ""}`.toLowerCase();

    // --- Price evidence (current + recent history) for crypto markets ---
    const symbol = this.detectCryptoSymbol(text, market.ticker);
    if (symbol) {
      try {
        const { marketDataService } = await import("./marketDataService");
        const quotes = await marketDataService.getCryptoQuotes([symbol]);
        const q = quotes?.[0];
        if (q && typeof q.price === "number" && q.price > 0) {
          const fetchedAt = new Date().toISOString();
          evidence.push({
            source: "marketDataService.getCryptoQuotes",
            fetchedAt,
            claim: `${q.symbol} current price is $${q.price}`,
            rawValue: { symbol: q.symbol, price: q.price, marketCap: q.marketCap },
          });
          evidence.push({
            source: "marketDataService.getCryptoQuotes",
            fetchedAt,
            claim: `${q.symbol} historical change: ${q.percentChange24h?.toFixed(2)}% (24h), ${q.percentChange7d?.toFixed(2)}% (7d), ${q.percentChange30d?.toFixed(2)}% (30d)`,
            rawValue: {
              percentChange24h: q.percentChange24h,
              percentChange7d: q.percentChange7d,
              percentChange30d: q.percentChange30d,
            },
          });
        }
      } catch (err: any) {
        console.warn(`[EvidenceResolution] price fetch failed for ${symbol}:`, err.message);
      }
    }

    // --- News headlines relevant to the question ---
    try {
      const { newsService } = await import("./newsService");
      const articles = await newsService.getCryptoNews(20);
      const keywords = this.significantWords(market.question);
      const relevant = (articles || [])
        .filter((a: any) => {
          const t = `${a.title} ${a.summary || ""}`.toLowerCase();
          return keywords.some((k) => t.includes(k));
        })
        .slice(0, 5);
      for (const a of relevant) {
        evidence.push({
          source: `newsService (${a.source})`,
          fetchedAt: new Date().toISOString(),
          claim: `Headline: "${a.title}" (published ${a.published})`,
          rawValue: { title: a.title, url: a.url, published: a.published, summary: a.summary },
        });
      }
    } catch (err: any) {
      console.warn("[EvidenceResolution] news fetch failed:", err.message);
    }

    // --- Macro data when applicable ---
    const isMacro = market.category === "macro" || MACRO_KEYWORDS.some((k) => text.includes(k));
    if (isMacro) {
      try {
        const { macroDataService } = await import("./macroDataService");
        const [yields, fearGreed] = await Promise.all([
          macroDataService.getTreasuryYields().catch(() => null),
          macroDataService.getFearGreedIndex().catch(() => null),
        ]);
        const fetchedAt = new Date().toISOString();
        if (yields) {
          evidence.push({
            source: "macroDataService.getTreasuryYields",
            fetchedAt,
            claim: `US Treasury yields: ${JSON.stringify(yields)}`,
            rawValue: yields,
          });
        }
        if (fearGreed) {
          evidence.push({
            source: "macroDataService.getFearGreedIndex",
            fetchedAt,
            claim: `Crypto Fear & Greed Index: ${(fearGreed as any).value} (${(fearGreed as any).classification})`,
            rawValue: fearGreed,
          });
        }
      } catch (err: any) {
        console.warn("[EvidenceResolution] macro fetch failed:", err.message);
      }
    }

    return evidence;
  }

  /** Ask the model gateway to resolve using the evidence list. */
  private async assessWithModel(
    market: { question: string; description?: string | null; deadline: Date | string },
    evidence: EvidenceItem[]
  ): Promise<EvidenceAssessment> {
    const evidenceList = evidence
      .map((e, i) => `[${i}] (${e.source}, fetched ${e.fetchedAt}) ${e.claim}`)
      .join("\n");

    const result = await modelGateway.completeJson<EvidenceAssessment>({
      tier: "reasoning",
      system:
        "You resolve binary prediction markets strictly from the numbered evidence provided. " +
        "You must cite the evidence item indices that justify your outcome in citedEvidence. " +
        "If the evidence is insufficient, contradictory, or the question is ambiguous, return " +
        "UNRESOLVABLE with an empty citedEvidence list. Never guess. Be conservative with confidence.",
      user:
        `Market question: "${market.question}"\n` +
        `Resolution criteria / description: ${market.description || "N/A"}\n` +
        `Deadline: ${market.deadline}\n\n` +
        `Evidence (cite by index):\n${evidenceList || "(no evidence could be gathered)"}`,
      temperature: 0.1,
      jsonSchema: {
        name: "market_resolution",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["resolution", "confidence", "citedEvidence", "reasoning"],
          properties: {
            resolution: { type: "string", enum: ["YES", "NO", "UNRESOLVABLE"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            citedEvidence: { type: "array", items: { type: "integer" } },
            reasoning: { type: "string" },
          },
        },
      },
    });

    return {
      resolution: result.resolution,
      confidence: typeof result.confidence === "number" ? result.confidence : 0,
      citedEvidence: Array.isArray(result.citedEvidence) ? result.citedEvidence : [],
      reasoning: result.reasoning || "",
    };
  }

  /** Mark market pending_review, write the assessment audit row, notify admins. */
  private async escalateToReview(
    market: { id: string; question: string },
    assessment: EvidenceAssessment,
    evidence: EvidenceItem[],
    validCitations: number[],
    escalationReason: string
  ): Promise<void> {
    await db
      .update(predictionMarkets)
      .set({ status: "pending_review", updatedAt: new Date() })
      .where(eq(predictionMarkets.id, market.id));

    await db.insert(marketResolutionsAudit).values({
      marketId: market.id,
      resolution: assessment.resolution,
      confidence: assessment.confidence,
      evidence: { items: evidence, citedEvidence: validCitations, escalationReason },
      reasoning: assessment.reasoning,
      resolvedBy: "ai",
      autoResolved: false,
    });

    await this.notifyAdmins(market, escalationReason).catch((err) =>
      console.warn("[EvidenceResolution] admin notification failed:", err.message)
    );
  }

  private async notifyAdmins(market: { id: string; question: string }, reason: string): Promise<void> {
    const adminUsernames = (process.env.ADMIN_USERNAMES || "admin")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    if (adminUsernames.length === 0) return;

    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.username, adminUsernames));

    const { pushNotificationService } = await import("./pushNotificationService");
    for (const admin of admins) {
      await pushNotificationService
        .sendToUser(admin.id, {
          title: "Market needs resolution review",
          body: `"${market.question}" — ${reason}`,
          url: `/prediction-markets/${market.id}`,
          tag: `resolution-review-${market.id}`,
          data: { marketId: market.id, type: "resolution_review" },
        })
        .catch((err: any) => console.warn("[EvidenceResolution] push failed:", err.message));
    }
  }

  private detectCryptoSymbol(text: string, ticker?: string | null): string | null {
    if (ticker && /^[A-Z]{2,6}$/.test(ticker)) return ticker.toUpperCase();
    for (const [keyword, symbol] of Object.entries(CRYPTO_KEYWORDS)) {
      // Word-boundary match so "eth" doesn't match "whether"
      if (new RegExp(`\\b${keyword}\\b`, "i").test(text)) return symbol;
    }
    return null;
  }

  private significantWords(question: string): string[] {
    const stop = new Set([
      "will", "the", "a", "an", "by", "of", "to", "in", "on", "at", "be", "is",
      "than", "above", "below", "before", "after", "end", "exceed", "reach", "close",
    ]);
    return question
      .toLowerCase()
      .replace(/[^a-z0-9$ ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stop.has(w));
  }
}

export const evidenceResolutionService = new EvidenceResolutionService();
