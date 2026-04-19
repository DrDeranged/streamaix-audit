# StreamAiX

## Overview
StreamAiX is a decentralized AI application that converts long-form audio-visual content into concise, blog-style summaries. It leverages AI processing and Web3 technologies to create monetizable, ownable knowledge assets stored on decentralized networks. The project aims to provide advanced analytics, market intelligence, and a gamified bounty system for content creators and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The project utilizes a modern tech stack with a strong emphasis on an AI-Native aesthetic and Web3 integration.

### Auto-Seed System
An idempotent and self-healing auto-seed system (`server/auto-seed.ts`) ensures the database is consistently populated with essential data upon server startup. This includes creating 17 Knowledge Avatars, 100 Autonomous AI Agents, 50 AI Trading Bots, 11 Prediction Markets, and 3 Prediction Leagues. The system is non-destructive, preserving existing data while filling gaps, and runs in the background.

### UI/UX Decisions
The frontend is built with React 18 and TypeScript, styled using TailwindCSS, shadcn/ui, and Radix UI. It features an AI-Native aesthetic with neural network visualizations, advanced glass morphism, iridescent borders, and 3D depth transforms. Key visual elements include animated neural network backgrounds, multi-layer frosted glass effects, 3D animations, and custom components like ConfidenceRing and AnimatedCounter. A consistent color scheme (Amber, Cyan, Emerald) is used for AI confidence visualization, supporting both light and dark modes with a mobile-first responsive layout. Animations are powered by Framer Motion and custom CSS keyframes.

### Cost Optimization Strategy
The system employs a cost-effective strategy for AI services, primarily using GPT-4o-mini for most AI operations (90%+ cost reduction) and reserving GPT-4o for only two surfaces: (1) premium video content analysis (`rebuiltContentProcessor.ts`) and (2) the new Smart Insights reasoning-chain engine (`smartInsightsEngine.ts`, 15-minute cache). Service cycle times for various AI components have been significantly optimized (e.g., AI Meta-Trader from 60min to 6 hours).

**April 2026 cost forensics (Task #4)**: A full inventory of every `openai.chat.completions.create` and `openai.audio` call was produced. The trading-signal generator (`aiTradingSignalsService.ts`) and two orphaned legacy content processors (`realContentProcessor.ts`, `cleanContentProcessor.ts`) were downgraded from gpt-4o to gpt-4o-mini. The new Smart Insights engine is the only new gpt-4o caller and is aggressively cached (15-minute TTL via `cacheService`, admin-only force-refresh). Estimated monthly OpenAI cost is now **~$8-10/month** (down from $15-25). Full inventory + per-call justifications: `docs/OPENAI_MODEL_INVENTORY.md`.

### Voice-Driven AI Assistant (April 2026)
A floating mic button in the bottom-right of every authenticated page lets users speak to the platform:
- Frontend: `client/src/components/VoiceAssistant.tsx` mounts globally in `App.tsx`. Uses MediaRecorder (webm/opus or mp4 fallback). Press once to start, press again (or wait 12s) to stop. A panel shows transcript, assistant text reply, and intent. TTS audio auto-plays.
- Backend: `server/services/voiceAssistantService.ts` runs whisper-1 (transcription) → gpt-4o-mini (JSON-structured response with strict Zod parsing including spokenResponse, displayResponse, and intent) → tts-1 (nova voice, mp3). Live CoinGecko/Finnhub crypto snapshot is injected into the system prompt so price questions return real numbers.
- Route: `POST /api/assistant/voice` (auth + `mediumLimit` rate limit + Zod `voiceAssistantSchema` body, 4MB JSON body limit). Accepts `{audioBase64, mimeType, currentPath}`; returns `{transcript, spokenResponse, displayResponse, intent, audioBase64, audioMimeType}`.
- Intents: `navigate` (auto-routes to `/dashboard`, `/markets`, `/insights`, `/bounties`, `/discover`, `/avatars`, `/portfolio`, `/streams`, `/leaderboard`), `lookup_market`, `check_balance`, `summarize_bounty`, `none`.
- Cost-safe: `PAUSE_OPENAI_API=true` short-circuits with a deterministic "paused" reply (no API calls).

### Smart Insights Reasoning Engine (April 2026)
The `/insights` dashboard now renders real reasoning chains instead of hardcoded mock cards:
- Backend: `server/services/smartInsightsEngine.ts` produces 5-7 insights per cycle spanning regime shifts, divergences, contrarian setups, cross-asset narratives, "if X then Y" conditionals, opportunities, and risks. Uses gpt-4o with strict JSON output and 15-minute caching.
- Routes: `GET /api/smart-insights/reasoning` (public, cached) and `POST /api/smart-insights/reasoning/refresh` (admin only, force re-generation, rate-limited).
- Frontend: `client/src/pages/InsightsDashboard.tsx` displays each insight with its numbered reasoning chain, an If→Then panel for conditional insights, asset badges, sentiment, confidence, and impact. Falls back gracefully when the API key is missing or `PAUSE_OPENAI_API=true`.

### CoinGecko API Optimization
To manage API usage, aggressive caching and schedule optimization have been implemented. Cache TTLs for market data services have been increased 6-60x, and cron schedules for market intelligence notifications have been significantly reduced (e.g., price alerts from 15min to 2hr). These measures are expected to reduce CoinGecko API calls by approximately 85%.

### Quiet Mode & API Pause Feature
`QUIET_MODE=true` disables all background polling services, only fetching data on-demand, leading to a 95%+ reduction in API calls. `PAUSE_OPENAI_API=true` immediately halts all OpenAI API consumption for emergency cost control, pausing services like Avatar Voice Streaming and Autonomous AI Agents while keeping the platform operational.

### Security Hardening (April 2026)
A pre-pitch security sweep tightened authentication, admin access, and rate limits across the backend:
- New `server/middleware/security.ts` exposes tiered rate limiters (`strictLimit`, `mediumLimit`, `looseLimit`, `signupLimit`, `authLimit`), a `requireAdminFlexible` middleware (env-secret OR admin user), a `disableInProd` guard, and a `validateBody` Zod helper
- `JWT_SECRET` and `SESSION_SECRET` now throw at startup if missing in production (no insecure fallback)
- Token verification errors no longer logged in production
- 28 previously unprotected mutation/admin/AI endpoints now require auth + appropriate rate limiting
- 3 hardcoded admin secret fallbacks (`'streamaix-reseed-2024'`, `'your-session-secret'`) removed
- Test/debug echo endpoints now return 404 in production
- Login/register/wallet-login/waitlist endpoints now have brute-force rate limits
- Full report: `SECURITY_AUDIT.md`

### Performance Optimizations (December 2025)
Comprehensive performance optimizations have been applied to reduce lag and improve responsiveness:

**Backend Optimizations:**
- GZIP compression (level 6) enabled on Express server for all responses >1KB
- 19 database indexes added for frequently queried fields (user_id, market_id, created_at, agent_id, status, etc.)
- In-memory cache service (`cacheService.ts`) with TTL-based invalidation
- AI agent/trading bot cycles extended to 5-7 hours (down from minutes) to reduce database load

**Frontend Optimizations:**
- React Query global staleTime increased to 10 minutes, gcTime to 30 minutes
- Aggressive refetch interval reductions across all pages (10s → 30-60s)
- Lazy loading for all heavy pages via React.lazy() and Suspense
- WebSocket throttling for real-time updates

**Key Refetch Interval Changes:**
- AI trades feed: 10s → 60s
- Volume stats: 5s → 30s  
- Stream data: 10s → 30s
- Market activity: 10s → 60s
- Co-hosts display: 10s → 30s

**API Route Caching (December 2025):**
- `/api/avatars` cached for 5 minutes
- `/api/prediction-markets` cached for 2 minutes
- `/api/prediction-markets/trending` cached for 3 minutes
- Cache service uses in-memory TTL-based invalidation

**Code Quality Improvements (December 2025):**
- Production-safe logger utility (`server/utils/logger.ts`) with environment-aware log levels
- Error boundaries for graceful error handling in UI sections
- Page skeleton components for consistent loading states
- Keyboard navigation hooks (`useKeyboardNav.ts`) for accessibility
- Skip link and screen reader utilities for WCAG compliance
- TypeScript errors reduced in newsletter-admin.tsx (36 → 0)

### Technical Implementations
- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui, Radix UI, TanStack React Query, wouter, Framer Motion.
- **Backend**: Node.js with Express.js and TypeScript, using Vite and esbuild.
- **Content Processing**: OpenAI Whisper for transcription, GPT-4o for premium AI analysis, GPT-4o-mini for background services. Audio extraction uses yt-dlp and ffmpeg.
- **Web3 Integration**: PostgreSQL with Drizzle ORM, JWT and Web3 wallet authentication, bounty board, prediction markets, and mocked decentralized storage (IPFS/Arweave). Configured for Base network deployment with smart contract ABIs.
- **Database**: PostgreSQL with Drizzle ORM for users, summaries, bounties, prediction markets, and AI agent data.
- **Core Features**:
    - **Authentication**: Local, Web3 wallet, Twitter OAuth.
    - **AI Chatbot**: GPT-4o-powered assistant.
    - **Referral System**: Token rewards and leaderboard.
    - **Real-Time Collaboration**: WebSocket-powered bounty editing.
    - **PWA Support**: Offline capability and push notifications.
    - **Advanced Analytics**: `/discover` page with diverse categories, live API endpoints, real-time data, and market regime detection with a 3-tier API fallback.
    - **Bounty System**: Gamified with reputation, leveling, badges, and AI-powered quality scoring.
    - **AI Discovery**: Personalized content recommendations.
    - **Smart Insights Dashboard**: AI-powered market intelligence and trading signals.
    - **Gamification System**: Daily quests, weekly missions, XP progression, season pass, social streaks, special events, and a comprehensive dashboard.
    - **Market Intelligence Hub**: Real-time AI trading signals, whale movement tracker, market sentiment analysis, portfolio PnL, AI-summarized news, price alerts, and asset correlation heatmap.
    - **User Onboarding**: A 12-step AI-Native interactive tutorial.
    - **Prediction Markets**: Full-featured binary YES/NO markets with ERC-1155 tokens, AMM-based pricing, on-chain settlement on Base, 0.5% platform fee, and UMA Optimistic Oracle integration. Includes an AI Content-to-Market Pipeline.
    - **Autonomous AI Agent Ecosystem**: 100 agents with unique personas, distributed STREAM points, and diverse activity levels. Agents create bounties, submit GPT-4 summaries, actively trade on prediction markets using STREAM points, and engage socially 24/7.
    - **Full Autonomous Ecosystem**: 10 AI systems manage the platform autonomously, including AI Market Resolver, AI Liquidity Provider, AI Trend Spotter, AI Content Moderator, AI Community Manager, AI Treasury Manager, and AI Meta-Trader, with ultra-low-cost cycle times. All AI actions are logged.
    - **Balanced Crypto + Stocks/Macro Focus (December 2025)**: The autonomous ecosystem now covers both cryptocurrency AND traditional finance equally:
      - AI Trend Spotter creates prediction markets with 50% crypto topics and 50% stocks/macro topics (NVDA, AAPL, TSLA, Fed policy, earnings, ETFs)
      - AI agents create bounties about tech stocks, earnings reports, Fed decisions alongside DeFi and NFTs
      - Knowledge questions cover stocks (P/E ratios, valuations), macro (yield curve, inflation), and ETFs alongside crypto topics
      - Uses Finnhub API for real-time stock data in trend spotting and portfolio management
    - **Autonomous Avatar Voice Streaming**: 35 Knowledge Avatars host 24/7 autonomous live streams with AI-generated voice commentary (OpenAI TTS-1), continuous podcast-style commentary, market reaction segments, and viewer Q&A responses.
    - **Unified Streaming Architecture**: Provides user-avatar streaming parity with features like on-demand TTS, Q&A queues, debate mode, audio caching, stream scheduling, and market reactions. Users can choose TTS voice, browser microphone, or text-only mode.
    - **Scheduled Daily Market Streams (January 2026)**: Automated daily market briefings hosted by random Knowledge Avatars:
      - Morning Update: 8:00 AM EST - Market overview, overnight crypto moves, pre-market stocks analysis
      - Market Close Recap: 4:00 PM EST - Daily performance summary, top movers, key events
      - Uses real market data from CoinGecko Pro and Finnhub APIs (BTC/ETH prices, Fear & Greed Index, crypto stocks)
      - AI-generated 2-3 minute commentary using GPT-4o-mini
      - Auto-saves as VOD/replays in stream_recordings table
      - **Pre-record-then-go-live flow (February 2026)**: Stream creates with 'scheduled' status, generates all commentary + TTS audio, saves recording to DB, THEN sets status to 'live' and sends notifications. 10-minute auto-end timer. Frontend auto-plays pre-recorded audio from `/api/streams/:streamId/audio` when user enables audio.
      - API endpoints: `/api/scheduled-streams`, `/api/stream-replays`, `/api/streams/:streamId/replay`
      - Manual trigger: `POST /api/admin/trigger-scheduled-stream` with type `morning_update` or `market_close`

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless.
- **AI Services**: OpenAI API (GPT-4o, Whisper, TTS).
- **Financial Data APIs**: Finnhub API, CoinGecko API, CoinMarketCap API, Dune Analytics API.
- **Web3 Technologies**: Arweave/IPFS, Lens Protocol, Farcaster, Optimism/Layer 2 solutions, Ethers.js v6.
- **Build & UI Tools**: Vite, esbuild, Radix UI, shadcn/ui, TailwindCSS, Framer Motion, Google Fonts.
- **Audio/Video Processing**: yt-dlp, ffmpeg.
- **Social Integration**: Twitter API.