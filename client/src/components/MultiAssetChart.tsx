import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Zap,
  Plus,
  Minus,
  RefreshCw,
  Target,
  ArrowUpDown,
  Layers,
  Shuffle
} from 'lucide-react';
import { format } from 'date-fns';

interface AssetSelection {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'bond' | 'commodity' | 'currency';
  color: string;
}

interface ComparisonData {
  primary: {
    symbol: string;
    data: Array<{
      timestamp: number;
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    indicators: any;
  };
  comparison?: Array<{
    symbol: string;
    assetType: string;
    data: Array<{
      timestamp: number;
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    normalizedData: number[];
  }>;
  correlations?: { [symbol: string]: number };
  metadata: {
    timeframe: string;
    lastUpdated: string;
    dataPoints: number;
  };
}

interface MultiAssetChartProps {
  defaultPrimary?: string;
  defaultComparisons?: string[];
  height?: number;
  showControls?: boolean;
  onDataChange?: (data: ComparisonData) => void;
}

const ASSET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#6366f1'  // indigo
];

const POPULAR_ASSETS = {
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
    { symbol: 'SOL', name: 'Solana', type: 'crypto' },
    { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
    { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
    { symbol: 'DOT', name: 'Polkadot', type: 'crypto' }
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple', type: 'stock' },
    { symbol: 'GOOGL', name: 'Google', type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
    { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
    { symbol: 'META', name: 'Meta', type: 'stock' }
  ],
  cryptoStocks: [
    { symbol: 'MSTR', name: 'MicroStrategy', type: 'stock' },
    { symbol: 'COIN', name: 'Coinbase', type: 'stock' },
    { symbol: 'RIOT', name: 'Riot Platforms', type: 'stock' },
    { symbol: 'MARA', name: 'Marathon Digital', type: 'stock' }
  ]
};

export default function MultiAssetChart({
  defaultPrimary = 'BTC',
  defaultComparisons = ['ETH', 'SOL'],
  height = 500,
  showControls = true,
  onDataChange
}: MultiAssetChartProps) {
  const { toast } = useToast();
  const [primaryAsset, setPrimaryAsset] = useState<AssetSelection>({
    symbol: defaultPrimary,
    assetType: 'crypto',
    color: ASSET_COLORS[0]
  });
  
  const [comparisonAssets, setComparisonAssets] = useState<AssetSelection[]>(
    defaultComparisons.map((symbol, index) => ({
      symbol,
      assetType: 'crypto' as const,
      color: ASSET_COLORS[index + 1]
    }))
  );
  
  const [timeframe, setTimeframe] = useState('1d');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customAssetType, setCustomAssetType] = useState<'crypto' | 'stock' | 'bond' | 'commodity' | 'currency'>('crypto');
  const [viewMode, setViewMode] = useState<'overlay' | 'correlation' | 'normalized'>('overlay');

  // Fetch comparison data
  const { mutate: fetchComparisonData, isPending, data: comparisonData } = useMutation({
    mutationFn: async () => {
      const assetTypes: { [key: string]: string } = {
        [primaryAsset.symbol]: primaryAsset.assetType
      };
      
      comparisonAssets.forEach(asset => {
        assetTypes[asset.symbol] = asset.assetType;
      });

      const response = await apiRequest('/api/charts/compare', {
        method: 'POST',
        body: JSON.stringify({
          primarySymbol: primaryAsset.symbol,
          comparisonSymbols: comparisonAssets.map(a => a.symbol),
          timeframe,
          assetTypes
        })
      });

      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        onDataChange?.(data.data);
        toast({
          title: "Chart Updated",
          description: `Loaded data for ${comparisonAssets.length + 1} assets`
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Unable to load chart data",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Auto-fetch data when assets or timeframe changes
  useEffect(() => {
    if (primaryAsset.symbol) {
      fetchComparisonData();
    }
  }, [primaryAsset, comparisonAssets, timeframe]);

  // Process data for charts
  const processedData = useMemo(() => {
    if (!comparisonData?.success || !comparisonData.data) return [];

    const primaryData = comparisonData.data.primary.data;
    const comparisons = comparisonData.data.comparison || [];

    return primaryData.map((point: any, index: number) => {
      const processed: any = {
        ...point,
        dateFormatted: format(new Date(point.timestamp), 'MMM dd HH:mm'),
        [primaryAsset.symbol]: point.close
      };

      // Add comparison data (normalized)
      comparisons.forEach((comparison: any) => {
        if (comparison.normalizedData[index] !== undefined) {
          processed[comparison.symbol] = comparison.normalizedData[index];
        }
      });

      return processed;
    });
  }, [comparisonData, primaryAsset.symbol]);

  // Correlation data for scatter plot
  const correlationData = useMemo(() => {
    if (!comparisonData?.data?.correlations) return [];

    return Object.entries(comparisonData.data.correlations).map(([symbol, correlation]) => ({
      symbol,
      correlation: correlation as number,
      strength: Math.abs(correlation as number),
      color: (correlation as number) >= 0 ? '#10b981' : '#ef4444'
    }));
  }, [comparisonData]);

  // Add comparison asset
  const addComparisonAsset = (symbol: string, assetType: 'crypto' | 'stock' | 'bond' | 'commodity' | 'currency') => {
    if (symbol === primaryAsset.symbol) {
      toast({
        title: "Invalid Selection",
        description: "Cannot compare an asset with itself",
        variant: "destructive"
      });
      return;
    }

    if (comparisonAssets.some(a => a.symbol === symbol)) {
      toast({
        title: "Already Added",
        description: `${symbol} is already in the comparison`,
        variant: "destructive"
      });
      return;
    }

    if (comparisonAssets.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "Maximum 5 comparison assets allowed",
        variant: "destructive"
      });
      return;
    }

    const newAsset: AssetSelection = {
      symbol: symbol.toUpperCase(),
      assetType,
      color: ASSET_COLORS[comparisonAssets.length + 1] || ASSET_COLORS[0]
    };

    setComparisonAssets(prev => [...prev, newAsset]);
    setCustomSymbol('');
  };

  // Remove comparison asset
  const removeComparisonAsset = (symbol: string) => {
    setComparisonAssets(prev => prev.filter(a => a.symbol !== symbol));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && viewMode === 'overlay') {
      return (
        <div className="bg-background/95 border border-border rounded-lg p-4 shadow-lg backdrop-blur-sm">
          <div className="text-sm font-medium mb-2">
            {label}
          </div>
          
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between gap-4">
                <span style={{ color: entry.color }}>{entry.dataKey}:</span>
                <span className="font-mono">${entry.value?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Correlation tooltip
  const CorrelationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg backdrop-blur-sm">
          <div className="text-sm font-medium">{data.symbol}</div>
          <div className="text-sm">
            Correlation: <span className="font-mono">{data.correlation.toFixed(3)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {data.correlation > 0.7 ? 'Strong Positive' :
             data.correlation > 0.3 ? 'Moderate Positive' :
             data.correlation > -0.3 ? 'Weak' :
             data.correlation > -0.7 ? 'Moderate Negative' : 'Strong Negative'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      {showControls && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Multi-Asset Comparison</CardTitle>
            
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-24" data-testid="select-comparison-timeframe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1M</SelectItem>
                  <SelectItem value="5m">5M</SelectItem>
                  <SelectItem value="15m">15M</SelectItem>
                  <SelectItem value="1h">1H</SelectItem>
                  <SelectItem value="4h">4H</SelectItem>
                  <SelectItem value="1d">1D</SelectItem>
                  <SelectItem value="1w">1W</SelectItem>
                </SelectContent>
              </Select>

              <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overlay" data-testid="tab-overlay">Overlay</TabsTrigger>
                  <TabsTrigger value="normalized" data-testid="tab-normalized">Normalized</TabsTrigger>
                  <TabsTrigger value="correlation" data-testid="tab-correlation">Correlation</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button 
                onClick={() => fetchComparisonData()} 
                disabled={isPending}
                size="sm"
                data-testid="button-refresh-comparison"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Asset selection */}
          <div className="space-y-4">
            {/* Primary asset */}
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium min-w-[80px]">Primary:</Label>
              <Badge variant="default" style={{ backgroundColor: primaryAsset.color }} className="text-white">
                {primaryAsset.symbol}
              </Badge>
              
              <Select 
                value={primaryAsset.symbol} 
                onValueChange={(symbol) => setPrimaryAsset(prev => ({ ...prev, symbol }))}
              >
                <SelectTrigger className="w-32" data-testid="select-primary-asset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Crypto</div>
                  {POPULAR_ASSETS.crypto.map(asset => (
                    <SelectItem key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - {asset.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Stocks</div>
                  {POPULAR_ASSETS.stocks.map(asset => (
                    <SelectItem key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comparison assets */}
            <div className="flex items-start gap-4">
              <Label className="text-sm font-medium min-w-[80px] mt-2">Compare:</Label>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {comparisonAssets.map((asset, index) => (
                    <Badge 
                      key={asset.symbol} 
                      variant="outline" 
                      style={{ borderColor: asset.color, color: asset.color }}
                      className="flex items-center gap-1"
                    >
                      {asset.symbol}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeComparisonAsset(asset.symbol)}
                        data-testid={`button-remove-${asset.symbol}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* Add custom asset */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add symbol (e.g., AAPL)"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    className="w-32"
                    data-testid="input-custom-symbol"
                  />
                  
                  <Select value={customAssetType} onValueChange={(value: any) => setCustomAssetType(value)}>
                    <SelectTrigger className="w-24" data-testid="select-custom-asset-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="bond">Bond</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => addComparisonAsset(customSymbol, customAssetType)}
                    disabled={!customSymbol || comparisonAssets.length >= 5}
                    size="sm"
                    data-testid="button-add-custom-asset"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick add buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {POPULAR_ASSETS.crypto.slice(0, 4).map(asset => (
                    <Button
                      key={asset.symbol}
                      variant="outline"
                      size="sm"
                      onClick={() => addComparisonAsset(asset.symbol, 'crypto')}
                      disabled={comparisonAssets.some(a => a.symbol === asset.symbol) || 
                               primaryAsset.symbol === asset.symbol}
                      className="text-xs"
                      data-testid={`button-quick-add-${asset.symbol}`}
                    >
                      {asset.symbol}
                    </Button>
                  ))}
                  
                  {POPULAR_ASSETS.cryptoStocks.slice(0, 2).map(asset => (
                    <Button
                      key={asset.symbol}
                      variant="outline"
                      size="sm"
                      onClick={() => addComparisonAsset(asset.symbol, 'stock')}
                      disabled={comparisonAssets.some(a => a.symbol === asset.symbol) || 
                               primaryAsset.symbol === asset.symbol}
                      className="text-xs"
                      data-testid={`button-quick-add-${asset.symbol}`}
                    >
                      {asset.symbol}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {isPending ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <div className="text-muted-foreground">Loading comparison data...</div>
            </div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No data available</div>
              <Button onClick={() => fetchComparisonData()} size="sm">
                Load Data
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ height: height }} className="w-full">
            {viewMode === 'correlation' ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  data={correlationData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="symbol"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    domain={[-1, 1]}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Correlation', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CorrelationTooltip />} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                  <ReferenceLine y={0.7} stroke="#10b981" strokeDasharray="2 2" />
                  <ReferenceLine y={-0.7} stroke="#ef4444" strokeDasharray="2 2" />
                  
                  <Scatter dataKey="correlation" fill="#8884d8">
                    {correlationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={processedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="dateFormatted"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />

                  {/* Primary asset line */}
                  <Line
                    type="monotone"
                    dataKey={primaryAsset.symbol}
                    stroke={primaryAsset.color}
                    strokeWidth={3}
                    dot={false}
                    name={`${primaryAsset.symbol} (Primary)`}
                  />

                  {/* Comparison asset lines */}
                  {comparisonAssets.map((asset) => (
                    <Line
                      key={asset.symbol}
                      type="monotone"
                      dataKey={asset.symbol}
                      stroke={asset.color}
                      strokeWidth={2}
                      dot={false}
                      name={asset.symbol}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Correlation summary */}
        {comparisonData?.data?.correlations && viewMode !== 'correlation' && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm font-medium mb-2">Correlation with {primaryAsset.symbol}:</div>
            <div className="flex items-center gap-4 flex-wrap">
              {Object.entries(comparisonData.data.correlations).map(([symbol, correlation]) => (
                <Badge 
                  key={symbol}
                  variant={Math.abs(correlation as number) > 0.7 ? "default" : "outline"}
                  className="text-xs"
                >
                  {symbol}: {(correlation as number).toFixed(3)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}