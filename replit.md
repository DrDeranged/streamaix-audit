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

## Current Phase Tracker

- Phase 0: **in progress**
- Phase 1 (job scheduler): **done** — all background engines register through `server/jobs/scheduler.ts` (`jobScheduler`); status at `GET /api/admin/jobs` (admin-only); state persisted in `job_runs` table
- Phase 2 (model gateway): not started
- Phase 3: not started
- Phase 4: not started

## User Preferences

Preferred communication style: Simple, everyday language.

## External Notes

- Private GitHub mirror for auditing: `github.com/DrDeranged/streamaix-audit` (pushed via `GITHUB_PERSONAL_ACCESS_TOKEN` secret).
- This file is the single source of truth. Root-level markdown files other than this one may be stale — do not trust them without verification.
