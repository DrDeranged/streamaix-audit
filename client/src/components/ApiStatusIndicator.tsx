import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApiStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "rate-limited";
  message?: string;
}

export function ApiStatusIndicator() {
  const { data: apiStatuses } = useQuery<{ statuses: ApiStatus[] }>({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const statuses = apiStatuses?.statuses || [];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-gain/10 text-gain border-gain/30";
      case "degraded":
      case "rate-limited":
        return "bg-warn/10 text-warn border-warn/30";
      case "down":
        return "bg-loss/10 text-loss border-loss/30";
      default:
        return "bg-ink-raised text-muted border-ink-edge";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-3 w-3" />;
      case "degraded":
      case "rate-limited":
        return <Clock className="h-3 w-3" />;
      case "down":
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  if (!statuses.length) return null;

  const hasIssues = statuses.some(s => s.status !== "operational");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          className={`${
            hasIssues 
              ? "bg-warn/10 text-warn border-warn/30" 
              : "bg-gain/10 text-gain border-gain/30"
          } cursor-help`}
          data-testid="api-status-indicator"
        >
          {hasIssues ? (
            <AlertCircle className="h-3 w-3 mr-1" />
          ) : (
            <CheckCircle className="h-3 w-3 mr-1" />
          )}
          API Status
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="bg-ink-surface border-ink-edge max-w-xs">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-body mb-2">API Services</p>
          {statuses.map((api) => (
            <div key={api.name} className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">{api.name}</span>
              <Badge className={`${getStatusColor(api.status)} text-xs px-2 py-0.5`}>
                {getStatusIcon(api.status)}
                <span className="ml-1 capitalize">{api.status.replace('-', ' ')}</span>
              </Badge>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function CompactApiStatus() {
  const { data: apiStatuses } = useQuery<{ statuses: ApiStatus[] }>({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000,
  });

  const statuses = apiStatuses?.statuses || [];
  const hasIssues = statuses.some(s => s.status !== "operational");
  
  if (!hasIssues) return null;

  const issueCount = statuses.filter(s => s.status !== "operational").length;

  return (
    <div className="flex items-center gap-2 text-xs text-warn/80">
      <AlertCircle className="h-3 w-3" />
      <span>{issueCount} API{issueCount > 1 ? 's' : ''} degraded</span>
    </div>
  );
}
