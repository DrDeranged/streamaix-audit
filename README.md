# StreamAiX - Decentralized AI Summarization Platform

A next-generation Web3 application that transforms long-form podcasts, videos, and livestreams into digestible blog-style summaries using AI and blockchain technology.

## 🚀 Features

- **AI-Powered Summarization**: Convert 2+ hour content into concise, digestible summaries
- **Web3 Integration**: Decentralized storage and ownership of knowledge assets
- **Real-time Processing**: Live stream analysis with Whisper AI transcription
- **Social Ecosystem**: Native integration with Farcaster, Lens Protocol, and other Web3 social platforms
- **Mobile-First Design**: Fully responsive across all devices
- **Creator Economy**: Monetizable knowledge assets with bounty system
- **Wallet Integration**: Connect and manage Web3 wallets seamlessly

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** + shadcn/ui components
- **Framer Motion** for animations
- **TanStack React Query** for state management
- **wouter** for routing

### Backend
- **Node.js** + Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **Neon** serverless database

### Build & Deployment
- **Vite** for frontend bundling
- **esbuild** for backend compilation
- **Vercel** deployment ready

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon account)

### Installation
```bash
# Clone repository
git clone <your-repo-url>
cd streamaix

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=development
```

## 🚀 Deployment

### Vercel Deployment
1. Fork this repository to your GitHub account
2. Connect your GitHub repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
4. Deploy automatically from GitHub

### Manual Build
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📱 Mobile Optimization

The application is fully optimized for mobile devices with:
- Responsive design across all components
- Touch-friendly interactive elements
- Optimized layouts for small screens
- Progressive loading for better performance

## 🎯 Core Functionality

### Landing Page
- Interactive hero section with AI processing demo
- Step-by-step process visualization
- Live demo with real-time audio analysis
- Social ecosystem integration showcase
- Creator bounty system
- Knowledge avatar profiles

### Dashboard
- User content management
- AI processing status tracking
- Analytics and insights
- Social sharing tools

### Wallet Integration
- Web3 wallet connectivity
- Transaction history
- Reward distribution
- NFT knowledge asset management

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Sync database schema

### Project Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared types and schemas
├── dist/           # Production build output
└── components.json  # shadcn/ui configuration
```

## 🌐 API Endpoints

- `GET /api/auth/user` - Get current user
- `POST /api/summaries` - Create new summary
- `GET /api/summaries` - List user summaries
- `POST /api/bounties` - Create bounty
- `GET /api/bounties` - List available bounties

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live Demo**: [Deployed on Vercel]
- **Documentation**: [Project Wiki]
- **Contact**: arslandin.founder@streamaix.com

## 🚨 Production Ready

This application is fully production-ready with:
- ✅ Comprehensive mobile responsiveness
- ✅ Optimized build pipeline
- ✅ Database integration
- ✅ Error handling
- ✅ Performance optimization
- ✅ Security best practices
- ✅ Deployment configuration

Built with ❤️ for the decentralized future of knowledge sharing.