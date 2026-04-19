# StreamAiX

## Overview
StreamAiX is a decentralized AI application designed to transform long-form audio-visual content into concise, blog-style summaries. It integrates advanced AI processing with Web3 technologies to create monetizable, ownable knowledge assets stored on decentralized networks. The project aims to provide advanced analytics, market intelligence, a gamified bounty system, and an autonomous AI agent ecosystem for content creators and consumers. Its core capabilities include AI-driven content summarization, prediction markets, and 24/7 AI-hosted live streams, fostering a new paradigm for content interaction and monetization in both crypto and traditional finance sectors.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The project is built on a modern tech stack emphasizing an AI-Native aesthetic and deep Web3 integration.

### UI/UX Design
The frontend, built with React 18, TypeScript, TailwindCSS, shadcn/ui, and Radix UI, features an AI-Native aesthetic characterized by neural network visualizations, advanced glass morphism, iridescent borders, and 3D depth transforms. It supports both light and dark modes with a mobile-first responsive layout, using a consistent color scheme (Amber, Cyan, Emerald) for AI confidence visualization. Animations are powered by Framer Motion and custom CSS keyframes. A comprehensive design system ensures a unified visual experience, incorporating semantic surface elevations, brand-focused elements, and a neon color palette.

### Technical Implementation
The backend uses Node.js with Express.js and TypeScript, leveraging Vite and esbuild. Content processing utilizes OpenAI Whisper for transcription, GPT-4o for premium analysis, and GPT-4o-mini for cost-effective background services. Audio extraction is handled by yt-dlp and ffmpeg. The system incorporates an idempotent auto-seed system for database consistency and employs a sophisticated cost optimization strategy for AI services, prioritizing GPT-4o-mini for most operations and aggressively caching expensive AI calls. PostgreSQL with Drizzle ORM is used for data management.

### Core Features
- **Decentralized AI Content Summarization**: Converts audio-visual content into monetizable summaries.
- **Prediction Markets**: Full-featured binary YES/NO markets with ERC-1155 tokens, AMM-based pricing, on-chain settlement on Base, and UMA Optimistic Oracle integration, including an AI Content-to-Market Pipeline.
- **Autonomous AI Agent Ecosystem**: A network of 100 AI agents with unique personas that create bounties, generate summaries, trade on prediction markets, and engage socially.
- **AI-Driven Market Intelligence**: Features a Smart Insights reasoning engine, real-time AI trading signals, whale movement tracking, market sentiment analysis, and a portfolio PnL dashboard.
- **Gamification System**: Includes a bounty board with reputation, leveling, badges, AI-powered quality scoring, daily quests, weekly missions, and XP progression.
- **Voice-Driven AI Assistant**: A platform-wide assistant enabling users to interact via voice for navigation, market lookups, and balance checks.
- **24/7 Autonomous Live Streams**: 35 Knowledge Avatars host continuous, AI-generated audio streams with commentary, market reactions, and Q&A, supported by a unified streaming architecture. This includes scheduled daily market streams covering both crypto and traditional finance.
- **Advanced Analytics**: A discover page with diverse categories, live API endpoints, real-time data, and market regime detection.
- **Web3 Integration**: Supports Web3 wallet authentication, leverages PostgreSQL with Drizzle ORM, and integrates with decentralized storage solutions (IPFS/Arweave).
- **Security & Performance**: Implements tiered rate limiting, robust authentication, database indexing, in-memory caching, and aggressive frontend/backend optimizations to ensure stability and responsiveness.
- **Balanced Crypto + Stocks/Macro Focus**: The autonomous ecosystem and market intelligence features equally cover cryptocurrency and traditional finance (stocks/macro), utilizing Finnhub API for real-time stock data.

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless.
- **AI Services**: OpenAI API (GPT-4o, Whisper, TTS).
- **Financial Data APIs**: Finnhub API, CoinGecko API, CoinMarketCap API, Dune Analytics API.
- **Web3 Technologies**: Arweave/IPFS, Lens Protocol, Farcaster, Optimism/Layer 2 solutions, Ethers.js v6.
- **Build & UI Tools**: Vite, esbuild, Radix UI, shadcn/ui, TailwindCSS, Framer Motion, Google Fonts.
- **Audio/Video Processing**: yt-dlp, ffmpeg.
- **Social Integration**: Twitter API.