import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import {
  Wallet, Plus, TrendingUp, TrendingDown, PieChart, BarChart3,
  RefreshCw, Settings, Brain, AlertTriangle, Target, Zap,
  DollarSign, Bitcoin, LineChart, Activity, Shield, ChevronRight,
  Sparkles, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Clock,
  Building2, Coins, Banknote, Landmark, Package, MoreHorizontal,
  ChevronDown, X, Check, Edit2, Trash2, Calculator, Lightbulb
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  totalCostBasis: number;
  totalPnl: number;
  totalPnlPercent: number;
  healthScore?: number;
  riskLevel?: string;
  diversificationScore?: number;
  lastSyncedAt?: string;
}

interface PortfolioAsset {
  id: string;
  assetType: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCostBasis: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  allocationPercent: number;
  accountName?: string;
  color?: string;
}

interface AIAnalysis {
  healthScore: number;
  riskLevel: string;
  diversificationScore: number;
  recommendations: Array<{ type: string; message: string; priority: string; action?: string }>;
  allocation: Record<string, number>;
  totalValue: number;
}

const assetTypeIcons: Record<string, any> = {
  crypto: Bitcoin,
  stock: TrendingUp,
  etf: BarChart3,
  bond: Shield,
  retirement: Landmark,
  cash: Banknote,
  stablecoin: Coins,
  real_estate: Building2,
  commodity: Package,
  other: Wallet,
};

const assetTypeColors: Record<string, string> = {
  crypto: 'from-orange-500 to-amber-500',
  stock: 'from-blue-500 to-cyan-500',
  etf: 'from-purple-500 to-fuchsia-500',
  bond: 'from-green-500 to-emerald-500',
  retirement: 'from-indigo-500 to-violet-500',
  cash: 'from-gray-500 to-slate-500',
  stablecoin: 'from-teal-500 to-cyan-500',
  real_estate: 'from-rose-500 to-pink-500',
  commodity: 'from-yellow-500 to-amber-500',
  other: 'from-slate-500 to-gray-500',
};

const riskLevelColors: Record<string, string> = {
  conservative: 'text-green-400 bg-green-500/20',
  moderate: 'text-blue-400 bg-blue-500/20',
  moderately_aggressive: 'text-amber-400 bg-amber-500/20',
  aggressive: 'text-orange-400 bg-orange-500/20',
  extreme: 'text-red-400 bg-red-500/20',
};

function HealthScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="56" cy="56" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="56" cy="56" r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400">Health</span>
      </div>
    </div>
  );
}

function AllocationChart({ allocation }: { allocation: Record<string, number> }) {
  const entries = Object.entries(allocation).filter(([_, v]) => v > 0);
  let cumulativeRotation = 0;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {entries.map(([type, percent], index) => {
          const sliceAngle = (percent / 100) * 360;
          const startAngle = cumulativeRotation;
          cumulativeRotation += sliceAngle;

          const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'];
          const color = colors[index % colors.length];

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = ((startAngle + sliceAngle) * Math.PI) / 180;

          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);

          const largeArc = sliceAngle > 180 ? 1 : 0;

          return (
            <path
              key={type}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="0.5"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="#0f172a" />
      </svg>
    </div>
  );
}

function AddAssetDialog({ portfolioId, onSuccess }: { portfolioId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [assetType, setAssetType] = useState('crypto');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [accountName, setAccountName] = useState('');
  const { toast } = useToast();

  const addAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/portfolios/${portfolioId}/assets`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: 'Asset added successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios', portfolioId] });
      onSuccess();
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add asset', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setSymbol('');
    setName('');
    setQuantity('');
    setAvgCost('');
    setAccountName('');
  };

  const handleSubmit = () => {
    if (!symbol || !name || !quantity) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    addAssetMutation.mutate({
      assetType,
      symbol,
      name,
      quantity: parseFloat(quantity),
      averageCostBasis: avgCost ? parseFloat(avgCost) : 0,
      accountName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400" data-testid="add-asset-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            Add New Asset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-gray-300">Asset Type</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="etf">ETF</SelectItem>
                <SelectItem value="bond">Bond</SelectItem>
                <SelectItem value="retirement">Retirement (401k/IRA)</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="stablecoin">Stablecoin</SelectItem>
                <SelectItem value="real_estate">Real Estate</SelectItem>
                <SelectItem value="commodity">Commodity</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Symbol *</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="BTC, AAPL..."
                className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-symbol"
              />
            </div>
            <div>
              <Label className="text-gray-300">Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bitcoin, Apple..."
                className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Quantity *</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-quantity"
              />
            </div>
            <div>
              <Label className="text-gray-300">Avg Cost Basis</Label>
              <Input
                type="number"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                placeholder="0.00"
                className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-avg-cost"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Account (Optional)</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Coinbase, Fidelity, etc."
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={addAssetMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
            data-testid="button-submit-asset"
          >
            {addAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssetRow({ asset, portfolioId }: { asset: PortfolioAsset; portfolioId: string }) {
  const Icon = assetTypeIcons[asset.assetType] || Wallet;
  const colorGradient = assetTypeColors[asset.assetType] || assetTypeColors.other;
  const isPositive = asset.unrealizedPnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", colorGradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{asset.symbol}</span>
            <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
              {asset.assetType}
            </Badge>
          </div>
          <p className="text-sm text-gray-400">{asset.name}</p>
          {asset.accountName && (
            <p className="text-xs text-gray-500">{asset.accountName}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-white">${asset.currentValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <div className={cn("flex items-center justify-end gap-1 text-sm", isPositive ? 'text-green-400' : 'text-red-400')}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>${Math.abs(asset.unrealizedPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span>({(asset.unrealizedPnlPercent || 0).toFixed(2)}%)</span>
        </div>
        <p className="text-xs text-gray-500">{asset.quantity?.toLocaleString(undefined, { maximumFractionDigits: 6 })} units</p>
      </div>
    </motion.div>
  );
}

export default function PortfolioDashboard() {
  const [, navigate] = useLocation();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(true);
  const { toast } = useToast();

  const { data: portfoliosData, isLoading: portfoliosLoading } = useQuery<{ portfolios: Portfolio[] }>({
    queryKey: ['/api/portfolios'],
    refetchInterval: 60000,
  });

  const portfolios = portfoliosData?.portfolios || [];
  const activePortfolioId = selectedPortfolioId || portfolios[0]?.id;

  const { data: portfolioData, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery<{ portfolio: Portfolio; assets: PortfolioAsset[]; insights: any[] }>({
    queryKey: ['/api/portfolios', activePortfolioId],
    enabled: !!activePortfolioId,
    refetchInterval: 60000,
  });

  const { data: analysisData, refetch: refetchAnalysis } = useQuery<{ analysis: AIAnalysis }>({
    queryKey: ['/api/portfolios', activePortfolioId, 'ai-analysis'],
    enabled: !!activePortfolioId,
    refetchInterval: 300000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/portfolios/${activePortfolioId}/sync`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: 'Portfolio synced successfully' });
      refetchPortfolio();
      refetchAnalysis();
    },
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({ name: 'My Portfolio' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      toast({ title: 'Portfolio created successfully!', description: 'Start adding your assets now.' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create portfolio', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    },
  });

  const portfolio = portfolioData?.portfolio;
  const assets = portfolioData?.assets || [];
  const insights = portfolioData?.insights || [];
  const analysis = analysisData?.analysis;

  if (portfoliosLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-800 rounded-lg w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/25">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  AI Portfolio Command Center
                </h1>
                <p className="text-gray-400">Unified asset management powered by AI intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValues(!showValues)}
                className="border-slate-600 text-gray-300"
              >
                {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || !activePortfolioId}
                className="border-slate-600 text-gray-300"
                data-testid="sync-portfolio-button"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", syncMutation.isPending && "animate-spin")} />
                Sync Prices
              </Button>
              {activePortfolioId && (
                <AddAssetDialog portfolioId={activePortfolioId} onSuccess={() => refetchPortfolio()} />
              )}
            </div>
          </div>

          {portfolios.length === 0 ? (
            <div className="relative min-h-[calc(100vh-200px)]">
              {/* Matrix-style falling data streams background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-[10px] font-mono text-cyan-500/30 whitespace-nowrap"
                    style={{ left: `${i * 5}%` }}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: '100vh', opacity: [0, 0.6, 0] }}
                    transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {Array(20).fill(0).map(() => ['$', '₿', '◈', '▲', '▼', '0', '1'][Math.floor(Math.random() * 7)]).join('')}
                  </motion.div>
                ))}
              </div>

              {/* Neural network grid overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
              >
                {/* AI System Status Bar */}
                <div className="flex items-center justify-between mb-6 px-4 py-2 bg-slate-900/80 border border-cyan-500/20 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-400"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-xs font-mono text-emerald-400">AI CORE ONLINE</span>
                    </div>
                    <div className="h-4 w-px bg-slate-700" />
                    <span className="text-xs font-mono text-gray-500">NEURAL_NET v4.2.1</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-cyan-400">MODELS: 12 LOADED</span>
                    <span className="text-xs font-mono text-amber-400">LATENCY: 23ms</span>
                  </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Panel - AI Brain Visualization */}
                  <Card className="relative overflow-hidden bg-slate-950/80 border border-purple-500/30 p-6 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">AI Analysis Engine</span>
                      </div>
                      
                      {/* Animated Brain Visualization */}
                      <div className="relative w-full h-48 mb-4">
                        <svg viewBox="0 0 200 160" className="w-full h-full">
                          <defs>
                            <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="rgba(168,85,247,0.4)" />
                              <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                          </defs>
                          
                          {/* Central Brain Core */}
                          <motion.circle
                            cx="100" cy="80" r="35"
                            fill="url(#brainGlow)"
                            animate={{ r: [35, 40, 35] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.circle
                            cx="100" cy="80" r="25"
                            fill="none"
                            stroke="rgba(168,85,247,0.6)"
                            strokeWidth="2"
                            animate={{ strokeDasharray: ['0 160', '160 0', '0 160'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                          
                          {/* Neural Nodes */}
                          {[
                            { x: 40, y: 40 }, { x: 160, y: 40 }, { x: 30, y: 90 }, { x: 170, y: 90 },
                            { x: 50, y: 130 }, { x: 150, y: 130 }, { x: 100, y: 30 }, { x: 100, y: 140 }
                          ].map((node, i) => (
                            <g key={i}>
                              <motion.line
                                x1="100" y1="80" x2={node.x} y2={node.y}
                                stroke="rgba(6,182,212,0.4)"
                                strokeWidth="1"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: [0, 1, 0] }}
                                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                              />
                              <motion.circle
                                cx={node.x} cy={node.y} r="6"
                                fill="rgba(6,182,212,0.2)"
                                stroke="rgba(6,182,212,0.8)"
                                strokeWidth="1"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                              />
                            </g>
                          ))}
                          
                          {/* Brain Icon in Center */}
                          <foreignObject x="85" y="65" width="30" height="30">
                            <Brain className="w-full h-full text-purple-400" />
                          </foreignObject>
                        </svg>
                      </div>

                      {/* Processing Status */}
                      <div className="space-y-2">
                        {['Pattern Recognition', 'Risk Analysis', 'Market Correlation'].map((process, i) => (
                          <div key={process} className="flex items-center justify-between">
                            <span className="text-xs font-mono text-gray-500">{process}</span>
                            <motion.div
                              className="flex gap-0.5"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.2 }}
                            >
                              {[...Array(5)].map((_, j) => (
                                <motion.div
                                  key={j}
                                  className="w-1.5 h-3 rounded-sm bg-cyan-500/30"
                                  animate={{ backgroundColor: ['rgba(6,182,212,0.3)', 'rgba(6,182,212,0.8)', 'rgba(6,182,212,0.3)'] }}
                                  transition={{ duration: 0.8, delay: j * 0.1 + i * 0.3, repeat: Infinity }}
                                />
                              ))}
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Center Panel - Main CTA */}
                  <Card className="relative overflow-hidden bg-slate-950/80 border border-cyan-500/30 p-8 backdrop-blur-xl lg:col-span-1">
                    <div className="absolute inset-0">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 blur-3xl" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/10 blur-3xl" />
                    </div>
                    
                    <div className="relative z-10 text-center">
                      {/* Hexagon Icon Container */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <motion.polygon
                            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                            fill="none"
                            stroke="url(#hexGrad)"
                            strokeWidth="2"
                            animate={{ strokeDasharray: ['0 400', '400 0'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                          <defs>
                            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#a855f7" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{ rotateY: [0, 360] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                          >
                            <Wallet className="w-8 h-8 text-cyan-400" />
                          </motion.div>
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold mb-2 font-mono">
                        <span className="text-cyan-400">[</span>
                        <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">INITIALIZE</span>
                        <span className="text-cyan-400">]</span>
                      </h2>
                      <h3 className="text-lg text-gray-400 mb-6 font-mono">AI Portfolio Command Center</h3>
                      
                      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Deploy advanced neural networks to analyze, optimize, and protect your portfolio with institutional-grade intelligence.
                      </p>

                      <Button
                        onClick={() => createPortfolioMutation.mutate()}
                        disabled={createPortfolioMutation.isPending}
                        className="relative group w-full bg-transparent border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 font-mono font-bold py-6 rounded-lg transition-all duration-300 overflow-hidden"
                        data-testid="create-portfolio-button"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {createPortfolioMutation.isPending ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span>INITIALIZING...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5" />
                              <span>DEPLOY PORTFOLIO</span>
                            </>
                          )}
                        </span>
                      </Button>

                      {/* Terminal Output Style */}
                      <div className="mt-6 text-left bg-slate-900/80 rounded-lg p-3 border border-slate-700/50">
                        <div className="font-mono text-xs space-y-1">
                          <p className="text-gray-600">&gt; Awaiting portfolio initialization...</p>
                          <motion.p
                            className="text-cyan-400"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            &gt; AI models ready_
                          </motion.p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Right Panel - Preview Dashboard */}
                  <Card className="relative overflow-hidden bg-slate-950/80 border border-emerald-500/30 p-6 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Dashboard Preview</span>
                      </div>

                      {/* Mock Health Score */}
                      <div className="flex items-center justify-between mb-6 p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
                        <div>
                          <p className="text-xs text-gray-500 font-mono">HEALTH SCORE</p>
                          <p className="text-2xl font-bold text-emerald-400">--</p>
                        </div>
                        <div className="relative w-16 h-16">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                            <motion.circle
                              cx="18" cy="18" r="16"
                              fill="none"
                              stroke="rgba(16,185,129,0.6)"
                              strokeWidth="3"
                              strokeDasharray="100"
                              animate={{ strokeDashoffset: [100, 25, 100] }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Mock Allocation Preview */}
                      <div className="space-y-3 mb-6">
                        <p className="text-xs text-gray-500 font-mono">ALLOCATION PREVIEW</p>
                        {[
                          { label: 'CRYPTO', color: 'bg-orange-500', width: '45%' },
                          { label: 'STOCKS', color: 'bg-blue-500', width: '30%' },
                          { label: 'ETFs', color: 'bg-purple-500', width: '15%' },
                          { label: 'OTHER', color: 'bg-gray-500', width: '10%' }
                        ].map((item, i) => (
                          <div key={item.label} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-gray-500">{item.label}</span>
                              <span className="text-gray-400">--</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                className={cn("h-full rounded-full", item.color)}
                                initial={{ width: 0 }}
                                animate={{ width: item.width, opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mock Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'RISK LEVEL', value: '--', icon: AlertTriangle, color: 'text-amber-400' },
                          { label: 'DIVERSITY', value: '--', icon: PieChart, color: 'text-purple-400' },
                          { label: 'AI SIGNALS', value: '--', icon: Zap, color: 'text-cyan-400' },
                          { label: 'ASSETS', value: '0', icon: Package, color: 'text-gray-400' }
                        ].map((metric) => (
                          <div key={metric.label} className="p-2 bg-slate-900/60 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-1 mb-1">
                              <metric.icon className={cn("w-3 h-3", metric.color)} />
                              <span className="text-[10px] font-mono text-gray-600">{metric.label}</span>
                            </div>
                            <p className={cn("text-lg font-bold font-mono", metric.color)}>{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Bottom Feature Cards - Terminal Style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  {[
                    { icon: LineChart, label: 'REAL-TIME SYNC', desc: 'Live price updates', status: 'READY' },
                    { icon: Brain, label: 'AI OPTIMIZATION', desc: 'ML-powered insights', status: 'STANDBY' },
                    { icon: Shield, label: 'SECURE STORAGE', desc: 'Encrypted data', status: 'ACTIVE' },
                    { icon: Target, label: 'GOAL TRACKING', desc: 'Milestone alerts', status: 'READY' }
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Card className="bg-slate-950/60 border border-slate-700/50 p-4 hover:border-cyan-500/30 transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-2">
                          <feature.icon className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {feature.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-300 font-semibold">{feature.label}</p>
                        <p className="text-xs text-gray-600">{feature.desc}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              {portfolios.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {portfolios.map((p) => (
                    <Button
                      key={p.id}
                      variant={p.id === activePortfolioId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPortfolioId(p.id)}
                      className={p.id === activePortfolioId
                        ? 'bg-purple-500 text-white'
                        : 'border-slate-600 text-gray-300'
                      }
                    >
                      {p.name}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => createPortfolioMutation.mutate()}
                    className="text-purple-400"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-slate-900/60 border-slate-700/50 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Value</span>
                    <DollarSign className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {showValues ? `$${(portfolio?.totalValue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '••••••'}
                  </p>
                  <div className={cn("flex items-center gap-1 text-sm mt-1", (portfolio?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {(portfolio?.totalPnl || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{showValues ? `$${Math.abs(portfolio?.totalPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '••••'}</span>
                    <span>({(portfolio?.totalPnlPercent || 0).toFixed(2)}%)</span>
                  </div>
                </Card>

                <Card className="bg-slate-900/60 border-slate-700/50 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Cost Basis</span>
                    <Target className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {showValues ? `$${(portfolio?.totalCostBasis || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '••••••'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Total invested</p>
                </Card>

                <Card className="bg-slate-900/60 border-slate-700/50 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Assets</span>
                    <PieChart className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{assets.length}</p>
                  <p className="text-sm text-gray-400 mt-1">Holdings tracked</p>
                </Card>

                <Card className="bg-slate-900/60 border-slate-700/50 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Health Score</span>
                    <Brain className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{analysis?.healthScore || portfolio?.healthScore || '--'}</p>
                  <Badge className={riskLevelColors[analysis?.riskLevel || portfolio?.riskLevel || ''] || 'text-gray-400 bg-gray-500/20'}>
                    {(analysis?.riskLevel || portfolio?.riskLevel || 'unknown').replace('_', ' ')}
                  </Badge>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-slate-900/60 border-slate-700/50 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-purple-400" />
                        Holdings
                      </h2>
                      <Badge variant="outline" className="text-gray-400 border-gray-600">
                        {assets.length} assets
                      </Badge>
                    </div>
                    {assets.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-400 mb-4">No assets yet. Add your first asset to get started.</p>
                        <AddAssetDialog portfolioId={activePortfolioId!} onSuccess={() => refetchPortfolio()} />
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {assets.map((asset) => (
                          <AssetRow key={asset.id} asset={asset} portfolioId={activePortfolioId!} />
                        ))}
                      </div>
                    )}
                  </Card>

                  {analysis?.recommendations && analysis.recommendations.length > 0 && (
                    <Card className="bg-slate-900/60 border-slate-700/50 p-6 backdrop-blur-sm">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                        AI Recommendations
                      </h2>
                      <div className="space-y-3">
                        {analysis.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-4 rounded-lg border",
                              rec.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                              rec.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                              'bg-slate-800/50 border-slate-700/50'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className={cn(
                                  "w-4 h-4 mt-0.5",
                                  rec.priority === 'high' ? 'text-red-400' :
                                  rec.priority === 'medium' ? 'text-amber-400' :
                                  'text-gray-400'
                                )} />
                                <div>
                                  <p className="text-white text-sm">{rec.message}</p>
                                  {rec.action && (
                                    <Button variant="link" size="sm" className="text-purple-400 p-0 h-auto mt-1">
                                      {rec.action} <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                {rec.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  {analysis && (
                    <Card className="bg-slate-900/60 border-slate-700/50 p-6 backdrop-blur-sm">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Brain className="w-5 h-5 text-purple-400" />
                        AI Analysis
                      </h2>
                      <div className="flex justify-center mb-4">
                        <HealthScoreRing score={analysis.healthScore} />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Diversification</span>
                            <span className="text-white">{analysis.diversificationScore}%</span>
                          </div>
                          <Progress value={analysis.diversificationScore} className="h-2" />
                        </div>
                        <div className="pt-2 border-t border-slate-700">
                          <p className="text-sm text-gray-400 mb-2">Risk Level</p>
                          <Badge className={cn("text-sm", riskLevelColors[analysis.riskLevel] || 'text-gray-400 bg-gray-500/20')}>
                            {analysis.riskLevel.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  )}

                  {analysis?.allocation && Object.keys(analysis.allocation).length > 0 && (
                    <Card className="bg-slate-900/60 border-slate-700/50 p-6 backdrop-blur-sm">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-cyan-400" />
                        Allocation
                      </h2>
                      <div className="flex justify-center mb-4">
                        <AllocationChart allocation={analysis.allocation} />
                      </div>
                      <div className="space-y-2">
                        {Object.entries(analysis.allocation).map(([type, percent]) => {
                          const colorGradient = assetTypeColors[type] || assetTypeColors.other;
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full bg-gradient-to-r", colorGradient)} />
                                <span className="text-sm text-gray-300 capitalize">{type.replace('_', ' ')}</span>
                              </div>
                              <span className="text-sm text-white font-medium">{percent.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  <Card className="bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 border-purple-500/30 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Calculator className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-white">Scenario Simulator</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                      Test "what if" scenarios. See how price changes would affect your portfolio.
                    </p>
                    <Button variant="outline" className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Run Simulation
                    </Button>
                  </Card>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
