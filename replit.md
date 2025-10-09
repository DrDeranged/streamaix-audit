# StreamAiX

## Overview
StreamAiX is a decentralized AI application that converts long-form audio-visual content (podcasts, videos, livestreams) into blog-style summaries. It leverages AI processing and Web3 technologies to create monetizable, ownable knowledge assets stored on decentralized networks. The project aims to provide advanced analytics, market intelligence, and a gamified bounty system for content creators and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### UI/UX Decisions
The frontend uses React 18 with TypeScript, styled with TailwindCSS, shadcn/ui, and Radix UI primitives. It features a futuristic, clean design with glass morphism effects, offering both light and dark modes and a mobile-first responsive layout. Animations are handled by Framer Motion.

### Technical Implementations
- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui, Radix UI, TanStack React Query for state management, wouter for routing, Framer Motion for animations.
- **Backend**: Node.js with Express.js and TypeScript, built with Vite for development and esbuild for production.
- **Content Processing**: Utilizes OpenAI Whisper for transcription and GPT-4o for AI analysis, summary generation, and chapter creation. Audio extraction uses yt-dlp and ffmpeg.
- **Web3 Integration**: Full PostgreSQL database with Drizzle ORM, JWT and Web3 wallet authentication, a bounty board, and decentralized storage integration (mocked for IPFS/Arweave). Configured for Base network deployment with smart contract ABIs for BountyBoard, STREAM ERC-20, SummaryNFT, and Staking.
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless, managing schemas for Users, Summaries, Bounties, User Interactions, and Knowledge Stacks.
- **Core Features**:
    - **Authentication**: Local login, Web3 wallet authentication, Twitter OAuth.
    - **AI Chatbot**: GPT-4o-powered assistant for platform help and investment insights.
    - **Referral System**: Unique code generation, signup tracking, token rewards, leaderboard.
    - **Real-Time Collaboration**: WebSocket-powered multi-user bounty editing, live cursors, and reward distribution.
    - **PWA Support**: Manifest, service worker, offline capability, push notifications, mobile install prompts.
    - **Advanced Analytics**: Comprehensive `/discover` page with 9 categories of analytics (e.g., volatility forecasting, pattern recognition), 67+ live API endpoints, real-time data flow for stocks and cryptocurrencies, market regime detection. Includes a generic TTL-based in-memory cache for API rate limit prevention and cost reduction. **3-tier API fallback system**: CoinGecko → CoinMarketCap → Dune Analytics for reliable crypto data.
    - **Bounty System**: Gamified with reputation, leveling, badges, streaks, and AI-powered quality scoring. Supports multi-token bounties and a template system for easy creation.
    - **AI Discovery**: Personalized content recommendations, trending bounties, "For You" feed.
    - **Smart Insights Dashboard**: AI-powered market intelligence, trading signals, sentiment analysis, confidence scoring.
    - **Analytics Dashboard**: Platform-wide engagement metrics, activity trends, category distribution, reward distribution.
    - **User Onboarding**: Interactive 6-step tutorial tour for new users featuring platform introduction, key features walkthrough, animated modal with progress tracking, localStorage-based completion tracking, and manual replay option.

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless
- **AI Services**: OpenAI API (GPT-4o for chatbot, quality scoring, content analysis, Whisper for transcription)
- **Financial Data APIs**:
    - Finnhub API: Real-time stock and forex data.
    - CoinGecko API: Crypto prices (primary, currently rate-limited).
    - CoinMarketCap API: Crypto prices and market data (secondary fallback).
    - Dune Analytics API: Blockchain data and on-chain metrics (tertiary fallback, 2,500 credits/month free tier).
- **Web3 Technologies**: Arweave/IPFS (decentralized storage), Lens Protocol, Farcaster (social), Optimism/Layer 2 solutions, Ethers.js v6.
- **Build & UI Tools**: Vite, esbuild, Radix UI, shadcn/ui, TailwindCSS, Framer Motion, Google Fonts (Inter, Orbitron).
- **Audio/Video Processing**: yt-dlp, ffmpeg.
- **Social Integration**: Twitter API (currently rate-limited).