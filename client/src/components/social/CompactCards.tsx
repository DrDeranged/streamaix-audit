import { motion } from 'framer-motion';
import { Target, TrendingUp, Clock, ExternalLink, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Compact Bounty Card
interface CompactBountyCardProps {
  id: string;
  title: string;
  reward: number;
  status: string;
  createdAt: string;
  creator?: { username: string };
}

export function CompactBountyCard({ id, title, reward, status, createdAt, creator }: CompactBountyCardProps) {
  const statusColors = {
    open: 'bg-green-500/20 text-green-400 border-green-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-3 hover:border-fuchsia-500/40 transition-all cursor-pointer"
      data-testid={`bounty-card-${id}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center">
          <Target className="w-5 h-5 text-fuchsia-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span>{creator?.username || 'Anonymous'}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[status as keyof typeof statusColors] || statusColors.open}`}>
            {status}
          </span>
          <div className="text-right">
            <div className="text-sm font-bold text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text">
              {reward} STREAM
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact Market Card
interface CompactMarketCardProps {
  id: string;
  question: string;
  yesPrice: number;
  totalVolume: number;
  createdAt: string;
}

export function CompactMarketCard({ id, question, yesPrice, totalVolume, createdAt }: CompactMarketCardProps) {
  const noPrice = 1 - yesPrice;
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-3 hover:border-fuchsia-500/40 transition-all cursor-pointer"
      data-testid={`market-card-${id}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{question}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span>{totalVolume.toLocaleString()} STREAM volume</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <div className="text-center px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="text-xs text-gray-400">YES</div>
            <div className="text-sm font-bold text-green-400">{(yesPrice * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="text-xs text-gray-400">NO</div>
            <div className="text-sm font-bold text-red-400">{(noPrice * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Macro Data Card
interface MacroDataCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function MacroDataCard({ symbol, name, price, change, changePercent }: MacroDataCardProps) {
  const isPositive = change >= 0;
  const isNeutral = change === 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-2.5 hover:border-fuchsia-500/40 transition-all"
      data-testid={`macro-card-${symbol}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="text-sm font-bold text-white">{symbol}</div>
          <div className="text-xs text-gray-400 truncate">{name}</div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-sm font-semibold text-white">
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          
          <div className={`flex items-center gap-1 text-xs font-medium ${
            isNeutral ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            <span>{Math.abs(changePercent).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact Story Card
interface CompactStoryCardProps {
  id: string;
  title: string;
  summary: string;
  thumbnailUrl?: string;
  createdAt: string;
  creator?: { username: string };
}

export function CompactStoryCard({ id, title, summary, thumbnailUrl, createdAt, creator }: CompactStoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-3 hover:border-fuchsia-500/40 transition-all cursor-pointer"
      data-testid={`story-card-${id}`}
    >
      <div className="flex items-start gap-3">
        {thumbnailUrl && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-purple-500/10">
            <img 
              src={thumbnailUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">{title}</h3>
          <p className="text-xs text-gray-400 line-clamp-1 mb-2">{summary}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{creator?.username || 'AI Hunter'}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}
