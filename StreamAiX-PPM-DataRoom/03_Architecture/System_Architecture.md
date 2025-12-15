# StreamAiX System Architecture

**Document Version:** 1.0  
**Last Updated:** December 15, 2025

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STREAMAIX PLATFORM                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   React     │  │  TailwindCSS │  │   Wouter    │  │  TanStack Query     │ │
│  │   Frontend  │  │  + shadcn/ui │  │   Router    │  │  + React Hook Form  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │   WebRTC    │  │  WebSocket  │  │         Framer Motion Animations    │  │
│  │   Streams   │  │   Client    │  │         + Custom CSS Keyframes      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTPS / WSS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SERVER LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         EXPRESS.JS + VITE                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │    │
│  │  │  REST API    │  │  WebSocket   │  │  Session Management      │  │    │
│  │  │  Routes      │  │  Server (WS) │  │  (express-session + PG)  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           CORE SERVICES                             │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │    │
│  │  │ Streaming  │ │ Prediction │ │  Bounty    │ │   AI Agent     │   │    │
│  │  │  Service   │ │  Markets   │ │  System    │ │   Service      │   │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │    │
│  │  │   Avatar   │ │    AMM     │ │  Web3      │ │  Content       │   │    │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Processor     │   │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AUTONOMOUS AI SYSTEMS                          │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │    │
│  │  │ AI Market    │ │ AI Liquidity │ │ AI Trading   │                │    │
│  │  │ Resolver     │ │ Provider     │ │ Bots (50)    │                │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │    │
│  │  │ AI Agents    │ │ Avatar Voice │ │ AI Content   │                │    │
│  │  │ (100)        │ │ Streaming    │ │ Moderator    │                │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      POSTGRESQL (NEON)                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │  Users   │ │ Markets  │ │ Bounties │ │ Avatars  │ │  Agents  │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │ Streams  │ │ Sessions │ │  Trades  │ │ Chats    │ │  Logs    │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      DRIZZLE ORM                                    │    │
│  │  Type-safe queries • Schema management • Migrations                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   OpenAI    │  │  CoinGecko  │  │ CoinMarket  │  │   Dune Analytics    │ │
│  │   API       │  │   Pro API   │  │  Cap API    │  │        API          │ │
│  │ GPT-4o-mini │  │             │  │             │  │                     │ │
│  │ TTS-1       │  │             │  │             │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Finnhub   │  │   Twitter   │  │   STUN      │  │    Base Network     │ │
│  │   API       │  │   OAuth     │  │   Servers   │  │    (Configured)     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Frontend Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 18 + TypeScript | UI components |
| Styling | TailwindCSS + shadcn/ui | Design system |
| Routing | Wouter | Client-side navigation |
| State | TanStack Query | Server state management |
| Forms | React Hook Form + Zod | Form handling + validation |
| Animations | Framer Motion | Motion design |
| Streaming | WebRTC | P2P video/audio |
| Real-time | WebSocket | Live updates |

### Backend Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ | Server runtime |
| Framework | Express.js | HTTP server |
| Build | Vite + esbuild | Development & bundling |
| Database | PostgreSQL (Neon) | Persistent storage |
| ORM | Drizzle | Type-safe queries |
| Auth | Passport.js | Authentication strategies |
| Sessions | express-session | Session management |
| WebSocket | ws library | Real-time communication |

### AI Services
| Service | Model | Purpose |
|---------|-------|---------|
| Agent Analysis | GPT-4o-mini | Market predictions |
| Avatar Responses | GPT-4o-mini | Conversation |
| Content Scoring | GPT-4o-mini | Quality assessment |
| Voice Synthesis | TTS-1 | Avatar audio |
| Premium Analysis | GPT-4o | Video content only |

---

## Data Flow Diagrams

### Prediction Market Trade Flow
```
User → Frontend → REST API → AMM Service → Database
  │                              │              │
  │                              ▼              │
  │                        Price Calc           │
  │                              │              │
  │                              ▼              │
  └────────── WebSocket ← Trade Event ─────────┘
```

### Live Streaming Flow
```
Broadcaster ─────┬───── WebRTC Offer ─────┐
                 │                        │
                 ▼                        ▼
           WebSocket ◄────────────► WebSocket
           Signaling                Signaling
                 │                        │
                 ▼                        ▼
Viewer 1 ◄───── ICE Exchange ─────► Broadcaster
Viewer 2 ◄───── ICE Exchange ─────► Broadcaster
Viewer N ◄───── ICE Exchange ─────► Broadcaster
```

### Avatar Conversation Flow
```
User Question → WebSocket → Conversation Service
                                    │
                                    ▼
                             GPT-4o-mini
                       (with market data context)
                                    │
                                    ▼
                             TTS-1 Voice
                                    │
                                    ▼
              WebSocket ← Audio Chunks + Transcript
```

---

## Database Schema Overview

### Core Tables (30+)
```
users                    # User accounts + wallet addresses
summaries                # Content summaries
bounties                 # Bounty listings
bounty_hunters           # Hunter profiles
bounty_quality_scores    # AI scoring

prediction_markets       # Market definitions
market_positions         # User positions
market_trades           # Trade history
prediction_leagues       # League structures

knowledge_avatars        # 17 avatar profiles
ai_agents               # 100 agent profiles
ai_predictions          # Agent predictions
ai_trades               # Agent trade history

live_streams            # Stream metadata
stream_chat_messages    # Chat history

sessions                # Auth sessions
referral_codes          # Referral system
user_follows            # Social graph
conversations           # Discussion threads
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  TRANSPORT: HTTPS/TLS 1.3 (all connections)        │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  AUTH: Session + JWT (API/WebSocket)               │ │
│  │  - bcrypt password hashing (12 rounds)             │ │
│  │  - Wallet signature verification (ethers.js)       │ │
│  │  - Twitter OAuth 1.0a                              │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  VALIDATION: Zod schemas (all inputs)              │ │
│  │  - Request body validation                         │ │
│  │  - Query parameter sanitization                    │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  DATABASE: Drizzle ORM (SQL injection prevention)  │ │
│  │  - Parameterized queries                           │ │
│  │  - Type-safe operations                            │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  STORAGE: Environment variables (secrets)          │ │
│  │  - API keys in env vars                            │ │
│  │  - No secrets in code                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    REPLIT HOSTING                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Application Server                    │ │
│  │  - Express.js (API + WebSocket)                    │ │
│  │  - Vite dev server (frontend)                      │ │
│  │  - Background workers (AI agents, crons)           │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Neon PostgreSQL                       │ │
│  │  - Serverless PostgreSQL                           │ │
│  │  - Auto-scaling                                    │ │
│  │  - Automated backups                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints Overview

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/wallet/connect
GET  /api/auth/twitter
```

### Prediction Markets
```
GET  /api/markets
GET  /api/markets/:id
POST /api/markets
POST /api/markets/:id/trade
GET  /api/markets/:id/positions
POST /api/markets/:id/resolve
```

### Bounties
```
GET  /api/bounties
GET  /api/bounties/:id
POST /api/bounties
POST /api/bounties/:id/claim
POST /api/bounties/:id/submit
```

### Streaming
```
GET  /api/streams
GET  /api/streams/:id
POST /api/streams
POST /api/streams/:id/start
POST /api/streams/:id/end
```

### Avatars
```
GET  /api/avatars
GET  /api/avatars/:id
POST /api/avatars/:id/ask
GET  /api/avatars/:id/stream
```

---

## Cost Structure

### Monthly Operating Costs (Estimated)
| Service | Cost | Notes |
|---------|------|-------|
| OpenAI API | $15-25 | GPT-4o-mini + TTS-1 |
| CoinGecko Pro | $129 | Market data |
| Hosting | $0-25 | Replit/Neon free tier |
| TURN (future) | $50-100 | Twilio |
| **Total** | **~$200-280** | |

---

This architecture document provides a comprehensive overview of the StreamAiX platform technical infrastructure for investor due diligence purposes.
