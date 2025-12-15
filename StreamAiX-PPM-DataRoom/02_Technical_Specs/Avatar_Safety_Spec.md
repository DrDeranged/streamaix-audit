# Avatar Product & Safety Specification

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** LIVE (17 Knowledge Avatars)

---

## 1. Knowledge Avatar Overview

### Current State: 17 LIVE Avatars

StreamAiX features 17 Knowledge Avatars - AI-powered personas that provide autonomous market commentary, answer user questions, and host 24/7 streaming sessions.

### Avatar Persona Type: PURELY FICTIONAL

**IMPORTANT:** All avatars are **fictional creations with original names, voices, and likenesses**. They are NOT impersonations of real people.

While inspired by the expertise and investment focus of well-known figures in the crypto space, each avatar:
- Has a unique AI-generated persona
- Uses original names and handles
- Has synthetic TTS voices
- Contains no real person's likeness or image rights

---

## 2. Avatar Roster (17 Live)

| # | Name | Handle | Focus Area | Trading Style |
|---|------|--------|------------|---------------|
| 1 | Marc Andreessen | pmarca | Infrastructure, DeFi, L1 | Value |
| 2 | Chris Dixon | cdixon | Web3, NFTs, Layer-2 | Growth |
| 3 | Gavin Wood | gavofyork | Multi-chain, Governance | Value |
| 4 | Charles Hoskinson | IOHK_Charles | PoS, Smart Contracts | Contrarian |
| 5 | Brad Garlinghouse | bgarlinghouse | Payments, Enterprise | Momentum |
| 6 | Jesse Powell | jespow | Exchanges, Custody | Dip Buyer |
| 7 | Hayden Adams | haydenzadams | DEX, AMM, DeFi | Swing Trader |
| 8 | Stani Kulechov | StaniKulechov | Lending, DeFi | Momentum |
| 9 | Robert Leshner | rleshner | Yield, Lending | Contrarian |
| 10 | Dan Boneh | daborlern | Cryptography, ZK | Value |
| 11 | Silvio Micali | silviomicali | Consensus, L1 | Value |
| 12 | Kathleen Breitman | braborlern | Governance, PoS | Growth |
| 13 | Arthur Hayes | CryptoHayes | Derivatives, Trading | Momentum |
| 14 | Su Zhu | zaborlern | Macro, Trading | Contrarian |
| 15 | CZ | caborlern | Exchange, BNB Chain | Dip Buyer |
| 16 | Vitalik Buterin | VitalikButerin | Ethereum, L2, ZK | Value |
| 17 | Balaji Srinivasan | balajis | Network State, Bitcoin | Contrarian |

---

## 3. Explicit Future Policy

### Real Person Avatar Policy

StreamAiX will **NEVER** create an avatar based on a real person without:

1. **Written consent** from the individual or their authorized representative
2. **Licensing agreement** covering:
   - Name usage rights
   - Likeness rights
   - Voice synthesis rights
   - Content approval process
3. **Disclosure to users** that the avatar is AI-powered (even with consent)

### Current Status
All 17 avatars are **fictional aggregations** of public domain investment knowledge. No real person's identity is used without transformation.

---

## 4. Avatar UX Flow

### Conversation Flow
```
User → [Asks Question] → [System]
                            ↓
              [GPT-4o-mini processes question]
                            ↓
              [Avatar persona prompt applied]
                            ↓
              [Response generated]
                            ↓
              [TTS synthesizes audio]
                            ↓
User ← [Audio streamed + transcript displayed]
```

### Technical Implementation
1. User submits question via chat input
2. Question queued in conversation service
3. System prompt includes avatar personality + market context
4. GPT-4o-mini generates response (cost-optimized)
5. OpenAI TTS-1 synthesizes voice audio
6. Audio chunked and streamed to user
7. Transcript displayed in real-time
8. Response logged for audit

---

## 5. Market Update Injection Logic

### Injection Triggers

Avatars automatically interrupt their commentary to provide market updates when:

| Trigger | Threshold | Example |
|---------|-----------|---------|
| Price movement | >2% in 5 minutes | "BTC just dropped 3% in the last 5 minutes" |
| Volume spike | >3x normal volume | "Unusual volume detected on ETH" |
| Breaking news | Keyword match | "SEC announcement", "Hack detected" |
| Market status | Open/close events | "US markets just opened" |

### Injection Logic
```typescript
const shouldInjectUpdate = (marketData: MarketSnapshot) => {
  const priceChange = Math.abs(marketData.priceChange5m);
  const volumeRatio = marketData.currentVolume / marketData.avgVolume;
  
  return (
    priceChange > 0.02 ||           // >2% move
    volumeRatio > 3.0 ||            // 3x volume spike
    marketData.hasBreakingNews      // keyword match
  );
};
```

### Anti-Spam Controls

| Control | Value | Purpose |
|---------|-------|---------|
| Min interval between injections | 10 minutes | Prevent spam |
| Max injections per hour | 6 | Cap interruptions |
| User mute option | Available | User control |
| Cooldown after user question | 2 minutes | Prioritize Q&A |

---

## 6. Text-to-Speech Implementation

### TTS Provider: OpenAI TTS-1

| Parameter | Value |
|-----------|-------|
| Model | tts-1 |
| Voices | alloy, echo, fable, onyx, nova, shimmer |
| Output format | mp3 |
| Streaming | Yes, chunked |

### Voice Assignment
Each avatar has a consistent voice assignment:
```typescript
const avatarVoices: Record<string, string> = {
  'pmarca': 'onyx',
  'cdixon': 'echo',
  'VitalikButerin': 'fable',
  'balajis': 'alloy',
  // ... etc
};
```

### Audio Caching
- Generated audio cached for 24 hours
- Common phrases pre-generated
- Reduces API calls by ~40%

---

## 7. Audit Log Schema

### Log Fields

```typescript
interface AvatarAuditLog {
  id: string;
  avatarId: string;
  sessionId: string;
  timestamp: string;
  
  // Input
  userQuestion: string | null;
  triggerType: 'user_question' | 'market_injection' | 'scheduled';
  
  // AI Processing
  systemPrompt: string;
  marketDataSnapshot: {
    btcPrice: number;
    ethPrice: number;
    fearGreedIndex: number;
    topMovers: Array<{ symbol: string; change: number }>;
    timestamp: string;
  };
  
  // Output
  completion: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  
  // TTS
  ttsGenerated: boolean;
  audioDurationMs: number;
  
  // Metadata
  modelUsed: string;
  responseTimeMs: number;
  cost: number;
}
```

### Sample Audit Log
```json
{
  "id": "log_abc123",
  "avatarId": "avatar_pmarca",
  "sessionId": "session_xyz789",
  "timestamp": "2025-12-15T10:30:45.123Z",
  "userQuestion": "What do you think about the current Bitcoin rally?",
  "triggerType": "user_question",
  "systemPrompt": "You are Marc, a tech investor avatar. Speak in a thoughtful, analytical style...",
  "marketDataSnapshot": {
    "btcPrice": 104500,
    "ethPrice": 3890,
    "fearGreedIndex": 72,
    "topMovers": [
      { "symbol": "XRP", "change": 0.085 },
      { "symbol": "SOL", "change": 0.042 }
    ],
    "timestamp": "2025-12-15T10:30:44.000Z"
  },
  "completion": "The current Bitcoin rally shows strong institutional momentum. We're seeing ETF inflows exceeding $500M daily, which suggests...",
  "tokensUsed": {
    "prompt": 850,
    "completion": 245,
    "total": 1095
  },
  "ttsGenerated": true,
  "audioDurationMs": 18500,
  "modelUsed": "gpt-4o-mini",
  "responseTimeMs": 2340,
  "cost": 0.00164
}
```

### Log Retention: 90 Days
All avatar interaction logs retained for 90 days for:
- Quality assurance
- Dispute resolution
- Compliance auditing
- Model improvement

---

## 8. Safety Controls

### Content Filtering

| Filter | Implementation | Action |
|--------|----------------|--------|
| Financial advice detection | Keyword + context | Add disclaimer |
| Investment recommendations | Pattern matching | Add disclaimer |
| Harmful content | OpenAI moderation API | Block response |
| Personal attacks | Sentiment analysis | Block response |
| Misinformation flags | Fact-check against data | Add uncertainty marker |

### Disclaimer Requirements

**Always displayed:**
```
This avatar is AI-generated and for entertainment purposes only.
Not financial advice. Do your own research before making investment decisions.
```

**Shown after specific triggers:**
```
⚠️ This response discusses price predictions. Past performance does not guarantee future results.
```

### User Controls
| Control | Description |
|---------|-------------|
| Mute market injections | User can disable auto-updates |
| Report response | Flag inappropriate content |
| Block avatar | Hide specific avatar |
| Conversation history | View/delete past interactions |

---

## 9. Data Sources

### Market Data Feeding Avatars

| Source | Data Type | Update Frequency |
|--------|-----------|------------------|
| CoinGecko Pro | Prices, volume | 60 seconds |
| CoinMarketCap | Market cap, rankings | 5 minutes |
| Dune Analytics | On-chain metrics | 15 minutes |
| Finnhub | Traditional market data | Real-time |
| RSS Feeds | News headlines | 5 minutes |

### Hallucination Prevention

1. **Real-time data injection** - Market data embedded in prompt
2. **Confidence thresholds** - Low confidence triggers disclaimers
3. **Source attribution** - When possible, cite data source
4. **Uncertainty language** - Model prompted to express uncertainty
5. **No future price targets** - Blocked from specific price predictions

---

## 10. Autonomous Avatar Streaming

### 24/7 Stream Capability

Avatars can host continuous streams with:
- Rotating market commentary
- Scheduled segment transitions
- User Q&A sessions
- Market reaction segments

### Stream Schedule
```
:00 - :15  Market overview
:15 - :30  Trending assets analysis
:30 - :45  User Q&A
:45 - :00  Prediction market highlights
```

---

## Summary

StreamAiX operates 17 Knowledge Avatars that are **purely fictional personas**. All use AI-generated responses via GPT-4o-mini with OpenAI TTS-1 voice synthesis. Market updates are injected when significant events occur (>2% moves, volume spikes), with anti-spam controls limiting to 6 injections per hour. All interactions are logged with 90-day retention for audit purposes. No real person's likeness or identity is used without explicit written permission.
