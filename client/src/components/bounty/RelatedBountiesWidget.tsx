import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { formatTokenAmount } from '@/lib/contracts';
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
          <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (bounties.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 p-6 text-center">
        <Trophy className="h-8 w-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No related bounties available</p>
      </Card>
    );
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTokenColor = (tokenType?: string) => {
    switch (tokenType?.toUpperCase()) {
      case 'STREAM': return 'text-green-400';
      case 'ETH': return 'text-purple-400';
      case 'USDC': return 'text-blue-400';
      default: return 'text-cyan-400';
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
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                    {bounty.title}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {bounty.difficulty && (
                      <Badge className={`${getDifficultyColor(bounty.difficulty)} border-none`}>
                        {bounty.difficulty}
                      </Badge>
                    )}
                    {bounty.category && (
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        {bounty.category}
                      </Badge>
                    )}
                    {bounty.dueDate && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-3 w-3" />
                        {getTimeLeft(bounty.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <DollarSign className={`h-4 w-4 ${getTokenColor(bounty.tokenType)}`} />
                    <span className={`font-bold text-sm ${getTokenColor(bounty.tokenType)}`}>
                      {bounty.reward}
                    </span>
                    <span className="text-xs text-gray-400">{bounty.tokenType || 'STREAM'}</span>
                  </div>
                  {bounty.tipPool && bounty.tipPool > 0 && (
                    <span className="text-xs text-purple-400">
                      +{bounty.tipPool} tips
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
      
      <Link href="/bounties">
        <Button 
          variant="outline" 
          className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          data-testid="button-view-all-bounties"
        >
          View All Bounties
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}
