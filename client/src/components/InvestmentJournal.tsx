import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  Lightbulb,
  DollarSign,
  Search,
  BarChart3,
  PenTool,
  Save,
  Plus,
  Clock,
  Activity,
  Star,
  Brain,
  Zap
} from 'lucide-react';
import { format, startOfDay, subDays, addDays, isToday, parseISO } from 'date-fns';

interface JournalEntry {
  id: string;
  userId: string;
  noteText: string;
  noteType: 'trade-analysis' | 'market-thoughts' | 'goals' | 'lessons' | 'research' | 'general';
  journalDate: string;
  mood?: 'bullish' | 'bearish' | 'neutral';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DayStats {
  entryCount: number;
  portfolioChange?: number;
  tradeCount?: number;
  streak: number;
}

const journalTemplates = {
  'trade-analysis': {
    icon: BarChart3,
    label: 'Trade Analysis',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    placeholder: `📊 Trade Analysis for ${format(new Date(), 'MMMM d, yyyy')}

**Position:** [Stock/Crypto Symbol]
**Entry Price:** $X.XX
**Exit Price:** $X.XX
**P&L:** +/-$XXX (+/-X.X%)

**Reasoning:**
- Why I entered this position
- Market conditions at entry

**Lessons Learned:**
- What went well
- What could be improved
- Key insights for future trades`
  },
  'market-thoughts': {
    icon: TrendingUp,
    label: 'Market Thoughts',
    color: 'bg-green-500/10 text-green-400 border-green-500/30',
    placeholder: `💭 Market Thoughts for ${format(new Date(), 'MMMM d, yyyy')}

**Overall Market Sentiment:** [Bullish/Bearish/Neutral]

**Key Observations:**
- Major market movements today
- Sector performance
- Economic indicators/news impact

**Opportunities:**
- Stocks/sectors to watch
- Potential entries/exits

**Risks:**
- What concerns me about current markets
- Risk management thoughts`
  },
  'goals': {
    icon: Target,
    label: 'Goals & Planning',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    placeholder: `🎯 Goals & Planning for ${format(new Date(), 'MMMM d, yyyy')}

**Today's Trading Plan:**
- [ ] Positions to monitor
- [ ] Entry/exit levels
- [ ] Risk management rules

**Weekly/Monthly Goals:**
- Portfolio performance targets
- Learning objectives
- Strategy improvements

**Progress Review:**
- What's working well
- Areas for improvement
- Adjustments needed`
  },
  'lessons': {
    icon: BookOpen,
    label: 'Lessons Learned',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    placeholder: `📚 Lessons Learned - ${format(new Date(), 'MMMM d, yyyy')}

**Key Insight:**
What's the most important thing I learned today?

**Mistake Analysis:**
- What went wrong (if anything)
- Why it happened
- How to prevent it next time

**Strategy Evolution:**
- New techniques or indicators discovered
- Adjustments to current strategy
- Ideas to research further

**Mindset & Discipline:**
- Emotional state during trades
- How well I followed my rules
- Areas for mental improvement`
  },
  'research': {
    icon: Search,
    label: 'Research Notes',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    placeholder: `🔍 Research Notes - ${format(new Date(), 'MMMM d, yyyy')}

**Company/Asset:** [Name/Symbol]

**Key Findings:**
- Fundamental analysis
- Technical patterns
- News/catalyst events

**Investment Thesis:**
- Bull case
- Bear case
- My conclusion

**Action Items:**
- [ ] Further research needed
- [ ] Price targets/levels to watch
- [ ] Timeline for decision`
  },
  'general': {
    icon: PenTool,
    label: 'General Notes',
    color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    placeholder: `📝 Investment Journal - ${format(new Date(), 'MMMM d, yyyy')}

What's on your mind today? This is your space to capture any thoughts, ideas, or reflections about your investment journey.

Some ideas to get started:
- Market observations
- Personal reflections
- Learning moments
- Future plans
- Random insights`
  }
};

export default function InvestmentJournal() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEntryText, setNewEntryText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof journalTemplates>('general');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedMood, setSelectedMood] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Format date for API queries
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Fetch journal entries for selected date
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['/api/notes', { date: dateString }],
    queryFn: () => apiRequest(`/api/notes?summaryId=journal-${dateString}`, {
      headers: getAuthHeaders(),
    }),
    enabled: !!user && isAuthenticated,
  });

  // Fetch daily stats (mock for now, can be enhanced with real portfolio data)
  const { data: statsData } = useQuery({
    queryKey: ['/api/users/stats', dateString],
    queryFn: () => apiRequest(`/api/users/${user?.id}/stats?date=${dateString}`, {
      headers: getAuthHeaders(),
    }),
    enabled: !!user && isAuthenticated,
  });

  const entries = entriesData?.notes || [];
  const stats: DayStats = {
    entryCount: entries.length,
    portfolioChange: statsData?.portfolioChange || 0,
    tradeCount: statsData?.tradeCount || 0,
    streak: statsData?.journalStreak || 0
  };

  // Create journal entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (entryData: { noteText: string; noteType: string; mood?: string }) =>
      apiRequest('/api/notes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...entryData,
          summaryId: `journal-${dateString}`, // Use special summaryId for journal entries
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setNewEntryText('');
      setShowNewEntry(false);
      setIsDrawerOpen(false);
      toast({ title: 'Success!', description: 'Journal entry saved successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save journal entry.', variant: 'destructive' });
    },
  });

  // Initialize template when selected (both desktop form and mobile drawer)
  useEffect(() => {
    if ((showNewEntry || isDrawerOpen) && selectedTemplate) {
      setNewEntryText(journalTemplates[selectedTemplate].placeholder);
    }
  }, [showNewEntry, isDrawerOpen, selectedTemplate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  const handleSaveEntry = () => {
    if (!newEntryText.trim()) return;
    
    createEntryMutation.mutate({
      noteText: newEntryText,
      noteType: selectedTemplate,
      mood: selectedMood
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
              Personal Investment Journal
            </h3>
            <p className="text-purple-600 dark:text-purple-400 text-sm">
              Sign in to access your daily trading journal and track your investment journey.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-gray-800 rounded-2xl p-4 md:p-6 border border-slate-600"
      >
        {/* Mobile-first header: stack title and nav */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Investment Journal</h2>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigateDate('prev')}
              className="text-gray-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] md:min-h-8 md:min-w-8 md:p-1"
              data-testid="button-prev-date"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
            
            <div className="px-3 py-2 md:px-4 bg-white/10 rounded-lg min-w-auto md:min-w-[200px] text-center">
              <div className="text-base md:text-lg font-semibold text-white">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE')}
              </div>
              <div className="text-xs md:text-sm text-gray-300">
                {format(selectedDate, 'MMM d, yyyy')}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigateDate('next')}
              className="text-gray-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] md:min-h-8 md:min-w-8 md:p-1"
              data-testid="button-next-date"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
            
            {!isToday(selectedDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="ml-2 text-gray-300 hover:text-white bg-white/5 border-white/20 hover:bg-white/10 min-h-[44px] md:min-h-auto"
                data-testid="button-today"
              >
                Today
              </Button>
            )}
          </div>
        </div>

        {/* Daily Stats - Mobile optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
          <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
            <div className="text-xl md:text-2xl font-bold text-blue-400" data-testid="text-entry-count">{stats.entryCount}</div>
            <div className="text-xs text-gray-400">Entries</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
            <div className={`text-xl md:text-2xl font-bold flex items-center justify-center gap-1 ${
              (stats.portfolioChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`} data-testid="text-portfolio-change">
              {(stats.portfolioChange || 0) >= 0 ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />}
              {(stats.portfolioChange || 0) >= 0 ? '+' : ''}{(stats.portfolioChange || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Portfolio</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
            <div className="text-xl md:text-2xl font-bold text-purple-400" data-testid="text-trade-count">{stats.tradeCount}</div>
            <div className="text-xs text-gray-400">Trades</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
            <div className="text-xl md:text-2xl font-bold text-amber-400 flex items-center justify-center gap-1" data-testid="text-streak">
              <Activity className="w-3 h-3 md:w-4 md:h-4" />
              {stats.streak}
            </div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Template Buttons - Mobile: horizontal scroll, Desktop: grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Mobile: Horizontal scrolling chips */}
        <div className="md:hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 p-1">
              {Object.entries(journalTemplates).map(([key, template]) => {
                const Icon = template.icon;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    className={`min-h-[44px] px-4 py-2 flex items-center gap-2 whitespace-nowrap transition-all ${template.color} border hover:bg-white/10`}
                    onClick={() => {
                      setSelectedTemplate(key as keyof typeof journalTemplates);
                      setIsDrawerOpen(true);
                    }}
                    data-testid={`button-template-${key}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{template.label}</span>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        
        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(journalTemplates).map(([key, template]) => {
            const Icon = template.icon;
            return (
              <Button
                key={key}
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(key as keyof typeof journalTemplates);
                  setShowNewEntry(true);
                }}
                className={`h-auto p-3 flex flex-col items-center gap-2 hover:scale-105 transition-all ${template.color} border`}
                data-testid={`button-template-${key}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{template.label}</span>
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* Mobile Drawer for New Entry Form */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-slate-900 border-slate-700">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-cyan-300 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              📝 New Journal Entry - {journalTemplates[selectedTemplate].label}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={selectedTemplate} onValueChange={(value: keyof typeof journalTemplates) => setSelectedTemplate(value)}>
                <SelectTrigger className="bg-white/5 border-white/20 backdrop-blur-sm text-white min-h-[44px]" data-testid="select-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(journalTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <template.icon className="w-4 h-4" />
                        {template.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMood} onValueChange={(value: 'bullish' | 'bearish' | 'neutral') => setSelectedMood(value)}>
                <SelectTrigger className="bg-white/5 border-white/20 backdrop-blur-sm text-white min-h-[44px]" data-testid="select-mood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullish">🐂 Bullish</SelectItem>
                  <SelectItem value="neutral">😐 Neutral</SelectItem>
                  <SelectItem value="bearish">🐻 Bearish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Textarea
              value={newEntryText}
              onChange={(e) => {
                setNewEntryText(e.target.value);
                // Auto-grow textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
              }}
              placeholder="Write your thoughts..."
              className="bg-white/5 border-white/20 backdrop-blur-sm text-white resize-none min-h-[120px] placeholder:text-gray-400"
              rows={5}
              data-testid="textarea-entry"
            />
            
            <div className="text-xs text-gray-400 text-right">
              {newEntryText.length}/5000 characters
            </div>
          </div>
          
          <DrawerFooter className="flex flex-row gap-2 pt-2">
            <Button
              onClick={handleSaveEntry}
              disabled={!newEntryText.trim() || createEntryMutation.isPending}
              className="bg-green-600 hover:bg-green-700 flex-1 min-h-[44px]"
              data-testid="button-save-entry"
            >
              <Save className="h-4 w-4 mr-2" />
              {createEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setNewEntryText('');
                }}
                className="border-white/20 backdrop-blur-sm bg-white/5 text-white hover:bg-white/10 min-h-[44px]"
                data-testid="button-cancel-entry"
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* Desktop New Entry Form */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block"
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  📝 New Journal Entry - {journalTemplates[selectedTemplate].label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select value={selectedTemplate} onValueChange={(value: keyof typeof journalTemplates) => setSelectedTemplate(value)}>
                    <SelectTrigger className="bg-white/5 border-white/20 backdrop-blur-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(journalTemplates).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <template.icon className="w-4 h-4" />
                            {template.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedMood} onValueChange={(value: 'bullish' | 'bearish' | 'neutral') => setSelectedMood(value)}>
                    <SelectTrigger className="bg-white/5 border-white/20 backdrop-blur-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullish">🐂 Bullish</SelectItem>
                      <SelectItem value="neutral">😐 Neutral</SelectItem>
                      <SelectItem value="bearish">🐻 Bearish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Textarea
                  value={newEntryText}
                  onChange={(e) => setNewEntryText(e.target.value)}
                  placeholder="Write your thoughts..."
                  className="bg-white/5 border-white/20 backdrop-blur-sm text-white resize-none min-h-[200px] placeholder:text-gray-400"
                  rows={8}
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEntry}
                    disabled={!newEntryText.trim() || createEntryMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewEntry(false);
                      setNewEntryText('');
                    }}
                    className="border-white/20 backdrop-blur-sm bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Entries */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse bg-gray-800/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {isToday(selectedDate) ? "Today's Entries" : `Entries for ${format(selectedDate, 'MMM d')}`} ({entries.length})
            </h3>
            {entries.map((entry: any, index: number) => {
              const template = journalTemplates[entry.noteType as keyof typeof journalTemplates] || journalTemplates.general;
              const Icon = template.icon;
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-slate-600 hover:border-slate-500 transition-all" data-testid={`card-entry-${entry.id}`}>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${template.color} text-xs`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {template.label}
                          </Badge>
                          {entry.mood && (
                            <Badge variant="outline" className={`text-xs ${
                              entry.mood === 'bullish' ? 'text-green-400 border-green-500/30' :
                              entry.mood === 'bearish' ? 'text-red-400 border-red-500/30' :
                              'text-gray-400 border-gray-500/30'
                            }`}>
                              {entry.mood === 'bullish' ? '🐂' : entry.mood === 'bearish' ? '🐻' : '😐'} {entry.mood}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(entry.createdAt), 'HH:mm')}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        <div className={`${
                          expandedEntries.has(entry.id) 
                            ? '' 
                            : 'md:line-clamp-none'
                        }`} style={{
                          display: expandedEntries.has(entry.id) ? 'block' : '-webkit-box',
                          WebkitLineClamp: expandedEntries.has(entry.id) ? 'unset' : '6',
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: expandedEntries.has(entry.id) ? 'visible' : 'hidden'
                        }}>
                          {entry.noteText}
                        </div>
                        {/* Show more/less button for long content on mobile */}
                        {entry.noteText.length > 300 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEntryExpansion(entry.id)}
                            className="mt-2 p-0 h-auto text-cyan-400 hover:text-cyan-300 md:hidden"
                            data-testid={`button-toggle-${entry.id}`}
                          >
                            {expandedEntries.has(entry.id) ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-gray-600 bg-gray-800/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <PenTool className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  {isToday(selectedDate) ? "Start today's journal" : `No entries for ${format(selectedDate, 'MMM d')}`}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {isToday(selectedDate) 
                    ? "Document your trading thoughts, market analysis, and insights for today."
                    : "No journal entries found for this date."
                  }
                </p>
                {isToday(selectedDate) && (
                  <Button
                    onClick={() => setShowNewEntry(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Writing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}