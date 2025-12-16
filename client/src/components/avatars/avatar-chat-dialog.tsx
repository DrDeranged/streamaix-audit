import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Loader2, 
  MessageCircle, 
  Trash2, 
  Sparkles,
  Bot,
  User,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AvatarChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatar: {
    id: string;
    name: string;
    handle: string;
    bio: string;
    expertise: string;
    imageUrl: string | null;
    verificationStatus?: string;
    investmentThesis?: string | null;
    tradingStyle?: string | null;
    riskTolerance?: string | null;
    marketOutlook?: string | null;
  };
}

export function AvatarChatDialog({ open, onOpenChange, avatar }: AvatarChatDialogProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: historyData, isLoading: historyLoading } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['/api/avatars', avatar.id, 'chat', 'history'],
    enabled: open,
    refetchInterval: false,
  });

  const messages = historyData?.messages || [];

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      return await apiRequest(`/api/avatars/${avatar.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: userMessage })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/avatars', avatar.id, 'chat', 'history'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Message failed",
        description: error.message || "Could not send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/avatars/${avatar.id}/chat/history`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/avatars', avatar.id, 'chat', 'history'] });
      toast({
        title: "Conversation cleared",
        description: "Your chat history has been reset."
      });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    const userMessage = message.trim();
    setMessage("");
    await sendMessageMutation.mutateAsync(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    `What's your investment philosophy?`,
    `How do you evaluate opportunities?`,
    `What's your market outlook?`,
    `Any advice for new investors?`
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 border-purple-500/30">
        <DialogHeader className="px-6 py-4 border-b border-purple-500/20 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-12 h-12 ring-2 ring-purple-500/40 border-2 border-slate-800">
                <AvatarImage 
                  src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                  alt={avatar.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-600 text-white font-bold">
                  {avatar.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {avatar.verificationStatus === 'verified' && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Chat with {avatar.name}
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                  AI Persona
                </Badge>
              </DialogTitle>
              <p className="text-sm text-purple-300/70">{avatar.expertise}</p>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                data-testid="button-clear-chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-xl" />
                  <div className="relative bg-slate-900/80 border border-purple-500/30 rounded-full p-6">
                    <MessageCircle className="h-12 w-12 text-purple-400" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Start a conversation with {avatar.name}
                  </h3>
                  <p className="text-sm text-purple-300/70 max-w-sm">
                    Ask about their investment philosophy, market insights, or get personalized advice based on their expertise.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs text-left justify-start bg-slate-900/50 border-purple-500/30 text-purple-200 hover:bg-purple-500/10 hover:border-purple-400/50"
                      onClick={() => {
                        setMessage(question);
                        inputRef.current?.focus();
                      }}
                      data-testid={`button-suggestion-${index}`}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((msg, index) => (
                  <motion.div
                    key={`${msg.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="w-8 h-8 ring-1 ring-purple-500/40 flex-shrink-0">
                        <AvatarImage src={avatar.imageUrl || undefined} alt={avatar.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-600 text-white text-xs">
                          {avatar.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div 
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white' 
                          : 'bg-slate-800/80 border border-purple-500/20 text-slate-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-purple-200/70' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {sendMessageMutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <Avatar className="w-8 h-8 ring-1 ring-purple-500/40 flex-shrink-0">
                  <AvatarImage src={avatar.imageUrl || undefined} alt={avatar.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-600 text-white text-xs">
                    {avatar.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-800/80 border border-purple-500/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-purple-300/70">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-purple-500/20 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${avatar.name.split(' ')[0]} anything...`}
              disabled={sendMessageMutation.isPending}
              className="flex-1 bg-slate-900/50 border-purple-500/30 text-white placeholder:text-purple-300/50 focus:border-purple-400/50 focus:ring-purple-400/20"
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-6"
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-purple-400/50 mt-2 text-center">
            This is an AI persona. Responses are for educational purposes only, not financial advice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
