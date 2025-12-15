# Market Mechanism & Resolution Specification

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** LIVE (Off-Chain Settlement) | Oracle PLANNED

---

## 1. Prediction Market Status

### Current State: LIVE
- Markets can be created, traded, and resolved
- All settlement is **OFF-CHAIN** (database + internal balances)
- UMA Oracle integration is **PLANNED** (not live)

---

## 2. AMM Formula: Constant Product Market Maker (CPMM)

### Core Formula
```
yes_pool * no_pool = k (constant)
```

### Price Calculation
```typescript
price_yes = no_pool / (yes_pool + no_pool)
price_no = yes_pool / (yes_pool + no_pool)
```

**Note:** Price is inverse relationship - more tokens in YES pool means lower YES price.

### Trade Execution Steps

1. **User initiates BUY YES with 100 STREAM**
2. Apply 0.5% fee: `fee = 100 * 0.005 = 0.5 STREAM`
3. Amount after fee: `99.5 STREAM`
4. Calculate tokens out using constant product:
   ```
   tokens_out = (amount_in * reserve_out) / (reserve_in + amount_in)
   tokens_out = (99.5 * yes_pool) / (no_pool + 99.5)
   ```
5. Update reserves:
   ```
   new_yes_pool = yes_pool - tokens_out
   new_no_pool = no_pool + 99.5
   ```
6. Mint position tokens to user
7. Record trade in database

### Example Trade

| Before Trade | Value |
|-------------|-------|
| yes_pool | 10,000 |
| no_pool | 10,000 |
| k | 100,000,000 |
| YES price | 50% |
| NO price | 50% |

User buys YES with 1,000 STREAM:
- Fee: 5 STREAM (0.5%)
- Amount after fee: 995 STREAM
- Tokens received: `(995 * 10,000) / (10,000 + 995) = 905.22 YES tokens`

| After Trade | Value |
|------------|-------|
| yes_pool | 9,094.78 |
| no_pool | 10,995 |
| YES price | 54.72% |
| NO price | 45.28% |

---

## 3. Fee Structure

### Fee Rate: 0.5% (50 basis points)

### Fee Calculation: PROFIT ONLY
The 0.5% fee is applied on **net profit**, not total payout.

```typescript
// Fee calculation on winning position
profit = payout - cost_basis
fee = profit * 0.005
net_payout = payout - fee

// Example:
// User bought 100 YES tokens at avg price 0.60 = 60 STREAM cost
// Market resolves YES, each token worth 1.00 = 100 STREAM payout
// Profit = 100 - 60 = 40 STREAM
// Fee = 40 * 0.005 = 0.20 STREAM
// Net payout = 100 - 0.20 = 99.80 STREAM
```

### Fee Distribution (Planned)
| Recipient | Share |
|-----------|-------|
| Platform treasury | 70% |
| Liquidity providers | 20% |
| Market creators | 10% |

---

## 4. Resolution System

### Resolution Priority

| Priority | Method | Status |
|----------|--------|--------|
| 1 | AI Resolver (GPT-4o-mini) | LIVE |
| 2 | Manual Admin Override | LIVE |
| 3 | UMA Optimistic Oracle | PLANNED |

### AI Resolver Process
1. Market reaches deadline
2. AI Resolver service triggers
3. GPT-4o-mini analyzes:
   - Market question
   - Current real-world data
   - News sources
   - Price data (if applicable)
4. AI proposes outcome: YES or NO
5. Confidence score generated
6. Resolution proposal submitted

### Admin Override
- Any admin can override AI resolution
- Required for disputed markets
- Logged in audit trail

### Current Settlement Flow
```
Market Deadline → AI Analysis → Propose Outcome → Dispute Window (24h)
                                                         ↓
                                        No Dispute → Finalize → Distribute Payouts
                                                         ↓
                                           Dispute → Admin Review → Final Decision
```

---

## 5. Dispute System

### Dispute Window: 24 Hours
After resolution is proposed, users have 24 hours to dispute.

### Dispute Stake
| Field | Current | Future |
|-------|---------|--------|
| Currency | Internal STREAM points | STREAM tokens (on-chain) |
| Amount | 100 points | 100 STREAM |
| Returned if successful | Yes | Yes |
| Slashed if unsuccessful | Yes | Yes |

### Dispute Flow
1. User stakes 100 points to dispute
2. Market enters "disputed" status
3. Admin reviews evidence
4. Admin makes final decision
5. If dispute upheld: stake returned, resolution overturned
6. If dispute rejected: stake slashed, original resolution stands

### Arbitration
Currently: **Admin arbitration only**
Planned: **UMA Optimistic Oracle + community governance**

---

## 6. Market Integrity Controls

### Position Limits
| Control | Value | Purpose |
|---------|-------|---------|
| Max position per user | 10% of pool | Prevent market manipulation |
| Max trades per minute | 10 per user | Rate limiting |
| Min liquidity | 1,000 STREAM | Ensure market depth |
| Slippage revert | >5% | Protect from sandwich attacks |

### Creator Restrictions
```typescript
// Creator cannot trade own market
if (market.created_by === user.id) {
  throw new Error("Creators cannot trade on their own markets");
}
```

### Anti-Manipulation Measures
1. **Time-weighted average price (TWAP)** considered for large positions
2. **Unusual volume alerts** trigger admin review
3. **AI agents monitored** for coordinated behavior
4. **Wash trading detection** (same wallet buy/sell patterns)

---

## 7. Database Schema

### prediction_markets Table
```typescript
export const predictionMarkets = pgTable("prediction_markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  deadline: timestamp("deadline").notNull(),
  yesPrice: integer("yes_price").default(5000), // basis points (50%)
  noPrice: integer("no_price").default(5000),
  yesPool: integer("yes_pool").default(10000),
  noPool: integer("no_pool").default(10000),
  totalVolume: integer("total_volume").default(0),
  status: text("status").default("open"), // open, closed, resolved, disputed
  outcome: text("outcome"), // "yes", "no", null
  resolvedAt: timestamp("resolved_at"),
  createdBy: varchar("created_by").references(() => users.id),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### market_positions Table
```typescript
export const marketPositions = pgTable("market_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id),
  userId: varchar("user_id").references(() => users.id),
  position: text("position").notNull(), // "yes" or "no"
  shares: integer("shares").notNull(),
  avgPrice: integer("avg_price").notNull(), // basis points
  totalCost: integer("total_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### market_trades Table
```typescript
export const marketTrades = pgTable("market_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id),
  userId: varchar("user_id").references(() => users.id),
  tradeType: text("trade_type").notNull(), // "buy" or "sell"
  position: text("position").notNull(), // "yes" or "no"
  amount: integer("amount").notNull(),
  shares: integer("shares").notNull(),
  price: integer("price").notNull(),
  fee: integer("fee").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 8. Sample Market Object (JSON)

```json
{
  "id": "mkt_abc123def456",
  "question": "Will Bitcoin reach $150,000 by March 2026?",
  "description": "Market resolves YES if BTC/USD reaches $150,000 on any major exchange.",
  "category": "Crypto",
  "deadline": "2026-03-31T23:59:59Z",
  "yesPrice": 3500,
  "noPrice": 6500,
  "yesPool": 8500,
  "noPool": 15800,
  "totalVolume": 24300,
  "status": "open",
  "outcome": null,
  "resolvedAt": null,
  "createdBy": "user_xyz789",
  "tags": ["bitcoin", "btc", "price-prediction", "2026"],
  "createdAt": "2025-12-15T10:00:00Z",
  "currentProbability": {
    "yes": 0.35,
    "no": 0.65
  }
}
```

---

## 9. Market Lifecycle

```
CREATED → OPEN → TRADING → DEADLINE REACHED → RESOLUTION PROPOSED
                                                       ↓
                     DISPUTED ← (24h window) ← PENDING RESOLUTION
                         ↓                           ↓
                   ADMIN REVIEW              NO DISPUTES
                         ↓                           ↓
                   FINAL DECISION → RESOLVED → PAYOUTS DISTRIBUTED
```

---

## Summary

StreamAiX prediction markets are **LIVE** with CPMM-based AMM pricing. All settlement is currently **OFF-CHAIN** using database balances. The 0.5% fee is applied on profit only. Resolution uses AI-first with admin override, and UMA Oracle integration is planned for Q2 2026.
