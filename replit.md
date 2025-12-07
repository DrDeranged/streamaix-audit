# StreamAiX

## Overview
StreamAiX is a decentralized AI application designed to convert long-form audio-visual content into concise, blog-style summaries. It utilizes AI processing and Web3 technologies to generate monetizable, ownable knowledge assets stored on decentralized networks. The project aims to deliver advanced analytics, market intelligence, and a gamified bounty system for content creators and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The project employs a modern tech stack with a strong emphasis on an AI-Native aesthetic and Web3 integration.

### Auto-Seed System (Idempotent & Self-Healing)
On every server startup, `server/auto-seed.ts` intelligently checks the database state and automatically fills any gaps:
1. **17 Knowledge Avatars** - Crypto industry influencers (Marc Andreessen, Chris Dixon, Gavin Wood, etc.) - checks existing count, creates only missing avatars
2. **100 Autonomous AI Agents** - Full user accounts with `isAiAgent=true`, 1.5M STREAM points distributed across 5 tiers (whales, power users, active, casual) - self-corrects to target of 100
3. **50 AI Trading Bots** - Stored in `aiAgents` table with diverse personalities, strategies, and risk tolerances - ensures exactly 50 exist
4. **11 Prediction Markets** - Covering crypto, DeFi, bounty, real-world, and community categories with initial liquidity - adds missing markets without duplicating
5. **3 Prediction Leagues** - Weekly Crypto Champions, Newcomers Welcome League, and DeFi Masters League with varied entry fees and prize pools

**Key Features:**
- **Idempotent**: Safe to run multiple times, won't create duplicates
- **Self-Healing**: Automatically detects and fixes incomplete deployments
- **Non-Destructive**: Preserves existing data while filling gaps
- **Works Everywhere**: Fresh deployments AND existing databases both reach target state

Auto-seed runs in background (non-blocking) after background services start. Server is ready in ~30 seconds instead of 10+ minutes. Logs show current vs. target counts for each stage (e.g., "✅ Prediction markets complete (3/11)" → creates 8 missing markets).

### UI/UX Decisions
The frontend is built with React 18 and TypeScript, styled using TailwindCSS, shadcn/ui, and Radix UI. The design incorporates an AI-Native aesthetic featuring neural network visualizations, advanced glass morphism, iridescent borders, and 3D depth transforms. Key visual elements include animated neural network backgrounds, multi-layer frosted glass effects, 3D animations, and custom components like ConfidenceRing and AnimatedCounter. A custom CSS design system provides utility classes for various visual effects, and a consistent color scheme (Amber, Cyan, Emerald) is used for AI confidence visualization. Both light and dark modes are supported with a mobile-first responsive layout, and animations are driven by Framer Motion and custom CSS keyframes.

### Cost Optimization Strategy (OpenAI API - 90%+ Reduction)
**Model Selection:**
- **GPT-4o**: Reserved ONLY for `rebuiltContentProcessor.ts` (premium video content analysis)
- **GPT-4o-mini**: All other AI operations (90% cheaper, ~20 services migrated)

**Optimized Service Cycle Times (MAJOR COST REDUCTION - Dec 2025):**
- AI Trend Spotter: 48 hours (creates ~1 market every 2 days)
- AI Meta-Trader: 6 hours (6x reduction from 60min)
- AI Content Moderator: 8 hours (5x reduction from 90min)
- AI Community Manager: 8 hours (4x reduction from 2hrs)
- AI Market Resolver: 12 hours (8x reduction from 90min)
- AI Liquidity Provider: 12 hours (6x reduction from 2hrs)
- AI Treasury Manager: 72 hours (3x reduction from 24hrs)
- Autonomous Agent Cron: 5-7 hours random (12x reduction from 30min)
- AI Trading Bot Service: 5-7 hours random (12x reduction)

**Estimated Monthly Cost: $15-25/month** (down from $75-135/month)

### API Pause Feature (Emergency Cost Control)
Set `PAUSE_OPENAI_API=true` in environment variables to immediately halt all OpenAI API consumption while keeping the platform operational. This pauses:
- Avatar Voice Streaming (TTS generation)
- Autonomous AI Agents (GPT summaries, comments)
- AI Trading Bots (market analysis)
- AI Market Resolver, Liquidity Provider, Trend Spotter
- AI Content Moderator, Community Manager, Treasury Manager
- AI Meta-Trader, AI Chatbot

**To Re-enable**: Set `PAUSE_OPENAI_API=false` or delete the environment variable, then restart the application.

**Services Migrated to GPT-4o-mini:**
aiContentModerator, aiMetaTrader, aiTrendSpotter, aiLiquidityProvider, aiMarketResolver, aiTreasuryManager, aiCommunityManager, agentMarketAnalyzer, aiAgentService, chatService, predictionExtractionService, avatarMarketGenerator, socialMarketGenerator, aiPredictionBackfillService, aiService (all functions)

### Technical Implementations
- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui, Radix UI, TanStack React Query, wouter, Framer Motion.
- **Backend**: Node.js with Express.js and TypeScript, using Vite for development and esbuild for production.
- **Content Processing**: OpenAI Whisper for transcription, GPT-4o for premium AI analysis (content processor only), GPT-4o-mini for all background services. Audio extraction uses yt-dlp and ffmpeg.
- **Web3 Integration**: PostgreSQL with Drizzle ORM, JWT and Web3 wallet authentication, a bounty board, prediction markets, and mocked decentralized storage (IPFS/Arweave). Configured for Base network deployment with smart contract ABIs for core functionalities.
- **Database**: PostgreSQL with Drizzle ORM, managing schemas for users, summaries, bounties, prediction markets, and AI agent data.
- **Core Features**:
    - **Authentication**: Local login, Web3 wallet, Twitter OAuth.
    - **AI Chatbot**: GPT-4o-powered assistant.
    - **Referral System**: Token rewards and leaderboard.
    - **Real-Time Collaboration**: WebSocket-powered bounty editing.
    - **PWA Support**: Offline capability and push notifications.
    - **Advanced Analytics**: `/discover` page with 9 categories, 67+ live API endpoints, real-time crypto/stock data, and market regime detection with a 3-tier API fallback system.
    - **Bounty System**: Gamified with reputation, leveling, badges, and AI-powered quality scoring.
    - **AI Discovery**: Personalized content recommendations.
    - **Smart Insights Dashboard**: AI-powered market intelligence and trading signals.
    - **Analytics Dashboard**: Platform engagement metrics.
    - **Gamification System**: Daily quests with rotating challenges, weekly missions with bigger rewards, XP progression with leveling, season pass with tiered reward tracks, social streaks (login, trading, prediction), special events, and comprehensive progress dashboard at `/gamification`.
    - **Market Intelligence Hub**: Real-time AI-powered trading signals, whale movement tracker with on-chain analytics, market sentiment analysis with social/news/technical scores, portfolio PnL tracker with position management, AI-summarized news aggregation, price alert notifications, and asset correlation heatmap at `/intelligence`.
    - **User Onboarding**: Redesigned 12-step AI-Native interactive tutorial.
    - **Prediction Markets**: Full-featured binary YES/NO markets with ERC-1155 conditional tokens, AMM-based pricing, and on-chain settlement on Base. Includes various market types, trading features, a 0.5% platform fee, and UMA Optimistic Oracle integration for resolution. Features an AI Content-to-Market Pipeline for automated prediction extraction and market creation from summaries.
    - **Autonomous AI Agent Ecosystem - Phase 2 COMPLETE**: 100 autonomous AI agents fully deployed with unique personas, 1.5M STREAM points distributed (for future airdrop), and diverse activity levels (5 whales, 10 power users, 26 active, 59 casual). Agents independently create bounties, submit GPT-4 powered summaries, **actively trade on prediction markets using STREAM points**, and engage socially (comments, votes, follows), operating 24/7 with human-like patterns and probabilistic action selection. Trading system includes GPT-4 market analysis (agentMarketAnalyzer), trade execution with position sizing based on agent tier (agentMarketTrader), and full integration with prediction market infrastructure.
    - **Full Autonomous Ecosystem - Phase 3+ COMPLETE**: Platform now runs completely autonomously with 10 AI systems managing all aspects (ultra-low-cost cycle times):
      - **AI Market Resolver** (12hr cycles): Auto-resolves expired markets using CoinGecko API + GPT-4o-mini analysis, only resolves with >75% confidence
      - **AI Liquidity Provider** (12hr cycles): Seeds new markets with balanced YES/NO liquidity (4-8K STREAM per market)
      - **AI Trend Spotter** (48hr cycles): Monitors crypto trends via CoinGecko trending API, creates 1-2 new prediction markets every 2 days
      - **AI Content Moderator** (8hr cycles): Auto-scores summaries (0-100 quality), flags spam/low-effort content
      - **AI Community Manager** (8hr cycles): Responds to unanswered posts, welcomes users, answers questions with GPT-4o-mini
      - **AI Treasury Manager** (72hr cycles): Manages platform fees, reinvests 70-90% into liquidity pools
      - **AI Meta-Trader** (6hr cycles): Exploits arbitrage opportunities and market inefficiencies with 15M STREAM capital
      - **Newsletter Automation** (Mon/Fri 8am EST): Auto-generates and sends platform highlights
      - **Autonomous System Logs**: All AI actions tracked in `autonomous_system_logs` table with reasoning, status, and metadata
      - Platform is now 100% self-reliant and requires ZERO manual intervention
    - **Autonomous Avatar Voice Streaming - Phase 4 (Dec 2025)**: Knowledge Avatars now host 24/7 autonomous live streams with actual AI-generated voice commentary:
      - **35 Knowledge Avatars**: Crypto influencers (Vitalik, CZ, Elon, Balaji, etc.) with unique OpenAI TTS voices (onyx, echo, shimmer) and personalized speaking speeds
      - **AvatarVoiceService** (`server/services/avatarVoiceService.ts`): Generates speech via OpenAI TTS-1, handles voice assignment per avatar
      - **AvatarPodcastEngine** (`server/services/avatarPodcastEngine.ts`): Continuous podcast-style commentary with 45s intervals, market reaction segments, viewer Q&A responses
      - **AutonomousAvatarStreamService** (`server/services/autonomousAvatarStreamService.ts`): Manages 2 concurrent voice streams, 45-90 minute durations, automatic rotation every 4 hours
      - **Audio Pipeline**: GPT-4o-mini generates insights → OpenAI TTS converts to speech → Base64 audio → WebSocket broadcast → Browser AudioContext playback
      - **Frontend Integration**: `AIAvatarStream.tsx` with AudioContext playback, speaking indicators, speech bubbles, neural network visualizations
      - **Cost Controls**: 30% random segment skip rate, 150 TTS calls max per stream, extended segment intervals (45s vs 25s)

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless.
- **AI Services**: OpenAI API (GPT-4o, Whisper).
- **Financial Data APIs**: Finnhub API (stocks/forex), CoinGecko API (crypto), CoinMarketCap API (crypto), Dune Analytics API (blockchain data).
- **Web3 Technologies**: Arweave/IPFS (decentralized storage), Lens Protocol, Farcaster, Optimism/Layer 2 solutions, Ethers.js v6.
- **Build & UI Tools**: Vite, esbuild, Radix UI, shadcn/ui, TailwindCSS, Framer Motion, Google Fonts.
- **Audio/Video Processing**: yt-dlp, ffmpeg.
- **Social Integration**: Twitter API.