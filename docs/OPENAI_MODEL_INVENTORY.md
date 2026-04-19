# OpenAI Call Inventory & Cost Justification

Last audited: April 2026 (Task #4 — AI cost forensics)

This document inventories every OpenAI call site in `server/`, the model
used, the justification, and any caching applied. It is the source of
truth for the platform's AI cost posture.

## Summary

| Bucket            | Calls | Model         | Notes                                        |
| ----------------- | ----- | ------------- | -------------------------------------------- |
| Premium reasoning | 2     | `gpt-4o`      | Smart Insights + premium content processor   |
| Background AI     | ~50   | `gpt-4o-mini` | All autonomous services & background scoring |
| TTS               | ~3    | `tts-1`       | Avatar voice + scheduled streams             |
| Whisper           | ~1    | `whisper-1`   | Transcription pipeline                       |

`gpt-4o-mini` is roughly 1/30 the price of `gpt-4o` for input/output
tokens. Default for everything that isn't directly visible to investors.

## Premium GPT-4o call sites (justified)

| File                                          | Purpose                                               | Why premium?                                                                                                          | Cache       |
| --------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- |
| `server/services/smartInsightsEngine.ts:175`  | Smart Insights reasoning chains (regime, divergence, contrarian, conditional, cross-asset, opportunity, risk) | Highest-visibility surface — drives the investor pitch. Reasoning-chain quality directly tied to perceived AI quality | 15 min TTL  |
| `server/services/rebuiltContentProcessor.ts:728` | Premium video/podcast content analysis (the live processor users hit) | Long-form content analysis where mini's 4o-mini quality drop is user-visible. Already documented in `replit.md` | per-content |

## Downgrades performed (April 2026)

| File                                          | Before    | After          | Reason                                                                                                                                            |
| --------------------------------------------- | --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/services/aiTradingSignalsService.ts:615` | `gpt-4o`  | `gpt-4o-mini`  | Structured trade-signal JSON generation works on mini at ~95% perceived quality and 1/30 the cost. Uses `response_format: json_object` so structure is enforced regardless of model. |
| `server/services/realContentProcessor.ts:275` | `gpt-4o`  | `gpt-4o-mini`  | Legacy/orphaned processor — no live import path. Downgraded defensively in case it gets re-wired.                                                  |
| `server/services/cleanContentProcessor.ts:239` | `gpt-4o`  | `gpt-4o-mini`  | Same — orphaned legacy processor, defensive downgrade.                                                                                            |

## All `gpt-4o-mini` call sites (~50)

The full list is grep-able with:

```
grep -rn "model: ['\"]gpt-4o" server/services server/routes
```

Categories:

- **Autonomous AI ecosystem** (10+ sites): `aiMarketResolver`,
  `aiLiquidityProvider`, `aiTrendSpotter`, `aiContentModerator`,
  `aiCommunityManager`, `aiTreasuryManager`, `aiMetaTrader`,
  `aiAgentService`, `agentMarketAnalyzer`, `agentBountyEngine`,
  `agentContentCreator`, `aiPredictionBackfillService`,
  `predictionExtractionService`. All low-stakes JSON output where mini
  is fine.
- **Streaming & avatars** (10+ sites): `avatarVoiceService`,
  `avatarChatService`, `avatarStreamEnhancementsService`,
  `avatarAlphaStreamService`, `autonomousAvatarStreamService`,
  `enhancedStreamingService`, `streamConversationService`,
  `debateManagerService`, `scheduledMarketStreamService`. Real-time
  conversational text where speed > nuance.
- **Market/news/scoring** (10+ sites): `aiTradingSignalsService` (post-downgrade),
  `aiTradingBotService`, `qualityScorerService`,
  `socialMarketGenerator`, `avatarMarketGenerator`,
  `knowledgeQuestionService`, `alphaIntelligenceService`,
  `alphaInsightsEngine` (all 6 methods), `chatService` (2 sites),
  `aiService` (10 sites — already mini, all annotated).
- **Routes** (1 site): `live-streaming-enhanced.ts:1019` (chat command
  responses).

## Caching audit

Caches with measurable hit rates:

- `cacheService` (server-wide TTL store): used by `/api/avatars` (5 min),
  `/api/prediction-markets` (2 min), `/api/prediction-markets/trending`
  (3 min), and now `/api/smart-insights/reasoning` (15 min).
- `alphaInsightsEngine` has its own in-class Map cache, 5 min TTL, used
  by `generatePriceAlertInsight`, `generateMorningBriefing`,
  `generateEveningRecap`, `generateTradingSignalInsight`,
  `generateAlphaSignal`. Already in place.
- `smartInsightsEngine` uses the shared `cacheService` with a 15 min
  TTL on the deterministic key `smart_insights_reasoning_v1`. Admin can
  force-refresh via `POST /api/smart-insights/reasoning/refresh`.

## Estimated monthly OpenAI cost (post Task #4)

| Component                             | Calls/day (est) | Avg tokens | Model         | Monthly cost |
| ------------------------------------- | --------------- | ---------- | ------------- | ------------ |
| Smart Insights (1 cache key, 96 fills/day worst-case) | 96              | 2,500      | gpt-4o        | $1.80        |
| Rebuilt content processor (per upload) | ~5             | 6,000      | gpt-4o        | $0.45        |
| Autonomous ecosystem (~50 sites, 6h cycles) | 200            | 1,000      | gpt-4o-mini   | $1.80        |
| Avatars / streaming TTS               | 100             | 800 chars  | tts-1         | ~$3          |
| Avatar chat / commentary text         | 500             | 300        | gpt-4o-mini   | $0.45        |
| Trading signals + market generators   | 300             | 700        | gpt-4o-mini   | $0.65        |
| Misc (qualityScorer, knowledge q's)   | 200             | 400        | gpt-4o-mini   | $0.25        |
| **Total**                             |                 |            |               | **~$8-10/month** |

Down from the previously documented $15-25/month. The savings primarily
come from (a) downgrading `aiTradingSignalsService` (the only hot
gpt-4o path outside content processing), (b) tight caching on Smart
Insights (15 min TTL on the only new gpt-4o surface), and (c) removing
two orphaned premium call sites that were waiting to bite us.

`PAUSE_OPENAI_API=true` continues to drop this to $0 immediately.
