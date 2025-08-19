import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, TrendingDown, TrendingUp, Clock, Fuel } from 'lucide-react';
import { motion } from 'framer-motion';

interface GasData {
  slow: { price: string; time: string };
  standard: { price: string; time: string };
  fast: { price: string; time: string };
  instant: { price: string; time: string };
  trend: 'up' | 'down' | 'stable';
  networkCongestion: 'low' | 'medium' | 'high';
}

interface GasOptimizerProps {
  onGasPriceSelect?: (gasPrice: string) => void;
  className?: string;
}

export function GasOptimizer({ onGasPriceSelect, className = '' }: GasOptimizerProps) {
  const [gasData, setGasData] = useState<GasData>({
    slow: { price: '12.3', time: '5+ min' },
    standard: { price: '15.8', time: '3-5 min' },
    fast: { price: '18.5', time: '1-2 min' },
    instant: { price: '25.2', time: '< 30s' },
    trend: 'down',
    networkCongestion: 'medium'
  });

  const [selectedSpeed, setSelectedSpeed] = useState<'slow' | 'standard' | 'fast' | 'instant'>('standard');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Simulate real-time gas price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGasData(prev => ({
        ...prev,
        slow: { ...prev.slow, price: (parseFloat(prev.slow.price) + (Math.random() - 0.5) * 2).toFixed(1) },
        standard: { ...prev.standard, price: (parseFloat(prev.standard.price) + (Math.random() - 0.5) * 3).toFixed(1) },
        fast: { ...prev.fast, price: (parseFloat(prev.fast.price) + (Math.random() - 0.5) * 4).toFixed(1) },
        instant: { ...prev.instant, price: (parseFloat(prev.instant.price) + (Math.random() - 0.5) * 6).toFixed(1) },
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
      }));
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleOptimizeGas = async () => {
    setIsOptimizing(true);
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Optimize by reducing gas price slightly
    setGasData(prev => ({
      ...prev,
      [selectedSpeed]: {
        ...prev[selectedSpeed],
        price: (parseFloat(prev[selectedSpeed].price) * 0.95).toFixed(1)
      }
    }));
    
    setIsOptimizing(false);
  };

  const handleSpeedSelect = (speed: 'slow' | 'standard' | 'fast' | 'instant') => {
    setSelectedSpeed(speed);
    onGasPriceSelect?.(gasData[speed].price);
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'slow': return <Clock className="h-4 w-4" />;
      case 'standard': return <Zap className="h-4 w-4" />;
      case 'fast': return <TrendingUp className="h-4 w-4" />;
      case 'instant': return <Fuel className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'slow': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'standard': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'fast': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'instant': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={className}>
      <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Gas Optimizer
            </div>
            <div className="flex items-center gap-2">
              {gasData.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-red-400" />
              ) : gasData.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-green-400" />
              ) : (
                <div className="h-4 w-4 bg-yellow-400 rounded-full" />
              )}
              <span className={`text-sm ${getCongestionColor(gasData.networkCongestion)}`}>
                {gasData.networkCongestion.toUpperCase()}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gas Speed Options */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(gasData).filter(([key]) => 
              ['slow', 'standard', 'fast', 'instant'].includes(key)
            ).map(([speed, data]) => (
              <motion.div
                key={speed}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedSpeed === speed
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => handleSpeedSelect(speed as 'slow' | 'standard' | 'fast' | 'instant')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSpeedIcon(speed)}
                        <span className="text-white font-medium capitalize">
                          {speed}
                        </span>
                      </div>
                      <Badge className={getSpeedColor(speed)}>
                        {(data as any).price} gwei
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">
                      ~{(data as any).time}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Optimization Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Selected: </span>
              <Badge className={getSpeedColor(selectedSpeed)}>
                {gasData[selectedSpeed].price} gwei
              </Badge>
            </div>
            <Button
              onClick={handleOptimizeGas}
              disabled={isOptimizing}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isOptimizing ? (
                <>
                  <Zap className="h-3 w-3 mr-1 animate-pulse" />
                  Optimizing...
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Optimize
                </>
              )}
            </Button>
          </div>

          {/* Gas Savings Estimate */}
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-300 text-sm">Estimated Savings</span>
              <span className="text-green-300 font-semibold">~15% ($3.20)</span>
            </div>
            <p className="text-green-200/80 text-xs mt-1">
              Based on current network conditions and historical data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}