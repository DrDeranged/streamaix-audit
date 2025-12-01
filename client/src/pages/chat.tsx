import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Bot, User, ArrowLeft, Trash2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { useLocation } from 'wouter';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';
import { Navigation } from '@/components/ui/navigation';

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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
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
                className="neural-glass hover:bg-white/10"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 rounded-2xl shadow-2xl"
                  >
                    <Bot className="h-8 w-8 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-orbitron font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                    AI Assistant
                  </h1>
                </div>
                <p className="text-gray-400">
                  Powered by GPT-4o • Ask about platform features, market analysis, or investment insights
                </p>
              </div>
              
              <div className="w-24" />
            </div>
          </motion.div>

          {/* Chat Container */}
          <div className="neural-glass rounded-3xl shadow-2xl overflow-hidden iridescent-border min-h-[600px] flex flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
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
                        className="inline-block p-6 bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-3xl"
                      >
                        <Sparkles className="h-16 w-16 text-purple-400" />
                      </motion.div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Welcome to AI Assistant</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
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
                          className="neural-glass p-4 rounded-xl text-left hover:bg-white/5 transition-all group border border-purple-500/20 hover:border-purple-400/40"
                          data-testid={`button-suggested-${index}`}
                        >
                          <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
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
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        )}
                        
                        <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div
                            className={`inline-block p-4 rounded-2xl ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 text-white'
                                : 'neural-glass border border-purple-500/20'
                            }`}
                          >
                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'text-gray-100' : ''}`}>
                              {msg.message}
                            </p>
                            
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                                <button
                                  onClick={() => handleCopyMessage(msg.message, msg.id)}
                                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
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
                          
                          <p className="text-xs text-gray-500 mt-2 px-2">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {msg.role === 'user' && (
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                            <User className="h-5 w-5 text-white" />
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
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="neural-glass border border-purple-500/20 p-4 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                            <p className="text-sm text-gray-400">Thinking...</p>
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
            <div className="border-t border-white/10 p-6 bg-black/20">
              <div className="relative">
                <div className="neural-glass rounded-2xl p-4 iridescent-border">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isAuthenticated ? "Ask me anything..." : "Please log in to use the chat"}
                    disabled={!isAuthenticated || sendMessageMutation.isPending}
                    className="min-h-[60px] max-h-[200px] resize-none bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-500 text-base"
                    data-testid="input-chat-message"
                  />
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-500">
                      {isAuthenticated ? 'Press Enter to send, Shift+Enter for new line' : 'Authentication required'}
                    </p>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMessageMutation.isPending || !isAuthenticated}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:opacity-90 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-500">
              AI responses are generated by GPT-4o and may not always be accurate. Always verify important information.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
