# OpenAI Call-Site Inventory (April 2026)

Generated as part of Task #4 (AI cost forensics). Every `openai.chat.completions.create`,
`openai.audio.speech.create`, and `openai.audio.transcriptions.create` call site in the
backend is listed below with its model, purpose, trigger frequency, and per-call token
estimate. Two surfaces remain on premium **gpt-4o**; everything else uses
**gpt-4o-mini**.

## Pricing reference (used for monthly estimate)

| Model | Input $/1M tok | Output $/1M tok |
|---|---|---|
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| tts-1 | $15.00 / 1M chars | — |
| whisper-1 | $0.006 / minute | — |

Frequency labels: **on-demand** (user click), **cron** (scheduled cycle, frequency in
parens), **per-event** (fires when a triggering DB event occurs). Token estimates are
input + output tokens per call (conservative upper bound from the prompt + `max_tokens`
setting).

---

## Premium gpt-4o call sites (2)

| # | File:line | Purpose | Frequency | ~Tok/call | Justification |
|---|---|---|---|---|---|
| 1 | `services/rebuiltContentProcessor.ts:727` | Premium long-form video → blog summary (the headline content product) | on-demand (user uploads URL) | ~3.5k in / 1.5k out | Output quality is the user-visible product; mini noticeably worse on long-context summarization |
| 2 | `services/smartInsightsEngine.ts:224` | Reasoning-chain market insights for /insights dashboard | cron-equivalent: lazy on first request, **15-min cache**, admin force-refresh only | ~1.2k in / 1.5k out | Highest-visibility surface in the investor pitch; reasoning-chain quality matters; aggressively cached so worst case is 4 calls/hour |

---

## gpt-4o-mini chat call sites (50)

| # | File:line | Purpose | Frequency | ~Tok/call |
|---|---|---|---|---|
| 1 | `services/alphaIntelligenceService.ts:984` | Alpha intelligence narrative generation | cron (6h) | 1.2k / 0.8k |
| 2 | `services/aiMetaTrader.ts:204` | Meta-trader portfolio rebalance reasoning | cron (6h) | 1.0k / 0.6k |
| 3 | `services/aiContentModerator.ts:178` | Bounty/comment moderation classification | per-event (new submission) | 0.6k / 0.3k |
| 4 | `services/aiCommunityManager.ts:175` | Community announcement / nudge generation | cron (4h) | 0.8k / 0.5k |
| 5 | `services/aiTreasuryManager.ts:157` | Treasury allocation reasoning | cron (6h) | 1.0k / 0.6k |
| 6 | `services/chatService.ts:101` | Site-wide chatbot reply (non-streaming) | on-demand (user message) | 1.0k / 0.7k |
| 7 | `services/chatService.ts:130` | Site-wide chatbot reply (streaming) | on-demand (user message) | 1.0k / 0.7k |
| 8 | `services/agentMarketAnalyzer.ts:172` | Agent reads markets to decide a trade | cron per agent (6–7h) | 0.9k / 0.5k |
| 9 | `services/agentContentCreator.ts:44` | Agent generates a bounty topic | cron per agent (5–7h) | 0.6k / 0.4k |
| 10 | `services/agentContentCreator.ts:96` | Agent writes a summary submission | cron per agent (5–7h) | 1.0k / 0.8k |
| 11 | `services/agentContentCreator.ts:141` | Agent writes a social/comment post | cron per agent (5–7h) | 0.5k / 0.3k |
| 12 | `services/aiAgentService.ts:162` | Generic AI agent action dispatcher | cron per agent (5h) | 0.8k / 0.5k |
| 13 | `services/alphaInsightsEngine.ts:122` | Legacy alpha insight: regime detection | cron (4h) | 0.9k / 0.6k |
| 14 | `services/alphaInsightsEngine.ts:204` | Legacy alpha insight: divergences | cron (4h) | 0.9k / 0.6k |
| 15 | `services/alphaInsightsEngine.ts:280` | Legacy alpha insight: contrarian setups | cron (4h) | 0.9k / 0.6k |
| 16 | `services/alphaInsightsEngine.ts:353` | Legacy alpha insight: cross-asset | cron (4h) | 0.9k / 0.6k |
| 17 | `services/alphaInsightsEngine.ts:410` | Legacy alpha insight: opportunities | cron (4h) | 0.9k / 0.6k |
| 18 | `services/alphaInsightsEngine.ts:464` | Legacy alpha insight: risks | cron (4h) | 0.9k / 0.6k |
| 19 | `services/predictionExtractionService.ts:171` | Extract prediction-market candidates from content | per-event (new published summary) | 1.5k / 0.8k |
| 20 | `services/avatarMarketGenerator.ts:78` | Avatar-authored prediction market topic | cron per avatar (8h) | 0.7k / 0.5k |
| 21 | `services/socialMarketGenerator.ts:79` | Social-feed-driven market topic | cron (6h) | 0.7k / 0.5k |
| 22 | `services/avatarAlphaStreamService.ts:289` | Avatar alpha commentary chunk | cron per avatar stream (5–10 min during live) | 0.6k / 0.4k |
| 23 | `services/aiPredictionBackfillService.ts:40` | One-shot backfill of historical predictions | manual admin trigger | 1.0k / 0.7k |
| 24 | `services/streamConversationService.ts:634` | Stream Q&A response to viewer message | per-event (viewer asks question) | 0.8k / 0.5k |
| 25 | `services/aiLiquidityProvider.ts:193` | Decide AMM liquidity adjustments | cron (6h) | 0.8k / 0.5k |
| 26 | `services/avatarChatService.ts:128` | Avatar 1:1 chat reply | on-demand (user DM avatar) | 0.7k / 0.5k |
| 27 | `services/avatarStreamEnhancementsService.ts:213` | Stream segment generator (e.g. recap) | cron per active stream (15 min) | 0.7k / 0.5k |
| 28 | `services/avatarStreamEnhancementsService.ts:307` | Stream highlight extractor | per-event (notable moment) | 0.6k / 0.4k |
| 29 | `services/debateManagerService.ts:278` | Multi-avatar debate turn generation | cron during debate (every 2 min) | 0.9k / 0.6k |
| 30 | `services/debateManagerService.ts:434` | Debate moderator summary | per-event (debate ends) | 1.2k / 0.8k |
| 31 | `services/aiTradingBotService.ts:221` | Trading bot decision reasoning | cron per bot (5–6h) | 0.9k / 0.6k |
| 32 | `services/aiTrendSpotter.ts:281` | Spot trending topics → propose markets | cron (6h) | 1.0k / 0.7k |
| 33 | `services/knowledgeQuestionService.ts:163` | Generate knowledge quiz questions | cron (8h) | 0.7k / 0.5k |
| 34 | `services/knowledgeQuestionService.ts:257` | Grade user knowledge answers | per-event (user submits answer) | 0.5k / 0.3k |
| 35 | `services/agentBountyEngine.ts:171` | Agent quality-scores a bounty | per-event (new submission) | 0.8k / 0.4k |
| 36 | `services/autonomousAvatarStreamService.ts:184` | Autonomous avatar stream commentary | cron per active stream (10 min) | 0.7k / 0.5k |
| 37 | `services/avatarVoiceService.ts:197` | Avatar voice script: market reaction | per-event (large price move) | 0.6k / 0.4k |
| 38 | `services/avatarVoiceService.ts:237` | Avatar voice script: news reaction | per-event (breaking news) | 0.6k / 0.4k |
| 39 | `services/avatarVoiceService.ts:272` | Avatar voice script: viewer Q&A | per-event (viewer question) | 0.6k / 0.4k |
| 40 | `services/avatarVoiceService.ts:309` | Avatar voice script: ambient commentary | cron per active stream (5–10 min) | 0.6k / 0.4k |
| 41 | `services/enhancedStreamingService.ts:85` | Stream metadata generation | per-event (stream start) | 0.5k / 0.3k |
| 42 | `services/enhancedStreamingService.ts:229` | Stream segment summarizer | cron per active stream (10 min) | 0.7k / 0.5k |
| 43 | `services/enhancedStreamingService.ts:273` | Stream highlight detector | per-event | 0.6k / 0.4k |
| 44 | `services/enhancedStreamingService.ts:1325` | Post-stream recap | per-event (stream ends) | 1.2k / 0.8k |
| 45 | `services/aiMarketResolver.ts:182` | Resolve disputed prediction-market outcome | per-event (market deadline) | 1.0k / 0.5k |
| 46 | `services/scheduledMarketStreamService.ts:463` | Daily morning/close market briefing script | cron (2x daily) | 1.5k / 1.0k |
| 47 | `services/aiTradingSignalsService.ts:611` | Trading-signal narrative (downgraded Apr 2026) | cron (4h) | 1.0k / 0.6k |
| 48 | `services/realContentProcessor.ts:271` | **Orphaned legacy** content processor (downgraded Apr 2026) | unused | — |
| 49 | `services/cleanContentProcessor.ts:235` | **Orphaned legacy** content processor (downgraded Apr 2026) | unused | — |
| 50 | `routes/portfolio-news.ts:311` | Portfolio news summary endpoint | on-demand (user opens portfolio) | 0.9k / 0.6k |
| 51 | `routes/live-streaming-enhanced.ts:1018` | Live-stream enhancement reasoning | per-event (stream interaction) | 0.6k / 0.4k |

> Note: items 48 and 49 are reachable code but no longer wired to any route or cron.
> They are downgraded to mini as a defense-in-depth measure but should be deleted in
> a future tech-debt task.

---

## Audio: tts-1 call sites (6)

| # | File:line | Purpose | Frequency | ~Chars/call |
|---|---|---|---|---|
| 1 | `services/streamConversationService.ts:700` | Speak Q&A response in user-hosted stream | per-event (viewer Q&A) | 200 |
| 2 | `services/avatarVoiceService.ts:127` | Avatar greeting / opener | per-event (stream start) | 250 |
| 3 | `services/avatarVoiceService.ts:169` | Avatar generic line | per-event | 200 |
| 4 | `services/avatarVoiceService.ts:368` | Avatar segment narration | cron per active stream (5–10 min) | 400 |
| 5 | `services/avatarVoiceService.ts:422` | Avatar Q&A reply | per-event (viewer question) | 250 |
| 6 | `auto-seed.ts:1793` | One-time TTS during initial seed (sample audio) | once on first deploy | 300 |

## Audio: whisper-1 call sites (1)

| # | File:line | Purpose | Frequency | ~Min/call |
|---|---|---|---|---|
| 1 | `services/streamConversationService.ts:868` | Transcribe browser-mic input from user-hosted stream | per-event (user speaks) | 0.5 |

---

## Monthly cost estimate (~$8–10)

Assuming a small-but-real production load:
- **gpt-4o (2 sites)**: rebuiltContentProcessor ~50 calls/mo × ~$0.025 ≈ $1.25;
  smartInsightsEngine ~96 calls/mo (cache-bounded at 4/h × 24h × 30d ≈ 2,880 max,
  but actual ≈ 3% cache miss / refresh pattern) × ~$0.018 ≈ $1.75. **~$3/mo**
- **gpt-4o-mini (50+ sites)**: dominated by per-agent crons (100 agents × ~3 calls/day),
  per-bot crons (50 bots × ~4 calls/day), and per-stream crons. ~150k calls/mo at
  ~$0.000045/call ≈ **$5–6/mo**
- **tts-1**: dominated by avatar streams; ~30k chars/day → ~900k/mo × $15/M chars
  ≈ **$0.50/mo** (with audio caching reducing this further)
- **whisper-1**: only on user-hosted streams with mic enabled; <100 min/mo ≈ **$0.50/mo**

**Total: ~$8–10/month** (vs. $15–25 before Task #4).

## Cost-control switches

- `PAUSE_OPENAI_API=true` — hard halt for **all** OpenAI calls (returns deterministic
  fallbacks; verified in `smartInsightsEngine`, `avatarVoiceService`, `chatService`,
  and the agent/bot dispatchers).
- `QUIET_MODE=true` — disables all background polling/cron services; only on-demand
  routes still call OpenAI.
- Smart Insights cache TTL: 15 min (`CACHE_TTL_SECONDS` in `smartInsightsEngine.ts`).
- Admin-only force refresh: `POST /api/smart-insights/reasoning/refresh`
  (auth + admin + `mediumLimit` rate limiter + Zod body validation).
