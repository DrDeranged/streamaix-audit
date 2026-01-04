import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface PriceHistoryPoint {
  id: string;
  marketId: string;
  yesPrice: number;
  noPrice: number;
  yesLiquidity: number;
  noLiquidity: number;
  totalVolume: number;
  createdAt: string;
}

interface PriceChartProps {
  marketId: string;
  hours?: number;
}

export function PriceChart({ marketId, hours = 24 }: PriceChartProps) {
  const { data, isLoading } = useQuery<{ history: PriceHistoryPoint[] }>({
    queryKey: [`/api/markets/${marketId}/price-history`, hours],
    refetchInterval: 60000
  });

  const chartData = (data?.history || []).map(point => ({
    time: new Date(point.createdAt).getTime(),
    timeLabel: format(new Date(point.createdAt), 'HH:mm'),
    yes: (point.yesPrice ?? 5000) > 10000 ? 50 : (point.yesPrice ?? 5000) / 100,
    no: (point.noPrice ?? 5000) > 10000 ? 50 : (point.noPrice ?? 5000) / 100,
  }));

  if (isLoading) {
    return (
      <Card className="neural-glass border-iridescent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-lg bg-slate-800/30 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.history || data.history.length === 0) {
    return (
      <Card className="neural-glass border-iridescent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No price history yet. Prices are tracked after each trade.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neural-glass border-iridescent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Price History (Last {hours}h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(96, 165, 250, 0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
            />
            <Line 
              type="monotone" 
              dataKey="yes" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="YES"
            />
            <Line 
              type="monotone" 
              dataKey="no" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="NO"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-300">YES Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-slate-300">NO Price</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
