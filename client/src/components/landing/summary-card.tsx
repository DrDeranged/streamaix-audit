import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, Video, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface SummaryCardProps {
  summary: {
    id: string;
    title: string;
    description?: string;
    summary?: string;
    originalUrl: string;
    platform?: string;
    processingStatus: string;
    accuracy?: number;
    tags?: string[];
    createdAt: string;
    rawData?: {
      thumbnail?: string;
      channel?: string;
      views?: string;
      duration?: string;
    };
  };
  index: number;
}

export function SummaryCard({ summary, index }: SummaryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'pending':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const displayDescription = summary.description || summary.summary || 'AI-powered summary of video content';
  const thumbnail = summary.rawData?.thumbnail || '/placeholder-thumbnail.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Card className="group h-full bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-500 overflow-hidden relative">
        {/* Hover gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none" />
        
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={thumbnail}
            alt={summary.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="system-ui" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EStreamAiX%3C/text%3E%3C/svg%3E';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Duration badge */}
          {summary.rawData?.duration && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {summary.rawData.duration}
            </div>
          )}
          
          {/* Platform badge */}
          {summary.platform && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-indigo-500/90 text-white border-0 backdrop-blur-sm">
                <Video className="w-3 h-3 mr-1" />
                {summary.platform}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3 relative">
          <CardTitle className="text-white text-lg font-semibold line-clamp-2 group-hover:text-indigo-300 transition-colors duration-300">
            {summary.title}
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className={`text-xs ${getStatusColor(summary.processingStatus)}`}>
              {summary.processingStatus}
            </Badge>
            
            {summary.accuracy && (
              <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-300">
                <Sparkles className="w-3 h-3 mr-1" />
                {summary.accuracy}% AI
              </Badge>
            )}
            
            {summary.rawData?.views && (
              <Badge variant="outline" className="text-xs border-gray-400/30 text-gray-300">
                <Eye className="w-3 h-3 mr-1" />
                {summary.rawData.views}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
            {displayDescription}
          </p>

          {/* Tags */}
          {summary.tags && summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {summary.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs border-cyan-400/20 text-cyan-300 bg-cyan-500/5"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Channel info */}
          {summary.rawData?.channel && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>📺</span>
              <span>{summary.rawData.channel}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              asChild
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 group/btn"
              data-testid={`button-view-summary-${summary.id}`}
            >
              <Link href={`/summary/${summary.id}`}>
                <span>View Summary</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="icon"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              data-testid={`button-source-${summary.id}`}
            >
              <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
