import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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

interface StreamMessage {
  id: string;
  userId: string;
  content: string;
  messageType: string;
  createdAt: string;
  metadata?: any;
}

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
  hostName?: string;
}

export function ConversationReplay({
  streamId,
  className,
  limit = 50,
  hostName,
}: ConversationReplayProps) {
  const { data: messagesData, isLoading, error } = useQuery<{ success: boolean; messages: StreamMessage[] }>({
    queryKey: [`/api/streams/${streamId}/messages?limit=${limit}`],
    enabled: !!streamId,
  });

  const rawMessages = messagesData?.messages || [];
  
  const messages: ConversationMessage[] = rawMessages.map(msg => ({
    id: msg.id,
    participantId: msg.userId,
    speakerType: msg.messageType === 'ai_comment' ? 'avatar' : 'user',
    speakerName: msg.messageType === 'ai_comment' ? (hostName || 'AI Host') : 'Viewer',
    textContent: msg.content,
    audioUrl: null,
    audioDurationMs: null,
    sourceType: msg.messageType,
    replyToMessageId: null,
    createdAt: msg.createdAt,
  }));

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full p-4 space-y-3", className)}>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4 rounded-xl" />
          <Skeleton className="h-4 w-32" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
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
        <History className="w-12 h-12 text-muted mb-4" />
        <SectionTitle as="h3" className="mb-2">No Conversation History</SectionTitle>
        <p className="text-sm text-secondary">
          {error ? 'Failed to load conversation history' : 'This stream has no recorded conversations yet'}
        </p>
      </div>
    );
  }

  const uniqueSpeakers = new Set(messages.map(m => m.speakerName || 'Unknown')).size;
  const avatarMessages = messages.filter(m => m.speakerType === 'avatar').length;

  return (
    <Surface className={cn(
      "flex flex-col h-full overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-divider bg-ink-raised">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent-bright" />
          <SectionTitle as="h3" className="text-sm font-medium">Conversation Replay</SectionTitle>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-ink-edge text-secondary">
            <MessageSquare className="w-3 h-3 mr-1" />
            {messages.length}
          </Badge>
          <Badge variant="outline" className="text-xs border-ink-edge text-secondary">
            <Users className="w-3 h-3 mr-1" />
            {uniqueSpeakers}
          </Badge>
          <Badge variant="outline" className="text-xs border-accent-core/30 text-accent-bright">
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
    </Surface>
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
          <div className="flex items-center gap-1 text-xs text-muted bg-ink-raised px-2 py-0.5 rounded-xl">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </div>
        </div>
      )}
      
      <div className={cn(
        "flex items-start gap-2",
        isAvatar && "bg-accent-core/10 -mx-3 px-3 py-2 rounded-xl"
      )}>
        <div className="flex-shrink-0 relative">
          <Avatar className="h-8 w-8 border border-ink-edge">
            <AvatarFallback className={cn(
              "text-xs",
              isAvatar ? "bg-accent-deep text-primary" : "bg-ink-raised text-primary"
            )}>
              {(message.speakerName || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isAvatar && (
            <Bot className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-accent-bright bg-ink-surface rounded-xl" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
              isAvatar ? "text-accent-bright" : "text-primary"
            )}>
              {message.speakerName || 'Unknown'}
            </span>
            <span className="text-xs text-muted">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.sourceType === 'microphone_transcription' && (
              <Mic className="h-3 w-3 text-muted" />
            )}
          </div>
          <p className="text-sm text-body mt-0.5 whitespace-pre-wrap">
            {message.textContent || ''}
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
