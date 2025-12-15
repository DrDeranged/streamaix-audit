import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-500/20 bg-red-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {this.props.section ? `Error in ${this.props.section}` : 'Something went wrong'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-400 mb-3">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              data-testid="button-retry-error"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export function SectionErrorFallback({ 
  section, 
  onRetry 
}: { 
  section: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border border-red-500/20 bg-red-900/10">
      <div className="flex items-center gap-2 text-red-400 mb-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium text-sm">Error loading {section}</span>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        This section encountered an error. Other parts of the page should still work.
      </p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-xs text-red-400 hover:bg-red-500/10"
          data-testid={`button-retry-${section.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function LoadingFallback({ section }: { section?: string }) {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-3 bg-slate-700/50 rounded w-full" />
        <div className="h-3 bg-slate-700/50 rounded w-5/6" />
        <div className="h-3 bg-slate-700/50 rounded w-4/6" />
      </div>
    </div>
  );
}
