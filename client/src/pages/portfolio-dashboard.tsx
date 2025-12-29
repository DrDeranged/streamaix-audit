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

interface SearchResult {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  thumb?: string;
  exchange?: string;
  marketCapRank?: number;
  id?: string;
}

function AddAssetDialog({ portfolioId, onSuccess }: { portfolioId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'manual' | 'cash'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [cryptoResults, setCryptoResults] = useState<SearchResult[]>([]);
  const [stockResults, setStockResults] = useState<SearchResult[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [assetType, setAssetType] = useState('crypto');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [accountName, setAccountName] = useState('');
  const { toast } = useToast();

  const searchAssets = async (query: string) => {
    if (query.length < 2) {
      setCryptoResults([]);
      setStockResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/asset-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCryptoResults(data.crypto || []);
      setStockResults(data.stocks || []);
    } catch {
      setCryptoResults([]);
      setStockResults([]);
    }
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchAssets(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    setSelectedAsset(null);
    setSearchQuery('');
    setCryptoResults([]);
    setStockResults([]);
    setMode('search');
  };

  const handleSelectAsset = (asset: SearchResult) => {
    setSelectedAsset(asset);
    setSymbol(asset.symbol.toUpperCase());
    setName(asset.name);
    setAssetType(asset.type);
    setSearchQuery('');
    setCryptoResults([]);
    setStockResults([]);
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

  const hasResults = cryptoResults.length > 0 || stockResults.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400" data-testid="add-asset-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            Add Asset
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          {[
            { id: 'search', label: 'Search', icon: Activity },
            { id: 'cash', label: 'Cash/Bank', icon: Banknote },
            { id: 'manual', label: 'Manual', icon: Edit2 }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={mode === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setMode(tab.id as any); resetForm(); setMode(tab.id as any); }}
              className={mode === tab.id ? 'bg-purple-600' : 'border-slate-600 text-gray-300'}
            >
              <tab.icon className="w-4 h-4 mr-1" />
              {tab.label}
            </Button>
          ))}
        </div>

        {mode === 'search' && !selectedAsset && (
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search stocks (AAPL, TSLA) or crypto (BTC, ETH)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white pl-10"
                data-testid="input-asset-search"
              />
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {isSearching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
            </div>

            {hasResults && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg max-h-64 overflow-y-auto">
                {stockResults.length > 0 && (
                  <>
                    <div className="px-3 py-2 bg-blue-500/20 text-xs text-blue-300 font-medium flex items-center gap-2 sticky top-0">
                      <Building2 className="w-3 h-3" /> Stocks
                    </div>
                    {stockResults.slice(0, 5).map((result) => (
                      <button
                        key={result.symbol}
                        onClick={() => handleSelectAsset({ ...result, type: 'stock' })}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{result.symbol}</p>
                          <p className="text-xs text-slate-400 truncate">{result.name}</p>
                        </div>
                        {result.exchange && <Badge variant="outline" className="text-xs shrink-0">{result.exchange}</Badge>}
                      </button>
                    ))}
                  </>
                )}
                {cryptoResults.length > 0 && (
                  <>
                    <div className="px-3 py-2 bg-orange-500/20 text-xs text-orange-300 font-medium flex items-center gap-2 sticky top-0">
                      <Bitcoin className="w-3 h-3" /> Crypto
                    </div>
                    {cryptoResults.slice(0, 5).map((result: any) => (
                      <button
                        key={result.id || result.symbol}
                        onClick={() => handleSelectAsset({ symbol: result.symbol, name: result.name, type: 'crypto', thumb: result.thumb })}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 text-left"
                      >
                        {result.thumb ? (
                          <img src={result.thumb} alt={result.symbol} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Bitcoin className="w-4 h-4 text-orange-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{result.symbol.toUpperCase()}</p>
                          <p className="text-xs text-slate-400 truncate">{result.name}</p>
                        </div>
                        {result.marketCapRank && <Badge variant="outline" className="text-xs shrink-0">#{result.marketCapRank}</Badge>}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {searchQuery.length >= 2 && !hasResults && !isSearching && (
              <p className="text-center text-gray-500 py-4">No results found</p>
            )}
          </div>
        )}

        {mode === 'cash' && (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select value={assetType} onValueChange={(v) => { setAssetType(v); setSymbol(v === 'cash' ? 'USD' : v === 'stablecoin' ? 'USDC' : 'BANK'); setName(v === 'cash' ? 'US Dollar' : v === 'stablecoin' ? 'USD Coin' : 'Bank Account'); }}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="cash">Cash (USD)</SelectItem>
                  <SelectItem value="stablecoin">Stablecoin (USDC/USDT)</SelectItem>
                  <SelectItem value="other">Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Amount ($)</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setAvgCost('1'); }}
                placeholder="10,000"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Account Name</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Chase Checking, Coinbase"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <Button
              onClick={() => {
                if (!quantity) { toast({ title: 'Enter an amount', variant: 'destructive' }); return; }
                const finalSymbol = assetType === 'cash' ? 'USD' : assetType === 'stablecoin' ? 'USDC' : 'BANK';
                const finalName = assetType === 'cash' ? 'US Dollar' : assetType === 'stablecoin' ? 'USD Coin' : 'Bank Account';
                addAssetMutation.mutate({
                  assetType: assetType === 'other' ? 'cash' : assetType,
                  symbol: finalSymbol,
                  name: accountName || finalName,
                  quantity: parseFloat(quantity),
                  averageCostBasis: 1,
                  accountName: accountName || finalName,
                });
              }}
              disabled={addAssetMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-cyan-500"
            >
              {addAssetMutation.isPending ? 'Adding...' : 'Add Cash Balance'}
            </Button>
          </div>
        )}

        {(mode === 'manual' || (mode === 'search' && selectedAsset)) && (
          <div className="space-y-4">
            {selectedAsset && (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-purple-500/30">
                {selectedAsset.thumb ? (
                  <img src={selectedAsset.thumb} alt={selectedAsset.symbol} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", selectedAsset.type === 'crypto' ? 'bg-orange-500/20' : 'bg-blue-500/20')}>
                    {selectedAsset.type === 'crypto' ? <Bitcoin className="w-5 h-5 text-orange-400" /> : <Building2 className="w-5 h-5 text-blue-400" />}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-white">{selectedAsset.symbol.toUpperCase()}</p>
                  <p className="text-sm text-gray-400">{selectedAsset.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedAsset(null); setSymbol(''); setName(''); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {mode === 'manual' && (
              <>
                <div>
                  <Label className="text-gray-300">Asset Type</Label>
                  <Select value={assetType} onValueChange={setAssetType}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="bond">Bond</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300">Symbol</Label>
                    <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="BTC" className="bg-slate-800 border-slate-600 text-white" />
                  </div>
                  <div>
                    <Label className="text-gray-300">Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bitcoin" className="bg-slate-800 border-slate-600 text-white" />
                  </div>
                </div>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Quantity</Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.00" className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-gray-300">Avg Cost ($)</Label>
                <Input type="number" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} placeholder="0.00" className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Account (optional)</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Coinbase, Fidelity..." className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <Button onClick={handleSubmit} disabled={addAssetMutation.isPending} className="w-full bg-gradient-to-r from-purple-500 to-cyan-500">
              {addAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
            </Button>
          </div>
        )}
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-slate-900/80 border-slate-700/50 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Create Your Portfolio</h2>
                  <p className="text-gray-400">Track all your assets in one place with AI-powered insights.</p>
                </div>

                <Button
                  onClick={() => createPortfolioMutation.mutate()}
                  disabled={createPortfolioMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold py-6 rounded-xl"
                  data-testid="create-portfolio-button"
                >
                  {createPortfolioMutation.isPending ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Portfolio
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-700/50">
                  {[
                    { icon: PieChart, label: 'Track All Assets', desc: 'Crypto, stocks, cash' },
                    { icon: Brain, label: 'AI Health Score', desc: 'Smart analysis' },
                    { icon: Shield, label: 'Private & Secure', desc: 'Your data stays safe' }
                  ].map((feature) => (
                    <div key={feature.label} className="text-center">
                      <feature.icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                      <p className="text-sm font-medium text-white">{feature.label}</p>
                      <p className="text-xs text-gray-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
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
