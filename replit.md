# StreamAiX

## What This Is

StreamAiX is a prediction-markets platform with an **off-chain STREAM points economy**, an autonomous AI agent ecosystem, AI-hosted avatar streams, and AI content summarization.

**Critical distinction:** Smart contracts targeting Base exist in `/contracts`, but the LIVE user economy is **database points** (PostgreSQL, managed by `server/services/pointsService.ts`) — NOT on-chain tokens. Do not assume any user balance, trade, or bounty reward touches a blockchain.

Core surfaces:
- Binary YES/NO prediction markets traded with STREAM points
- ~100 autonomous AI agents that create bounties, trade markets, generate summaries, and comment
- Knowledge Avatars hosting continuous AI-generated audio streams (crypto + traditional finance)
- Content summarization pipeline (Whisper transcription, GPT-4o / GPT-4o-mini analysis)
- Gamification: bounties, XP, levels, badges, quests

## Architecture Map

- `server/index.ts` — **minimal production bootstrap**. Binds a port immediately, answers health probes, then dynamically imports the real app. It is deliberately import-free apart from `node:http`. Never add imports here; preserve the comment block at the top of the file explaining why.
- `server/app.ts` — real app initialization: Express setup, route registration, and background engine startup (wrapped in `safeStart()` so a failing service can't crash boot).
- `server/routes/` — per-domain route modules (auth, markets, bounties, avatars, trading, etc.).
- `server/services/` — ~110 service modules (points, market data, AI agents, streams, analytics).
- `server/middleware/validationSchemas.ts` — Zod schemas for request validation.
- `shared/schema.ts` — Drizzle ORM schema shared by client and server.
- `client/src/` — React 18 + wouter routing + TanStack Query v5 + shadcn/ui + TailwindCSS. `client/src/components/PageHeader.tsx` is the canonical page-header primitive (showcased at `/style-guide`).

Stack: Node.js/Express + TypeScript, Vite, PostgreSQL (Neon) with Drizzle ORM, OpenAI API, Finnhub/CoinGecko/CoinMarketCap/Dune for market data.

## Hard Rules for Future Changes

1. **`server/index.ts` is frozen.** No new imports, ever. The bootstrap guarantee depends on it.
2. **All new endpoints require a Zod schema** in `server/middleware/validationSchemas.ts`.
3. **All new background work must go through the job scheduler** (added in Phase 1) — never a raw `setInterval`.
4. **All AI calls must go through the model gateway** (added in Phase 2) — never instantiate a raw OpenAI/Anthropic client.
5. **Never touch `process.env.PRIVATE_KEY` handling** without explicit human approval.
6. **Run `npm run check` and `npm test`** before declaring any task complete.
7. **After any npm install, run `npm run lockfile:scrub` before committing** — Replit's proxy contaminates resolved URLs and breaks builds outside Replit.
8. **After committing, always push to origin main and verify with git ls-remote origin main** — commits left unpushed are invisible to external audits and backups.
9. **All UI work must follow DESIGN.md.** Banned classes are enforced globally across all of `client/src` by `npm run design:lint` — there is no allowlist.

## Current Phase Tracker

- Phase 0: tests **done** (121 passing); root cleanup **NOT done**
- Phase 1 (job scheduler): **done** — all background engines register through `server/jobs/scheduler.ts` (`jobScheduler`); status at `GET /api/admin/jobs` (admin-only); state persisted in `job_runs` table. Budget enforcement: **done** — `checkBudget()` in `apiCostTracker` (persistent `api_spend_daily` ledger, `DAILY_AI_BUDGET_USD` default 25) enforced inside `modelGateway` (every call requires `priority` + `tag`): ≥80% sheds cosmetic-tag background calls, ≥100% blocks all background, ≥150% blocks user calls (503). Whisper/TTS sites are guarded the same way. Admin view: `GET /api/admin/costs`.
- Phase 2 (model gateway): **done** — gateway at `server/lib/modelGateway.ts` is Anthropic-backed (tiers: reasoning→claude-sonnet-4-6, fast→claude-haiku-4-5-20251001, overridable via `MODEL_REASONING`/`MODEL_FAST` env; JSON via instruction + fence-strip + one repair retry; respects `PAUSE_ANTHROPIC_API`). ALL text/reasoning AI calls in `server/` route through it — zero direct `chat.completions.create` remain. OpenAI has been REMOVED entirely (package uninstalled, `server/lib/openaiClient.ts` deleted, `OPENAI_API_KEY`/`PAUSE_OPENAI_API` purged). Audio input: video transcription now uses yt-dlp caption extraction (`server/services/captionExtractor.ts`) — videos without captions get a graceful 422; direct audio uploads/mic input are NOT transcribed server-side (graceful 'not supported' response). Speech output: client-side Web Speech API (`client/src/components/ui/speak-button.tsx`); all server-side TTS endpoints return 410.
- Phase 3 (evidence resolution + risk engine): **done**
- Phase 4 (token bridge scaffolding): server scaffolding **done**; contracts NOT deployed; `ONCHAIN_WRITES_ENABLED` and `BRIDGE_ENABLED` both off

## TOKEN BRIDGE: dormant by design

The points-to-token bridge (`server/services/bridgeService.ts`, `server/routes/bridge.ts`, `bridge_requests` table) is scaffolded but **DISABLED on purpose**. Enabling `BRIDGE_ENABLED` and `ONCHAIN_WRITES_ENABLED` is a **business + legal decision requiring human sign-off, not a bug to fix**. Do not flip either flag, "helpfully" wire an automatic minting path, or treat the 403 "bridge not yet enabled" response as an error.

- `ONCHAIN_WRITES_ENABLED=false` (default): every on-chain write in `contractService` throws; reads still work.
- `BRIDGE_ENABLED=false` (default): all bridge endpoints return 403; `bridgeService` methods throw.
- Minting a token requires BOTH flags on PLUS an explicit human admin approval (`POST /api/admin/bridge/:id/approve`). There is no automatic mint path anywhere — keep it that way.
- Server writes sign with `SERVICE_SIGNER_PRIVATE_KEY` (limited MINTER_ROLE key). The legacy `PRIVATE_KEY` (admin key) is deprecated for server-side writes.
- Every attempted write (success or failure) is audited in the `onchain_actions` table.

## AGENT SIGNALS: dormant by design

Agent Signals (`server/services/agentSignalService.ts`, `server/routes/signals.ts`, `agent_signals` table) ship dark behind `SIGNALS_ENABLED=false` (default). Flipping the flag is a **human decision pending legal review — not a bug to fix**, same discipline as the bridge and swap rail (`SWAPS_ENABLED`).

- `SIGNALS_ENABLED=false`: `/api/signals*` returns 403, the generation job is a no-op, and the UI hides all signal surfaces.
- Signals are observational theses (evidence + invalidation), never advice — the system prompt bans imperative advice verbs and validation rejects violations. There is NO auto-execution anywhere: users trade only through the swap rail, wallet-signed, with explicit confirmation ("Trade this" merely prefills the swap card, capped at 5% of balance, user-editable).
- Outcomes are resolved daily against real market prices; real-market signal accuracy is displayed separately from simulated stats.

## User Preferences

Preferred communication style: Simple, everyday language.

## External Notes

- Private GitHub mirror for auditing: `github.com/DrDeranged/streamaix-audit` (pushed via `GITHUB_PERSONAL_ACCESS_TOKEN` secret).
- This file is the single source of truth. Root-level markdown files other than this one may be stale — do not trust them without verification.
