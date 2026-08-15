# Known Runtime Bugs (found during TypeScript burn-down, 2026-08-15)

These are genuine runtime defects discovered while eliminating all tsc errors.
Per policy, behavior was NOT changed silently — the code was typed to reflect
what it actually does (including crashing paths). Each item needs a deliberate fix.

## Reported by burn-down group 1

- server/routes/bounties.ts:141 — `summary.qualityScore` accessed but `summaries` table has no `qualityScore` column → always undefined. Likely intent: join bountyQualityScores.overallScore.
- server/routes/bounties.ts:501 — `qualityScorerService.calculateQualityScore(...)` does not exist → throws at runtime. Likely intent: `scoreSummary(bountyId, summaryId)`.
- server/routes/bounties.ts:507 — `bountyHunterService.updateAfterCompletion(hunter.id, bountyId, number)` does not exist AND signature differs → throws. Likely intent: `updateHunterAfterCompletion(hunterId, { reward, completionTimeHours, qualityScore, category? })`.
- server/services/crossMarketSignalService.ts:317,319 — `EventModelingDashboard.predictions` does not exist (property is `activePredictions`) → always undefined, event strength/impact always empty.
- server/services/crossMarketSignalService.ts:523 — fallback `takeProfit: 0` but type is `number[]`; also excess `trailingStop`/`positionAdjustment` and missing `maxDrawdown`/`hedgingStrategy` → shape mismatch vs consumers.
- server/services/crossMarketSignalService.ts:527 — `timeHorizon: 'short_term'` is not a valid value (union: scalp|day_trade|swing|position|long_term). Likely intent: `'day_trade'` or `'position'`.
- server/routes/live-streaming-enhanced.ts:805 — streamClips insert omits `endTime` (NOT NULL column) → DB insert throws at runtime. Likely intent: pass `endTime: (startTime||0)+(duration||30)`.
- server/routes/live-streaming-enhanced.ts:1157 — `storage.updateUserPoints` does not exist → throws (trivia points never awarded). Likely intent: pointsService.awardPoints.
- server/storage.ts:1551 — `updatedAt` set on `avatarInsights` which has no such column; drizzle silently ignores → update timestamp never persisted (removed the dead key).
- server/storage.ts:2399 — `this.getPredictionMarkets(...)` does not exist on DatabaseStorage → unified social feed 'market' branch throws. Likely intent: query predictionMarkets table.
- server/routes/push-notifications.ts:182,183 — `volumeSpikes`/`weeklyPreview` accessed but not columns on `pushSubscriptions` → always undefined in subscriptions listing (note: PATCH /preferences also writes these keys which drizzle silently drops).
- server/routes/interaction.ts:162 — `getUserInteractions(userId, summaryId)` passes a raw string where an options object `{ summaryId? }` is expected → the summaryId filter is silently skipped at runtime; endpoint returns ALL user interactions regardless of `?summaryId`. Likely intent: `{ summaryId }`.
- server/services/qualityScorerService.ts:153 — `this.aiService.chat(...)` does not exist (AIService exposes only static methods, no instance `chat`) → AI quality scoring always throws and falls back to default 70 scores.

## Reported by burn-down group 2

- server/routes/live-streaming-monetization.ts:265 & :293 — `storage.updateUserPoints(...)` does not exist on DatabaseStorage; channel-points redeem and gift-subs endpoints throw at runtime (points never deducted). Cast receiver via unknown to preserve the throw. Likely intended: a real points-adjustment method (no matching method exists; not updateUserNote).
- server/routes/alpha-intelligence.ts:1019 — `marketData.getTrendingContent(timeFilter)` does not exist on MarketDataService; enhanced-discover endpoint throws. Likely intended: getTrendingCoins().
- server/routes/alpha-intelligence.ts:1020 — `marketData.getSectorPerformance(timeFilter)` does not exist; same endpoint throws. Likely intended: getCategoryPerformance().
- server/routes/alpha-intelligence.ts:834 — getInstitutionalFundFlows only accepts '1h'|'24h'|'7d'; a '30d' timeframe query flows through unmapped (else-branch passes '30d'), which the service can't handle. Cast precisely to preserve behavior.
- server/routes/price-alerts.ts:373, :429, :474 — `marketDataService.getCryptoData()` does not exist; the 3 market-intelligence endpoints (signals/whales/sentiment) always hit their catch and return fallback data. Cast receiver via unknown to preserve the throw. Likely intended: getCryptoStats() or getTopCryptos().
- server/routes/real-processing.ts:234 — `userId` was block-scoped inside the try and referenced only in the catch, so on any error the catch itself threw ReferenceError (masking the original error and the FK-diagnostic response). Hoisted the declaration to function scope (`let userId: string | null = null`) so the intended diagnostic log/response works; success path unchanged.
- server/services/autonomousTradingEngine.ts:366 — update payload set `streamPointsEarned` on the aiAgents table, but that column lives on viewerWatchRewards, not aiAgents; drizzle silently drops the key so agent stream-points were never persisted. Removed the dead key. (The now-unused `pointsEarned` local at :360 is harmless and left as-is; no tsc error.)
- server/services/socialMarketGenerator.ts:131 — user insert set `pointsBalance: 1000000`, but the users table has no `pointsBalance` column (it has `streamPoints`); drizzle silently dropped it so the AI creator account never got liquidity balance. Removed the dead key.

## Reported by burn-down group 3

- autonomous-trading-engine.ts:211 — `avatarTradesTable.tradingPersona` column does not exist (undefined) → drizzle select build throws (caught, returns 500). Likely intent: `tradingStyle`.
- autonomous-trading-engine.ts:220 — `avatarTradesTable.fee` column does not exist → same throw. No fee column exists on avatar_trades; likely meant to be omitted/derived.
- autonomous-trading-engine.ts:222 — `avatarTradesTable.confidence` column does not exist → same throw. Likely intent: reuse of aiTrades.probability semantics; no confidence column on avatar_trades.
- agentSummarySubmitter.ts:179 — `getStorage()` is not defined (ReferenceError, caught → "Bounty claim failed" logged, claim silently skipped). Likely intent: use the module-imported `storage` (the class already imports it at top). Preserved as a throw via globalThis-undefined cast.
- live-streaming.ts:701 — `avatar1[0].avatarUrl` does not exist on knowledgeAvatars row (always undefined; hostAvatar for debate replays is never populated). Likely intent: `imageUrl`.
- live-streaming.ts:715 — `enhancedStreamingService` is not defined (never imported); ReferenceError caught → replays endpoint returns empty recordings, so regular (non-debate) replays never appear. Likely intent: import/use `getEnhancedStreamingService()` from ../services/enhancedStreamingService. Preserved as a throw via globalThis-undefined cast.
- marketEventModelingService.ts:409 — `federalReserveService.getUpcomingEvents(timeframe)` passes a string ('1d'|'7d'|'30d'|'90d') where the method signature expects `number` (limit). Genuine arg-type bug; the timeframe is coerced/ignored as a limit at runtime. Cast preserves the call.
- marketEventModelingService.ts:746 — TradingSignal.timeframe set to '24h' but the union only allows '5m'|'15m'|'1h'|'4h'|'1d'|'1w'|'long_term'. Invalid enum value flows into signals. Cast preserves the emitted value.
- autonomousAgentService.ts:471 — passes `agent.id` (string) as SubmitSummaryParams.agentId (typed number). Runtime-compatible (only consumed via String()), but signature/type is inconsistent across agent services.

## Reported by burn-down group 4

- server/services/patternRecognitionService.ts:564 — `troughs = findPeaks(...).map(x => -x)` negates `{value,index}` OBJECTS producing NaN, then lines 597/607/612 read `t.value` (undefined). support/resistance levels, pattern height, and targetPrice for head-and-shoulders are NaN. Likely intent: `.map(x => ({ ...x, value: -x.value }))` (as done correctly at line 830).
- server/services/patternRecognitionService.ts:1545 — `findPeaks(data)` called without required `minDistance`; at runtime `minDistance` is undefined so the loop bounds are NaN and it always returns `[]`. `findSupportResistanceLevels` therefore never returns any levels. Likely intent: pass a distance like `5`.
- server/routes/portfolio-news.ts:217 & 276 — `getTimeAgo` is not defined in this module (it exists only as a local fn in price-alerts.ts / newsletterTemplate.ts). Both `/api/portfolio-news` and `/api/portfolio/news/:symbol` throw and return 500. Likely intent: define/import a `getTimeAgo(date)` helper.
- server/routes/social-feed.ts:134 — `storage.getPredictionMarkets` does not exist on DatabaseStorage (also called internally at storage.ts:2399 but never defined). `/api/content-topics` catches it and returns `{topics: []}` so markets never contribute. Likely intent: an actual prediction-markets query method.
- server/services/avatarMarketGenerator.ts:124 — `pointsBalance: 1000000` on the AI-creator user insert is silently discarded; the users table column is `streamPoints`. Likely intent: `streamPoints: 1000000`.

No files outside my list were edited (read-only inspection of storage.ts, schema.ts, socialTradingService.ts, price-alerts.ts for context).