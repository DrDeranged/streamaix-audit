import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Send, Sparkles, Loader2, LogIn, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import SectionTitle from '@/components/ds/SectionTitle';
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
            <strong key={`bold-${keyIndex++}`} className="font-semibold text-accent-bright">
            {firstMatch.match[1]}
          </strong>
        );
      } else if (firstMatch.type === 'code') {
        result.push(
          <code key={`code-${keyIndex++}`} className="bg-ink-raised px-1.5 py-0.5 rounded-xl text-accent-bright text-xs font-mono">
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
        <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-accent-core flex items-center justify-center glow-accent">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl border ${
          role === 'user'
            ? 'grad-accent text-primary border-accent-core px-4 py-2.5'
            : 'bg-ink-surface border-ink-edge text-body px-4 py-3'
        }`}
      >
        {role === 'user' ? (
          <p className="text-sm leading-relaxed">{message}</p>
        ) : (
          <div className="text-sm chat-content">
            {parsedContent}
          </div>
        )}
        <p className={`text-[10px] mt-1.5 ${role === 'user' ? 'text-primary/60' : 'text-muted'}`}>
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

function LauncherButton({ isOpen, isOnline, onClick }: { isOpen: boolean; isOnline: boolean; onClick: () => void }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [tooltipDismissed, setTooltipDismissed] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem('streamaix-chat-tooltip-dismissed') === '1'
  );
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % AGENT_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const dismissTooltip = () => {
    window.sessionStorage.setItem('streamaix-chat-tooltip-dismissed', '1');
    setTooltipDismissed(true);
  };

  const showTooltip = !isOpen && !tooltipDismissed;

  return (
    <div className="relative">
      {/* Rotating-phrase tooltip — ink pill, hidden on mobile */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
            className="absolute -top-12 right-0 whitespace-nowrap hidden sm:flex items-center gap-1 bg-ink-surface/90 backdrop-blur border border-ink-edge rounded-xl pl-4 pr-1.5 py-1.5"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={messageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                className="text-sm font-medium text-primary"
              >
                {AGENT_MESSAGES[messageIndex]}
              </motion.span>
            </AnimatePresence>
            <button
              type="button"
              onClick={dismissTooltip}
              aria-label="Dismiss assistant tip"
              className="p-1 text-muted hover:text-primary rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="button-dismiss-chat-tooltip"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing ring */}
      {!prefersReducedMotion && !isOpen && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-accent-core/40 pointer-events-none"
          animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <motion.button
        type="button"
        onClick={onClick}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
        aria-label={isOpen ? 'Close chat' : 'Chat with StreamAiX assistant'}
        aria-expanded={isOpen}
        className="relative w-14 h-14 rounded-full grad-accent glow-accent border-0 text-primary flex items-center justify-center cursor-pointer transition-[filter] duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink-page"
        data-testid="button-open-chat"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? 'close' : 'chat'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            className="flex items-center justify-center"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>

        {/* Presence dot — reflects browser online state */}
        <span
          aria-hidden="true"
          className={`absolute top-0.5 right-0.5 h-3 w-3 rounded-full ring-[1.5px] ring-ink-page ${isOnline ? 'bg-gain' : 'bg-ink-edge'}`}
          data-testid="status-chat-presence"
        />
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

  // Browser online state drives the launcher presence dot
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Escape closes the open panel
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

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
          title: 'Unable to send message',
          description: 'Please try again.',
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
      {/* Floating chat launcher */}
      <div
        className="fixed z-50"
        style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))', right: '1.25rem' }}
      >
        <LauncherButton
          isOpen={isOpen}
          isOnline={isOnline}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              return;
            }
            // Dispatch event to close any open avatar dialogs on mobile
            window.dispatchEvent(new CustomEvent('streamaix-chat-open'));
            setIsOpen(true);
          }}
        />
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-2 right-2 left-2 sm:left-auto sm:right-6 sm:bottom-24 z-50 w-auto sm:w-[360px] h-[55vh] sm:h-[480px] max-h-[500px] bg-ink-surface backdrop-blur-xl border border-ink-edge rounded-2xl flex flex-col overflow-hidden"
            data-testid="chat-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-ink-divider bg-accent-core/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-accent-core flex items-center justify-center glow-accent">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <SectionTitle as="h3" className="font-semibold text-sm">StreamAiX Assistant</SectionTitle>
                  <p className="text-[11px] text-secondary hidden sm:block">AI-powered help & insights</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-secondary hover:text-primary hover:bg-ink-raised rounded-xl h-8 w-8"
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
                          <div className="w-10 h-10 rounded-xl bg-accent-core animate-pulse" />
                          <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-primary" />
                        </div>
                        <p className="text-xs text-muted">Loading messages...</p>
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
                            <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-accent-core flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                          <div className="bg-ink-surface border border-ink-edge rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <motion.div
                                   className="w-2 h-2 rounded-xl bg-accent-bright"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                   className="w-2 h-2 rounded-xl bg-accent-core"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                   className="w-2 h-2 rounded-xl bg-gain"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                              </div>
                               <span className="text-xs text-muted">Thinking...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
                      <div className="relative mb-4 sm:mb-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-accent-core/20 flex items-center justify-center">
                          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-accent-bright" />
                        </div>
                        <motion.div
                           className="absolute inset-0 rounded-xl border border-accent-core/30"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <SectionTitle as="h3" className="font-semibold mb-1.5 text-sm sm:text-base">Welcome to StreamAiX Assistant!</SectionTitle>
                      <p className="text-xs sm:text-sm text-secondary mb-4 sm:mb-5 max-w-[260px]">
                        Ask me about bounties, markets, or crypto!
                      </p>
                      <div className="space-y-1.5 sm:space-y-2 w-full max-w-[280px]">
                        <button
                           className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl bg-ink-raised border border-ink-edge hover:border-accent-core hover:bg-ink-surface transition-all group"
                          onClick={() => setInputMessage('How do bounties work?')}
                          data-testid="button-quick-bounties"
                        >
                           <span className="text-xs sm:text-sm text-body group-hover:text-primary transition-colors">How do bounties work?</span>
                        </button>
                        <button
                           className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl bg-ink-raised border border-ink-edge hover:border-accent-core hover:bg-ink-surface transition-all group"
                          onClick={() => setInputMessage('Explain prediction markets')}
                          data-testid="button-quick-markets"
                        >
                           <span className="text-xs sm:text-sm text-body group-hover:text-primary transition-colors">Explain prediction markets</span>
                        </button>
                        <button
                           className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl bg-ink-raised border border-ink-edge hover:border-accent-core hover:bg-ink-surface transition-all group"
                          onClick={() => setInputMessage('How do I create a summary?')}
                          data-testid="button-quick-summary"
                        >
                           <span className="text-xs sm:text-sm text-body group-hover:text-primary transition-colors">How to create a summary?</span>
                        </button>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                 <div className="p-3 sm:p-4 border-t border-ink-divider bg-ink-raised">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendMessageMutation.isPending}
                       className="flex-1 bg-ink-surface border-ink-edge focus:border-accent-core text-primary placeholder:text-muted rounded-xl text-sm h-10"
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                      size="icon"
                       className="grad-accent hover:bg-accent-deep rounded-xl glow-accent disabled:opacity-50 h-10 w-10"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                   <p className="text-[10px] text-muted mt-1.5 text-center hidden sm:block">
                    AI-Powered • Press Enter to send
                  </p>
                </div>
            </>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
