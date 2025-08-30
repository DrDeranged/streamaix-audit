import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Clock,
  ExternalLink,
  Zap,
  Brain,
  Target,
  BookOpen,
  TrendingUp,
  Database,
  Sparkles,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  ChevronRight
} from 'lucide-react';

interface Summary {
  id: string;
  title: string;
  description?: string;
  originalUrl: string;
  platform: string;
  originalDuration?: number;
  accuracy: number;
  tldrSummary: string;
  blogPost: string;
  marketAnalysis: string;
  rawData: any;
  processingStatus: string;
  createdAt: string;
}



export default function ProcessingResults({ params }: { params?: { id: string } }) {
  const summaryId = params?.id;
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('tldr');
  const [copySuccess, setCopySuccess] = useState('');

  // Query for processing result with real-time updates (same as demo)
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['/api/processing-result', summaryId],
    enabled: !!summaryId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.processingStatus === 'processing' ? 1500 : false;
    },
  }) as { data: Summary, isLoading: boolean, error: any };

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Brain className="h-16 w-16 text-purple-400 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading AI Results</h2>
          <p className="text-gray-400">Processing your content intelligence...</p>
        </motion.div>
      </div>
    );
  }

  if (!summaryId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Invalid URL</h2>
          <p className="text-gray-400 mb-4">No summary ID provided in URL</p>
          <Button onClick={() => setLocation('/')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Content Not Found</h2>
          <p className="text-gray-400 mb-4">Summary ID: {summaryId}</p>
          <Button onClick={() => setLocation('/')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'tldr', label: 'TLDR', icon: Target, content: summary.tldrSummary },
    { id: 'analysis', label: 'Analysis', icon: BookOpen, content: summary.blogPost },
    { id: 'market', label: 'Market Intel', icon: TrendingUp, content: summary.marketAnalysis },
    { id: 'metadata', label: 'Metadata', icon: Database, content: JSON.stringify(summary.rawData, null, 2) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <h1 className="text-xl font-bold text-white">AI Content Intelligence</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Processed
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                    {summary.accuracy}% Accuracy
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-white">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Content Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                {summary.title}
              </h2>
              {summary.description && (
                <p className="text-gray-300 text-lg mb-4">
                  {summary.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {summary.originalDuration ? 
                    `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                    'N/A'
                  }
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  {summary.platform}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Processed {new Date(summary.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Source
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Section Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 p-2 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 overflow-x-auto">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap border
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white border-purple-500/50' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{section.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Display */}
        <AnimatePresence mode="wait">
          {sections.map((section) => {
            if (activeSection !== section.id) return null;
            const Icon = section.icon;
            
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                          <Icon className="h-6 w-6 text-purple-300" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">{section.label}</h3>
                          <p className="text-gray-400 text-sm">
                            {section.id === 'tldr' && 'Quick insights for fast understanding'}
                            {section.id === 'analysis' && 'Comprehensive breakdown and insights'}
                            {section.id === 'market' && 'Investment and market intelligence'}
                            {section.id === 'metadata' && 'Technical processing details'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(section.content, section.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        {copySuccess === section.id ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20">
                      {section.id === 'analysis' ? (
                        <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed">
                          <div 
                            dangerouslySetInnerHTML={{
                              __html: section.content
                                ?.replace(/# (.*)/g, '<h3 class="text-2xl font-bold text-white mt-8 mb-4 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">$1</h3>')
                                ?.replace(/## (.*)/g, '<h4 class="text-xl font-semibold text-blue-200 mt-6 mb-3">$1</h4>')
                                ?.replace(/### (.*)/g, '<h5 class="text-lg font-medium text-purple-200 mt-4 mb-2">$1</h5>')
                                ?.replace(/- \*\*(.*?)\*\*: (.*)/g, '<li class="mb-3"><strong class="text-blue-300">$1:</strong> <span class="text-gray-200">$2</span></li>')
                                ?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                ?.replace(/\n\n/g, '<br><br>')
                                ?.replace(/\n/g, '<br>')
                            }}
                          />
                        </div>
                      ) : section.id === 'metadata' ? (
                        <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                          {section.content}
                        </pre>
                      ) : (
                        <p className="text-gray-200 text-lg leading-relaxed">
                          {section.content}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-3">
                Ready for Your Next Content?
              </h3>
              <p className="text-gray-300 mb-6">
                Transform another video, podcast, or livestream into actionable insights
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-8"
                onClick={() => setLocation('/')}
              >
                <Brain className="h-5 w-5 mr-2" />
                Process New Content
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}