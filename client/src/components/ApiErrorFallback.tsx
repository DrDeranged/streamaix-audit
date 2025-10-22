import { AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiErrorFallbackProps {
  title?: string;
  message?: string;
  apiName?: string;
  showUpgradePrompt?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ApiErrorFallback({
  title = "Data Temporarily Unavailable",
  message = "We're experiencing high demand. Please try again in a few moments.",
  apiName,
  showUpgradePrompt = false,
  onRetry,
  className = "",
}: ApiErrorFallbackProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Alert className="max-w-lg border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-slate-200 text-lg font-semibold mb-2">
          {title}
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-slate-400 text-sm leading-relaxed">
            {message}
          </p>
          
          {apiName && (
            <p className="text-slate-500 text-xs">
              Service: {apiName}
            </p>
          )}

          {showUpgradePrompt && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border border-purple-700/30 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-300">
                  <p className="font-medium mb-1">Upgrade Available</p>
                  <p className="text-slate-400">
                    Premium API tier provides higher rate limits and real-time data access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-3 w-full border-slate-600 hover:bg-slate-700 text-slate-200"
              data-testid="button-retry-api"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface ApiErrorCardProps {
  title: string;
  description?: string;
  compact?: boolean;
}

export function ApiErrorCard({ 
  title, 
  description = "Data temporarily unavailable",
  compact = false 
}: ApiErrorCardProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="text-center space-y-1">
          <AlertCircle className="h-5 w-5 text-amber-500/60 mx-auto" />
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500/70 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ApiLoadingCard({ title }: { title: string }) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-slate-600 border-t-purple-500 animate-spin mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          <p className="text-xs text-slate-500">Loading data...</p>
        </div>
      </div>
    </div>
  );
}
