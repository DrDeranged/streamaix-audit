# StreamAiX - Replit Project Overview

## Overview

StreamAiX is a decentralized AI application that transforms long-form podcasts, videos, and livestreams into digestible blog-style summaries. The platform combines AI processing with Web3 technologies to create ownable, monetizable knowledge assets stored on decentralized networks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Routing**: wouter for lightweight client-side routing
- **Animation**: Framer Motion for smooth transitions and animations
- **Theme**: Light/dark mode support with custom CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Development**: Vite for development server and build tooling
- **API Structure**: RESTful API with `/api` prefix for all routes

### UI Design System
- **Component Library**: Radix UI primitives with custom styling
- **Design Tokens**: CSS custom properties for theming
- **Typography**: Inter for body text, Orbitron for headers
- **Visual Style**: Futuristic, clean design with glass morphism effects
- **Responsive**: Mobile-first approach with Tailwind breakpoints

## Key Components

### Landing Page Structure
1. **Hero Section**: Main value proposition with animated background
2. **How It Works**: 3-step process visualization
3. **Live Demo**: Interactive demonstration of AI processing
4. **Why Blockchain**: Feature grid explaining Web3 benefits
5. **Knowledge Avatars**: User profile showcases
6. **AI Suggestions**: Personalized content recommendations
7. **Bounties**: Community-driven content creation system
8. **Social Ecosystem**: Integration with Web3 social platforms
9. **Footer**: Contact and additional features

### UI Components
- **Navigation**: Fixed header with theme toggle and demo input
- **Cards**: Glassmorphism-styled content containers
- **Buttons**: Gradient-styled with hover effects
- **Forms**: Integrated form handling with validation
- **Animations**: Smooth scrolling and section transitions

## Data Flow

### Current Implementation
- **Database Integration**: Full PostgreSQL database with comprehensive schema deployed
- **State Management**: React Query for client-side state
- **Storage Layer**: DatabaseStorage class implementing full CRUD operations
- **User Management**: Complete user system with JWT authentication and Web3 wallet support
- **Processing Pipeline**: Real-time stream-to-summary AI processing with status tracking
- **Wallet Integration**: Mock wallet system with transaction history and reward distribution

### Database Schema
- **Users Table**: ID, username, password, email, wallet address, ENS name, avatar, bio
- **Summaries Table**: Content transformation data with AI processing status, Web3 storage references
- **Bounties Table**: Community-driven content creation with rewards and tip pools
- **User Interactions Table**: Likes, bookmarks, shares, views with metadata
- **Knowledge Stacks Table**: Curated collections of related summaries
- **Relations**: Comprehensive foreign key relationships between all entities
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless connection

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless
- **Build Tools**: Vite, esbuild for production builds
- **UI Library**: Extensive Radix UI component collection
- **Animation**: Framer Motion for advanced animations
- **Fonts**: Google Fonts (Inter, Orbitron)

### Web3 Integration (Planned)
- **Storage**: Arweave/IPFS for decentralized content storage
- **Social**: Lens Protocol and Farcaster integration
- **Blockchain**: Optimism and other Layer 2 solutions
- **Wallet**: Web3 wallet connectivity

### AI Services (Planned)
- **Transcription**: Whisper API integration
- **Summarization**: GPT-4 or similar large language models
- **Processing**: Custom AI pipeline for content transformation

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon PostgreSQL database
- **Environment Variables**: DATABASE_URL required for database connection

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js`
- **Static Assets**: Served from Express in production
- **Database Migrations**: Drizzle Kit for schema management

### Hosting Considerations
- **Replit Integration**: Configured for Replit deployment
- **Error Handling**: Runtime error overlay for development
- **Performance**: Optimized builds with tree shaking

### Database Management
- **Migrations**: Located in `./migrations` directory
- **Schema**: Centralized in `./shared/schema.ts`
- **Commands**: `npm run db:push` for schema deployment

## Development Notes

The application is currently in the MVP stage with a complete landing page showcasing the concept. The backend infrastructure is set up but minimal, ready for expansion with actual AI processing capabilities and Web3 integrations. The database layer uses an abstraction pattern that allows for easy switching between in-memory storage (current) and PostgreSQL (configured).

## Recent Updates

### Professional Design with Fixed Images (Latest - July 28, 2025)
- Fixed missing images in Knowledge Avatars, Summary Bounty Board, and Social + Ecosystem sections
- Created professional SVG avatars for Naval, Vitalik, and other personas
- Maintained sophisticated React design with Framer Motion animations
- Preserved all professional features: glass morphism, gradients, interactive demos
- Fixed asset bundling and relative paths for production deployment
- Package: `streamaix-IMAGES-FIXED.tar.gz` (394KB) with complete professional design

### Previous Deployment Attempts (Resolved)
- Identified root causes: Missing QueryClientProvider, Replit scripts, asset path issues
- Multiple React-based deployment packages created but consistently failed
- React Query dependencies causing runtime errors in production
- Asset bundling creating path resolution problems on static hosts

### Contact Integration
- Added founder email (arslandin.founder@streamaix.com) to footer contact section
- Linked "Join Waitlist" button to email with pre-filled subject and message
- Connected partnership inquiries to founder email for business opportunities
- Enhanced footer with comprehensive contact information and mailto links

### Mobile Optimization
- Fully responsive design across all pages and components
- Optimized navigation and hero section for mobile devices
- Enhanced dashboard layouts with mobile-friendly spacing and typography
- Improved wallet dashboard with responsive card layouts and button sizing
- Creator submission form optimized for mobile interaction

## Deployment Strategy Evaluation

### Platform Comparison (July 28, 2025)
- **Current**: Multi-platform deployment (GitHub → Vercel → GoDaddy)
- **Alternative**: Full Replit deployment with integrated domain management
- **Replit Advantages**: One-click deployment, automatic SSL, integrated database, simpler domain setup
- **Consideration**: User preference for external hosting vs. Replit's all-in-one approach

Key areas for immediate development:
1. Implement actual AI processing endpoints
2. Add Web3 wallet connectivity
3. Integrate with decentralized storage
4. Build user authentication system
5. Create content management interfaces