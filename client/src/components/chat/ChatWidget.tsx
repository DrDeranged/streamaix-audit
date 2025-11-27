import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { Link } from 'wouter';

const AGENT_MESSAGES = [
  "Need help?",
  "Ask me anything",
  "100+ agents online",
  "AI-powered insights",
  "Let's chat!",
  "I'm here to help",
];

function EnergyOrbButton({ onClick }: { onClick: () => void }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowMessage(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % AGENT_MESSAGES.length);
        setShowMessage(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Speech Bubble */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-12 right-0 whitespace-nowrap"
          >
            <div className="relative bg-slate-900/95 backdrop-blur-xl border border-purple-500/40 rounded-xl px-4 py-2 shadow-lg shadow-purple-500/20">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                {AGENT_MESSAGES[messageIndex]}
              </span>
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-slate-900/95 border-r border-b border-purple-500/40 transform rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Energy Orb Container */}
      <motion.button
        onClick={onClick}
        className="relative w-16 h-16 rounded-full cursor-pointer focus:outline-none group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          y: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        data-testid="button-open-chat"
      >
        {/* Outer Pulsing Glow Ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 opacity-40 blur-xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary Glow Ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 opacity-30 blur-lg"
          animate={{
            scale: [1.1, 1.3, 1.1],
            opacity: [0.3, 0.15, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Orbiting Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-3px',
              marginTop: '-3px',
            }}
            animate={{
              x: [
                Math.cos((i * 60 * Math.PI) / 180) * 28,
                Math.cos(((i * 60 + 180) * Math.PI) / 180) * 28,
                Math.cos(((i * 60 + 360) * Math.PI) / 180) * 28,
              ],
              y: [
                Math.sin((i * 60 * Math.PI) / 180) * 28,
                Math.sin(((i * 60 + 180) * Math.PI) / 180) * 28,
                Math.sin(((i * 60 + 360) * Math.PI) / 180) * 28,
              ],
              opacity: [0.8, 0.4, 0.8],
              scale: [1, 0.6, 1],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Inner Orbiting Ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-purple-400/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute -top-0.5 left-1/2 w-1 h-1 rounded-full bg-purple-400 -translate-x-1/2" />
        </motion.div>

        {/* Orb Base with Gradient */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-500/50 shadow-inner overflow-hidden">
          {/* Swirling Energy Effect */}
          <motion.div
            className="absolute inset-0 opacity-80"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #a855f7, transparent, #06b6d4, transparent, #d946ef, transparent)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent" />
          
          {/* Core Energy */}
          <motion.div
            className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500/40 via-fuchsia-500/30 to-cyan-500/40 backdrop-blur-sm"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* AI Symbol - Stylized "S" or Neural Node */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Neural network node design */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Central node */}
                <circle cx="12" cy="12" r="3" fill="currentColor" className="opacity-90" />
                {/* Outer nodes */}
                <circle cx="12" cy="4" r="1.5" fill="currentColor" className="opacity-70" />
                <circle cx="19" cy="8" r="1.5" fill="currentColor" className="opacity-70" />
                <circle cx="19" cy="16" r="1.5" fill="currentColor" className="opacity-70" />
                <circle cx="12" cy="20" r="1.5" fill="currentColor" className="opacity-70" />
                <circle cx="5" cy="16" r="1.5" fill="currentColor" className="opacity-70" />
                <circle cx="5" cy="8" r="1.5" fill="currentColor" className="opacity-70" />
                {/* Connection lines */}
                <path d="M12 7 L12 9" strokeLinecap="round" className="opacity-60" />
                <path d="M12 15 L12 17" strokeLinecap="round" className="opacity-60" />
                <path d="M9 10.5 L7 9" strokeLinecap="round" className="opacity-60" />
                <path d="M15 10.5 L17 9" strokeLinecap="round" className="opacity-60" />
                <path d="M9 13.5 L7 15" strokeLinecap="round" className="opacity-60" />
                <path d="M15 13.5 L17 15" strokeLinecap="round" className="opacity-60" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Scan Line Effect */}
        <motion.div
          className="absolute inset-1 rounded-full overflow-hidden pointer-events-none"
          style={{ mixBlendMode: 'overlay' }}
        >
          <motion.div
            className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
            animate={{
              y: [0, 56, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>

        {/* Hover Highlight */}
        <div className="absolute inset-1 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
      </motion.button>

      {/* Status Indicator */}
      <motion.div
        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-lg"
        animate={{
          scale: [1, 1.2, 1],
          boxShadow: [
            '0 0 0 0 rgba(16, 185, 129, 0.4)',
            '0 0 0 6px rgba(16, 185, 129, 0)',
            '0 0 0 0 rgba(16, 185, 129, 0.4)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Check if user is authenticated for personalized features
  const isAuthenticated = !!getAuthToken();

  // Fetch chat history (only for authenticated users)
  const { data: chatHistory, isLoading } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['/api/chat/history'],
    enabled: isOpen && isAuthenticated,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      setInputMessage('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory?.messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessageMutation.mutate(inputMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Energy Orb AI Agent Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <EnergyOrbButton onClick={() => setIsOpen(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl flex flex-col"
            data-testid="chat-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-cyan-500/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">StreamAiX Assistant</h3>
                  <p className="text-xs text-muted-foreground">AI-powered help & insights</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content - Different UI for authenticated vs unauthenticated users */}
            {!isAuthenticated ? (
              // Unauthenticated: Show signup prompt
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center mb-6">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Unlock Your AI Assistant
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Sign up to chat with our AI-powered assistant and get help with platform features, investing insights, and crypto questions.
                </p>
                <Link href="/auth">
                  <Button 
                    className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600"
                    data-testid="button-signup-chat"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign Up / Log In
                  </Button>
                </Link>
              </div>
            ) : (
              // Authenticated: Show full chat interface
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : chatHistory?.messages && chatHistory.messages.length > 0 ? (
                    <div className="space-y-4">
                      {chatHistory.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${msg.role}-${msg.id}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {sendMessageMutation.isPending && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="font-semibold mb-2">Welcome to StreamAiX Assistant!</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ask me about the platform, bounties, investing, or any crypto questions!
                      </p>
                      <div className="space-y-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => setInputMessage('How do bounties work?')}
                          data-testid="button-quick-bounties"
                        >
                          How do bounties work?
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => setInputMessage('What are the best investment strategies?')}
                          data-testid="button-quick-investing"
                        >
                          Best investment strategies?
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => setInputMessage('How do I create a summary?')}
                          data-testid="button-quick-summary"
                        >
                          How to create a summary?
                        </Button>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendMessageMutation.isPending}
                      className="flex-1"
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                      size="icon"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Powered by GPT-4o • Press Enter to send
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
