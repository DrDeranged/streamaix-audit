import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  MessageCircle, Send, X, ChevronUp, ChevronDown, Bot, Crown, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  isAiAgent?: boolean;
  isModerator?: boolean;
  isSubscriber?: boolean;
  timestamp: number;
}

interface LiveChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isConnected: boolean;
  isAuthenticated: boolean;
  className?: string;
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const timeAgo = useCallback((timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 py-2 px-1"
    >
      <AvatarWithFallback 
        src={message.avatar} 
        name={message.username} 
        size="xs"
        className={cn(
          message.isAiAgent && "ring-1 ring-cyan-400/50",
          message.isModerator && "ring-1 ring-emerald-400/50",
          message.isSubscriber && "ring-1 ring-purple-400/50"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {message.isAiAgent && (
            <Bot className="h-3 w-3 text-cyan-400" />
          )}
          {message.isModerator && (
            <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1 py-0 h-3.5">
              MOD
            </Badge>
          )}
          {message.isSubscriber && (
            <Crown className="h-3 w-3 text-purple-400" />
          )}
          <span className={cn(
            "text-xs font-semibold",
            message.isAiAgent ? "text-cyan-400" :
            message.isModerator ? "text-emerald-400" :
            message.isSubscriber ? "text-purple-400" : 
            "text-slate-300"
          )}>
            {message.username}
          </span>
          <span className="text-[10px] text-slate-500">
            {timeAgo(message.timestamp)}
          </span>
        </div>
        <p className="text-sm text-slate-200 break-words leading-relaxed">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}

export function LiveChatPanel({
  messages,
  onSendMessage,
  isConnected,
  isAuthenticated,
  className
}: LiveChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !isAuthenticated) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isAuthenticated, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50) {
      setIsExpanded(true);
    } else if (info.offset.y > 50) {
      setIsExpanded(false);
    }
  }, []);

  return (
    <motion.div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-2xl",
        "md:relative md:bottom-auto md:left-auto md:right-auto md:border md:rounded-xl",
        className
      )}
      initial={false}
      animate={{ 
        height: isExpanded ? '70vh' : '160px'
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      data-testid="chat-panel"
    >
      <motion.div
        className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing md:hidden"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div className="w-10 h-1 rounded-full bg-slate-600" />
      </motion.div>

      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Live Chat</span>
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
          )} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:hidden text-slate-400 hover:text-white"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="button-toggle-chat"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      <div 
        ref={scrollRef}
        className={cn(
          "overflow-y-auto px-3",
          isExpanded ? "h-[calc(70vh-120px)]" : "h-14"
        )}
      >
        <AnimatePresence initial={false}>
          {messages.slice(-50).map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>
        
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No messages yet. Be the first to chat!
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Send a message..." : "Sign in to chat"}
            disabled={!isAuthenticated || !isConnected}
            className="flex-1 h-9 bg-slate-800/50 border-slate-700 text-sm placeholder:text-slate-500"
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            className="h-9 w-9 bg-purple-600 hover:bg-purple-500"
            onClick={handleSend}
            disabled={!inputValue.trim() || !isAuthenticated || !isConnected}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface FloatingChatButtonProps {
  unreadCount?: number;
  onClick: () => void;
  className?: string;
}

export function FloatingChatButton({ unreadCount, onClick, className }: FloatingChatButtonProps) {
  return (
    <Button
      size="icon"
      className={cn(
        "fixed bottom-4 right-4 z-30 h-14 w-14 rounded-full",
        "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500",
        "shadow-lg shadow-purple-500/25",
        className
      )}
      onClick={onClick}
      data-testid="button-floating-chat"
    >
      <MessageCircle className="h-6 w-6 text-white" />
      {unreadCount && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
