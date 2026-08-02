import { AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Surface from "@/components/ds/Surface";

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
      <Surface className="max-w-lg p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <div className="min-w-0 flex-1">
            <h3 className="mb-2 text-lg font-semibold text-primary">
              {title}
            </h3>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-body">
                {message}
              </p>

              {apiName && (
                <p className="text-xs text-muted">
                  Service: {apiName}
                </p>
              )}

              {showUpgradePrompt && (
                <div className="mt-4 rounded-xl border border-accent-core/30 bg-accent-core/10 p-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                    <div className="text-xs text-body">
                      <p className="mb-1 font-medium">Upgrade Available</p>
                      <p className="text-secondary">
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
                  className="mt-3 w-full rounded-xl border-ink-edge bg-ink-raised text-primary hover:bg-ink-raised hover:text-primary"
                  data-testid="button-retry-api"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </Surface>
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
      <Surface variant="raised" className="flex items-center justify-center p-4">
        <div className="text-center space-y-1">
          <AlertCircle className="mx-auto h-5 w-5 text-warn/60" />
          <p className="text-xs text-muted">{description}</p>
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warn/70" />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-primary">{title}</h3>
          <p className="text-xs leading-relaxed text-secondary">
            {description}
          </p>
        </div>
      </div>
    </Surface>
  );
}

export function ApiLoadingCard({ title }: { title: string }) {
  return (
    <Surface className="p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-5 w-5 animate-pulse rounded-xl border-2 border-ink-edge bg-ink-raised" />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-primary">{title}</h3>
          <p className="text-xs text-secondary">Loading data...</p>
        </div>
      </div>
    </Surface>
  );
}
