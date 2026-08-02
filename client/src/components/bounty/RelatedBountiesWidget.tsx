import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import Surface from '@/components/ds/Surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, DollarSign, ArrowRight } from 'lucide-react';
import type { Bounty } from '@shared/schema';

interface RelatedBountiesWidgetProps {
  tags?: string[];
  category?: string;
  limit?: number;
}

export default function RelatedBountiesWidget({ tags = [], category, limit = 3 }: RelatedBountiesWidgetProps) {
  const { data, isLoading } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties/related', tags.join(','), category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tags.length > 0) params.append('tags', tags.join(','));
      if (category) params.append('category', category);
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/bounties/related?${params}`);
      if (!response.ok) return { bounties: [] };
      return response.json();
    },
    enabled: tags.length > 0 || !!category,
  });

  const bounties = data?.bounties || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-ink-edge bg-ink-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (bounties.length === 0) {
    return (
      <Surface className="p-6 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-muted" />
        <p className="text-sm text-secondary">No related bounties available</p>
      </Surface>
    );
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-gain bg-gain/10';
      case 'medium': return 'text-warn bg-warn/10';
      case 'hard': return 'text-loss bg-loss/10';
      default: return 'text-secondary bg-ink-raised';
    }
  };

  const getTokenColor = (tokenType?: string) => {
    switch (tokenType?.toUpperCase()) {
      case 'STREAM': return 'text-gain';
      case 'ETH': return 'text-accent-bright';
      case 'USDC': return 'text-accent-bright';
      default: return 'text-secondary';
    }
  };

  const getTimeLeft = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Less than 1h';
  };

  return (
    <div className="space-y-3">
      {bounties.map((bounty, index) => (
        <motion.div
          key={bounty.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Link href={`/bounties/${bounty.id}`}>
            <Surface className="cursor-pointer bg-ink-surface p-4 transition-all hover:bg-ink-raised group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="mb-2 line-clamp-2 text-sm font-medium text-primary transition-colors group-hover:text-accent-bright">
                    {bounty.title}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {bounty.difficulty && (
                      <Badge className={`${getDifficultyColor(bounty.difficulty)} border-none`}>
                        {bounty.difficulty}
                      </Badge>
                    )}
                    {bounty.category && (
                        <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                        {bounty.category}
                      </Badge>
                    )}
                    {bounty.dueDate && (
                      <span className="flex items-center gap-1 text-secondary">
                        <Clock className="h-3 w-3" />
                        {getTimeLeft(bounty.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <DollarSign className={`h-4 w-4 ${getTokenColor(bounty.tokenType)}`} />
                    <span className={`tabular text-sm font-bold ${getTokenColor(bounty.tokenType)}`}>
                      {bounty.reward}
                    </span>
                    <span className="text-xs text-secondary">{bounty.tokenType || 'STREAM'}</span>
                  </div>
                  {bounty.tipPool && bounty.tipPool > 0 && (
                      <span className="tabular text-xs text-accent-bright">
                      +{bounty.tipPool} tips
                    </span>
                  )}
                </div>
              </div>
            </Surface>
          </Link>
        </motion.div>
      ))}
      
      <Link href="/bounties">
        <Button 
          variant="outline" 
          className="w-full rounded-xl border-accent-core/30 text-accent-bright hover:bg-ink-raised"
          data-testid="button-view-all-bounties"
        >
          View All Bounties
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}
