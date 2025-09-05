import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import UserNotesList from '@/components/UserNotesList';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Clock, 
  TrendingUp, 
  Wallet,
  Star,
  Share,
  Bookmark,
  Eye,
  DollarSign,
  Award,
  Zap,
  BarChart3,
  Users,
  Target,
  ArrowLeft,
  Home,
  BookmarkPlus,
  Activity,
  Calendar,
  MessageSquare,
  FileText,
  Hash,
  Code2,
  ArrowUp,
  ArrowDown,
  Newspaper,
  Globe,
  RefreshCw,
  ExternalLink,
  Headphones,
  Video,
  TrendingDown
} from 'lucide-react';

interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  marketCap: number;
  volume24h: number;
}

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  marketCap?: number;
  volume?: number;
}

interface NewsArticle {
  title: string;
  url: string;
  published: string;
  source: string;
  summary?: string;
}

interface PodcastShow {
  title: string;
  host: string;
  latestEpisode: string;
  thumbnail: string;
  videoUrl: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for live feeling
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live crypto data for ticker
  const { data: cryptoData, isLoading: cryptoLoading } = useQuery({
    queryKey: ['/api/market/crypto/BTC,ETH,SOL,BNB,XRP,ADA,AVAX,DOT,MATIC,LINK,LTC,BCH,UNI,ATOM,FTT'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch financial news
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/market/news?limit=10'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch crypto-related stocks
  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['/api/market/stocks/crypto'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Mock crypto podcasts data
  const cryptoPodcasts: PodcastShow[] = [
    {
      title: "Unchained",
      host: "Laura Shin",
      latestEpisode: "The Future of DeFi with Uniswap's Hayden Adams",
      thumbnail: "/api/placeholder/60/60",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      title: "The Pomp Podcast",
      host: "Anthony Pompliano",
      latestEpisode: "Michael Saylor on Bitcoin as Digital Gold",
      thumbnail: "/api/placeholder/60/60",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      title: "Bankless",
      host: "Ryan Sean Adams",
      latestEpisode: "Ethereum's Path to $10K",
      thumbnail: "/api/placeholder/60/60",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      title: "What Bitcoin Did",
      host: "Peter McCormack",
      latestEpisode: "The Lightning Network Revolution",
      thumbnail: "/api/placeholder/60/60",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(0)}`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? ArrowUp : change < 0 ? ArrowDown : null;
  };

  const cryptoQuotes = cryptoData?.quotes || [];
  const newsArticles = newsData?.articles || [];
  const cryptoStocks = stocksData?.stocks || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Futuristic Grid Background */}
      <div className="fixed inset-0" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        opacity: 0.5
      }}></div>
      
      {/* MOVING CRYPTO TICKER BANNER */}
      <div className="relative z-20 bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-purple-900/30 backdrop-blur-lg border-b border-white/10">
        <div className="overflow-hidden py-3">
          <motion.div 
            className="flex space-x-8 text-sm"
            animate={{ x: "-100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 30, 
              ease: "linear" 
            }}
            style={{ width: "200%" }}
          >
            {/* First set of crypto data */}
            {cryptoQuotes.map((quote: CryptoQuote, index: number) => {
              const ChangeIcon = getChangeIcon(quote.percentChange24h);
              return (
                <div key={`first-${index}`} className="flex items-center space-x-2 text-white whitespace-nowrap">
                  <span className="font-bold text-orange-400">{quote.symbol}</span>
                  <span className="font-semibold">{formatPrice(quote.price)}</span>
                  <span className={`flex items-center ${getChangeColor(quote.percentChange24h)}`}>
                    {ChangeIcon && <ChangeIcon className="h-3 w-3 mr-1" />}
                    {quote.percentChange24h.toFixed(2)}%
                  </span>
                  <span className="text-gray-400 text-xs">{formatMarketCap(quote.marketCap)}</span>
                </div>
              );
            })}
            
            {/* Duplicate for seamless scroll */}
            {cryptoQuotes.map((quote: CryptoQuote, index: number) => {
              const ChangeIcon = getChangeIcon(quote.percentChange24h);
              return (
                <div key={`second-${index}`} className="flex items-center space-x-2 text-white whitespace-nowrap">
                  <span className="font-bold text-orange-400">{quote.symbol}</span>
                  <span className="font-semibold">{formatPrice(quote.price)}</span>
                  <span className={`flex items-center ${getChangeColor(quote.percentChange24h)}`}>
                    {ChangeIcon && <ChangeIcon className="h-3 w-3 mr-1" />}
                    {quote.percentChange24h.toFixed(2)}%
                  </span>
                  <span className="text-gray-400 text-xs">{formatMarketCap(quote.marketCap)}</span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pt-4"
        >
          <div className="flex items-center gap-6 mb-4 sm:mb-0">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              size="sm"
              className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 hover:scale-105 transition-transform"
              data-testid="button-back-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">
                StreamAiX Command Center
              </h1>
              <p className="text-gray-300 text-lg flex items-center gap-2">
                <span className="text-green-400 animate-pulse">●</span>
                {currentTime.toLocaleTimeString()} - Live Market Data
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FINANCIAL NEWS SECTION (5-10 stories) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-blue-400" />
                  Live Financial News
                  <Badge variant="outline" className="ml-auto text-xs bg-blue-500/20 text-blue-300 border-blue-400/30">
                    {newsArticles.length} Stories
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[500px] space-y-3">
                {newsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
                  </div>
                ) : (
                  newsArticles.slice(0, 10).map((article: NewsArticle, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                      onClick={() => window.open(article.url, '_blank')}
                      data-testid={`news-article-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-purple-300 transition-colors">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-400/30">
                              {article.source}
                            </Badge>
                            <span className="text-gray-400 text-xs">
                              {new Date(article.published).toLocaleTimeString()}
                            </span>
                          </div>
                          {article.summary && (
                            <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* CRYPTO PODCASTS SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-green-400" />
                  Crypto Podcasts & Videos
                  <Badge variant="outline" className="ml-auto text-xs bg-green-500/20 text-green-300 border-green-400/30">
                    Latest Episodes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto max-h-[500px]">
                {cryptoPodcasts.map((podcast, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all hover:scale-105 cursor-pointer group"
                    onClick={() => window.open(podcast.videoUrl, '_blank')}
                    data-testid={`podcast-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium group-hover:text-green-300 transition-colors">
                          {podcast.title}
                        </h4>
                        <p className="text-gray-400 text-sm">by {podcast.host}</p>
                        <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                          {podcast.latestEpisode}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Play className="h-4 w-4 text-green-400" />
                          <span className="text-green-400 text-xs">Watch Latest</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add more podcast entries */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-400/30 text-center"
                >
                  <Headphones className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Discover More</p>
                  <p className="text-gray-300 text-sm">Top crypto podcasts updating live</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CRYPTO-RELATED STOCKS (20+ stocks) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  Crypto Stocks
                  <Badge variant="outline" className="ml-auto text-xs bg-orange-500/20 text-orange-300 border-orange-400/30">
                    {cryptoStocks.length} Stocks
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[500px] space-y-2">
                {stocksLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-orange-400" />
                  </div>
                ) : (
                  cryptoStocks.map((stock: StockQuote, index: number) => {
                    const ChangeIcon = getChangeIcon(stock.percentChange24h);
                    return (
                      <motion.div
                        key={stock.symbol}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors"
                        data-testid={`stock-${stock.symbol}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            {stock.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <span className="text-white font-medium text-sm">{stock.symbol}</span>
                            <div className="text-gray-400 text-xs truncate max-w-[120px]">
                              {stock.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {formatPrice(stock.price)}
                          </div>
                          <div className={`flex items-center justify-end text-xs ${getChangeColor(stock.percentChange24h)}`}>
                            {ChangeIcon && <ChangeIcon className="h-3 w-3 mr-1" />}
                            {stock.percentChange24h.toFixed(2)}%
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-400/30 text-center mt-4"
                >
                  <BarChart3 className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-white font-medium text-sm">Live Market Data</p>
                  <p className="text-gray-300 text-xs">Real-time crypto-related stock prices</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-bold text-xl">{cryptoQuotes.length}</div>
              <div className="text-gray-400 text-sm">Live Cryptos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <Newspaper className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-white font-bold text-xl">{newsArticles.length}</div>
              <div className="text-gray-400 text-sm">News Stories</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <Headphones className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-bold text-xl">{cryptoPodcasts.length}</div>
              <div className="text-gray-400 text-sm">Podcasts</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <div className="text-white font-bold text-xl">{cryptoStocks.length}</div>
              <div className="text-gray-400 text-sm">Crypto Stocks</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}