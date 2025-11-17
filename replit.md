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

**Key Features:**
- **Idempotent**: Safe to run multiple times, won't create duplicates
- **Self-Healing**: Automatically detects and fixes incomplete deployments
- **Non-Destructive**: Preserves existing data while filling gaps
- **Works Everywhere**: Fresh deployments AND existing databases both reach target state

Auto-seed runs in background (non-blocking) after background services start. Server is ready in ~30 seconds instead of 10+ minutes. Logs show current vs. target counts for each stage (e.g., "✅ Prediction markets complete (3/11)" → creates 8 missing markets).

### UI/UX Decisions
The frontend is built with React 18 and TypeScript, styled using TailwindCSS, shadcn/ui, and Radix UI. The design incorporates an AI-Native aesthetic featuring neural network visualizations, advanced glass morphism, iridescent borders, and 3D depth transforms. Key visual elements include animated neural network backgrounds, multi-layer frosted glass effects, 3D animations, and custom components like ConfidenceRing and AnimatedCounter. A custom CSS design system provides utility classes for various visual effects, and a consistent color scheme (Amber, Cyan, Emerald) is used for AI confidence visualization. Both light and dark modes are supported with a mobile-first responsive layout, and animations are driven by Framer Motion and custom CSS keyframes.

### Technical Implementations
- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui, Radix UI, TanStack React Query, wouter, Framer Motion.
- **Backend**: Node.js with Express.js and TypeScript, using Vite for development and esbuild for production.
- **Content Processing**: OpenAI Whisper for transcription, GPT-4o for AI analysis, summarization, and chapter creation. Audio extraction uses yt-dlp and ffmpeg.
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
    - **User Onboarding**: Redesigned 12-step AI-Native interactive tutorial.
    - **Prediction Markets**: Full-featured binary YES/NO markets with ERC-1155 conditional tokens, AMM-based pricing, and on-chain settlement on Base. Includes various market types, trading features, a 0.5% platform fee, and UMA Optimistic Oracle integration for resolution. Features an AI Content-to-Market Pipeline for automated prediction extraction and market creation from summaries.
    - **Autonomous AI Agent Ecosystem - Phase 2 COMPLETE**: 100 autonomous AI agents fully deployed with unique personas, 1.5M STREAM points distributed (for future airdrop), and diverse activity levels (5 whales, 10 power users, 26 active, 59 casual). Agents independently create bounties, submit GPT-4 powered summaries, **actively trade on prediction markets using STREAM points**, and engage socially (comments, votes, follows), operating 24/7 with human-like patterns and probabilistic action selection. Trading system includes GPT-4 market analysis (agentMarketAnalyzer), trade execution with position sizing based on agent tier (agentMarketTrader), and full integration with prediction market infrastructure.
    - **Full Autonomous Ecosystem - Phase 3+ COMPLETE**: Platform now runs completely autonomously with 10 AI systems managing all aspects:
      - **AI Market Resolver** (30min cycles): Auto-resolves expired markets using CoinGecko API + GPT-4 analysis, only resolves with >75% confidence
      - **AI Liquidity Provider** (45min cycles): Seeds new markets with balanced YES/NO liquidity (4-8K STREAM per market)
      - **AI Trend Spotter** (6hr cycles): Monitors crypto trends via CoinGecko trending API, creates 3-5 new prediction markets daily
      - **AI Content Moderator** (30min cycles): Auto-scores summaries (0-100 quality), flags spam/low-effort content
      - **AI Community Manager** (60min cycles): Responds to unanswered posts, welcomes users, answers questions with GPT-4
      - **AI Treasury Manager** (24hr cycles): Manages platform fees, reinvests 70-90% into liquidity pools
      - **AI Meta-Trader** (20min cycles): Exploits arbitrage opportunities and market inefficiencies with 15M STREAM capital
      - **Newsletter Automation** (Mon/Fri 8am EST): Auto-generates and sends platform highlights
      - **Autonomous System Logs**: All AI actions tracked in `autonomous_system_logs` table with reasoning, status, and metadata
      - Platform is now 100% self-reliant and requires ZERO manual intervention

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless.
- **AI Services**: OpenAI API (GPT-4o, Whisper).
- **Financial Data APIs**: Finnhub API (stocks/forex), CoinGecko API (crypto), CoinMarketCap API (crypto), Dune Analytics API (blockchain data).
- **Web3 Technologies**: Arweave/IPFS (decentralized storage), Lens Protocol, Farcaster, Optimism/Layer 2 solutions, Ethers.js v6.
- **Build & UI Tools**: Vite, esbuild, Radix UI, shadcn/ui, TailwindCSS, Framer Motion, Google Fonts.
- **Audio/Video Processing**: yt-dlp, ffmpeg.
- **Social Integration**: Twitter API.