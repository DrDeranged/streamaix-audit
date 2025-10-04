# StreamAiX - Compressed Replit Project Overview

## Overview
StreamAiX is a decentralized AI application that transforms long-form podcasts, videos, and livestreams into digestible blog-style summaries. It combines AI processing with Web3 technologies to create ownable, monetizable knowledge assets stored on decentralized networks. The platform aims to be a fully functional AI-powered content processing platform, supporting real-time AI transcription and analysis, with advanced enterprise features like social trading, flash loan arbitrage, and DAO governance. The project is production-ready for deployment on the Base network.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with shadcn/ui and Radix UI primitives
- **State Management**: TanStack React Query
- **Routing**: wouter
- **Animation**: Framer Motion
- **UI Design**: Futuristic, clean design with glass morphism effects, light/dark mode, responsive (mobile-first).

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Development**: Vite for development, esbuild for production
- **API**: RESTful API (`/api` prefix)

### Core Features & Implementations
- **Content Processing**: Extracts and processes video/podcast/livestream URLs, AI transcription (OpenAI Whisper), AI analysis (GPT-4o) for summaries and insights, audio extraction (yt-dlp + ffmpeg), chapter generation.
- **Web3 Integration**: Full PostgreSQL database with Drizzle ORM, user management with JWT and Web3 wallet support, real-time stream-to-summary AI processing, mock wallet system, bounty board, and decentralized storage integration.
- **Enterprise Features**: Social trading platform, flash loan arbitrage, advanced DeFi automation, security scanner, cross-chain bridge, AI content engine, DAO governance, and analytics engine.
- **Base Network Readiness**: Configured for Base network deployment with smart contract ABIs (BountyBoard, STREAM ERC-20, SummaryNFT, Staking), automatic network detection and switching, BaseScan utility links, and comprehensive error handling.

### Data Flow & Database
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless.
- **Schema**: Users, Summaries, Bounties, User Interactions, Knowledge Stacks tables with comprehensive relationships.
- **Storage Layer**: DatabaseStorage class for CRUD operations.

## External Dependencies
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless
- **Build Tools**: Vite, esbuild
- **UI Libraries**: Radix UI, shadcn/ui, TailwindCSS
- **Animation**: Framer Motion
- **Fonts**: Google Fonts (Inter, Orbitron)
- **AI Services**: OpenAI Whisper (transcription), GPT-4o (summarization/analysis)
- **Web3 Integration**: Arweave/IPFS (decentralized storage), Lens Protocol, Farcaster (social), Optimism/Layer 2 solutions, Ethers.js v6.
- **Audio/Video Processing**: yt-dlp, ffmpeg