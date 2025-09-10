import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Format date for API queries
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Fetch journal entries for selected date
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['/api/notes', { date: dateString }],
    queryFn: () => apiRequest(`/api/notes?date=${dateString}`, {
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
      toast({ title: 'Success!', description: 'Journal entry saved successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save journal entry.', variant: 'destructive' });
    },
  });

  // Initialize template when selected
  useEffect(() => {
    if (showNewEntry && selectedTemplate) {
      setNewEntryText(journalTemplates[selectedTemplate].placeholder);
    }
  }, [showNewEntry, selectedTemplate]);

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
        className="bg-gradient-to-br from-slate-800 to-gray-800 rounded-2xl p-6 border border-slate-600"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Investment Journal</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="px-4 py-2 bg-white/10 rounded-lg min-w-[200px] text-center">
              <div className="text-lg font-semibold text-white">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
              </div>
              <div className="text-sm text-gray-300">
                {format(selectedDate, 'MMMM d, yyyy')}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.entryCount}</div>
            <div className="text-xs text-gray-400">Entries</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              (stats.portfolioChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(stats.portfolioChange || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {(stats.portfolioChange || 0) >= 0 ? '+' : ''}{(stats.portfolioChange || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Portfolio</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.tradeCount}</div>
            <div className="text-xs text-gray-400">Trades</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1">
              <Activity className="w-4 h-4" />
              {stats.streak}
            </div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Template Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
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
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{template.label}</span>
            </Button>
          );
        })}
      </motion.div>

      {/* New Entry Form */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-700">
              <CardHeader>
                <CardTitle className="text-indigo-300 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  New Journal Entry - {journalTemplates[selectedTemplate].label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select value={selectedTemplate} onValueChange={(value: keyof typeof journalTemplates) => setSelectedTemplate(value)}>
                    <SelectTrigger className="bg-gray-900/50 border-gray-600">
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
                    <SelectTrigger className="bg-gray-900/50 border-gray-600">
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
                  className="bg-gray-900/50 border-gray-600 text-white resize-none min-h-[200px]"
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
                    className="border-gray-600"
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
                  <Card className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-slate-600 hover:border-slate-500 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={template.color}>
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
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(entry.createdAt), 'HH:mm')}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {entry.noteText}
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