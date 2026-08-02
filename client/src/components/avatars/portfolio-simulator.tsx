import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import StatValue from "@/components/ds/StatValue";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertCircle,
  Sparkles,
  Target
} from "lucide-react";
import { motion } from "framer-motion";

interface Avatar {
  id: string;
  name: string;
  handle: string;
  portfolioRoi: number | null;
  riskScore: number | null;
  volatility: number | null;
  accuracyPercentage: number | null;
}

interface PortfolioAllocation {
  avatarId: string;
  allocation: number;
}

interface PortfolioSimulatorProps {
  avatars: Avatar[];
}

export const PortfolioSimulator = memo(function PortfolioSimulator({ avatars }: PortfolioSimulatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState<number>(10000);
  const [timeHorizon, setTimeHorizon] = useState<number>(12);
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    avatars.forEach(avatar => {
      initial[avatar.id] = 0;
    });
    return initial;
  });

  const totalAllocation = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0);
  }, [allocations]);

  const handleAllocationChange = (avatarId: string, value: number) => {
    setAllocations(prev => ({
      ...prev,
      [avatarId]: value
    }));
  };

  const autoAllocate = () => {
    const totalWeight = avatars.reduce((sum, avatar) => {
      const roi = avatar.portfolioRoi || 0;
      const accuracy = avatar.accuracyPercentage || 0;
      const risk = avatar.riskScore || 50;
      const weight = (roi * 0.4 + accuracy * 0.3 + (100 - risk) * 0.3);
      return sum + Math.max(weight, 0);
    }, 0);

    const newAllocations: Record<string, number> = {};
    avatars.forEach(avatar => {
      const roi = avatar.portfolioRoi || 0;
      const accuracy = avatar.accuracyPercentage || 0;
      const risk = avatar.riskScore || 50;
      const weight = (roi * 0.4 + accuracy * 0.3 + (100 - risk) * 0.3);
      newAllocations[avatar.id] = Math.round((Math.max(weight, 0) / totalWeight) * 100);
    });

    setAllocations(newAllocations);
  };

  const resetAllocations = () => {
    const newAllocations: Record<string, number> = {};
    avatars.forEach(avatar => {
      newAllocations[avatar.id] = 0;
    });
    setAllocations(newAllocations);
  };

  const simulatedResults = useMemo(() => {
    let expectedReturn = 0;
    let riskLevel = 0;
    let confidence = 0;

    avatars.forEach(avatar => {
      const allocation = allocations[avatar.id] || 0;
      const weight = allocation / 100;
      
      if (allocation > 0) {
        const monthlyRoi = ((avatar.portfolioRoi || 0) / 12) * (timeHorizon / 12);
        expectedReturn += monthlyRoi * weight;
        riskLevel += (avatar.riskScore || 50) * weight;
        confidence += (avatar.accuracyPercentage || 0) * weight;
      }
    });

    const finalValue = investmentAmount * (1 + expectedReturn / 100);
    const profit = finalValue - investmentAmount;
    
    return {
      expectedReturn: expectedReturn.toFixed(2),
      finalValue: finalValue.toFixed(2),
      profit: profit.toFixed(2),
      riskLevel: riskLevel.toFixed(1),
      confidence: confidence.toFixed(1)
    };
  }, [avatars, allocations, investmentAmount, timeHorizon]);

  return (
    <div className="space-y-4 md:space-y-6">
      <Surface className="p-4 md:p-6">
        <div className="pb-4 md:pb-6">
          <SectionTitle className="flex items-center gap-2 text-lg md:text-xl">
            <PieChart className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
            Portfolio Simulator
          </SectionTitle>
        </div>
        <div className="space-y-4 md:space-y-6">
          {/* Investment Amount */}
          <div className="space-y-2">
            <Label className="text-secondary">Investment Amount ($)</Label>
            <Input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="rounded-xl border border-ink-edge bg-ink-raised text-primary"
              min={100}
              step={100}
            />
          </div>

          {/* Time Horizon */}
          <div className="space-y-2">
            <Label className="text-secondary">Time Horizon ({timeHorizon} months)</Label>
            <Slider
              value={[timeHorizon]}
              onValueChange={(value) => setTimeHorizon(value[0])}
              min={1}
              max={36}
              step={1}
              className="py-4"
            />
          </div>

          {/* Allocation Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={autoAllocate}
              size="sm"
              className="grad-accent glow-accent w-full rounded-xl text-primary hover:bg-accent-deep sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Auto Allocate
            </Button>
            <Button
              onClick={resetAllocations}
              size="sm"
              variant="outline"
              className="w-full rounded-xl border border-ink-edge bg-ink-raised text-secondary sm:w-auto"
            >
              Reset
            </Button>
          </div>

          {/* Allocation Progress */}
          <Surface variant="raised" className="rounded-xl border border-ink-edge p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-secondary">Total Allocation</span>
              <span className={`tabular text-sm font-bold ${totalAllocation === 100 ? 'text-gain' : totalAllocation > 100 ? 'text-loss' : 'text-warn'}`}>
                {totalAllocation}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-ink-edge">
              <div
                className={`h-2 rounded-full transition-all ${totalAllocation === 100 ? 'bg-gain' : totalAllocation > 100 ? 'bg-loss' : 'bg-warn'}`}
                style={{ width: `${Math.min(totalAllocation, 100)}%` }}
              />
            </div>
          </Surface>

          {/* Avatar Allocations */}
          <div className="space-y-3">
            <Label className="text-secondary">Entrepreneur Allocations</Label>
            {avatars.map((avatar) => (
              <Surface key={avatar.id} variant="raised" className="rounded-xl border border-ink-edge p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-primary text-sm font-semibold">{avatar.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="border-accent-core/30 bg-accent-core/10 text-xs text-accent-bright">
                        ROI: {avatar.portfolioRoi || 0}%
                      </Badge>
                      <Badge variant="outline" className="border-accent-core/30 bg-accent-core/10 text-xs text-accent-bright">
                        Risk: {avatar.riskScore || 50}
                      </Badge>
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={allocations[avatar.id] || 0}
                    onChange={(e) => handleAllocationChange(avatar.id, Number(e.target.value))}
                    className="w-20 rounded-xl border border-ink-edge bg-ink-surface text-center text-primary"
                    min={0}
                    max={100}
                  />
                </div>
                <Slider
                  value={[allocations[avatar.id] || 0]}
                  onValueChange={(value) => handleAllocationChange(avatar.id, value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </Surface>
            ))}
          </div>
        </div>
      </Surface>

      {/* Simulation Results */}
      {totalAllocation === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
            <Surface className="p-4 md:p-6">
             <div className="pb-4">
               <SectionTitle className="flex items-center gap-2">
                 <Target className="w-5 h-5 text-gain" />
                Projected Results
               </SectionTitle>
             </div>
             <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <Surface variant="raised" className="rounded-xl border border-ink-edge p-4">
                  <div className="flex items-center gap-2 mb-1">
                     <DollarSign className="w-4 h-4 text-gain" />
                     <p className="text-xs text-secondary">Final Value</p>
                  </div>
                  <StatValue label="" value={`$${Number(simulatedResults.finalValue).toLocaleString()}`} />
                </Surface>

                <Surface variant="raised" className="rounded-xl border border-ink-edge p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {Number(simulatedResults.profit) >= 0 ? (
                       <TrendingUp className="w-4 h-4 text-gain" />
                    ) : (
                       <TrendingDown className="w-4 h-4 text-loss" />
                    )}
                     <p className="text-xs text-secondary">Expected Profit</p>
                  </div>
                  <StatValue label="" value={`${Number(simulatedResults.profit) >= 0 ? '+' : ''}$${Number(simulatedResults.profit).toLocaleString()}`} valueClassName={Number(simulatedResults.profit) >= 0 ? "text-gain" : "text-loss"} />
                </Surface>

                <Surface variant="raised" className="rounded-xl border border-ink-edge p-4">
                  <div className="flex items-center gap-2 mb-1">
                     <TrendingUp className="w-4 h-4 text-accent-bright" />
                     <p className="text-xs text-secondary">Expected Return</p>
                  </div>
                  <StatValue label="" value={`${Number(simulatedResults.expectedReturn) >= 0 ? '+' : ''}${simulatedResults.expectedReturn}%`} valueClassName="text-accent-bright" />
                </Surface>

                <Surface variant="raised" className="rounded-xl border border-ink-edge p-4">
                  <div className="flex items-center gap-2 mb-1">
                     <AlertCircle className="w-4 h-4 text-warn" />
                     <p className="text-xs text-secondary">Risk Level</p>
                  </div>
                  <StatValue label="" value={`${simulatedResults.riskLevel}/100`} valueClassName="text-warn" />
                </Surface>

                <Surface variant="raised" className="col-span-2 rounded-xl border border-ink-edge p-4">
                  <div className="flex items-center gap-2 mb-1">
                     <Sparkles className="w-4 h-4 text-accent-bright" />
                     <p className="text-xs text-secondary">Confidence Score</p>
                  </div>
                  <StatValue label="" value={`${simulatedResults.confidence}%`} valueClassName="text-accent-bright" />
                </Surface>
              </div>

              <Surface variant="raised" className="mt-4 rounded-xl border border-ink-edge p-4">
                 <p className="mb-2 text-xs text-secondary">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Disclaimer
                </p>
                 <p className="text-xs text-muted">
                  This is a simulated projection based on historical performance. Actual returns may vary significantly. Past performance does not guarantee future results. Always conduct your own research before making investment decisions.
                </p>
              </Surface>
             </div>
            </Surface>
        </motion.div>
      )}

      {totalAllocation !== 100 && totalAllocation > 0 && (
        <Surface className="p-4">
             <div className="flex items-center gap-2 text-warn">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">
                Allocate exactly 100% to see projected results
                {totalAllocation > 100 && ` (Currently: ${totalAllocation}%)`}
              </p>
            </div>
        </Surface>
      )}
    </div>
  );
});
