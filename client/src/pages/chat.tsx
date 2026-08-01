import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Bot, User, ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/PageHeader';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { useLocation } from 'wouter';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';
import { Navigation } from '@/components/ui/navigation';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  const isAuthenticated = !!getAuthToken();

  // Fetch chat history
  const { data: chatHistory, isLoading } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['/api/chat/history'],
    enabled: isAuthenticated,
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
        title: 'Unable to send message',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatHistory?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(inputMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const messages = chatHistory?.messages || [];

  // Suggested prompts for new users
  const suggestedPrompts = [
    "How do bounties work on StreamAiX?",
    "Analyze Bitcoin price trends",
    "What are prediction markets?",
    "Explain the STREAM points utility",
    "How do I create AI summaries?",
    "Show me top DeFi opportunities"
  ];

  return (
    <div className="relative min-h-[100dvh] bg-ink-page">
      <NeuralNetworkBackground />
      
      <div className="relative z-10">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                className="rounded-xl border border-ink-edge bg-ink-surface text-secondary hover:bg-ink-raised hover:text-primary"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div className="flex-1">
                <PageHeader
                  align="center"
                  eyebrow="AI · platform-wide assistant"
                  title="AI Assistant"
                  icon={<Bot className="h-5 w-5" />}
                  subtitle="Ask about platform features, market analysis, or investment insights."
                />
              </div>
              
              <div className="w-24" />
            </div>
          </motion.div>

          {/* Chat Container */}
          <Surface className="min-h-[600px] flex flex-col overflow-hidden">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-bright" />
                  </div>
                ) : messages.length === 0 ? (
                  /* Empty State */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="mb-6">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-block rounded-xl border border-accent-core/30 bg-accent-core/10 p-6"
                      >
                        <Sparkles className="h-16 w-16 text-accent-bright" />
                      </motion.div>
                    </div>
                    <SectionTitle as="h3" className="mb-2">Welcome to AI Assistant</SectionTitle>
                    <p className="mx-auto mb-8 max-w-md text-body">
                      Ask me anything about platform features, market trends, or get personalized investment insights.
                    </p>
                    
                    {/* Suggested Prompts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {suggestedPrompts.map((prompt, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => setInputMessage(prompt)}
                          className="group rounded-xl border border-ink-edge bg-ink-raised p-4 text-left transition-all hover:border-accent-core/50 hover:bg-ink-surface"
                          data-testid={`button-suggested-${index}`}
                        >
                          <p className="text-sm text-body transition-colors group-hover:text-primary">
                            {prompt}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* Messages */
                  <>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-core/40 bg-accent-core/10">
                            <Bot className="h-5 w-5 text-accent-bright" />
                          </div>
                        )}
                        
                        <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div
                            className={`inline-block rounded-xl border p-4 ${
                              msg.role === 'user'
                                ? 'border-accent-core bg-accent-core text-primary'
                                : 'border-ink-edge bg-ink-raised'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary">
                              {msg.message}
                            </p>
                            
                            {msg.role === 'assistant' && (
                              <div className="mt-3 flex items-center gap-2 border-t border-ink-divider pt-3">
                                <button
                                  onClick={() => handleCopyMessage(msg.message, msg.id)}
                                  className="flex items-center gap-1 text-xs text-secondary transition-colors hover:text-primary"
                                  data-testid={`button-copy-${msg.id}`}
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <p className="mt-2 px-2 text-xs text-muted">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {msg.role === 'user' && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-core/40 bg-accent-core/10">
                            <User className="h-5 w-5 text-accent-bright" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {sendMessageMutation.isPending && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 justify-start"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-core/40 bg-accent-core/10">
                          <Bot className="h-5 w-5 text-accent-bright" />
                        </div>
                        <div className="rounded-xl border border-ink-edge bg-ink-raised p-4">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-accent-bright" />
                            <p className="text-sm text-secondary">Thinking...</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={scrollRef} />
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-ink-divider bg-ink-page p-6">
              <div className="relative">
                <Surface variant="raised" className="border border-ink-edge p-4">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isAuthenticated ? "Ask me anything..." : "Please log in to use the chat"}
                    disabled={!isAuthenticated || sendMessageMutation.isPending}
                    className="min-h-[60px] max-h-[200px] resize-none border-none bg-transparent text-base text-primary placeholder:text-muted focus:ring-0"
                    data-testid="input-chat-message"
                  />
                  
                  <div className="mt-3 flex items-center justify-between border-t border-ink-divider pt-3">
                    <p className="text-xs text-muted">
                      {isAuthenticated ? 'Press Enter to send, Shift+Enter for new line' : 'Authentication required'}
                    </p>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMessageMutation.isPending || !isAuthenticated}
                      size="sm"
                       className="grad-accent glow-accent rounded-xl text-primary hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </Surface>
              </div>
            </div>
          </Surface>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-muted">
              AI responses may not always be accurate. Always verify important information.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
