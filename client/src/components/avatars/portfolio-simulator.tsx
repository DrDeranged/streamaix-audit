import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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

export function PortfolioSimulator({ avatars }: PortfolioSimulatorProps) {
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
      <Card className="bg-gradient-to-br from-slate-950/90 to-blue-950/90 backdrop-blur-xl border-blue-500/20">
        <CardHeader className="pb-4 md:pb-6">
          <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
            <PieChart className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
            Portfolio Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Investment Amount */}
          <div className="space-y-2">
            <Label className="text-blue-200">Investment Amount ($)</Label>
            <Input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="bg-slate-900/60 border-blue-500/30 text-white"
              min={100}
              step={100}
            />
          </div>

          {/* Time Horizon */}
          <div className="space-y-2">
            <Label className="text-blue-200">Time Horizon ({timeHorizon} months)</Label>
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
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Auto Allocate
            </Button>
            <Button
              onClick={resetAllocations}
              size="sm"
              variant="outline"
              className="border-blue-500/40 text-blue-300 w-full sm:w-auto"
            >
              Reset
            </Button>
          </div>

          {/* Allocation Progress */}
          <div className="bg-slate-900/60 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-200">Total Allocation</span>
              <span className={`text-sm font-bold ${totalAllocation === 100 ? 'text-green-400' : totalAllocation > 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                {totalAllocation}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${totalAllocation === 100 ? 'bg-green-500' : totalAllocation > 100 ? 'bg-red-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.min(totalAllocation, 100)}%` }}
              />
            </div>
          </div>

          {/* Avatar Allocations */}
          <div className="space-y-3">
            <Label className="text-blue-200">Entrepreneur Allocations</Label>
            {avatars.map((avatar) => (
              <div key={avatar.id} className="bg-slate-900/60 rounded-lg p-3 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white text-sm font-semibold">{avatar.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/30">
                        ROI: {avatar.portfolioRoi || 0}%
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/30">
                        Risk: {avatar.riskScore || 50}
                      </Badge>
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={allocations[avatar.id] || 0}
                    onChange={(e) => handleAllocationChange(avatar.id, Number(e.target.value))}
                    className="w-20 bg-slate-800 border-blue-500/30 text-white text-center"
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {totalAllocation === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-green-950/40 to-emerald-950/40 backdrop-blur-xl border-green-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Projected Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-slate-950/60 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-green-200">Final Value</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${Number(simulatedResults.finalValue).toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    {Number(simulatedResults.profit) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <p className="text-xs text-green-200">Expected Profit</p>
                  </div>
                  <p className={`text-2xl font-bold ${Number(simulatedResults.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(simulatedResults.profit) >= 0 ? '+' : ''}${Number(simulatedResults.profit).toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <p className="text-xs text-green-200">Expected Return</p>
                  </div>
                  <p className="text-2xl font-bold text-cyan-400">
                    {Number(simulatedResults.expectedReturn) >= 0 ? '+' : ''}{simulatedResults.expectedReturn}%
                  </p>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <p className="text-xs text-green-200">Risk Level</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {simulatedResults.riskLevel}/100
                  </p>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-4 border border-green-500/20 col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <p className="text-xs text-green-200">Confidence Score</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">
                    {simulatedResults.confidence}%
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-950/40 rounded-lg border border-blue-500/20">
                <p className="text-xs text-blue-200 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Disclaimer
                </p>
                <p className="text-xs text-blue-300/70">
                  This is a simulated projection based on historical performance. Actual returns may vary significantly. Past performance does not guarantee future results. Always conduct your own research before making investment decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {totalAllocation !== 100 && totalAllocation > 0 && (
        <Card className="bg-yellow-950/20 backdrop-blur-xl border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">
                Allocate exactly 100% to see projected results
                {totalAllocation > 100 && ` (Currently: ${totalAllocation}%)`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
