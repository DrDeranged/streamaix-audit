import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bot, 
  Mic, 
  MessageSquare,
  Clock,
  Users,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationMessage {
  id: string;
  participantId: string;
  speakerType: 'user' | 'avatar';
  speakerName: string;
  textContent: string;
  audioUrl?: string | null;
  audioDurationMs?: number | null;
  sourceType: string;
  replyToMessageId?: string | null;
  createdAt: string;
}

interface ConversationReplayProps {
  streamId: string;
  className?: string;
  limit?: number;
}

export function ConversationReplay({
  streamId,
  className,
  limit = 50,
}: ConversationReplayProps) {
  const { data, isLoading, error } = useQuery<{ success: boolean; messages: ConversationMessage[] }>({
    queryKey: ['/api/streams', streamId, 'conversation', 'history', limit],
    enabled: !!streamId,
  });

  const messages = data?.messages || [];

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full p-4 space-y-3", className)}>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !messages.length) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full p-6 text-center",
        className
      )}>
        <History className="w-12 h-12 text-slate-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Conversation History</h3>
        <p className="text-sm text-slate-400">
          {error ? 'Failed to load conversation history' : 'This stream has no recorded conversations yet'}
        </p>
      </div>
    );
  }

  const uniqueSpeakers = new Set(messages.map(m => m.speakerName)).size;
  const avatarMessages = messages.filter(m => m.speakerType === 'avatar').length;

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Conversation Replay</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
            <MessageSquare className="w-3 h-3 mr-1" />
            {messages.length}
          </Badge>
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
            <Users className="w-3 h-3 mr-1" />
            {uniqueSpeakers}
          </Badge>
          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
            <Bot className="w-3 h-3 mr-1" />
            {avatarMessages}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <ReplayMessageBubble 
              key={msg.id} 
              message={msg} 
              isAvatar={msg.speakerType === 'avatar'}
              showTimestamp={idx === 0 || shouldShowTimestamp(messages[idx - 1]?.createdAt, msg.createdAt)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function shouldShowTimestamp(prevTime: string | undefined, currTime: string): boolean {
  if (!prevTime) return true;
  const diff = new Date(currTime).getTime() - new Date(prevTime).getTime();
  return diff > 5 * 60 * 1000; // Show timestamp if more than 5 minutes apart
}

function ReplayMessageBubble({ 
  message, 
  isAvatar,
  showTimestamp,
}: { 
  message: ConversationMessage; 
  isAvatar: boolean;
  showTimestamp: boolean;
}) {
  return (
    <div className="space-y-1">
      {showTimestamp && (
        <div className="flex items-center justify-center my-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </div>
        </div>
      )}
      
      <div className={cn(
        "flex items-start gap-2",
        isAvatar && "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 -mx-3 px-3 py-2 rounded-lg"
      )}>
        <div className="flex-shrink-0 relative">
          <Avatar className="h-8 w-8 border border-slate-600">
            <AvatarFallback className={cn(
              "text-xs",
              isAvatar ? "bg-gradient-to-br from-cyan-600 to-purple-600 text-white" : "bg-slate-700 text-white"
            )}>
              {message.speakerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isAvatar && (
            <Bot className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-cyan-400 bg-slate-900 rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
              isAvatar ? "text-cyan-300" : "text-white"
            )}>
              {message.speakerName}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.sourceType === 'microphone_transcription' && (
              <Mic className="h-3 w-3 text-slate-500" />
            )}
          </div>
          <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">
            {message.textContent}
          </p>
          {message.audioUrl && (
            <audio 
              src={message.audioUrl} 
              controls 
              className="mt-2 h-8 w-full max-w-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationReplay;
