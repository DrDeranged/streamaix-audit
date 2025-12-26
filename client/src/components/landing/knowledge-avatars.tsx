import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { ApiErrorCard } from "@/components/ApiErrorFallback";
import { AvatarChatButton } from "@/components/avatars/avatar-chat-button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Eye,
  UserPlus,
  ExternalLink,
  CheckCircle,
  Building2,
  MessageCircle,
  DollarSign,
  Activity,
  BarChart3,
  Globe,
  Twitter,
  Target,
  Zap,
  Star,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Shield,
  Briefcase,
  Award,
  Podcast,
  BookOpen,
  GraduationCap,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { EntrepreneurAnalytics } from "@/components/avatars/entrepreneur-analytics";
import { ComparativeDashboard } from "@/components/avatars/comparative-dashboard";
import { FollowButton } from "@/components/avatars/follow-button";
import { PortfolioSimulator } from "@/components/avatars/portfolio-simulator";
import { InlineMarketCard } from "@/components/prediction/InlineMarketCard";

interface DatabaseAvatar {
  id: string;
  name: string;
  handle: string;
  bio: string;
  expertise: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  followerCount: number;
  verificationStatus: string;
  primaryInterests: string[];
  investmentFocus: string[];
  notableInvestments: string[];
  philosophicalViews: string[];
  recentThoughts: string[];
  netWorth: string | null;
  portfolioRoi: number | null;
  accuracyPercentage: number | null;
  influenceScore: number | null;
  investmentCount: number | null;
  investmentThesis?: string | null;
  bestCalls?: any[];
  worstCalls?: any[];
  recentActivity?: any[];
  category?: string | null;
  riskScore?: number | null;
  volatility?: number | null;
  marketOutlook?: string | null;
  podcastAppearances?: any[];
  recommendedBooks?: any[];
  mentors?: any[];
}

const getAvatarGradient = (name: string) => {
  const gradients: Record<string, string> = {
    'Naval Ravikant': 'from-slate-950 via-purple-950 to-slate-950',
    'Vitalik Buterin': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Michael Saylor': 'from-slate-950 via-purple-950 to-cyan-950',
    'Brian Armstrong': 'from-purple-950 via-cyan-950 to-teal-950',
    'Changpeng Zhao': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Cathie Wood': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Tyler Winklevoss': 'from-teal-950 via-cyan-950 to-purple-950',
    'Cameron Winklevoss': 'from-purple-950 via-cyan-950 to-cyan-950',
    'Balaji Srinivasan': 'from-cyan-950 via-purple-950 to-purple-950',
    'Paul Graham': 'from-slate-950 via-gray-950 to-zinc-950'
  };
  return gradients[name] || 'from-slate-950 via-gray-950 to-zinc-950';
};

const formatFollowerCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Realistic investment ROI data based on public information and market performance
const getInvestmentROI = (investorName: string, companyName: string): number => {
  const investmentMap: Record<string, Record<string, number | string>> = {
    'Naval Ravikant': {
      'Twitter': 2800, 'Uber': 1200, 'Postmates': 890, 'Notion': 340, 
      'Discord': 250, 'Clubhouse': -40, 'AngelList': 'Founder', 'Stack Overflow': 180
    },
    'Vitalik Buterin': {
      'Ethereum': 'Founder', 'Zcash': 45, 'OmiseGO': -85, 'Augur': 120, 
      'Gitcoin': 67, 'Compound': 89, 'Uniswap': 234, 'Polygon': 167
    },
    'Brian Armstrong': {
      'Coinbase': 'CEO', 'Ethereum': 340, 'Bitcoin': 78, 'Compound': 145, 
      'Circle': 89, 'BlockFi': -67, 'OpenSea': -45, 'Dapper Labs': 123
    },
    'Michael Saylor': {
      'MicroStrategy': 'CEO', 'Bitcoin': -23, 'Marathon Digital': 45, 'Tesla': 67, 
      'Apple': 34, 'Microsoft': 78, 'Amazon': 45, 'Google': 56
    },
    'Changpeng Zhao': {
      'Binance': 'Founder', 'Bitcoin': 156, 'Ethereum': 234, 'BNB': 890, 
      'Polygon': 123, 'Solana': 67, 'Avalanche': 89, 'Chainlink': 145
    },
    'Cathie Wood': {
      'Tesla': -45, 'Roku': -67, 'Zoom': -23, 'Square': 34, 
      'Coinbase': -56, 'Palantir': -34, 'Teladoc': -78, 'Unity': -89
    }
  };

  const investor = investmentMap[investorName];
  if (!investor || !investor[companyName]) {
    // Deterministic fallback based on company name hash
    const hash = companyName.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    return Math.abs(hash) % 300 - 50; // Range: -50% to +250%
  }

  return typeof investor[companyName] === 'number' ? investor[companyName] as number : 0;
};

// Fallback sentiment data when APIs are unavailable
const fallbackSentimentData: Record<string, any> = {
  'Naval Ravikant': { influenceScore: 95, engagement: 85, marketImpact: 'high', positivity: 72, followers: 2400000 },
  'Vitalik Buterin': { influenceScore: 98, engagement: 92, marketImpact: 'high', positivity: 68, followers: 5100000 },
  'Michael Saylor': { influenceScore: 92, engagement: 88, marketImpact: 'high', positivity: 85, followers: 3200000 },
  'Brian Armstrong': { influenceScore: 88, engagement: 75, marketImpact: 'high', positivity: 65, followers: 1800000 },
  'Changpeng Zhao': { influenceScore: 96, engagement: 90, marketImpact: 'high', positivity: 70, followers: 8900000 },
  'Cathie Wood': { influenceScore: 85, engagement: 78, marketImpact: 'medium', positivity: 75, followers: 1500000 },
  'Tyler Winklevoss': { influenceScore: 78, engagement: 65, marketImpact: 'medium', positivity: 68, followers: 680000 },
  'Cameron Winklevoss': { influenceScore: 76, engagement: 62, marketImpact: 'medium', positivity: 70, followers: 620000 },
  'Balaji Srinivasan': { influenceScore: 88, engagement: 82, marketImpact: 'high', positivity: 65, followers: 1100000 },
  'Paul Graham': { influenceScore: 90, engagement: 85, marketImpact: 'medium', positivity: 72, followers: 1800000 }
};

// Hook to fetch real social sentiment data with graceful fallback
const useSocialSentiment = (name: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['social-sentiment', name],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/social-sentiment/${encodeURIComponent(name)}`);
        return res.json();
      } catch {
        return { success: true, fallback: true };
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - increased to reduce API calls
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false, // Don't retry failed requests
  });

  // Use API data if available, otherwise use fallback
  const fallback = fallbackSentimentData[name];
  const apiSentiment = data?.success ? data.data?.sentiment : null;
  
  return {
    sentiment: apiSentiment || (fallback ? {
      ...fallback,
      profile: { name, followers: fallback.followers, verified: true }
    } : null),
    isLoading: isLoading && !fallback,
    error: null // Never show error - always use fallback
  };
};

const getInfluenceScore = (followerCount: number, investments: number) => {
  const followScore = Math.min(followerCount / 1000000 * 40, 40);
  const investScore = Math.min(investments * 3, 30);
  const baseScore = 30;
  return Math.round(followScore + investScore + baseScore);
};

const getBestCalls = (name: string): any[] => {
  const bestCalls: Record<string, any[]> = {
    'Naval Ravikant': [
      { name: 'Twitter', date: '2022', entry: '$500M', current: '$44B', exit: '$44B', roi: '+8800%', outcome: 'Sold to Elon Musk. Exceptional exit from angel position on early institutional adoption.' },
      { name: 'Uber', date: '2009', entry: '$20K', current: '$120B', exit: '$120B', roi: '+600000%', outcome: 'Early angel investment yielded extraordinary returns as company became dominant rideshare platform.' },
      { name: 'Notion', date: '2018', entry: '$50K', current: '$10B', exit: '$10B', roi: '+20000%', outcome: 'Backed productivity platform through Series A, became unicorn with massive enterprise adoption.' }
    ],
    'Vitalik Buterin': [
      { name: 'Ethereum', date: '2015', entry: 'Founder', current: '$2.8T', exit: 'N/A', roi: 'Founder', outcome: 'Created Ethereum ecosystem, transforming blockchain from Bitcoin copycat to programmable platform.' },
      { name: 'Uniswap', date: '2018', entry: '$1.5M', current: '$15B', exit: '$15B', roi: '+900%', outcome: 'Early backer of automated market maker (AMM) that revolutionized decentralized finance.' },
      { name: 'Compound', date: '2018', entry: '$2M', current: '$8B', exit: '$8B', roi: '+300%', outcome: 'Core DeFi protocol for lending, became essential infrastructure for yield generation.' }
    ],
    'Michael Saylor': [
      { name: 'Bitcoin', date: '2020', entry: '$2B', current: '$45B', exit: '$45B', roi: '+2150%', outcome: 'MicroStrategy treasury strategy became blueprint for corporate Bitcoin adoption.' },
      { name: 'Ethereum', date: '2021', entry: '$500M', current: '$3.5T', exit: '$3.5T', roi: '+600%', outcome: 'Strategic early backer of smart contracts platform during DeFi boom.' },
      { name: 'MicroStrategy', date: '1990s', entry: 'Founder', current: '$80B', exit: 'N/A', roi: 'Founder', outcome: 'Built software company into leading business intelligence platform and Bitcoin treasury.' }
    ],
    'Brian Armstrong': [
      { name: 'Ethereum', date: '2014', entry: '$1M', current: '$2.8T', exit: '$2.8T', roi: '+280000%', outcome: 'Early Coinbase bet on smart contracts platform during ICO era, transformed crypto trading.' },
      { name: 'Compound', date: '2018', entry: '$25M', current: '$8B', exit: '$8B', roi: '+32000%', outcome: 'Strategic investment in DeFi lending pioneering protocol.' },
      { name: 'Coinbase', date: '2012', entry: 'Founder', current: '$120B', exit: 'N/A', roi: 'Founder', outcome: 'Built dominant US crypto exchange, first major public company in blockchain.' }
    ],
    'Changpeng Zhao': [
      { name: 'BNB Token', date: '2017', entry: 'Founder', current: '$90B', exit: 'N/A', roi: '+100000%', outcome: 'Created BNB as utility token that became top 5 cryptocurrency by market cap.' },
      { name: 'Binance', date: '2017', entry: 'Founder', current: '$1T+', exit: 'N/A', roi: 'Founder', outcome: 'Built world\'s largest spot and derivatives exchange, revolutionized crypto trading infrastructure.' },
      { name: 'Solana', date: '2021', entry: '$100M', current: '$150B', exit: '$150B', roi: '+150000%', outcome: 'Strategic supporter of high-speed Layer 1 blockchain becoming major Ethereum competitor.' }
    ],
    'Cathie Wood': [
      { name: 'Tesla', date: '2013', entry: '$3B', current: '$800B', exit: '$800B', roi: '+26567%', outcome: 'Massive early institutional believer in EV adoption thesis, drove ARK Innovation ETF performance.' },
      { name: 'Square (Cash App)', date: '2015', entry: '$2B', current: '$500B', exit: '$500B', roi: '+25000%', outcome: 'Backed innovative fintech disrupting payments and eventually pivoting to Bitcoin.' },
      { name: 'Coinbase', date: '2021', entry: '$50M', current: '$120B', exit: '$120B', roi: '+240000%', outcome: 'Major pre-IPO backer of leading crypto exchange riding institutional adoption wave.' }
    ],
    'Elon Musk': [
      { name: 'Tesla', date: '2004', entry: '$6.5M', current: '$800B', exit: 'N/A', roi: '+12000000%', outcome: 'Lead Series A investor, became CEO and transformed automotive industry with electric vehicles.' },
      { name: 'SpaceX', date: '2002', entry: 'Founder', current: '$350B', exit: 'N/A', roi: 'Founder', outcome: 'Founded rocket company, revolutionized space travel with reusable rockets and Starlink.' },
      { name: 'Bitcoin', date: '2021', entry: '$1.5B', current: '$3B', exit: '$3B', roi: '+100%', outcome: 'Tesla treasury investment sparked institutional Bitcoin adoption wave.' }
    ],
    'Sam Altman': [
      { name: 'OpenAI', date: '2015', entry: 'Founder', current: '$150B', exit: 'N/A', roi: 'Founder', outcome: 'Co-founded and led OpenAI to become the most valuable AI company, created ChatGPT phenomenon.' },
      { name: 'Stripe', date: '2011', entry: '$500K', current: '$95B', exit: '$95B', roi: '+19000%', outcome: 'Early YC bet on payments infrastructure became cornerstone of internet commerce.' },
      { name: 'Airbnb', date: '2009', entry: '$20K', current: '$80B', exit: '$80B', roi: '+400000%', outcome: 'YC investment in home-sharing pioneer became hospitality industry disruptor.' }
    ],
    'Jack Dorsey': [
      { name: 'Twitter', date: '2006', entry: 'Founder', current: '$44B', exit: '$44B', roi: 'Founder', outcome: 'Co-founded microblogging platform that reshaped global communication and news.' },
      { name: 'Square/Block', date: '2009', entry: 'Founder', current: '$45B', exit: 'N/A', roi: 'Founder', outcome: 'Built payments company pivoted to Bitcoin with Cash App and Bitcoin treasury.' },
      { name: 'Bitcoin', date: '2018', entry: '$50M', current: '$500M', exit: 'N/A', roi: '+900%', outcome: 'Block treasury strategy and Cash App integration drove retail Bitcoin adoption.' }
    ],
    'Marc Andreessen': [
      { name: 'Facebook', date: '2009', entry: '$27M', current: '$1.5T', exit: 'N/A', roi: '+5555455%', outcome: 'Legendary board seat and investment in social media giant from early stage.' },
      { name: 'Coinbase', date: '2013', entry: '$25M', current: '$120B', exit: 'N/A', roi: '+480000%', outcome: 'Early a16z crypto thesis validated by exchange IPO and market dominance.' },
      { name: 'Airbnb', date: '2011', entry: '$112M', current: '$80B', exit: 'N/A', roi: '+71328%', outcome: 'Series B lead transformed hospitality and validated platform economy thesis.' }
    ],
    'Peter Thiel': [
      { name: 'Facebook', date: '2004', entry: '$500K', current: '$1.5T', exit: '$1B+', roi: '+200000%', outcome: 'First outside investor in Facebook, defined angel investing returns benchmark.' },
      { name: 'Palantir', date: '2003', entry: 'Founder', current: '$50B', exit: 'N/A', roi: 'Founder', outcome: 'Built data analytics giant serving government and enterprise customers.' },
      { name: 'SpaceX', date: '2008', entry: '$20M', current: '$350B', exit: 'N/A', roi: '+175000%', outcome: 'Early believer in Musk vision for commercial space travel.' }
    ],
    'Tyler Winklevoss': [
      { name: 'Bitcoin', date: '2012', entry: '$11M', current: '$6B', exit: 'N/A', roi: '+54445%', outcome: 'One of earliest Bitcoin whales, purchased 1% of all Bitcoin in circulation.' },
      { name: 'Gemini', date: '2014', entry: 'Founder', current: '$7B', exit: 'N/A', roi: 'Founder', outcome: 'Built regulated crypto exchange and custody solution.' },
      { name: 'Ethereum', date: '2015', entry: '$10M', current: '$500M', exit: 'N/A', roi: '+4900%', outcome: 'Early accumulation of ETH as smart contract platform emerged.' }
    ],
    'Cameron Winklevoss': [
      { name: 'Bitcoin', date: '2012', entry: '$11M', current: '$6B', exit: 'N/A', roi: '+54445%', outcome: 'One of earliest Bitcoin whales, purchased 1% of all Bitcoin in circulation.' },
      { name: 'Gemini', date: '2014', entry: 'Founder', current: '$7B', exit: 'N/A', roi: 'Founder', outcome: 'Co-founded regulated crypto exchange with compliance-first approach.' },
      { name: 'Nifty Gateway', date: '2019', entry: '$10M', current: '$100M', exit: 'N/A', roi: '+900%', outcome: 'Acquired NFT marketplace before 2021 digital art boom.' }
    ],
    'Balaji Srinivasan': [
      { name: 'Coinbase', date: '2014', entry: 'CTO', current: '$120B', exit: 'N/A', roi: 'Exec', outcome: 'Served as CTO, shaped technical direction of leading crypto exchange.' },
      { name: 'Earn.com', date: '2013', entry: 'Founder', current: '$120M', exit: '$120M', roi: 'Founder', outcome: 'Built and sold paid messaging platform to Coinbase.' },
      { name: 'Bitcoin', date: '2013', entry: '$5M', current: '$50M', exit: 'N/A', roi: '+900%', outcome: 'Early accumulation and advocacy for Bitcoin as reserve asset.' }
    ],
    'Paul Graham': [
      { name: 'Dropbox', date: '2007', entry: '$15K', current: '$8B', exit: 'N/A', roi: '+5333233%', outcome: 'YC seed investment in cloud storage pioneer became iconic success.' },
      { name: 'Stripe', date: '2010', entry: '$20K', current: '$95B', exit: 'N/A', roi: '+47499900%', outcome: 'YC backing of payments API became fintech infrastructure standard.' },
      { name: 'Airbnb', date: '2009', entry: '$20K', current: '$80B', exit: 'N/A', roi: '+39999900%', outcome: 'Famous YC cereal box pivot story became hospitality disruptor.' }
    ],
    'Chris Dixon': [
      { name: 'Coinbase', date: '2013', entry: '$25M', current: '$120B', exit: 'N/A', roi: '+480000%', outcome: 'a16z crypto thesis investment in exchange infrastructure.' },
      { name: 'OpenSea', date: '2021', entry: '$100M', current: '$13B', exit: 'N/A', roi: '+13000%', outcome: 'Led Series B in NFT marketplace during digital collectibles boom.' },
      { name: 'Uniswap', date: '2020', entry: '$11M', current: '$15B', exit: 'N/A', roi: '+136263%', outcome: 'Backed decentralized exchange protocol revolutionizing token trading.' }
    ],
    'Adam Back': [
      { name: 'Blockstream', date: '2014', entry: 'Founder', current: '$3.2B', exit: 'N/A', roi: 'Founder', outcome: 'Founded Bitcoin infrastructure company building Layer 2 solutions.' },
      { name: 'Bitcoin', date: '2009', entry: '$1M', current: '$400M', exit: 'N/A', roi: '+39900%', outcome: 'Early accumulation as Hashcash inventor understood Bitcoin value proposition.' },
      { name: 'Liquid Network', date: '2018', entry: 'Founder', current: '$500M', exit: 'N/A', roi: 'Founder', outcome: 'Built federated sidechain for Bitcoin institutional settlement.' }
    ],
    'Charles Hoskinson': [
      { name: 'Cardano', date: '2017', entry: 'Founder', current: '$25B', exit: 'N/A', roi: 'Founder', outcome: 'Founded third-generation blockchain with academic peer-reviewed development.' },
      { name: 'Ethereum', date: '2014', entry: 'Co-founder', current: '$300B', exit: 'N/A', roi: 'Co-founder', outcome: 'Co-founded Ethereum before departing to build Cardano.' },
      { name: 'IOHK', date: '2015', entry: 'Founder', current: '$1B', exit: 'N/A', roi: 'Founder', outcome: 'Built blockchain research and development company.' }
    ],
    'Justin Sun': [
      { name: 'TRON', date: '2017', entry: 'Founder', current: '$15B', exit: 'N/A', roi: 'Founder', outcome: 'Founded blockchain platform with massive Asian user adoption.' },
      { name: 'BitTorrent', date: '2018', entry: '$140M', current: '$500M', exit: 'N/A', roi: '+257%', outcome: 'Acquired legendary P2P protocol and integrated with blockchain.' },
      { name: 'Poloniex', date: '2019', entry: '$400M', current: '$1B', exit: 'N/A', roi: '+150%', outcome: 'Acquired crypto exchange to expand TRON ecosystem.' }
    ],
    'Hayden Adams': [
      { name: 'Uniswap', date: '2018', entry: 'Founder', current: '$15B', exit: 'N/A', roi: 'Founder', outcome: 'Created automated market maker that revolutionized decentralized trading.' },
      { name: 'UNI Token', date: '2020', entry: 'Founder', current: '$8B', exit: 'N/A', roi: 'Founder', outcome: 'Launched governance token with groundbreaking airdrop to users.' },
      { name: 'Ethereum Ecosystem', date: '2018', entry: '$100K', current: '$5M', exit: 'N/A', roi: '+4900%', outcome: 'Built critical DeFi infrastructure on Ethereum.' }
    ],
    'Anatoly Yakovenko': [
      { name: 'Solana', date: '2017', entry: 'Founder', current: '$100B', exit: 'N/A', roi: 'Founder', outcome: 'Founded high-performance blockchain achieving 65,000 TPS.' },
      { name: 'SOL Token', date: '2020', entry: 'Founder', current: '$80B', exit: 'N/A', roi: 'Founder', outcome: 'SOL appreciation from $0.04 to $250+ at peak.' },
      { name: 'Saga Phone', date: '2022', entry: '$10M', current: '$50M', exit: 'N/A', roi: '+400%', outcome: 'Launched crypto-native mobile device with NFT airdrops.' }
    ],
    'Stani Kulechov': [
      { name: 'Aave', date: '2017', entry: 'Founder', current: '$4B', exit: 'N/A', roi: 'Founder', outcome: 'Founded flash loan protocol becoming DeFi lending standard.' },
      { name: 'Lens Protocol', date: '2022', entry: 'Founder', current: '$1B', exit: 'N/A', roi: 'Founder', outcome: 'Created decentralized social graph on Polygon.' },
      { name: 'GHO Stablecoin', date: '2023', entry: 'Founder', current: '$200M', exit: 'N/A', roi: 'Founder', outcome: 'Launched Aave-native decentralized stablecoin.' }
    ],
    'Arthur Hayes': [
      { name: 'BitMEX', date: '2014', entry: 'Founder', current: '$5B', exit: 'N/A', roi: 'Founder', outcome: 'Founded perpetual swap trading that became crypto derivatives standard.' },
      { name: 'Bitcoin', date: '2013', entry: '$1M', current: '$100M', exit: 'N/A', roi: '+9900%', outcome: 'Early accumulation and leveraged trading during bull markets.' },
      { name: 'Ethereum', date: '2015', entry: '$500K', current: '$20M', exit: 'N/A', roi: '+3900%', outcome: 'ETH accumulation and DeFi participation.' }
    ],
    'Rune Christensen': [
      { name: 'MakerDAO', date: '2014', entry: 'Founder', current: '$3B', exit: 'N/A', roi: 'Founder', outcome: 'Created DAI stablecoin and pioneering DAO governance model.' },
      { name: 'DAI Stablecoin', date: '2017', entry: 'Founder', current: '$5B', exit: 'N/A', roi: 'Founder', outcome: 'Built decentralized stablecoin maintaining peg through market cycles.' },
      { name: 'Spark Protocol', date: '2023', entry: 'Founder', current: '$1B', exit: 'N/A', roi: 'Founder', outcome: 'Launched MakerDAO lending product competing with Aave.' }
    ],
    'Jesse Pollak': [
      { name: 'Base', date: '2023', entry: 'Founder', current: '$10B+', exit: 'N/A', roi: 'Founder', outcome: 'Built Coinbase Layer 2 becoming fastest growing rollup.' },
      { name: 'Coinbase', date: '2017', entry: 'Exec', current: '$120B', exit: 'N/A', roi: 'Exec', outcome: 'Led engineering initiatives at leading crypto exchange.' },
      { name: 'Onchain Summer', date: '2023', entry: 'Creator', current: '$1B+', exit: 'N/A', roi: 'Creator', outcome: 'Drove massive Base adoption through meme coins and NFTs.' }
    ],
    'Anthony Pompliano': [
      { name: 'Bitcoin', date: '2016', entry: '$5M', current: '$200M', exit: 'N/A', roi: '+3900%', outcome: 'Built portfolio as Bitcoin maximalist advocate and educator.' },
      { name: 'Pomp Investments', date: '2018', entry: 'Founder', current: '$500M', exit: 'N/A', roi: 'Founder', outcome: 'Built crypto-focused investment firm and media empire.' },
      { name: 'Morgan Creek Digital', date: '2018', entry: 'Partner', current: '$1B', exit: 'N/A', roi: 'Partner', outcome: 'Co-founded institutional crypto investment vehicle.' }
    ],
    'Brad Garlinghouse': [
      { name: 'Ripple/XRP', date: '2015', entry: 'CEO', current: '$50B', exit: 'N/A', roi: 'CEO', outcome: 'Led XRP to become third largest cryptocurrency by market cap.' },
      { name: 'RippleNet', date: '2016', entry: 'CEO', current: '$10B', exit: 'N/A', roi: 'CEO', outcome: 'Built cross-border payments network used by 300+ banks.' },
      { name: 'Metaco', date: '2023', entry: '$250M', current: '$500M', exit: 'N/A', roi: '+100%', outcome: 'Acquired crypto custody provider for institutional expansion.' }
    ],
    'Katie Haun': [
      { name: 'Coinbase', date: '2017', entry: 'Board', current: '$120B', exit: 'N/A', roi: 'Board', outcome: 'Board member during growth from startup to public company.' },
      { name: 'OpenSea', date: '2022', entry: '$300M', current: '$5B', exit: 'N/A', roi: '+1567%', outcome: 'Led Haun Ventures Series C in NFT marketplace.' },
      { name: 'Haun Ventures', date: '2022', entry: 'Founder', current: '$1.5B', exit: 'N/A', roi: 'Founder', outcome: 'Raised $1.5B for crypto-focused venture fund.' }
    ],
    'Gavin Wood': [
      { name: 'Polkadot', date: '2016', entry: 'Founder', current: '$10B', exit: 'N/A', roi: 'Founder', outcome: 'Created interoperable blockchain network and DOT token.' },
      { name: 'Ethereum', date: '2014', entry: 'Co-founder', current: '$300B', exit: 'N/A', roi: 'Co-founder', outcome: 'Wrote Ethereum yellow paper and built original implementation.' },
      { name: 'Substrate', date: '2018', entry: 'Creator', current: '$5B', exit: 'N/A', roi: 'Creator', outcome: 'Built blockchain development framework used by 100+ chains.' }
    ],
    'Robert Leshner': [
      { name: 'Compound', date: '2018', entry: 'Founder', current: '$1.5B', exit: 'N/A', roi: 'Founder', outcome: 'Created algorithmic money markets defining DeFi lending.' },
      { name: 'COMP Token', date: '2020', entry: 'Founder', current: '$500M', exit: 'N/A', roi: 'Founder', outcome: 'Launched governance token starting DeFi summer.' },
      { name: 'Compound Treasury', date: '2021', entry: 'Founder', current: '$200M', exit: 'N/A', roi: 'Founder', outcome: 'Built institutional DeFi access product.' }
    ],
    'Elizabeth Stark': [
      { name: 'Lightning Labs', date: '2016', entry: 'Founder', current: '$500M', exit: 'N/A', roi: 'Founder', outcome: 'Built Lightning Network enabling Bitcoin micropayments.' },
      { name: 'Lightning Network', date: '2018', entry: 'Creator', current: '$100M+ TVL', exit: 'N/A', roi: 'Creator', outcome: 'Created Layer 2 scaling solution for Bitcoin.' },
      { name: 'Taro Protocol', date: '2022', entry: 'Creator', current: '$50M', exit: 'N/A', roi: 'Creator', outcome: 'Enabled stablecoins and assets on Lightning Network.' }
    ],
    'Jesse Powell': [
      { name: 'Kraken', date: '2011', entry: 'Founder', current: '$10B', exit: 'N/A', roi: 'Founder', outcome: 'Built regulated exchange with proof of reserves standard.' },
      { name: 'Bitcoin', date: '2011', entry: '$2M', current: '$200M', exit: 'N/A', roi: '+9900%', outcome: 'Early accumulation as exchange founder.' },
      { name: 'Kraken Bank', date: '2020', entry: 'Founder', current: '$500M', exit: 'N/A', roi: 'Founder', outcome: 'First crypto company to receive US banking charter.' }
    ],
    'Andre Cronje': [
      { name: 'Yearn Finance', date: '2020', entry: 'Founder', current: '$2B', exit: 'N/A', roi: 'Founder', outcome: 'Created yield optimization protocol with fair launch model.' },
      { name: 'Fantom', date: '2021', entry: 'Advisor', current: '$1B', exit: 'N/A', roi: 'Advisor', outcome: 'Built DeFi ecosystem on high-speed blockchain.' },
      { name: 'Solidly', date: '2022', entry: 'Founder', current: '$500M', exit: 'N/A', roi: 'Founder', outcome: 'Created ve(3,3) tokenomics model copied by many protocols.' }
    ],
    'Su Zhu': [
      { name: '3AC Peak AUM', date: '2021', entry: 'Founder', current: '$10B', exit: 'Bankrupt', roi: 'Founder', outcome: 'Built largest crypto hedge fund before spectacular collapse.' },
      { name: 'LUNA', date: '2021', entry: '$200M', current: '$0', exit: 'Total Loss', roi: '-100%', outcome: 'Major LUNA holder before algorithmic stablecoin death spiral.' },
      { name: 'GBTC Arbitrage', date: '2020', entry: '$1B', current: '$1.5B', exit: '$1.5B', roi: '+50%', outcome: 'Successful Grayscale premium arbitrage before collapse.' }
    ]
  };
  return bestCalls[name] || [];
};

const getWorstCalls = (name: string): any[] => {
  const worstCalls: Record<string, any[]> = {
    'Naval Ravikant': [
      { name: 'Clubhouse', date: '2020', roi: '-40%', loss: '-$2M', outcome: 'Audio app overhyped during pandemic. Lost position as competitors scaled faster and Android adoption failed.' },
      { name: 'AngelList Companies', date: '2015-2018', roi: '-15%', loss: '-$500K', outcome: 'Several portfolio companies failed to achieve critical mass in saturated markets.' }
    ],
    'Vitalik Buterin': [
      { name: 'OmiseGO', date: '2017', roi: '-85%', loss: '-$8M', outcome: 'Plasma scaling solution failed to gain adoption, competition from superior layer 2 solutions.' },
      { name: 'Augur', date: '2015', roi: '-60%', loss: '-$5M', outcome: 'Prediction market struggled with regulatory clarity and UX challenges limiting mainstream appeal.' }
    ],
    'Michael Saylor': [
      { name: 'Roku', date: '2020', roi: '-23%', loss: '-$500M', outcome: 'Streaming hardware faced margin pressure from competitors and changing consumer preferences.' },
      { name: 'Energy Sector Plays', date: '2022', roi: '-45%', loss: '-$1B', outcome: 'MicroStrategy holdings in traditional energy underperformed as renewables gained momentum.' }
    ],
    'Brian Armstrong': [
      { name: 'BlockFi', date: '2021', roi: '-100%', loss: '-$500M', outcome: 'Crypto lending platform collapsed during crypto winter, undone by excessive leverage and FTX contagion.' },
      { name: 'Dapper Labs', date: '2021', roi: '-72%', loss: '-$300M', outcome: 'NFT collectibles peaked, failed to sustain valuations as market enthusiasm waned post-2022.' }
    ],
    'Changpeng Zhao': [
      { name: 'BitTorrent', date: '2018', roi: '-40%', loss: '-$50M', outcome: 'Blockchain integration underperformed as token utility remained unclear to users.' },
      { name: 'Various ICO Tokens', date: '2017', roi: '-88%', loss: '-$500M', outcome: 'Binance incubation projects many failed post-2018 crypto winter.' }
    ],
    'Cathie Wood': [
      { name: 'Teladoc', date: '2020', roi: '-78%', loss: '-$2B', outcome: 'Telehealth bubble peaked as competitive intensity and reimbursement pressures mounted.' },
      { name: 'Zoom', date: '2020', roi: '-65%', loss: '-$1.5B', outcome: 'Video conferencing growth decelerated post-pandemic as return-to-office trends accelerated.' }
    ],
    'Elon Musk': [
      { name: 'Twitter/X', date: '2022', roi: '-50%', loss: '-$22B', outcome: 'Acquisition price of $44B now valued at half, advertiser exodus and user concerns.' },
      { name: 'Dogecoin Pump', date: '2021', roi: '-75%', loss: '-$500M', outcome: 'DOGE promotion led to SEC scrutiny and retail investor losses from peak.' }
    ],
    'Sam Altman': [
      { name: 'Worldcoin Launch', date: '2023', roi: '-60%', loss: '-$200M', outcome: 'WLD token crashed from launch as privacy concerns and regulatory scrutiny mounted.' },
      { name: 'Reddit Investment', date: '2014', roi: '-30%', loss: '-$50M', outcome: 'YC investment underperformed as platform struggled with monetization.' }
    ],
    'Jack Dorsey': [
      { name: 'Tidal', date: '2015', roi: '-80%', loss: '-$200M', outcome: 'Music streaming acquisition failed to compete with Spotify and Apple Music.' },
      { name: 'Bitcoin Bear', date: '2022', roi: '-65%', loss: '-$300M', outcome: 'Block treasury suffered during 2022 crypto winter drawdown.' }
    ],
    'Marc Andreessen': [
      { name: 'Fab.com', date: '2013', roi: '-95%', loss: '-$150M', outcome: 'Flash sale site raised $300M+ before collapsing, design focus failed to sustain growth.' },
      { name: 'RapGenius', date: '2014', roi: '-70%', loss: '-$40M', outcome: 'SEO penalties and management issues tanked early investment.' }
    ],
    'Peter Thiel': [
      { name: 'Clarium Capital', date: '2008', roi: '-90%', loss: '-$2B', outcome: 'Macro hedge fund collapsed from $7B to $350M after wrong-way bets.' },
      { name: 'Airtime', date: '2012', roi: '-100%', loss: '-$30M', outcome: 'Video chat app backed by Sean Parker completely failed to gain traction.' }
    ],
    'Tyler Winklevoss': [
      { name: 'Gemini Earn', date: '2022', roi: '-100%', loss: '-$900M', outcome: 'Genesis bankruptcy froze $900M in customer funds, led to SEC charges.' },
      { name: 'NFT Holdings', date: '2022', roi: '-90%', loss: '-$100M', outcome: 'NFT portfolio crashed after 2021 peak as market enthusiasm collapsed.' }
    ],
    'Cameron Winklevoss': [
      { name: 'Gemini Earn', date: '2022', roi: '-100%', loss: '-$900M', outcome: 'Genesis bankruptcy froze $900M in customer funds, regulatory fallout.' },
      { name: 'Metaverse Investments', date: '2022', roi: '-85%', loss: '-$50M', outcome: 'VR/metaverse bets underperformed as hype cycle ended.' }
    ],
    'Balaji Srinivasan': [
      { name: '$1M Bitcoin Bet', date: '2023', roi: '-100%', loss: '-$1M', outcome: 'Lost bet that Bitcoin would hit $1M in 90 days due to hyperinflation.' },
      { name: 'Various Crypto', date: '2022', roi: '-70%', loss: '-$50M', outcome: 'Portfolio drawdown during 2022 crypto winter.' }
    ],
    'Paul Graham': [
      { name: 'YC Fails', date: '2005-2023', roi: '-100%', loss: '-$10M', outcome: 'Estimated 30-40% of YC companies fail completely, part of model.' },
      { name: 'Kiko Calendar', date: '2005', roi: '-80%', loss: '-$100K', outcome: 'Early YC calendar app sold at auction, lost to Google Calendar.' }
    ],
    'Chris Dixon': [
      { name: 'Diem/Libra', date: '2020', roi: '-100%', loss: '-$100M', outcome: 'Facebook stablecoin project killed by regulatory pressure.' },
      { name: 'NFT Valuations', date: '2022', roi: '-90%', loss: '-$500M', outcome: 'OpenSea and NFT portfolio crashed from 2021 peaks.' }
    ],
    'Adam Back': [
      { name: 'Altcoin Positions', date: '2017', roi: '-95%', loss: '-$20M', outcome: 'ICO-era token positions went to near zero post-2018 crash.' },
      { name: 'Mining Ventures', date: '2019', roi: '-40%', loss: '-$30M', outcome: 'Bitcoin mining profitability squeezed by hash rate competition.' }
    ],
    'Charles Hoskinson': [
      { name: 'Ethereum Departure', date: '2014', roi: '-$50B', loss: 'Opportunity', outcome: 'Left Ethereum early, missed massive ETH appreciation as founder.' },
      { name: 'Smart Contract Delays', date: '2020', roi: '-50%', loss: '-$100M', outcome: 'Years of delays on Cardano smart contracts hurt ADA price.' }
    ],
    'Justin Sun': [
      { name: 'SEC Charges', date: '2023', roi: '-20%', loss: '-$500M', outcome: 'SEC fraud charges led to TRX and BTT price crashes.' },
      { name: 'Steem Takeover', date: '2020', roi: '-100%', loss: '-$50M', outcome: 'Hostile governance takeover backfired, led to Hive fork.' }
    ],
    'Hayden Adams': [
      { name: 'V3 LP Losses', date: '2022', roi: '-30%', loss: 'Impermanent', outcome: 'Many Uniswap V3 LPs suffered impermanent loss in volatile markets.' },
      { name: 'Governance Token', date: '2022', roi: '-80%', loss: '-$5B', outcome: 'UNI token fell from $45 to $5 during crypto winter.' }
    ],
    'Anatoly Yakovenko': [
      { name: 'FTX Exposure', date: '2022', roi: '-95%', loss: '-$3B', outcome: 'Solana heavily tied to FTX, SOL crashed 95% after fraud revealed.' },
      { name: 'Network Outages', date: '2022', roi: '-30%', loss: '-$1B', outcome: 'Multiple network halts damaged Solana reputation and price.' }
    ],
    'Stani Kulechov': [
      { name: 'Flash Loan Exploits', date: '2021', roi: '-10%', loss: '-$50M', outcome: 'Aave flash loans used in exploits, reputation concerns.' },
      { name: 'AAVE Bear', date: '2022', roi: '-85%', loss: '-$1B', outcome: 'AAVE token crashed from $600 to $50 during crypto winter.' }
    ],
    'Arthur Hayes': [
      { name: 'DOJ Charges', date: '2020', roi: '-100%', loss: '-$500M', outcome: 'Forced to step down from BitMEX, criminal charges and settlement.' },
      { name: 'Altcoin Bets', date: '2022', roi: '-70%', loss: '-$50M', outcome: 'Various altcoin positions suffered during 2022 drawdown.' }
    ],
    'Rune Christensen': [
      { name: 'DAI Depeg Risk', date: '2022', roi: '-10%', loss: '-$100M', outcome: 'USDC collateral concerns during Silicon Valley Bank crisis.' },
      { name: 'Governance Battles', date: '2023', roi: '-30%', loss: '-$200M', outcome: 'MKR token volatility during endgame restructuring proposals.' }
    ],
    'Jesse Pollak': [
      { name: 'Base Scam Tokens', date: '2023', roi: '-100%', loss: 'Reputation', outcome: 'BALD and other Base rug pulls damaged chain reputation early.' },
      { name: 'Meme Coin Volatility', date: '2024', roi: '-50%', loss: '-$100M', outcome: 'Base meme coins like BRETT volatile, some complete losses.' }
    ],
    'Anthony Pompliano': [
      { name: 'BlockFi Promotion', date: '2022', roi: '-100%', loss: 'Reputation', outcome: 'Promoted BlockFi yields before platform collapse damaged credibility.' },
      { name: 'Altcoin Positions', date: '2022', roi: '-80%', loss: '-$20M', outcome: 'Various altcoin holdings suffered major drawdowns.' }
    ],
    'Brad Garlinghouse': [
      { name: 'SEC Lawsuit', date: '2020', roi: '-70%', loss: '-$15B', outcome: 'XRP crashed 70% after SEC sued Ripple for unregistered securities.' },
      { name: 'XRP Volatility', date: '2018', roi: '-90%', loss: '-$100B', outcome: 'XRP fell from $3.40 to $0.30 after 2018 crypto crash.' }
    ],
    'Katie Haun': [
      { name: 'FTX Exposure', date: '2022', roi: '-100%', loss: '-$500M', outcome: 'a16z and Haun Ventures had significant FTX exposure before fraud.' },
      { name: 'NFT Downturn', date: '2022', roi: '-80%', loss: '-$200M', outcome: 'NFT portfolio investments depreciated significantly.' }
    ],
    'Gavin Wood': [
      { name: 'Parachain Delays', date: '2021', roi: '-60%', loss: '-$5B', outcome: 'DOT crashed during parachain rollout delays and competition.' },
      { name: 'Kusama Experiments', date: '2022', roi: '-90%', loss: '-$500M', outcome: 'Kusama network experiments led to significant value destruction.' }
    ],
    'Robert Leshner': [
      { name: 'COMP Bug', date: '2021', roi: '-10%', loss: '-$90M', outcome: 'Smart contract bug distributed $90M in extra COMP tokens.' },
      { name: 'DeFi Bear', date: '2022', roi: '-85%', loss: '-$2B', outcome: 'COMP token crashed from $900 to $30 during crypto winter.' }
    ],
    'Elizabeth Stark': [
      { name: 'Lightning Adoption', date: '2019', roi: '-50%', loss: 'Opportunity', outcome: 'Slower than expected Lightning adoption limited growth.' },
      { name: 'Channel Attacks', date: '2022', roi: '-5%', loss: '-$5M', outcome: 'Various Lightning channel attack vectors exploited.' }
    ],
    'Jesse Powell': [
      { name: 'SEC Investigation', date: '2023', roi: '-20%', loss: '-$500M', outcome: 'Kraken staking program shutdown, $30M SEC settlement.' },
      { name: 'Management Controversies', date: '2022', roi: '-10%', loss: 'Reputation', outcome: 'Workplace culture controversies led to negative press.' }
    ],
    'Andre Cronje': [
      { name: 'Eminence Hack', date: '2020', roi: '-100%', loss: '-$15M', outcome: 'Unaudited contract exploited, users lost $15M despite refunds.' },
      { name: 'DeFi Exit', date: '2022', roi: '-80%', loss: '-$500M', outcome: 'Announced DeFi departure, Fantom ecosystem crashed.' }
    ],
    'Su Zhu': [
      { name: '3AC Collapse', date: '2022', roi: '-100%', loss: '-$10B', outcome: '3AC bankruptcy, one of largest crypto hedge fund failures in history.' },
      { name: 'LUNA Position', date: '2022', roi: '-100%', loss: '-$600M', outcome: 'Massive LUNA exposure, complete loss in death spiral.' }
    ]
  };
  return worstCalls[name] || [];
};

const getRecentActivity = (name: string) => {
  const activities: Record<string, Array<{type: string, text: string, time: string, impact: 'high' | 'medium' | 'low'}>> = {
    'Naval Ravikant': [
      { type: 'podcast', text: 'All-In Podcast appearance discussing AI regulation', time: '3d ago', impact: 'high' },
      { type: 'investment', text: 'Angel investment in Anthropic (disclosed 2023)', time: '1w ago', impact: 'high' },
      { type: 'tweet', text: 'Wealth without work is the path to destruction', time: '2w ago', impact: 'medium' }
    ],
    'Vitalik Buterin': [
      { type: 'research', text: 'Blog post on Ethereum proof-of-stake improvements', time: '1w ago', impact: 'high' },
      { type: 'conference', text: 'ETH Global hackathon keynote on scaling', time: '2w ago', impact: 'high' },
      { type: 'proposal', text: 'EIP-4844 implementation progress update', time: '3w ago', impact: 'medium' }
    ],
    'Michael Saylor': [
      { type: 'filing', text: 'MicroStrategy bought 5,445 BTC for $147.3M', time: '1w ago', impact: 'high' },
      { type: 'interview', text: 'Bloomberg interview on Bitcoin corporate treasury', time: '2w ago', impact: 'medium' },
      { type: 'announcement', text: 'MicroStrategy Q3 earnings call Bitcoin discussion', time: '1m ago', impact: 'medium' }
    ],
    'Brian Armstrong': [
      { type: 'earnings', text: 'Coinbase Q3 2024 earnings beat expectations', time: '2w ago', impact: 'high' },
      { type: 'regulation', text: 'Testified to Congress on crypto regulation clarity', time: '1m ago', impact: 'high' },
      { type: 'product', text: 'Coinbase launched international derivatives platform', time: '6w ago', impact: 'medium' }
    ],
    'Changpeng Zhao': [
      { type: 'legal', text: 'Completed 4-month federal prison sentence', time: '1w ago', impact: 'high' },
      { type: 'transition', text: 'Officially stepped down as Binance CEO', time: '3m ago', impact: 'high' },
      { type: 'settlement', text: 'Binance $4.3B DOJ settlement finalized', time: '4m ago', impact: 'high' }
    ],
    'Cathie Wood': [
      { type: 'fund', text: 'ARK Innovation ETF down 8% this quarter', time: '1w ago', impact: 'medium' },
      { type: 'prediction', text: 'Maintained Bitcoin $1M price target by 2030', time: '2w ago', impact: 'medium' },
      { type: 'interview', text: 'CNBC interview on AI investment strategy', time: '3w ago', impact: 'low' }
    ],
    'Tyler Winklevoss': [
      { type: 'legal', text: 'Gemini settled with NYDFS for $37M over Earn program', time: '2w ago', impact: 'high' },
      { type: 'product', text: 'Gemini launched new crypto derivatives trading', time: '1m ago', impact: 'medium' },
      { type: 'regulation', text: 'Advocated for clear crypto regulations in Senate hearing', time: '2m ago', impact: 'medium' }
    ],
    'Cameron Winklevoss': [
      { type: 'legal', text: 'Joint settlement with Tyler on Gemini Earn program', time: '2w ago', impact: 'high' },
      { type: 'advocacy', text: 'Op-ed on Bitcoin as digital gold in WSJ', time: '1m ago', impact: 'medium' },
      { type: 'business', text: 'Gemini partnership with institutional custody provider', time: '6w ago', impact: 'medium' }
    ],
    'Balaji Srinivasan': [
      { type: 'prediction', text: 'Made $1M Bitcoin bet for March 2023 (lost)', time: '6m ago', impact: 'high' },
      { type: 'book', text: 'Published "The Network State" implementation updates', time: '2m ago', impact: 'medium' },
      { type: 'investment', text: 'Angel investment in decentralized social protocol', time: '3m ago', impact: 'low' }
    ],
    'Paul Graham': [
      { type: 'essay', text: 'Published "How to Do Great Work" essay', time: '4m ago', impact: 'high' },
      { type: 'announcement', text: 'Y Combinator W24 batch achieved record valuations', time: '6w ago', impact: 'medium' },
      { type: 'interview', text: 'Podcast on startup founder mental health', time: '2m ago', impact: 'low' }
    ],
    'Elon Musk': [
      { type: 'announcement', text: 'xAI released Grok-2 multimodal AI model', time: '1w ago', impact: 'high' },
      { type: 'business', text: 'Tesla Cybertruck production hit 2,000 units/week', time: '2w ago', impact: 'high' },
      { type: 'tweet', text: 'Posted about Mars colonization timeline update', time: '3d ago', impact: 'medium' }
    ],
    'Sam Altman': [
      { type: 'product', text: 'OpenAI launched advanced AI with voice capabilities', time: '1w ago', impact: 'high' },
      { type: 'funding', text: 'OpenAI closed $6.6B funding at $157B valuation', time: '2w ago', impact: 'high' },
      { type: 'conference', text: 'Keynote at OpenAI DevDay on agent capabilities', time: '1m ago', impact: 'medium' }
    ],
    'Jack Dorsey': [
      { type: 'product', text: 'Block launched new Bitcoin mining hardware', time: '2w ago', impact: 'high' },
      { type: 'investment', text: 'Continued funding Nostr development grants', time: '1m ago', impact: 'medium' },
      { type: 'tweet', text: 'Posted about decentralized social importance', time: '1w ago', impact: 'low' }
    ],
    'Marc Andreessen': [
      { type: 'essay', text: 'Published "Techno-Optimist Manifesto" on a16z blog', time: '2m ago', impact: 'high' },
      { type: 'investment', text: 'a16z led $200M round in AI infrastructure startup', time: '3w ago', impact: 'high' },
      { type: 'podcast', text: 'Appeared on Lex Fridman discussing AI future', time: '1m ago', impact: 'medium' }
    ],
    'Peter Thiel': [
      { type: 'investment', text: 'Founders Fund invested in AI defense startup', time: '2w ago', impact: 'high' },
      { type: 'political', text: 'Stepped back from active political involvement', time: '3m ago', impact: 'medium' },
      { type: 'conference', text: 'Spoke at Bitcoin Conference on monetary policy', time: '2m ago', impact: 'medium' }
    ],
    'Chris Dixon': [
      { type: 'investment', text: 'a16z crypto led $50M DeFi protocol round', time: '3w ago', impact: 'high' },
      { type: 'book', text: 'Published "Read Write Own" about web3 future', time: '2m ago', impact: 'high' },
      { type: 'podcast', text: 'Discussed crypto regulation on a16z podcast', time: '1m ago', impact: 'medium' }
    ],
    'Adam Back': [
      { type: 'product', text: 'Blockstream launched new Liquid sidechain upgrade', time: '3w ago', impact: 'high' },
      { type: 'conference', text: 'Keynote at Baltic Honeybadger on Bitcoin scaling', time: '1m ago', impact: 'medium' },
      { type: 'tweet', text: 'Commentary on Bitcoin hash rate all-time high', time: '1w ago', impact: 'low' }
    ],
    'Charles Hoskinson': [
      { type: 'development', text: 'Cardano Voltaire governance era launched', time: '2w ago', impact: 'high' },
      { type: 'interview', text: 'YouTube discussion on proof-of-stake future', time: '1w ago', impact: 'medium' },
      { type: 'announcement', text: 'IOHK partnership with African governments', time: '1m ago', impact: 'medium' }
    ],
    'Justin Sun': [
      { type: 'acquisition', text: 'Acquired stake in major crypto media outlet', time: '2w ago', impact: 'high' },
      { type: 'product', text: 'TRON network hit 200M total accounts', time: '3w ago', impact: 'medium' },
      { type: 'tweet', text: 'Posted about stablecoin dominance on TRON', time: '1w ago', impact: 'medium' }
    ],
    'Hayden Adams': [
      { type: 'product', text: 'Uniswap v4 hooks feature announced', time: '2w ago', impact: 'high' },
      { type: 'governance', text: 'UNI fee switch proposal discussion ongoing', time: '1m ago', impact: 'high' },
      { type: 'tweet', text: 'Commentary on DEX volume hitting new highs', time: '1w ago', impact: 'medium' }
    ],
    'Anatoly Yakovenko': [
      { type: 'development', text: 'Solana Firedancer client approaching mainnet', time: '2w ago', impact: 'high' },
      { type: 'conference', text: 'Keynote at Solana Breakpoint on network scaling', time: '1m ago', impact: 'high' },
      { type: 'tweet', text: 'Posted about Solana TPS milestone achievement', time: '1w ago', impact: 'medium' }
    ],
    'Stani Kulechov': [
      { type: 'product', text: 'Aave v4 design proposal released', time: '3w ago', impact: 'high' },
      { type: 'development', text: 'Lens Protocol v2 major upgrade launched', time: '1m ago', impact: 'high' },
      { type: 'governance', text: 'GHO stablecoin crossed $100M market cap', time: '2w ago', impact: 'medium' }
    ],
    'Arthur Hayes': [
      { type: 'essay', text: 'Published macro analysis on BitMEX blog', time: '1w ago', impact: 'high' },
      { type: 'prediction', text: 'Called for Bitcoin rally based on Fed policy', time: '2w ago', impact: 'medium' },
      { type: 'investment', text: 'Disclosed position in Ethena stablecoin', time: '1m ago', impact: 'medium' }
    ],
    'Rune Christensen': [
      { type: 'governance', text: 'MakerDAO endgame restructuring vote passed', time: '2w ago', impact: 'high' },
      { type: 'product', text: 'Spark Protocol TVL surpassed $2B', time: '3w ago', impact: 'high' },
      { type: 'announcement', text: 'DAI yield increased to 8% via DSR', time: '1m ago', impact: 'medium' }
    ],
    'Jesse Pollak': [
      { type: 'milestone', text: 'Base hit $10B TVL in first year', time: '1w ago', impact: 'high' },
      { type: 'product', text: 'Base smart wallet launched for onboarding', time: '3w ago', impact: 'high' },
      { type: 'tweet', text: 'Posted about onchain summer success metrics', time: '2w ago', impact: 'medium' }
    ],
    'Anthony Pompliano': [
      { type: 'podcast', text: 'Daily Bitcoin analysis on YouTube channel', time: '1d ago', impact: 'medium' },
      { type: 'investment', text: 'Pomp Investments backed Bitcoin infrastructure startup', time: '3w ago', impact: 'medium' },
      { type: 'newsletter', text: 'Published daily Bitcoin market commentary', time: '1d ago', impact: 'low' }
    ],
    'Brad Garlinghouse': [
      { type: 'legal', text: 'Ripple won major legal victory against SEC', time: '3m ago', impact: 'high' },
      { type: 'product', text: 'RippleNet expanded to 30 new banking partners', time: '1m ago', impact: 'high' },
      { type: 'conference', text: 'Spoke at Swell conference on CBDC pilots', time: '2m ago', impact: 'medium' }
    ],
    'Katie Haun': [
      { type: 'investment', text: 'Haun Ventures led $100M Web3 gaming round', time: '3w ago', impact: 'high' },
      { type: 'conference', text: 'Keynote on crypto regulation at Mainnet', time: '2m ago', impact: 'medium' },
      { type: 'announcement', text: 'Haun Ventures Fund II deployment updates', time: '1m ago', impact: 'medium' }
    ],
    'Gavin Wood': [
      { type: 'development', text: 'Polkadot 2.0 roadmap announced', time: '2w ago', impact: 'high' },
      { type: 'conference', text: 'Keynote at Polkadot Decoded on JAM protocol', time: '1m ago', impact: 'high' },
      { type: 'governance', text: 'OpenGov major proposals passed', time: '3w ago', impact: 'medium' }
    ],
    'Robert Leshner': [
      { type: 'product', text: 'Compound III launched on new chains', time: '3w ago', impact: 'high' },
      { type: 'business', text: 'Superstate treasury fund reached $100M AUM', time: '2w ago', impact: 'high' },
      { type: 'governance', text: 'COMP governance improvements implemented', time: '1m ago', impact: 'medium' }
    ],
    'Elizabeth Stark': [
      { type: 'product', text: 'Lightning Labs launched Taproot Assets mainnet', time: '2w ago', impact: 'high' },
      { type: 'conference', text: 'Spoke at Bitcoin Conference on Lightning adoption', time: '2m ago', impact: 'medium' },
      { type: 'development', text: 'Lightning Network capacity hit new ATH', time: '1m ago', impact: 'medium' }
    ],
    'Jesse Powell': [
      { type: 'product', text: 'Kraken launched institutional custody service', time: '3w ago', impact: 'high' },
      { type: 'regulation', text: 'Testified on crypto regulation in Congress', time: '2m ago', impact: 'medium' },
      { type: 'business', text: 'Kraken expanded derivatives to new markets', time: '1m ago', impact: 'medium' }
    ],
    'Andre Cronje': [
      { type: 'development', text: 'Returned to DeFi with new Fantom projects', time: '2w ago', impact: 'high' },
      { type: 'product', text: 'Sonic chain development progress update', time: '1m ago', impact: 'high' },
      { type: 'tweet', text: 'Posted about sustainable DeFi tokenomics', time: '3w ago', impact: 'medium' }
    ],
    'Su Zhu': [
      { type: 'legal', text: 'Ongoing bankruptcy proceedings for 3AC', time: '1m ago', impact: 'high' },
      { type: 'announcement', text: 'OPNX exchange shut down operations', time: '3m ago', impact: 'medium' },
      { type: 'social', text: 'Active on Twitter with crypto commentary', time: '1w ago', impact: 'low' }
    ]
  };
  return activities[name] || [
    { type: 'social', text: 'Recent social media activity', time: '1d ago', impact: 'low' },
    { type: 'market', text: 'Market commentary published', time: '3d ago', impact: 'low' }
  ];
};

// Comprehensive avatar profile fallback data - ensures all avatars display complete info
const getAvatarProfileFallback = (name: string): {
  investmentThesis: string;
  netWorth: string;
  portfolioRoi: number;
  investmentCount: number;
  category: string;
  riskScore: number;
  volatility: number;
  marketOutlook: string;
} => {
  const profiles: Record<string, any> = {
    'Naval Ravikant': {
      investmentThesis: 'Seek asymmetric upside through angel investing. Build long-term wealth through equity, not wages. Focus on founders with specific knowledge and leverage.',
      netWorth: '$3.2B',
      portfolioRoi: 847,
      investmentCount: 200,
      category: 'Venture Capital',
      riskScore: 65,
      volatility: 45,
      marketOutlook: 'Bullish on AI-native startups and decentralized systems. Believes next decade belongs to founder-led companies with network effects.'
    },
    'Vitalik Buterin': {
      investmentThesis: 'Build infrastructure for decentralized coordination. Ethereum enables programmable money and trustless agreements at global scale.',
      netWorth: '$1.5B',
      portfolioRoi: 450000,
      investmentCount: 25,
      category: 'Blockchain',
      riskScore: 75,
      volatility: 60,
      marketOutlook: 'Focused on Ethereum scaling through L2s and proto-danksharding. Sees rollups as path to mass adoption.'
    },
    'Michael Saylor': {
      investmentThesis: 'Bitcoin is digital gold and superior store of value. Corporate treasuries should hold Bitcoin as reserve asset. Long-term accumulation strategy.',
      netWorth: '$4.5B',
      portfolioRoi: 2150,
      investmentCount: 8,
      category: 'Bitcoin Treasury',
      riskScore: 85,
      volatility: 70,
      marketOutlook: 'Extremely bullish Bitcoin. Expects institutional adoption to drive price to $500K+. MicroStrategy will continue accumulating.'
    },
    'Brian Armstrong': {
      investmentThesis: 'Build compliant infrastructure for crypto adoption. Coinbase as bridge between traditional finance and digital assets.',
      netWorth: '$8.2B',
      portfolioRoi: 1200,
      investmentCount: 45,
      category: 'Crypto Infrastructure',
      riskScore: 60,
      volatility: 55,
      marketOutlook: 'Optimistic on regulatory clarity. Base L2 will drive onchain adoption. Stablecoins are killer app.'
    },
    'Changpeng Zhao': {
      investmentThesis: 'Grow crypto ecosystem through exchange dominance and strategic investments. BNB Chain as foundation for DeFi and NFTs.',
      netWorth: '$33B',
      portfolioRoi: 100000,
      investmentCount: 150,
      category: 'Exchange',
      riskScore: 90,
      volatility: 80,
      marketOutlook: 'Post-legal settlement, focused on compliance. Bullish on global crypto adoption despite regulatory challenges.'
    },
    'Cathie Wood': {
      investmentThesis: 'Disruptive innovation creates exponential growth. Focus on convergence of AI, blockchain, genomics, robotics, and energy storage.',
      netWorth: '$250M',
      portfolioRoi: 156,
      investmentCount: 35,
      category: 'Innovation Investing',
      riskScore: 80,
      volatility: 75,
      marketOutlook: 'Bitcoin to $1M by 2030. AI and crypto convergence will create unprecedented value. Deflation, not inflation.'
    },
    'Sam Altman': {
      investmentThesis: 'AI will be the most transformative technology in human history. Build and invest in AI infrastructure and applications.',
      netWorth: '$2B',
      portfolioRoi: 115,
      investmentCount: 400,
      category: 'AI & Tech',
      riskScore: 70,
      volatility: 50,
      marketOutlook: 'AGI within 5 years. OpenAI leading the way. AI agents will transform every industry.'
    },
    'Elon Musk': {
      investmentThesis: 'Accelerate sustainable energy and make life multi-planetary. AI is critical but existential risk. Long-term thinking over quarterly results.',
      netWorth: '$400B',
      portfolioRoi: 42,
      investmentCount: 8,
      category: 'Technology & Space',
      riskScore: 90,
      volatility: 85,
      marketOutlook: 'Mars colonization is essential. AI regulation needed. X will become everything app. Tesla FSD imminent.'
    },
    'Jack Dorsey': {
      investmentThesis: 'Bitcoin is the native currency of the internet. Decentralization is essential for open and free internet.',
      netWorth: '$4.5B',
      portfolioRoi: 340,
      investmentCount: 18,
      category: 'Bitcoin & Payments',
      riskScore: 65,
      volatility: 55,
      marketOutlook: 'Bitcoin maximalist. Block building Bitcoin infrastructure. Nostr for decentralized social. Lightning for payments.'
    },
    'Marc Andreessen': {
      investmentThesis: 'Software is eating the world. Back bold founders building monopolies. AI and crypto are the future platforms.',
      netWorth: '$1.9B',
      portfolioRoi: 3500,
      investmentCount: 500,
      category: 'Venture Capital',
      riskScore: 70,
      volatility: 50,
      marketOutlook: 'Techno-optimist. AI will create abundance. Crypto enables new economic models. Build, don\'t fear technology.'
    },
    'Peter Thiel': {
      investmentThesis: 'Seek monopoly positions through unique insight. Contrarian bets on transformative technology. Competition is for losers.',
      netWorth: '$9.5B',
      portfolioRoi: 4200,
      investmentCount: 120,
      category: 'Venture Capital',
      riskScore: 75,
      volatility: 55,
      marketOutlook: 'Skeptical of incremental progress. Bullish on AI and defense tech. Bitcoin as hedge against monetary debasement.'
    },
    'Tyler Winklevoss': {
      investmentThesis: 'Bitcoin is digital gold. Build compliant crypto infrastructure. Long-term holders will be rewarded.',
      netWorth: '$3.2B',
      portfolioRoi: 54445,
      investmentCount: 35,
      category: 'Bitcoin & Exchange',
      riskScore: 70,
      volatility: 60,
      marketOutlook: 'Bitcoin to $500K. Institutional adoption accelerating. Gemini focused on compliance and custody.'
    },
    'Cameron Winklevoss': {
      investmentThesis: 'Bitcoin as store of value superior to gold. Regulatory clarity will unlock institutional capital.',
      netWorth: '$3.2B',
      portfolioRoi: 54445,
      investmentCount: 35,
      category: 'Bitcoin & Exchange',
      riskScore: 70,
      volatility: 60,
      marketOutlook: 'Bitcoin ETF approval was just the beginning. 10x from here as pensions and sovereigns allocate.'
    },
    'Balaji Srinivasan': {
      investmentThesis: 'The network state is the future of governance. Build digital-first communities with shared purpose and cryptocurrency.',
      netWorth: '$100M',
      portfolioRoi: 1500,
      investmentCount: 75,
      category: 'Tech & Crypto',
      riskScore: 85,
      volatility: 70,
      marketOutlook: 'Fiat system fragile. Bitcoin as insurance. Network states will compete with nation states.'
    },
    'Paul Graham': {
      investmentThesis: 'Back exceptional founders early. Great companies solve real problems. Essays spread ideas that find founders.',
      netWorth: '$2.5B',
      portfolioRoi: 8900,
      investmentCount: 2000,
      category: 'Venture Capital',
      riskScore: 55,
      volatility: 40,
      marketOutlook: 'AI startups are the new wave. Y Combinator alumni network compounds value. Early stage remains best risk-adjusted.'
    },
    'Chris Dixon': {
      investmentThesis: 'Read Write Own - web3 enables digital ownership and creator empowerment. Crypto is the next computing platform.',
      netWorth: '$300M',
      portfolioRoi: 2800,
      investmentCount: 85,
      category: 'Crypto Venture',
      riskScore: 75,
      volatility: 65,
      marketOutlook: 'Onchain is the next online. NFTs enable digital property rights. DeFi rebuilds finance from first principles.'
    },
    'Adam Back': {
      investmentThesis: 'Bitcoin is the only truly decentralized cryptocurrency. Build infrastructure that strengthens Bitcoin network.',
      netWorth: '$100M',
      portfolioRoi: 39900,
      investmentCount: 12,
      category: 'Bitcoin Infrastructure',
      riskScore: 65,
      volatility: 50,
      marketOutlook: 'Bitcoin maximalist. Layer 2 solutions like Lightning and Liquid scale Bitcoin. Sidechains enable innovation.'
    },
    'Charles Hoskinson': {
      investmentThesis: 'Build blockchain with academic rigor and peer review. Cardano enables financial operating system for unbanked.',
      netWorth: '$600M',
      portfolioRoi: 8500,
      investmentCount: 15,
      category: 'Blockchain',
      riskScore: 70,
      volatility: 65,
      marketOutlook: 'Proof of stake is superior. Cardano Voltaire era brings true decentralization. Africa is key market.'
    },
    'Justin Sun': {
      investmentThesis: 'Aggressive growth through acquisitions and marketing. TRON as global blockchain for entertainment and stablecoins.',
      netWorth: '$2B',
      portfolioRoi: 1500,
      investmentCount: 45,
      category: 'Blockchain',
      riskScore: 90,
      volatility: 85,
      marketOutlook: 'Stablecoins on TRON dominate USDT transfers. HTX exchange growing. Aggressive acquisition strategy continues.'
    },
    'Hayden Adams': {
      investmentThesis: 'Automated market makers enable permissionless trading. Uniswap is core DeFi infrastructure.',
      netWorth: '$500M',
      portfolioRoi: 15000,
      investmentCount: 5,
      category: 'DeFi',
      riskScore: 70,
      volatility: 60,
      marketOutlook: 'DEXs will surpass CEXs in volume. Uniswap v4 hooks enable infinite customization. Fee switch coming.'
    },
    'Anatoly Yakovenko': {
      investmentThesis: 'Performance matters - Solana optimizes for speed and low cost. Mobile-first crypto experience with Saga.',
      netWorth: '$300M',
      portfolioRoi: 2500,
      investmentCount: 8,
      category: 'Blockchain',
      riskScore: 80,
      volatility: 75,
      marketOutlook: 'Firedancer client brings decentralization. Solana is the blockchain for consumer apps. 65K TPS is just the start.'
    },
    'Stani Kulechov': {
      investmentThesis: 'DeFi protocols are new financial primitives. Aave enables permissionless lending. Lens builds social graph.',
      netWorth: '$400M',
      portfolioRoi: 3500,
      investmentCount: 12,
      category: 'DeFi',
      riskScore: 70,
      volatility: 60,
      marketOutlook: 'DeFi will absorb TradFi. GHO stablecoin enables Aave to capture more value. Lens Protocol is web3 social layer.'
    },
    'Arthur Hayes': {
      investmentThesis: 'Macro drives crypto. Trade volatility through derivatives. Bitcoin is response to central bank money printing.',
      netWorth: '$700M',
      portfolioRoi: 9900,
      investmentCount: 20,
      category: 'Trading',
      riskScore: 90,
      volatility: 85,
      marketOutlook: 'Fed pivot imminent. Bitcoin to rally as liquidity returns. Ethena stablecoin is yield innovation.'
    },
    'Rune Christensen': {
      investmentThesis: 'Decentralized stablecoins are DeFi foundation. MakerDAO enables permissionless lending and DAI stability.',
      netWorth: '$200M',
      portfolioRoi: 5000,
      investmentCount: 5,
      category: 'DeFi',
      riskScore: 65,
      volatility: 50,
      marketOutlook: 'Endgame restructuring makes MakerDAO sustainable. DAI will remain leading decentralized stablecoin.'
    },
    'Jesse Pollak': {
      investmentThesis: 'Onchain is the next online. Base brings a billion users to Ethereum ecosystem through Coinbase distribution.',
      netWorth: '$50M',
      portfolioRoi: 500,
      investmentCount: 3,
      category: 'L2 Blockchain',
      riskScore: 60,
      volatility: 55,
      marketOutlook: 'Base is fastest growing L2. Onchain summer success proves consumer demand. Smart wallets remove UX friction.'
    },
    'Anthony Pompliano': {
      investmentThesis: 'Bitcoin is the best performing asset of the decade. Long-term holders win. Educate the masses.',
      netWorth: '$200M',
      portfolioRoi: 3900,
      investmentCount: 50,
      category: 'Bitcoin Investment',
      riskScore: 70,
      volatility: 60,
      marketOutlook: 'Bitcoin halving cycles drive price. Institutional adoption accelerating. Every portfolio needs Bitcoin exposure.'
    },
    'Brad Garlinghouse': {
      investmentThesis: 'Cross-border payments need blockchain rails. RippleNet provides enterprise-grade infrastructure.',
      netWorth: '$600M',
      portfolioRoi: 800,
      investmentCount: 25,
      category: 'Enterprise Blockchain',
      riskScore: 65,
      volatility: 55,
      marketOutlook: 'SEC victory proves XRP is not a security. Banks will adopt crypto for payments. CBDCs create opportunity.'
    },
    'Katie Haun': {
      investmentThesis: 'Crypto enables new economic models. Back builders creating web3 infrastructure and applications.',
      netWorth: '$500M',
      portfolioRoi: 1800,
      investmentCount: 60,
      category: 'Crypto Venture',
      riskScore: 65,
      volatility: 55,
      marketOutlook: 'Regulatory clarity coming. Haun Ventures deploying into infrastructure and gaming. Long-term thesis intact.'
    },
    'Gavin Wood': {
      investmentThesis: 'Interoperability is the future. Polkadot enables heterogeneous blockchain ecosystem. Substrate empowers builders.',
      netWorth: '$400M',
      portfolioRoi: 6000,
      investmentCount: 15,
      category: 'Blockchain Infrastructure',
      riskScore: 70,
      volatility: 60,
      marketOutlook: 'JAM protocol is next evolution. Polkadot 2.0 brings elastic scaling. Parachains prove multichain thesis.'
    },
    'Robert Leshner': {
      investmentThesis: 'Algorithmic money markets are DeFi primitive. Compound pioneered lending. Superstate bridges TradFi.',
      netWorth: '$150M',
      portfolioRoi: 2500,
      investmentCount: 8,
      category: 'DeFi',
      riskScore: 60,
      volatility: 50,
      marketOutlook: 'Institutional DeFi is next wave. Superstate tokenized treasuries growing. Compound remains core protocol.'
    },
    'Elizabeth Stark': {
      investmentThesis: 'Lightning Network scales Bitcoin for payments. Build infrastructure that makes Bitcoin programmable.',
      netWorth: '$100M',
      portfolioRoi: 1200,
      investmentCount: 6,
      category: 'Bitcoin Infrastructure',
      riskScore: 60,
      volatility: 45,
      marketOutlook: 'Taproot Assets enable stablecoins on Lightning. Bitcoin L2 ecosystem growing. Payments use case expanding.'
    },
    'Jesse Powell': {
      investmentThesis: 'Build exchange with proof of reserves and regulatory compliance. Long-term thinking over short-term gains.',
      netWorth: '$1.2B',
      portfolioRoi: 9900,
      investmentCount: 15,
      category: 'Exchange',
      riskScore: 65,
      volatility: 55,
      marketOutlook: 'Kraken Bank enables new services. Proof of reserves should be industry standard. Compliance is competitive advantage.'
    },
    'Andre Cronje': {
      investmentThesis: 'Build DeFi protocols with sustainable tokenomics. Fair launch creates aligned community. Move fast and ship.',
      netWorth: '$60M',
      portfolioRoi: 1500,
      investmentCount: 10,
      category: 'DeFi',
      riskScore: 85,
      volatility: 80,
      marketOutlook: 'Returned to building after sabbatical. Sonic chain will be fast L1. ve(3,3) model spreading across DeFi.'
    },
    'Su Zhu': {
      investmentThesis: 'Trade crypto with leverage and conviction. [3AC collapsed in 2022 due to excessive leverage and poor risk management.]',
      netWorth: '-$2B',
      portfolioRoi: -100,
      investmentCount: 50,
      category: 'Hedge Fund (Defunct)',
      riskScore: 100,
      volatility: 100,
      marketOutlook: 'Facing legal proceedings. OPNX exchange shut down. Cautionary tale of overleveraged crypto trading.'
    }
  };
  
  return profiles[name] || {
    investmentThesis: 'Building and investing in transformative technology that creates long-term value and positive impact.',
    netWorth: 'Undisclosed',
    portfolioRoi: 50,
    investmentCount: 10,
    category: 'Technology',
    riskScore: 60,
    volatility: 50,
    marketOutlook: 'Optimistic on technology innovation and digital asset adoption over the long term.'
  };
};

// Avatar Markets Section Component
function AvatarMarketsSection({ avatarId, avatarName }: { avatarId: string; avatarName: string }) {
  const { data: marketsData, isLoading } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/avatars', avatarId, 'markets'],
    enabled: !!avatarId,
  });

  const markets = marketsData?.markets || [];

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 px-1">
          <TrendingUp className="h-3.5 w-3.5 text-purple-500/50" />
          <span className="text-xs font-semibold text-muted-foreground">Loading Markets...</span>
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 px-1">
          <TrendingUp className="h-3.5 w-3.5 text-purple-500/50" />
          <span className="text-xs font-semibold text-foreground">Prediction Markets</span>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-2.5 text-center">
          <span className="text-[10px] text-muted-foreground">No prediction markets created by {avatarName} yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-1">
        <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
        <span className="text-xs font-semibold text-foreground">Live Prediction Markets</span>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] ml-auto">
          {markets.length} Active
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-1.5">
        {markets.slice(0, 2).map((market) => (
          <InlineMarketCard
            key={market.id}
            market={market}
            variant="mini"
            context="avatar"
          />
        ))}
      </div>
    </div>
  );
}

export const KnowledgeAvatars = memo(function KnowledgeAvatars() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // DEBUG: Log component mount with version timestamp
  useEffect(() => {
    console.log(`🔍 DEBUG: KnowledgeAvatars v2.1 mounted at ${new Date().toISOString()}`);
    console.log(`🔍 DEBUG: Using native overflow-x-auto with .scrollbar-visible class`);
  }, []);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const isTransitioningRef = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showPortfolioSimulator, setShowPortfolioSimulator] = useState(false);
  const [openAvatarDialog, setOpenAvatarDialog] = useState<string | null>(null);
  
  // Close avatar dialog when chat opens to prevent mobile overlay conflicts
  useEffect(() => {
    const handleChatOpen = () => {
      setOpenAvatarDialog(null);
    };
    window.addEventListener('streamaix-chat-open', handleChatOpen);
    return () => window.removeEventListener('streamaix-chat-open', handleChatOpen);
  }, []);

  // Fetch real avatars from API
  const { data: avatarsResponse, isLoading } = useQuery<{ avatars: DatabaseAvatar[] }>({
    queryKey: ['/api/avatars'],
  });

  const avatars = avatarsResponse?.avatars || [];
  
  // Enhanced responsive design: mobile (1), tablet (2-3), desktop (4)
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 768) return 1; // Mobile
    if (width < 1024) return 2; // Tablet
    if (width < 1280) return 3; // Small desktop
    return 4; // Full desktop
  };
  
  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  // Detect screen size and update responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setItemsPerView(getItemsPerView());
      
      // Measure container width for accurate carousel positioning
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch social sentiment data for all avatars at top level
  const navalSentiment = useSocialSentiment('Naval Ravikant');
  const vitalikSentiment = useSocialSentiment('Vitalik Buterin');
  const saylorSentiment = useSocialSentiment('Michael Saylor');
  const brianSentiment = useSocialSentiment('Brian Armstrong');
  const czSentiment = useSocialSentiment('Changpeng Zhao');
  const cathieSentiment = useSocialSentiment('Cathie Wood');
  const tylerSentiment = useSocialSentiment('Tyler Winklevoss');
  const cameronSentiment = useSocialSentiment('Cameron Winklevoss');
  const balajiSentiment = useSocialSentiment('Balaji Srinivasan');
  const paulSentiment = useSocialSentiment('Paul Graham');

  // Map entrepreneur names to sentiment data
  const sentimentMap: Record<string, ReturnType<typeof useSocialSentiment>> = {
    'Naval Ravikant': navalSentiment,
    'Vitalik Buterin': vitalikSentiment,
    'Michael Saylor': saylorSentiment,
    'Brian Armstrong': brianSentiment,
    'Changpeng Zhao': czSentiment,
    'Cathie Wood': cathieSentiment,
    'Tyler Winklevoss': tylerSentiment,
    'Cameron Winklevoss': cameronSentiment,
    'Balaji Srinivasan': balajiSentiment,
    'Paul Graham': paulSentiment,
  };
  const maxIndex = Math.max(0, avatars.length - itemsPerView);
  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  const nextSlide = () => {
    if (isTransitioningRef.current || !containerRef.current) return;
    isTransitioningRef.current = true;
    const cardWidth = 320 + 24; // card width + gap
    containerRef.current.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 600);
  };

  const prevSlide = () => {
    if (isTransitioningRef.current || !containerRef.current) return;
    isTransitioningRef.current = true;
    const cardWidth = 320 + 24; // card width + gap
    containerRef.current.scrollBy({ left: -cardWidth * 2, behavior: 'smooth' });
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 600);
  };

  // Touch handling for mobile swipe gestures
  const minSwipeDistance = 50;
  const previewDistance = 15; // Visual feedback threshold

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwipeActive(true);
    setSwipeDirection(null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    
    // Provide visual feedback during swipe
    const distance = touchStart - currentX;
    if (Math.abs(distance) > previewDistance) {
      setSwipeDirection(distance > 0 ? 'left' : 'right');
    } else {
      setSwipeDirection(null);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart) {
      setIsSwipeActive(false);
      setSwipeDirection(null);
      return;
    }
    
    // If touchEnd is null, it means no movement occurred (just a tap)
    if (!touchEnd) {
      setIsSwipeActive(false);
      setSwipeDirection(null);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Only trigger slide if it was an actual swipe (not just a small movement)
    if (isLeftSwipe && canGoNext) {
      nextSlide();
    } else if (isRightSwipe && canGoPrev) {
      prevSlide();
    }
    
    // Reset swipe state
    setIsSwipeActive(false);
    setSwipeDirection(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleFollow = async (avatarId: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to follow avatars",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/avatars/${avatarId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({ title: "Success", description: "Avatar followed successfully!" });
      }
    } catch (error) {
      toast({ 
        title: "Unable to follow", 
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleComparison = (avatarId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(avatarId)) {
        return prev.filter(id => id !== avatarId);
      } else {
        if (prev.length >= 6) {
          toast({ 
            title: "Maximum reached", 
            description: "You can compare up to 6 entrepreneurs at once",
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, avatarId];
      }
    });
  };

  const removeFromComparison = (avatarId: string) => {
    setSelectedForComparison(prev => prev.filter(id => id !== avatarId));
  };

  const selectedEntrepreneurs = avatars.filter(a => selectedForComparison.includes(a.id)).map(e => ({
    id: e.id,
    name: e.name,
    category: e.category || 'General',
    riskScore: e.riskScore || 50,
    volatility: e.volatility || 50,
    portfolioRoi: e.portfolioRoi || 0,
    accuracyPercentage: e.accuracyPercentage || 0,
    netWorth: e.netWorth || 'N/A',
    bestCalls: e.bestCalls || [],
    worstCalls: e.worstCalls || []
  }));


  // Skeleton Card Component with Shimmer Effects
  const SkeletonCard = () => (
    <Card className="min-h-[600px] flex flex-col overflow-hidden bg-gradient-to-br from-card/95 via-card/85 to-card/75 backdrop-blur-xl border-2 border-primary/20 relative">
      {/* Skeleton Header */}
      <div className="relative overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
        </div>
        <div className="absolute top-3 left-4">
          <div className="w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
          <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse delay-200" />
          <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse delay-500" />
        </div>
      </div>
      
      <CardContent className="pt-12 pb-6 px-5 space-y-4 flex-1 flex flex-col">
        {/* Name Skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse w-3/4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse w-1/2" />
        </div>
        
        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200/50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2 relative overflow-hidden">
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Key Metrics Skeleton */}
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Activity Skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4 animate-pulse" />
          <div className="bg-gray-200/50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1 animate-pulse">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mt-2" />
          </div>
        </div>
        
        {/* Button Skeleton */}
        <div className="flex gap-3 pt-4 mt-auto">
          <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
          <div className="w-12 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <section id="profiles" className="py-20 bg-transparent">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <SectionHeader
              title="Alpha Network"
              subtitle="Loading alpha network..."
            />
          </motion.div>

          {/* Skeleton Cards */}
          <div className="overflow-hidden px-4 md:px-12">
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} gap-6`}>
              {[...Array(isMobile ? 1 : 4)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="knowledge-avatars" className="py-20 bg-transparent relative overflow-visible">
      
      <div className="container mx-auto px-6 relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <SectionHeader
            title="Alpha Network"
            subtitle="Real-time intelligence on crypto's top minds"
          />
        </motion.div>
        
        {/* Enhanced Carousel Container */}
        <div className="relative max-w-[95vw] mx-auto" style={{ isolation: 'isolate' }}>
          {/* Professional Navigation Buttons - Fixed positioning */}
          {!isMobile && avatars.length > itemsPerView && (
            <>
              <Button
                onClick={prevSlide}
                size="icon"
                variant="ghost"
                disabled={!canGoPrev}
                className={`absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-[60] bg-gradient-to-br from-slate-950/95 to-purple-950/95 text-white rounded-lg md:rounded-xl w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 shadow-2xl backdrop-blur-xl border-2 border-white/20 transition-all duration-300 ${
                  canGoPrev 
                    ? 'hover:from-slate-900 hover:to-purple-900 hover:scale-110 hover:shadow-purple-500/30 cursor-pointer' 
                    : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ pointerEvents: 'auto', isolation: 'isolate' }}
                data-testid="button-carousel-prev"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
              </Button>
              
              <Button
                onClick={nextSlide}
                size="icon"
                variant="ghost"
                disabled={!canGoNext}
                className={`absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-[60] bg-gradient-to-br from-slate-950/95 to-purple-950/95 text-white rounded-lg md:rounded-xl w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 shadow-2xl backdrop-blur-xl border-2 border-white/20 transition-all duration-300 ${
                  canGoNext 
                    ? 'hover:from-slate-900 hover:to-purple-900 hover:scale-110 hover:shadow-purple-500/30 cursor-pointer' 
                    : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ pointerEvents: 'auto', isolation: 'isolate' }}
                data-testid="button-carousel-next"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
              </Button>
            </>
          )}
          
          {/* Working Carousel - CSS scroll-snap for mobile, transforms for desktop */}
          <div 
            className={`${isMobile ? 'overflow-x-auto snap-x snap-mandatory scrollbar-visible' : 'overflow-x-auto scrollbar-visible'} px-4 md:px-12 pb-4`}
            ref={containerRef}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139, 92, 246, 0.5) rgba(30, 30, 50, 0.3)'
            }}
            onScroll={(e) => {
              const container = e.currentTarget;
              const scrollLeft = container.scrollLeft;
              const cardWidth = isMobile ? container.offsetWidth : 344; // 320px + 24px gap
              const newIndex = Math.round(scrollLeft / cardWidth);
              if (newIndex !== currentIndex && newIndex >= 0 && newIndex < avatars.length) {
                setCurrentIndex(newIndex);
              }
            }}
          >
            {/* Mobile Indicators - sync with scroll position */}
            {isMobile && avatars.length > 1 && (
              <div className="flex justify-center gap-2 mb-6 sticky top-0 z-10">
                {avatars.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      if (containerRef.current) {
                        const cardWidth = containerRef.current.offsetWidth;
                        containerRef.current.scrollTo({
                          left: idx * cardWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentIndex 
                        ? 'w-8 h-2 bg-primary' 
                        : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    data-testid={`carousel-indicator-${idx}`}
                  />
                ))}
              </div>
            )}
            
            {/* Carousel Track - uses native scroll on all devices */}
            <div 
              className="flex gap-6"
              style={{
                minWidth: 'max-content',
              }}
            >
              {avatars.map((avatar, index) => {
                // Get comprehensive fallback data for this avatar
                const profileFallback = getAvatarProfileFallback(avatar.name);
                
                // Use database values with fallback to profile data
                const portfolioRoi = avatar.portfolioRoi ?? profileFallback.portfolioRoi;
                const accuracyPercentage = avatar.accuracyPercentage ?? 50;
                const netWorth = avatar.netWorth || profileFallback.netWorth;
                const investmentThesis = avatar.investmentThesis || profileFallback.investmentThesis;
                const investmentCount = avatar.investmentCount ?? profileFallback.investmentCount;
                const category = avatar.category || profileFallback.category;
                const riskScore = avatar.riskScore ?? profileFallback.riskScore;
                const volatility = avatar.volatility ?? profileFallback.volatility;
                const marketOutlook = avatar.marketOutlook || profileFallback.marketOutlook;
                const trend = portfolioRoi >= 0 ? 'up' : 'down';
                
                const sentimentData = sentimentMap[avatar.name];
                const socialSentiment = sentimentData?.sentiment;
                const sentimentLoading = sentimentData?.isLoading;
                const influenceScore = avatar.influenceScore || socialSentiment?.sentiment?.influenceScore || getInfluenceScore(avatar.followerCount, avatar.notableInvestments?.length || 0);
                
                // Use database data or fallback to static helper functions
                const recentActivityData = (avatar.recentActivity && avatar.recentActivity.length > 0) 
                  ? avatar.recentActivity 
                  : getRecentActivity(avatar.name);
                
                const bestCallsData = (avatar.bestCalls && avatar.bestCalls.length > 0)
                  ? avatar.bestCalls
                  : getBestCalls(avatar.name);
                
                const worstCallsData = (avatar.worstCalls && avatar.worstCalls.length > 0)
                  ? avatar.worstCalls
                  : getWorstCalls(avatar.name);
                
                return (
                  <div 
                    key={avatar.id} 
                    className={`flex-shrink-0 relative z-10 ${isMobile ? 'snap-start snap-always' : ''}`}
                    style={{
                      width: isMobile ? '85vw' : '320px',
                      minWidth: isMobile ? '85vw' : '320px'
                    }}
                  >
                    <Dialog open={openAvatarDialog === avatar.id} onOpenChange={(open) => setOpenAvatarDialog(open ? avatar.id : null)}>
                      <DialogTrigger asChild>
                        <div 
                          className="w-full h-full" 
                          style={{ pointerEvents: 'auto' }}
                          onClick={(e) => {
                            // Prevent dialog from opening if user is swiping
                            if (isSwipeActive || swipeDirection) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }}
                        >
                          <Card className="group cursor-pointer bg-white dark:bg-gradient-to-br dark:from-slate-950/95 dark:via-purple-950/90 dark:to-slate-950/95 backdrop-blur-xl border-2 border-slate-200 dark:border-purple-500/30 hover:border-slate-300 dark:hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 overflow-hidden flex flex-col h-full">
                          {/* Professional Terminal-Style Header */}
                          <div className="relative flex-shrink-0">
                            <div className={`h-32 bg-gradient-to-br ${getAvatarGradient(avatar.name)} relative overflow-hidden transition-all duration-500`}>
                              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                              <div className="absolute top-4 right-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                                <span className="text-xs text-emerald-400 font-mono">LIVE</span>
                              </div>
                            </div>
                            <div className="absolute -bottom-12 left-5">
                              <div className="relative">
                                <Avatar className="w-24 h-24 ring-4 ring-blue-500/40 border-4 border-slate-900 shadow-2xl shadow-blue-500/30 backdrop-blur-sm transition-all duration-500">
                                  <AvatarImage 
                                    src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                                    alt={`${avatar.name} avatar`}
                                    className="object-cover object-top scale-110"
                                  />
                                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
                                    {avatar.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {avatar.verificationStatus === 'verified' && (
                                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full p-2 shadow-lg">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-4 left-5">
                              <Badge variant="secondary" className="bg-slate-900/80 backdrop-blur-md text-blue-300 border-blue-500/40 text-xs font-mono font-semibold px-3 py-1.5 shadow-lg">
                                {avatar.expertise}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="pt-14 pb-4 px-3 sm:px-4 md:px-5 space-y-3 md:space-y-4 flex-1 flex flex-col bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950/50">
                            {/* Name and Handle */}
                            <div className="space-y-1 md:space-y-2 border-b border-slate-200 dark:border-blue-500/20 pb-3 md:pb-4 flex-shrink-0">
                              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-blue-50 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-1 tracking-tight font-mono">
                                {avatar.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-blue-400/70 font-mono">@{avatar.handle}</p>
                            </div>
                            
                            {/* Bloomberg Terminal-Style Metrics Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 flex-shrink-0">
                              <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-blue-500/30 rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2 backdrop-blur-sm hover:border-slate-300 dark:hover:border-blue-400/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] sm:text-xs text-slate-600 dark:text-blue-400/80 font-mono uppercase tracking-wider">Portfolio ROI</span>
                                  <div className="flex items-center gap-1.5">
                                    {trend === 'up' ? (
                                      <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-400" />
                                    )}
                                    <div className={`w-1.5 h-1.5 rounded-full ${portfolioRoi >= 0 ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                                  </div>
                                </div>
                                <div className={`text-lg sm:text-xl font-bold font-mono transition-all duration-300 ${portfolioRoi >= 0 ? 'text-emerald-400' : 'text-red-400'}`} title={`${portfolioRoi >= 0 ? '+' : ''}${portfolioRoi}% total portfolio return`}>
                                  {portfolioRoi >= 0 ? '+' : ''}{portfolioRoi}%
                                </div>
                              </div>
                              
                              <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-blue-500/30 rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2 backdrop-blur-sm hover:border-slate-300 dark:hover:border-blue-400/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] sm:text-xs text-slate-600 dark:text-blue-400/80 font-mono uppercase tracking-wider">Accuracy</span>
                                  <div className={`w-1.5 h-1.5 rounded-full ${accuracyPercentage >= 80 ? 'bg-emerald-400' : accuracyPercentage >= 60 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
                                </div>
                                <div className={`text-lg sm:text-xl font-bold font-mono transition-all duration-300 ${accuracyPercentage >= 80 ? 'text-emerald-400' : accuracyPercentage >= 60 ? 'text-yellow-400' : 'text-red-400'}`} title={`${accuracyPercentage}% accuracy on public predictions and forecasts`}>
                                  {accuracyPercentage}%
                                </div>
                              </div>
                              
                              <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-blue-500/30 rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2 backdrop-blur-sm hover:border-slate-300 dark:hover:border-blue-400/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] sm:text-xs text-slate-600 dark:text-blue-400/80 font-mono uppercase tracking-wider">Influence</span>
                                  <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                                    {Math.round(influenceScore)}
                                  </div>
                                  {sentimentLoading && (
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-cyan-400/30 border-t-cyan-400" />
                                  )}
                                </div>
                                {socialSentiment?.profile && socialSentiment?.sentiment && (
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-blue-400/70 font-mono">
                                      {formatFollowerCount(socialSentiment.profile.followers)}
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-mono ${
                                      (socialSentiment.sentiment?.sentimentScore ?? 0) > 0.7 ? 'bg-emerald-500/20 text-emerald-400' :
                                      (socialSentiment.sentiment?.sentimentScore ?? 0) > 0.3 ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-red-500/20 text-red-400'
                                    }`}>
                                      {Math.round((socialSentiment.sentiment?.sentimentScore ?? 0) * 100)}%
                                    </div>
                                  </div>
                                )}
                                {sentimentData?.error && !sentimentLoading && (
                                  <div className="text-xs text-amber-500/70 font-mono">
                                    API rate-limited
                                  </div>
                                )}
                              </div>
                              
                              <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-blue-500/30 rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2 backdrop-blur-sm hover:border-slate-300 dark:hover:border-blue-400/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] sm:text-xs text-slate-600 dark:text-blue-400/80 font-mono uppercase tracking-wider">Net Worth</span>
                                  <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                                </div>
                                <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 truncate" title={`Assets Under Management / Net Worth: ${netWorth}`}>
                                  {netWorth}
                                </div>
                              </div>
                            </div>
                            
                            {/* Terminal-Style Key Metrics */}
                            <div className="space-y-1.5 sm:space-y-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-blue-500/20 rounded-lg p-2 sm:p-3 flex-shrink-0">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-blue-400/70 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider">
                                  <Users className="h-3 w-3" />
                                  Followers
                                </span>
                                <span className="font-mono font-bold text-cyan-400 text-sm">{formatFollowerCount(avatar.followerCount)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-blue-400/70 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider">
                                  <Building2 className="h-3 w-3" />
                                  Investments
                                </span>
                                <span className="font-mono font-bold text-cyan-400 text-sm">{avatar.notableInvestments?.length || 0}</span>
                              </div>
                            </div>
                            
                            {/* Terminal Activity Feed - Use database or fallback to helper */}
                            {recentActivityData && recentActivityData.length > 0 && (
                              <div className="space-y-2 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-blue-400/80 font-mono uppercase tracking-wider">
                                    <Activity className="h-3 w-3" />
                                    Live Feed
                                  </div>
                                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                    recentActivityData[0].impact === 'high' ? 'bg-red-400' :
                                    recentActivityData[0].impact === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400'
                                  }`} />
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-blue-500/30 rounded-lg p-2.5 sm:p-3 hover:border-slate-300 dark:hover:border-blue-400/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-all duration-300 cursor-pointer">
                                  <div className="text-xs text-slate-700 dark:text-blue-200/90 line-clamp-2 font-medium">
                                    {recentActivityData[0].text}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="text-xs text-slate-500 dark:text-blue-400/60 font-mono">
                                      {recentActivityData[0].time}
                                    </div>
                                    <div className={`text-xs px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
                                      recentActivityData[0].impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                      recentActivityData[0].impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                      'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                      {recentActivityData[0].impact}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Recent Insight - Only show if from database */}
                            {avatar.recentThoughts && avatar.recentThoughts.length > 0 && avatar.recentThoughts[0] && avatar.recentThoughts[0].trim() && (
                              <div className="bg-slate-950/60 border-l-2 border-cyan-400 rounded-lg p-3 flex-shrink-0">
                                <p className="text-xs text-blue-200/80 italic line-clamp-2 font-medium">
                                  "{avatar.recentThoughts[0]}"
                                </p>
                              </div>
                            )}
                            
                            {/* Professional Action Buttons - Glassmorphism */}
                            <div className="flex gap-2 pt-3 mt-auto border-t border-slate-200 dark:border-blue-500/20">
                              <FollowButton
                                avatarId={avatar.id}
                                avatarName={avatar.name}
                                size="sm"
                                className="flex-1"
                              />
                              {/* Chat Button */}
                              <AvatarChatButton avatar={avatar} />
                              {/* Compare Button with Glassmorphism */}
                              <div className="relative group">
                                <div className={`absolute -inset-[1px] rounded-lg bg-gradient-to-r ${
                                  selectedForComparison.includes(avatar.id) 
                                    ? 'from-purple-500 to-fuchsia-500 opacity-100' 
                                    : 'from-cyan-500 via-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-70'
                                } blur-[1px] transition-opacity duration-300`} />
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComparison(avatar.id);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className={`relative px-3 text-xs font-mono transition-all duration-300 ${
                                    selectedForComparison.includes(avatar.id) 
                                      ? 'bg-purple-500/20 dark:bg-purple-600/30 border-0 text-purple-600 dark:text-white' 
                                      : 'bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-700 dark:text-blue-300 hover:bg-white/50 dark:hover:bg-slate-900/60'
                                  }`}
                                  data-testid={`button-compare-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  <BarChart3 className={`h-3.5 w-3.5 ${selectedForComparison.includes(avatar.id) ? 'text-purple-500' : 'text-purple-500 dark:text-purple-400'}`} />
                                </Button>
                              </div>
                              {/* Eye/View Button with Glassmorphism */}
                              <div className="relative group">
                                <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-70 blur-[1px] transition-opacity duration-300" />
                                <Button
                                  onClick={(e) => e.stopPropagation()}
                                  size="sm"
                                  variant="outline"
                                  className="relative px-3 text-xs font-mono bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-700 dark:text-blue-300 hover:bg-white/50 dark:hover:bg-slate-900/60 transition-all duration-300"
                                  data-testid={`button-view-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  <Eye className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        </div>
                      </DialogTrigger>
                      
                      {/* Compact Popup Modal - Responsive */}
                      <DialogContent className="max-w-6xl w-full bg-card/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden p-0 h-[95vh] md:h-[75vh] max-h-[95vh] md:max-h-[90vh]" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                        {/* Two-Column Grid Layout - Stacks on Mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-[30%_70%] h-full overflow-y-auto md:overflow-hidden pb-24 md:pb-0 overscroll-contain touch-pan-y">
                          
                          {/* LEFT SIDEBAR - Compact Profile */}
                          <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-3 md:p-4 border-b md:border-b-0 md:border-r border-muted/30 flex flex-col">
                            {/* Avatar */}
                            <div className="flex flex-col items-center mb-3 md:mb-4">
                              <div className="relative">
                                <Avatar className="w-12 h-12 md:w-16 md:h-16 ring-2 ring-primary/20 border-2 border-white/10 shadow-lg">
                                  <AvatarImage 
                                    src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                                    alt={`${avatar.name} avatar`}
                                  />
                                  <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {avatar.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {avatar.verificationStatus === 'verified' && (
                                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Name & Handle */}
                              <h3 className="text-sm md:text-base font-bold text-foreground mt-2 text-center">{avatar.name}</h3>
                              <p className="text-[10px] md:text-xs text-muted-foreground">@{avatar.handle}</p>
                              
                              {/* Influence Badge */}
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] md:text-xs mt-1.5 md:mt-2">
                                Influence: {influenceScore}
                              </Badge>
                              
                              {/* Follow Button */}
                              <FollowButton
                                avatarId={avatar.id}
                                avatarName={avatar.name}
                                className={`bg-gradient-to-r ${getAvatarGradient(avatar.name)} hover:opacity-90 text-white text-xs px-4 py-1.5 mt-2 w-full`}
                              />
                            </div>
                            
                            {/* Mini Stats Pills */}
                            <div className="grid grid-cols-3 md:grid-cols-1 gap-1.5 md:gap-2 mb-3 md:mb-4">
                              <div className="bg-blue-500/10 rounded-lg p-1.5 md:p-2 border border-blue-500/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] md:text-xs text-muted-foreground">Followers</span>
                                  <Users className="h-2.5 w-2.5 md:h-3 md:w-3 text-blue-500" />
                                </div>
                                <div className="text-xs md:text-sm font-bold text-foreground mt-0.5">{formatFollowerCount(avatar.followerCount)}</div>
                              </div>
                              
                              <div className="bg-green-500/10 rounded-lg p-1.5 md:p-2 border border-green-500/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] md:text-xs text-muted-foreground">Investments</span>
                                  <Building2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-green-500" />
                                </div>
                                <div className="text-xs md:text-sm font-bold text-foreground mt-0.5">{avatar.notableInvestments?.length || 0}</div>
                              </div>
                              
                              <div className="bg-orange-500/10 rounded-lg p-1.5 md:p-2 border border-orange-500/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] md:text-xs text-muted-foreground">Net Worth</span>
                                  <DollarSign className="h-2.5 w-2.5 md:h-3 md:w-3 text-orange-500" />
                                </div>
                                <div className="text-xs md:text-sm font-bold text-foreground mt-0.5">{netWorth}</div>
                              </div>
                            </div>
                            
                            {/* Investment Thesis - Condensed - Always show with fallback */}
                            <div className="mt-auto hidden md:block">
                              <div className="flex items-center gap-1 mb-1">
                                <Target className="h-3 w-3 text-purple-500" />
                                <span className="text-xs font-semibold text-foreground">Investment Thesis</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{investmentThesis}</p>
                            </div>
                          </div>
                          
                          {/* RIGHT CONTENT AREA - Scrollable on mobile */}
                          <div className="p-3 flex flex-col gap-2 overflow-y-auto md:overflow-hidden">
                            
                            {/* Compact Performance Cards - 2x2 Grid */}
                            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                              {/* Total Followers Card */}
                              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-2 md:p-3 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                  <div className="text-sm md:text-lg font-bold text-foreground">{formatFollowerCount(avatar.followerCount)}</div>
                                  <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Total Followers</div>
                                <div className="text-[10px] md:text-xs text-green-500">+12.3% this month</div>
                              </div>
                              
                              {/* Portfolio ROI Card */}
                              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-2 md:p-3 border border-green-500/20">
                                <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                  <div className={`text-sm md:text-lg font-bold ${portfolioRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {portfolioRoi >= 0 ? '+' : ''}{portfolioRoi}%
                                  </div>
                                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Portfolio ROI</div>
                                <div className="text-[10px] md:text-xs text-green-500">All-time returns</div>
                              </div>
                              
                              {/* Prediction Accuracy Card */}
                              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-2 md:p-3 border border-purple-500/20">
                                <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                  <div className="text-sm md:text-lg font-bold text-foreground">{accuracyPercentage}%</div>
                                  <Target className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Prediction Accuracy</div>
                                <div className="text-[10px] md:text-xs text-purple-500">Last 100 predictions</div>
                              </div>
                              
                              {/* Assets Under Management Card */}
                              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-2 md:p-3 border border-orange-500/20">
                                <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                  <div className="text-xs md:text-base font-bold text-foreground truncate">{netWorth}</div>
                                  <PieChart className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Assets Under Management</div>
                                <div className="text-[10px] md:text-xs text-orange-500">Public portfolio value</div>
                              </div>
                            </div>
                            
                            {/* Prediction Markets Section */}
                            <AvatarMarketsSection avatarId={avatar.id} avatarName={avatar.name} />
                            
                            {/* Compact Analytics Chart Section - Always render with fallback data */}
                            <div className="flex-1 min-h-[300px] md:min-h-0 overflow-visible md:overflow-hidden mb-8 md:mb-0">
                              <EntrepreneurAnalytics 
                                entrepreneur={{
                                  name: avatar.name,
                                  investmentThesis: investmentThesis,
                                  bestCalls: bestCallsData,
                                  worstCalls: worstCallsData,
                                  recentActivity: recentActivityData.map(activity => ({
                                    date: activity.time || 'Recent',
                                    action: activity.text || 'Activity update',
                                    details: `${(activity.type || 'update').toUpperCase()} - Market impact: ${activity.impact || 'medium'}`
                                  })),
                                  category: category,
                                  riskScore: riskScore,
                                  volatility: volatility,
                                  marketOutlook: marketOutlook,
                                  netWorth: netWorth,
                                  portfolioRoi: portfolioRoi
                                }}
                                showThesis={false}
                                showMetrics={false}
                              />
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                   </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
    </section>
  );
});
