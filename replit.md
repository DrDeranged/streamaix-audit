# StreamAiX

## Overview
StreamAiX is a decentralized AI application that converts long-form audio-visual content (podcasts, videos, livestreams) into blog-style summaries. It leverages AI processing and Web3 technologies to create monetizable, ownable knowledge assets stored on decentralized networks. The project aims to provide advanced analytics, market intelligence, and a gamified bounty system for content creators and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### UI/UX Decisions
The frontend uses React 18 with TypeScript, styled with TailwindCSS, shadcn/ui, and Radix UI primitives. It features an **AI-Native aesthetic** with sophisticated neural network visualizations, advanced glass morphism effects, iridescent borders, and 3D depth transforms. The design emphasizes technology-forward visuals with:
- **Neural Network Background**: Animated nodes with glowing connections, data flow particles, and mouse-reactive interactions
- **Enhanced Glass Morphism**: Multi-layer frosted glass with iridescent shimmer effects and holographic borders
- **Advanced Animations**: 3D transforms, floating elements, circular progress visualizations, neural pulse effects, and glow animations
- **Design System**: Custom CSS utilities for `.neural-glass`, `.iridescent-border`, `.glow-pulse`, `.tilt-hover`, and `.float-3d` effects
Offering both light and dark modes with mobile-first responsive layout. Animations powered by Framer Motion and custom CSS keyframes.

### Technical Implementations
- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui, Radix UI, TanStack React Query for state management, wouter for routing, Framer Motion for animations.
- **Backend**: Node.js with Express.js and TypeScript, built with Vite for development and esbuild for production.
- **Content Processing**: Utilizes OpenAI Whisper for transcription and GPT-4o for AI analysis, summary generation, and chapter creation. Audio extraction uses yt-dlp and ffmpeg.
- **Web3 Integration**: Full PostgreSQL database with Drizzle ORM, JWT and Web3 wallet authentication, a bounty board, prediction markets, and decentralized storage integration (mocked for IPFS/Arweave). Configured for Base network deployment with smart contract ABIs for BountyBoard, STREAM ERC-20, SummaryNFT, Staking, ConditionalTokens (ERC-1155), and PredictionMarketFactory.
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless, managing schemas for Users, Summaries, Bounties, User Interactions, Knowledge Stacks, Prediction Markets, Market Positions, Market Trades, Market Resolutions, Liquidity Providers, and Market Predictors.
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
    - **User Onboarding**: Redesigned AI-Native onboarding modal with 12-step interactive tutorial featuring:
        - Neural network animated background with glowing nodes and connections
        - Circular progress ring (Apple Watch style) instead of traditional dots
        - Enhanced glass morphism with iridescent shimmer effects
        - 3D floating icon animations and depth transforms
        - Modernized layout with better spacing and visual hierarchy
        - Minimized floating widget for continued navigation
        - Step-by-step platform walkthrough with interactive elements
    - **Prediction Markets**: Full-featured binary YES/NO prediction market platform (Polymarket-inspired) with:
        - **Smart Contracts**: ERC-1155 conditional tokens, AMM-based pricing, on-chain settlement on Base network
        - **Market Types**: Crypto predictions, DeFi events, bounty outcomes, real-world events, community predictions
        - **Trading Features**: Buy/sell positions, real-time pricing with constant product AMM (x*y=k), slippage protection, price impact calculation
        - **Economic Model**: 0.5% platform fee, 100 STREAM market creation deposit, liquidity mining rewards
        - **Resolution System**: UMA Optimistic Oracle integration, automated settlement, manual admin resolution, predictor stats tracking
        - **Leaderboard**: User rankings by accuracy rate, profit/loss tracking, achievement badges, streak tracking
        - **Landing Page Section**: Featured markets showcase between BountyFeed and SocialEcosystem sections
        - **Full Pages**: `/markets` listing page with category filters, `/markets/:id` detail page with trading interface
        - **Backend Services**: predictionMarketService, ammService, resolutionService with comprehensive API routes
        - **Database Schema**: predictionMarkets, marketPositions, marketTrades, marketResolutions, liquidityProviders, marketPredictors tables
        - **AI Content-to-Market Pipeline**: Automated prediction extraction from summaries using GPT-4, AI-suggested markets on summary pages, one-click market creation from content analysis, bidirectional linking between summaries and markets via `linkedSummaryId`

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless
- **AI Services**: OpenAI API (GPT-4o for chatbot, quality scoring, content analysis, Whisper for transcription)
- **Financial Data APIs**:
    - Finnhub API: Real-time stock and forex data.
    - CoinGecko API: Crypto prices (primary, rate-limited at 10K calls).
    - CoinMarketCap API: Crypto prices and market data (secondary fallback, monthly credit limit reached).
    - Dune Analytics API: **Fully implemented** blockchain data and on-chain DEX price queries (tertiary fallback). Queries 15+ ERC-20 tokens using contract addresses, tries 4 different public query IDs for maximum coverage. Free tier rate-limited at ~2,500 credits/month.
- **Web3 Technologies**: Arweave/IPFS (decentralized storage), Lens Protocol, Farcaster (social), Optimism/Layer 2 solutions, Ethers.js v6.
- **Build & UI Tools**: Vite, esbuild, Radix UI, shadcn/ui, TailwindCSS, Framer Motion, Google Fonts (Inter, Orbitron).
- **Audio/Video Processing**: yt-dlp, ffmpeg.
- **Social Integration**: Twitter API (currently rate-limited).