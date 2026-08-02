import { motion } from 'framer-motion';
import { Target, TrendingUp, ExternalLink, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Surface from '@/components/ds/Surface';

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
    open: 'bg-gain/10 text-gain border-gain/30',
    in_progress: 'bg-warn/10 text-warn border-warn/30',
    completed: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
    expired: 'bg-ink-raised text-secondary border-ink-edge',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="cursor-pointer transition-all"
    >
      <Surface className="p-3 hover:bg-ink-raised" data-testid={`bounty-card-${id}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-core/10 border border-accent-core/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent-bright" />
          </div>
        
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary truncate">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-secondary mt-0.5">
              <span>{creator?.username || 'Anonymous'}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-xl text-xs font-medium border ${statusColors[status as keyof typeof statusColors] || statusColors.open}`}>
              {status}
            </span>
            <div className="text-right">
              <div className="tabular text-sm font-bold text-accent-bright">
                {reward} STREAM
              </div>
            </div>
          </div>
        </div>
      </Surface>
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
  // Normalize price - handle both basis points (5000 = 50%) and decimal (0.5 = 50%) formats
  const normalizePrice = (price: number | undefined | null) => {
    if (price == null || price > 10000) return 50; // Invalid/missing, default to 50%
    if (price <= 1) return Math.round(price * 100); // Decimal format
    return Math.round(price / 100); // Basis points format
  };
  const yesPriceNormalized = normalizePrice(yesPrice);
  const noPriceNormalized = 100 - yesPriceNormalized;
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="cursor-pointer transition-all"
    >
      <Surface className="p-3 hover:bg-ink-raised" data-testid={`market-card-${id}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gain/10 border border-gain/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gain" />
          </div>
        
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary truncate">{question}</h3>
            <div className="flex items-center gap-2 text-xs text-secondary mt-0.5">
              <span>{totalVolume.toLocaleString()} STREAM volume</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <div className="text-center px-3 py-1 rounded-xl bg-gain/10 border border-gain/30">
              <div className="text-xs text-muted">YES</div>
              <div className="tabular text-sm font-bold text-gain">{yesPriceNormalized}%</div>
            </div>
            <div className="text-center px-3 py-1 rounded-xl bg-loss/10 border border-loss/30">
              <div className="text-xs text-muted">NO</div>
              <div className="tabular text-sm font-bold text-loss">{noPriceNormalized}%</div>
            </div>
          </div>
        </div>
      </Surface>
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
      className="transition-all"
    >
      <Surface className="p-2.5 hover:bg-ink-raised" data-testid={`macro-card-${symbol}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="text-sm font-bold text-primary">{symbol}</div>
            <div className="text-xs text-secondary truncate">{name}</div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="tabular text-sm font-semibold text-primary">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            <div className={`flex items-center gap-1 text-xs font-medium ${
              isNeutral ? 'text-muted' : isPositive ? 'text-gain' : 'text-loss'
            }`}>
              {isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : isPositive ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              <span className="tabular">{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </Surface>
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
      className="cursor-pointer transition-all"
    >
      <Surface className="p-3 hover:bg-ink-raised" data-testid={`story-card-${id}`}>
        <div className="flex items-start gap-3">
          {thumbnailUrl && (
            <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-ink-raised">
              <img 
                src={thumbnailUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary line-clamp-2 mb-1">{title}</h3>
            <p className="text-xs text-secondary line-clamp-1 mb-2">{summary}</p>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{creator?.username || 'AI Hunter'}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          <ExternalLink className="w-4 h-4 text-secondary flex-shrink-0 mt-1" />
        </div>
      </Surface>
    </motion.div>
  );
}
