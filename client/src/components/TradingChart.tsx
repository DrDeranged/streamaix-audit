import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Area,
  Bar,
  ReferenceLine,
  Brush
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Zap,
  Settings,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  Layers,
  Clock,
  Target,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';

interface ChartDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  rsi?: number[];
  macd?: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  movingAverages?: {
    sma20: number[];
    sma50: number[];
    sma200: number[];
    ema12: number[];
    ema26: number[];
  };
  bollingerBands?: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
  volumeIndicators?: {
    volumeMA: number[];
    volumeRatio: number[];
    onBalanceVolume: number[];
  };
}

interface ChartData {
  primary: {
    symbol: string;
    data: ChartDataPoint[];
    indicators: TechnicalIndicators;
  };
  metadata: {
    timeframe: string;
    lastUpdated: string;
    dataPoints: number;
  };
}

interface TradingChartProps {
  symbol: string;
  assetType?: 'crypto' | 'stock' | 'bond' | 'commodity' | 'currency';
  height?: number;
  showControls?: boolean;
  defaultTimeframe?: string;
  defaultIndicators?: string[];
  onSymbolChange?: (symbol: string) => void;
  onTimeframeChange?: (timeframe: string) => void;
}

export default function TradingChart({
  symbol,
  assetType = 'crypto',
  height = 600,
  showControls = true,
  defaultTimeframe = '1d',
  defaultIndicators = ['rsi', 'macd', 'movingAverages'],
  onSymbolChange,
  onTimeframeChange
}: TradingChartProps) {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(defaultIndicators);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [volumeVisible, setVolumeVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [crosshairEnabled, setCrosshairEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusArea, setFocusArea] = useState<{ startIndex?: number; endIndex?: number }>({});
  const chartRef = useRef<any>(null);

  // Fetch chart data
  const { data: chartData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/charts/data', symbol, timeframe, activeIndicators.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe,
        assetType,
        indicators: activeIndicators.join(',')
      });
      
      const response = await fetch(`/api/charts/data/${symbol}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2
  });

  // Get available metadata
  const { data: metadata } = useQuery({
    queryKey: ['/api/charts/metadata'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Process chart data for Recharts
  const processedData = useMemo(() => {
    if (!chartData?.success || !chartData.data?.primary?.data) return [];

    const rawData = chartData.data.primary.data;
    const indicators = chartData.data.primary.indicators;

    return rawData.map((point: ChartDataPoint, index: number) => {
      const processedPoint: any = {
        ...point,
        dateFormatted: format(new Date(point.timestamp), 'MMM dd HH:mm'),
        priceChange: index > 0 ? point.close - rawData[index - 1].close : 0,
        priceChangePercent: index > 0 
          ? ((point.close - rawData[index - 1].close) / rawData[index - 1].close) * 100 
          : 0
      };

      // Add technical indicators
      if (indicators?.rsi && indicators.rsi[index] !== undefined) {
        processedPoint.rsi = indicators.rsi[index];
      }

      if (indicators?.macd) {
        if (indicators.macd.macd[index] !== undefined) processedPoint.macd = indicators.macd.macd[index];
        if (indicators.macd.signal[index] !== undefined) processedPoint.macdSignal = indicators.macd.signal[index];
        if (indicators.macd.histogram[index] !== undefined) processedPoint.macdHistogram = indicators.macd.histogram[index];
      }

      if (indicators?.movingAverages) {
        if (indicators.movingAverages.sma20[index] !== undefined) processedPoint.sma20 = indicators.movingAverages.sma20[index];
        if (indicators.movingAverages.sma50[index] !== undefined) processedPoint.sma50 = indicators.movingAverages.sma50[index];
        if (indicators.movingAverages.sma200[index] !== undefined) processedPoint.sma200 = indicators.movingAverages.sma200[index];
        if (indicators.movingAverages.ema12[index] !== undefined) processedPoint.ema12 = indicators.movingAverages.ema12[index];
        if (indicators.movingAverages.ema26[index] !== undefined) processedPoint.ema26 = indicators.movingAverages.ema26[index];
      }

      if (indicators?.bollingerBands) {
        if (indicators.bollingerBands.upper[index] !== undefined) processedPoint.bbUpper = indicators.bollingerBands.upper[index];
        if (indicators.bollingerBands.middle[index] !== undefined) processedPoint.bbMiddle = indicators.bollingerBands.middle[index];
        if (indicators.bollingerBands.lower[index] !== undefined) processedPoint.bbLower = indicators.bollingerBands.lower[index];
      }

      if (indicators?.volumeIndicators) {
        if (indicators.volumeIndicators.volumeMA[index] !== undefined) processedPoint.volumeMA = indicators.volumeIndicators.volumeMA[index];
        if (indicators.volumeIndicators.volumeRatio[index] !== undefined) processedPoint.volumeRatio = indicators.volumeIndicators.volumeRatio[index];
        if (indicators.volumeIndicators.onBalanceVolume[index] !== undefined) processedPoint.obv = indicators.volumeIndicators.onBalanceVolume[index];
      }

      return processedPoint;
    });
  }, [chartData]);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    onTimeframeChange?.(newTimeframe);
  };

  // Toggle indicator
  const toggleIndicator = (indicator: string) => {
    setActiveIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Handle zoom
  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? Math.min(prev * 1.5, 5) : Math.max(prev / 1.5, 0.5);
      return newZoom;
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background/95 border border-border rounded-lg p-4 shadow-lg backdrop-blur-sm">
          <div className="text-sm font-medium mb-2">
            {format(new Date(data.timestamp), 'MMM dd, yyyy HH:mm')}
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono">${data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">High:</span>
              <span className="font-mono text-green-500">${data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-mono text-red-500">${data.low.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono font-medium">${data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-mono text-xs">{data.volume.toLocaleString()}</span>
            </div>
            
            {data.priceChange !== 0 && (
              <div className="flex justify-between gap-4 pt-1 border-t border-border">
                <span className="text-muted-foreground">Change:</span>
                <span className={`font-mono ${data.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data.priceChange >= 0 ? '+' : ''}${data.priceChange.toFixed(2)} 
                  ({data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}

            {/* Technical Indicators */}
            {data.rsi !== undefined && (
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-muted-foreground">RSI:</span>
                <span className="font-mono">{data.rsi.toFixed(1)}</span>
              </div>
            )}
            
            {activeIndicators.includes('movingAverages') && (
              <>
                {data.sma20 !== undefined && (
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-muted-foreground">SMA20:</span>
                    <span className="font-mono">${data.sma20.toFixed(2)}</span>
                  </div>
                )}
                {data.sma50 !== undefined && (
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-muted-foreground">SMA50:</span>
                    <span className="font-mono">${data.sma50.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom candlestick component
  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10b981' : '#ef4444';
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);

    // Scale values to chart coordinates
    const wickTop = high;
    const wickBottom = low;
    const candleWidth = Math.max(1, width * 0.8);
    const candleX = x + (width - candleWidth) / 2;

    return (
      <g>
        {/* Wick line */}
        <line
          x1={x + width / 2}
          y1={wickTop}
          x2={x + width / 2}
          y2={wickBottom}
          stroke={color}
          strokeWidth={1}
        />
        
        {/* Candle body */}
        <rect
          x={candleX}
          y={bodyY}
          width={candleWidth}
          height={Math.max(1, bodyHeight)}
          fill={isGreen ? color : 'transparent'}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">Failed to load chart data</div>
            <Button onClick={() => refetch()} size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {showControls && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg">
                {symbol.toUpperCase()} 
                <Badge variant="outline" className="ml-2 text-xs">
                  {assetType.toUpperCase()}
                </Badge>
              </CardTitle>
              
              {chartData?.data && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    ${chartData.data.primary.data[chartData.data.primary.data.length - 1]?.close.toFixed(2)}
                  </span>
                  {chartData.data.primary.data.length > 1 && (
                    <Badge 
                      variant={chartData.data.primary.data[chartData.data.primary.data.length - 1]?.close >= 
                              chartData.data.primary.data[chartData.data.primary.data.length - 2]?.close ? 
                              "default" : "destructive"}
                      className="text-xs"
                    >
                      {chartData.data.primary.data[chartData.data.primary.data.length - 1]?.close >= 
                       chartData.data.primary.data[chartData.data.primary.data.length - 2]?.close ? 
                       <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {timeframe.toUpperCase()}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Timeframe selector */}
              <Select value={timeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-24" data-testid="select-timeframe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(metadata as any)?.data?.timeframes?.map((tf: string) => (
                    <SelectItem key={tf} value={tf}>{tf.toUpperCase()}</SelectItem>
                  )) || (
                    <>
                      <SelectItem value="1m">1M</SelectItem>
                      <SelectItem value="5m">5M</SelectItem>
                      <SelectItem value="15m">15M</SelectItem>
                      <SelectItem value="1h">1H</SelectItem>
                      <SelectItem value="4h">4H</SelectItem>
                      <SelectItem value="1d">1D</SelectItem>
                      <SelectItem value="1w">1W</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {/* Chart type selector */}
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-32" data-testid="select-chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candlestick">Candlestick</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => handleZoom('out')} data-testid="button-zoom-out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleZoom('in')} data-testid="button-zoom-in">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button 
                  variant={crosshairEnabled ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setCrosshairEnabled(!crosshairEnabled)}
                  data-testid="button-crosshair"
                >
                  <Crosshair className="w-4 h-4" />
                </Button>
                <Button 
                  variant={gridVisible ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setGridVisible(!gridVisible)}
                  data-testid="button-grid"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Indicators toggles */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="volume-toggle" className="text-sm">Volume</Label>
              <Switch
                id="volume-toggle"
                checked={volumeVisible}
                onCheckedChange={setVolumeVisible}
                data-testid="switch-volume"
              />
            </div>
            
            {(metadata as any)?.data?.indicators?.map((indicator: string) => (
              <div key={indicator} className="flex items-center gap-2">
                <Label htmlFor={`${indicator}-toggle`} className="text-sm capitalize">
                  {indicator.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={`${indicator}-toggle`}
                  checked={activeIndicators.includes(indicator)}
                  onCheckedChange={() => toggleIndicator(indicator)}
                  data-testid={`switch-${indicator}`}
                />
              </div>
            )) || (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="rsi-toggle" className="text-sm">RSI</Label>
                  <Switch
                    id="rsi-toggle"
                    checked={activeIndicators.includes('rsi')}
                    onCheckedChange={() => toggleIndicator('rsi')}
                    data-testid="switch-rsi"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="macd-toggle" className="text-sm">MACD</Label>
                  <Switch
                    id="macd-toggle"
                    checked={activeIndicators.includes('macd')}
                    onCheckedChange={() => toggleIndicator('macd')}
                    data-testid="switch-macd"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ma-toggle" className="text-sm">Moving Averages</Label>
                  <Switch
                    id="ma-toggle"
                    checked={activeIndicators.includes('movingAverages')}
                    onCheckedChange={() => toggleIndicator('movingAverages')}
                    data-testid="switch-moving-averages"
                  />
                </div>
              </>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No data available</div>
              <Button onClick={() => refetch()} size="sm">
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ height: height }} className="w-full" data-testid="trading-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                ref={chartRef}
              >
                {gridVisible && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                
                <XAxis 
                  dataKey="dateFormatted"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  domain={['dataMin * 0.95', 'dataMax * 1.05']}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                
                {crosshairEnabled && <Tooltip content={<CustomTooltip />} />}

                {/* Bollinger Bands */}
                {activeIndicators.includes('bollingerBands') && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="bbUpper"
                      stroke="#8884d8"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="bbLower"
                      stroke="#8884d8"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="bbMiddle"
                      stroke="#8884d8"
                      strokeWidth={1}
                      fill="transparent"
                    />
                  </>
                )}

                {/* Moving Averages */}
                {activeIndicators.includes('movingAverages') && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="sma20"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sma50"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sma200"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </>
                )}

                {/* Main price chart */}
                {chartType === 'candlestick' && (
                  // Note: Recharts doesn't have native candlestick, so we'll use a line for now
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                )}

                {chartType === 'line' && (
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                )}

                {chartType === 'area' && (
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                )}

                {/* Volume bars */}
                {volumeVisible && (
                  <Bar
                    dataKey="volume"
                    fill="hsl(var(--muted))"
                    opacity={0.3}
                    yAxisId="volume"
                  />
                )}

                <YAxis yAxisId="volume" orientation="right" hide />

                {/* Brush for zooming */}
                <Brush 
                  dataKey="dateFormatted" 
                  height={30} 
                  stroke="hsl(var(--primary))"
                  startIndex={focusArea.startIndex}
                  endIndex={focusArea.endIndex}
                />

                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}