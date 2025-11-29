import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, LogIn, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { Link } from 'wouter';

function parseMarkdown(text: string): JSX.Element[] {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let currentIndex = 0;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const items = listItems.map((item, i) => (
        <li key={i} className="ml-4 mb-1">{parseInlineMarkdown(item)}</li>
      ));
      if (listType === 'ul') {
        elements.push(<ul key={`list-${currentIndex++}`} className="list-disc pl-4 my-2 space-y-1">{items}</ul>);
      } else {
        elements.push(<ol key={`list-${currentIndex++}`} className="list-decimal pl-4 my-2 space-y-1">{items}</ol>);
      }
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.match(/^#{1,3}\s+/)) {
      flushList();
      const level = (trimmedLine.match(/^#+/) || [''])[0].length;
      const content = trimmedLine.replace(/^#+\s+/, '');
      const className = level === 1 ? 'text-base font-bold mt-3 mb-2' : 
                       level === 2 ? 'text-sm font-semibold mt-2 mb-1' : 
                       'text-sm font-medium mt-2 mb-1';
      elements.push(<div key={`h-${currentIndex++}`} className={className}>{parseInlineMarkdown(content)}</div>);
    }
    else if (trimmedLine.match(/^[-*]\s+/)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(trimmedLine.replace(/^[-*]\s+/, ''));
    }
    else if (trimmedLine.match(/^\d+\.\s+/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(trimmedLine.replace(/^\d+\.\s+/, ''));
    }
    else if (trimmedLine === '') {
      flushList();
      if (i > 0 && i < lines.length - 1) {
        elements.push(<div key={`br-${currentIndex++}`} className="h-2" />);
      }
    }
    else {
      flushList();
      elements.push(<p key={`p-${currentIndex++}`} className="mb-2 leading-relaxed">{parseInlineMarkdown(trimmedLine)}</p>);
    }
  }

  flushList();
  return elements;
}

function parseInlineMarkdown(text: string): (string | JSX.Element)[] {
  const result: (string | JSX.Element)[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    let firstMatch: { type: 'bold' | 'code'; index: number; match: RegExpMatchArray } | null = null;

    if (boldMatch && boldMatch.index !== undefined) {
      firstMatch = { type: 'bold', index: boldMatch.index, match: boldMatch };
    }
    if (codeMatch && codeMatch.index !== undefined) {
      if (!firstMatch || codeMatch.index < firstMatch.index) {
        firstMatch = { type: 'code', index: codeMatch.index, match: codeMatch };
      }
    }

    if (firstMatch) {
      if (firstMatch.index > 0) {
        result.push(remaining.substring(0, firstMatch.index));
      }

      if (firstMatch.type === 'bold') {
        result.push(
          <strong key={`bold-${keyIndex++}`} className="font-semibold text-purple-300">
            {firstMatch.match[1]}
          </strong>
        );
      } else if (firstMatch.type === 'code') {
        result.push(
          <code key={`code-${keyIndex++}`} className="bg-slate-700/50 px-1.5 py-0.5 rounded text-cyan-300 text-xs font-mono">
            {firstMatch.match[1]}
          </code>
        );
      }

      remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
    } else {
      result.push(remaining);
      break;
    }
  }

  return result;
}

function ChatMessage({ message, role, timestamp }: { message: string; role: 'user' | 'assistant'; timestamp: string }) {
  const parsedContent = useMemo(() => {
    if (role === 'user') return null;
    return parseMarkdown(message);
  }, [message, role]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {role === 'assistant' && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl shadow-lg ${
          role === 'user'
            ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white px-4 py-2.5'
            : 'bg-slate-800/90 border border-slate-700/50 text-slate-100 px-4 py-3'
        }`}
      >
        {role === 'user' ? (
          <p className="text-sm leading-relaxed">{message}</p>
        ) : (
          <div className="text-sm chat-content">
            {parsedContent}
          </div>
        )}
        <p className={`text-[10px] mt-1.5 ${role === 'user' ? 'text-white/60' : 'text-slate-500'}`}>
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

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
      {/* Speech Bubble - Hidden on mobile to prevent overlap */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-12 right-0 whitespace-nowrap hidden sm:block"
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

      {/* Energy Orb Container - Smaller on mobile */}
      <motion.button
        onClick={onClick}
        className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full cursor-pointer focus:outline-none group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          y: [0, -4, 0],
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
      const errorMsg = error.message || '';
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('No authentication token')) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to chat with the AI assistant and save your conversation history.',
          variant: 'default',
        });
      } else if (errorMsg.includes('OPENAI') || errorMsg.includes('API key')) {
        toast({
          title: 'Service temporarily unavailable',
          description: 'The AI service is currently unavailable. Please try again in a moment.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      }
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
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
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
            className="fixed bottom-2 right-2 left-2 sm:left-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-[360px] h-[55vh] sm:h-[480px] max-h-[500px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-purple-500/10 flex flex-col overflow-hidden"
            data-testid="chat-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-cyan-500/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">StreamAiX Assistant</h3>
                  <p className="text-[11px] text-slate-400 hidden sm:block">AI-powered help & insights</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl h-8 w-8"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat interface - available for everyone */}
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 px-3 sm:px-4 py-3" ref={scrollRef}>
                {isLoading && isAuthenticated ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 animate-pulse" />
                          <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-white" />
                        </div>
                        <p className="text-xs text-slate-500">Loading messages...</p>
                      </div>
                    </div>
                  ) : chatHistory?.messages && chatHistory.messages.length > 0 ? (
                    <div className="space-y-4">
                      {chatHistory.messages.map((msg) => (
                        <div key={msg.id} data-testid={`message-${msg.role}-${msg.id}`}>
                          <ChatMessage
                            message={msg.message}
                            role={msg.role}
                            timestamp={msg.createdAt}
                          />
                        </div>
                      ))}
                      {sendMessageMutation.isPending && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 justify-start"
                        >
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-purple-400"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-fuchsia-400"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-cyan-400"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">Thinking...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
                      <div className="relative mb-4 sm:mb-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
                        </div>
                        <motion.div
                          className="absolute inset-0 rounded-full border border-purple-500/30"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <h4 className="font-semibold text-white mb-1.5 text-sm sm:text-base">Welcome to StreamAiX Assistant!</h4>
                      <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-5 max-w-[260px]">
                        Ask me about bounties, markets, or crypto!
                      </p>
                      <div className="space-y-1.5 sm:space-y-2 w-full max-w-[280px]">
                        <button
                          className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800 transition-all group"
                          onClick={() => setInputMessage('How do bounties work?')}
                          data-testid="button-quick-bounties"
                        >
                          <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">How do bounties work?</span>
                        </button>
                        <button
                          className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800 transition-all group"
                          onClick={() => setInputMessage('Explain prediction markets')}
                          data-testid="button-quick-markets"
                        >
                          <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">Explain prediction markets</span>
                        </button>
                        <button
                          className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800 transition-all group"
                          onClick={() => setInputMessage('How do I create a summary?')}
                          data-testid="button-quick-summary"
                        >
                          <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">How to create a summary?</span>
                        </button>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t border-slate-700/50 bg-slate-800/30">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendMessageMutation.isPending}
                      className="flex-1 bg-slate-800/80 border-slate-700/50 focus:border-purple-500/50 text-white placeholder:text-slate-500 rounded-xl text-sm h-10"
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                      size="icon"
                      className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-purple-700 rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50 h-10 w-10"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 text-center hidden sm:block">
                    Powered by GPT-4o • Press Enter to send
                  </p>
                </div>
            </>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
