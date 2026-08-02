import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ error, errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to performance monitor
    if (typeof window !== 'undefined') {
      const performanceMonitor = (window as any).__PERFORMANCE_MONITOR__;
      if (performanceMonitor) {
        performanceMonitor.recordMetric('error.boundary', 1);
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error!} resetError={this.resetError} />;
      }

      // Default error UI
      return (
        <div className="min-h-[100dvh] bg-ink-page flex items-center justify-center p-6">
          <Surface className="max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-loss/10 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-loss" />
              </div>
              <SectionTitle as="h2">Something went wrong</SectionTitle>
            </div>
            <div className="space-y-4 mt-4">
              <p className="text-body text-center text-sm">
                An unexpected error occurred. This has been logged and we'll look into it.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="bg-ink-raised rounded-xl p-3 text-xs text-secondary">
                  <summary className="cursor-pointer mb-2 text-loss">Error Details</summary>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-32 text-secondary">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.resetError}
                  className="flex-1 grad-accent glow-accent text-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-ink-edge text-body hover:bg-ink-raised"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </Surface>
        </div>
      );
    }

    return this.props.children;
  }
}

// Web3 specific error boundary
export function Web3ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Surface className="p-6 border-loss/30 bg-loss/10">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-loss" />
            <SectionTitle as="h3" className="text-loss">Web3 Connection Error</SectionTitle>
          </div>
          
          <p className="text-body text-sm mb-4">
            There was an issue with your Web3 connection. Please check your wallet and try again.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={resetError}
              size="sm" 
              className="grad-accent glow-accent text-primary"
            >
              Retry Connection
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              size="sm"
              className="border-ink-edge text-body hover:bg-ink-raised"
            >
              Refresh
            </Button>
          </div>
        </Surface>
      )}
      onError={(error, errorInfo) => {
        // Log Web3 specific errors
        console.error('Web3 Error:', error);
        
        // You could send to analytics here
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'exception', {
            description: error.message,
            fatal: false,
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Query error boundary for React Query errors
export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Surface className="p-4 border-warn/30 bg-warn/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warn" />
            <span className="text-warn text-sm font-medium">Data Loading Error</span>
          </div>
          
          <p className="text-body text-sm mb-3">
            Failed to load data. This might be a temporary issue.
          </p>
          
          <Button 
            onClick={resetError}
            size="sm" 
            variant="outline"
            className="border-warn/30 text-warn hover:bg-warn/10"
          >
            Try Again
          </Button>
        </Surface>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}