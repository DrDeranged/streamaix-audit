import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, TrendingUp, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface ApiUpgrade {
  service: string;
  currentTier: string;
  recommendedTier: string;
  monthlyPrice: number;
  benefits: string[];
  urgency: "low" | "medium" | "high";
}

export function AdminApiNotification() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: upgradesData } = useQuery<{ upgrades: ApiUpgrade[] }>({
    queryKey: ['/api/system/api-upgrades'],
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  const upgrades = upgradesData?.upgrades || [];
  const highPriorityUpgrades = upgrades.filter(u => u.urgency === "high");

  // Only show to logged-in users (can be restricted on backend)
  if (!user) return null;
  
  // Don't show if dismissed or no upgrades needed
  if (dismissed || !highPriorityUpgrades.length) return null;

  const totalMonthlyCost = highPriorityUpgrades.reduce((sum, u) => sum + u.monthlyPrice, 0);

  return (
    <Alert className="mb-6 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/30">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-200 font-semibold flex items-center justify-between">
        <span>API Upgrade Recommended</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="h-6 w-6 p-0 hover:bg-amber-500/20"
          data-testid="button-dismiss-notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-slate-300 text-sm">
          {highPriorityUpgrades.length} API{highPriorityUpgrades.length > 1 ? 's are' : ' is'} experiencing rate limits. 
          Upgrading will improve data reliability and user experience.
        </p>
        
        <div className="space-y-2">
          {highPriorityUpgrades.map((upgrade) => (
            <div 
              key={upgrade.service}
              className="bg-slate-900/50 rounded-lg p-3 border border-amber-500/20"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-amber-200">{upgrade.service}</p>
                  <p className="text-xs text-slate-400">
                    {upgrade.currentTier} → {upgrade.recommendedTier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">${upgrade.monthlyPrice}/mo</p>
                </div>
              </div>
              <ul className="text-xs text-slate-400 space-y-1">
                {upgrade.benefits.slice(0, 2).map((benefit, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <TrendingUp className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
          <p className="text-xs text-slate-400">
            Total estimated cost: <span className="text-amber-400 font-semibold">${totalMonthlyCost}/month</span>
          </p>
          <Button 
            size="sm" 
            className="bg-amber-600 hover:bg-amber-700 text-white"
            data-testid="button-view-upgrade-guide"
          >
            View Upgrade Guide
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
