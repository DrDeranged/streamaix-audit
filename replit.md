# StreamAiX

## Overview
StreamAiX is a decentralized AI application designed to convert long-form audio-visual content into concise, blog-style summaries. It utilizes AI processing and Web3 technologies to generate monetizable, ownable knowledge assets stored on decentralized networks. The project aims to deliver advanced analytics, market intelligence, and a gamified bounty system for content creators and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The project employs a modern tech stack with a strong emphasis on an AI-Native aesthetic and Web3 integration.

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
    - **Autonomous AI Agent Trading System**: Phase 1 implements autonomous AI agents that analyze and trade on prediction markets using GPT-4 for analysis and personality-driven prompts. Agents operate with distinct personalities and position sizing, accessing real-time market data.
    - **Autonomous AI Agent Ecosystem (100 Agents - Phase 2)**: 100 autonomous AI agents populated with unique personas, STREAM points (for future airdrop), and diverse activity levels. Agents independently create bounties, submit summaries, trade prediction markets, and engage socially, operating 24/7 with human-like patterns and probabilistic action selection.

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless.
- **AI Services**: OpenAI API (GPT-4o, Whisper).
- **Financial Data APIs**: Finnhub API (stocks/forex), CoinGecko API (crypto), CoinMarketCap API (crypto), Dune Analytics API (blockchain data).
- **Web3 Technologies**: Arweave/IPFS (decentralized storage), Lens Protocol, Farcaster, Optimism/Layer 2 solutions, Ethers.js v6.
- **Build & UI Tools**: Vite, esbuild, Radix UI, shadcn/ui, TailwindCSS, Framer Motion, Google Fonts.
- **Audio/Video Processing**: yt-dlp, ffmpeg.
- **Social Integration**: Twitter API.