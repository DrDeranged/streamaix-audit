import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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
      case 'slow': return 'bg-gain/10 text-gain border-gain/30';
      case 'standard': return 'bg-accent-core/10 text-accent-bright border-accent-core/30';
      case 'fast': return 'bg-warn/10 text-warn border-warn/30';
      case 'instant': return 'bg-loss/10 text-loss border-loss/30';
      default: return 'bg-ink-raised text-secondary border-ink-edge';
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-gain';
      case 'medium': return 'text-warn';
      case 'high': return 'text-loss';
      default: return 'text-muted';
    }
  };

  return (
    <div className={className}>
      <Surface className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-divider p-5">
          <SectionTitle as="h3" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-accent-bright" />
              Gas Optimizer
            </div>
          </SectionTitle>
          <div className="flex items-center gap-2">
            {gasData.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-loss" />
            ) : gasData.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-gain" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-warn" />
            )}
            <span className={`text-sm ${getCongestionColor(gasData.networkCongestion)}`}>
              {gasData.networkCongestion.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="space-y-4 p-5">
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
                <Surface
                  variant={selectedSpeed === speed ? "raised" : "panel"}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedSpeed === speed
                      ? 'border-accent-core/50 glow-accent'
                      : 'hover:bg-ink-raised'
                  }`}
                  onClick={() => handleSpeedSelect(speed as 'slow' | 'standard' | 'fast' | 'instant')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-accent-bright">{getSpeedIcon(speed)}</span>
                        <span className="font-medium capitalize text-primary">
                          {speed}
                        </span>
                      </div>
                      <Badge className={getSpeedColor(speed)}>
                        {(data as any).price} gwei
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary">
                      ~{(data as any).time}
                    </p>
                  </div>
                </Surface>
              </motion.div>
            ))}
          </div>

          {/* Optimization Controls */}
          <div className="flex items-center justify-between border-t border-ink-divider pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-body">Selected: </span>
              <Badge className={getSpeedColor(selectedSpeed)}>
                <span className="tabular">{gasData[selectedSpeed].price} gwei</span>
              </Badge>
            </div>
            <Button
              onClick={handleOptimizeGas}
              disabled={isOptimizing}
              size="sm"
              className="grad-accent glow-accent rounded-xl text-primary hover:bg-accent-deep"
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
          <div className="rounded-xl border border-gain/20 bg-gain/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gain">Estimated Savings</span>
              <span className="font-semibold tabular text-gain">~15% ($3.20)</span>
            </div>
            <p className="mt-1 text-xs text-secondary">
              Based on current network conditions and historical data
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}