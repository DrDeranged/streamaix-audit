# Known Runtime Bugs (found during TypeScript burn-down, 2026-08-15)

These are genuine runtime defects discovered while eliminating all tsc errors.
Per policy, behavior was NOT changed silently — the code was typed to reflect
what it actually does (including crashing paths). Each item needs a deliberate fix.

Legend: **[A]** = ambiguous, left in place pending a product/architecture decision.
Items that have been fixed (or were already fixed) have been removed from this list.

## Remaining ambiguous items ([A] — do NOT auto-fix)

- **[A]** server/routes/push-notifications.ts:182,183 — `volumeSpikes`/`weeklyPreview`
  accessed but not columns on `pushSubscriptions` → always undefined in subscriptions
  listing (PATCH /preferences also writes these keys which drizzle silently drops).
  Decision needed: add the columns to the schema (schema change — out of scope here)
  or drop the feature. No safe drop-in fix.
- **[A]** server/routes/live-streaming-monetization.ts:265 & :293 —
  `storage.updateUserPoints(...)` does not exist; channel-points redeem and gift-subs
  endpoints throw (points never deducted). Unlike the trivia-award path (which maps
  cleanly to pointsService.awardPoints), these are point *deductions*; pointsService
  exposes no matching debit/adjustment method. Decision needed: add a
  points-deduction method to pointsService, then wire both endpoints to it.
- **[A]** server/routes/alpha-intelligence.ts:834 — getInstitutionalFundFlows only
  accepts '1h'|'24h'|'7d'; a '30d' timeframe query flows through unmapped
  (else-branch passes '30d'), which the service can't handle. Cast preserves behavior.
  Decision needed: either extend the service to support '30d' or reject/clamp the
  input at the route.
- **[A]** server/routes/price-alerts.ts:373, :429, :474 —
  `marketDataService.getCryptoData()` does not exist; the 3 market-intelligence
  endpoints (signals/whales/sentiment) always hit their catch and return fallback
  data. Two plausible replacements (getCryptoStats() vs getTopCryptos()) with
  different shapes → ambiguous. Decision needed: pick the intended data source and
  remap the transforms accordingly.
- **[A]** server/services/autonomousAgentService.ts:471 — passes `agent.id` (string)
  as SubmitSummaryParams.agentId (typed number). Runtime-compatible (only consumed
  via String()), so NOT a live runtime defect — a type/signature inconsistency across
  agent services. Decision needed: normalise the agentId type across the agent
  service surface (touches shared param shapes).
