import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
          <Card className="bg-white/10 border-red-500/30 backdrop-blur-lg max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <CardTitle className="text-white">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-center text-sm">
                An unexpected error occurred. This has been logged and we'll look into it.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-black/20 rounded p-3 text-xs text-gray-400">
                  <summary className="cursor-pointer mb-2 text-red-400">Error Details</summary>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.resetError}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
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
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-red-400 font-semibold">Web3 Connection Error</h3>
          </div>
          
          <p className="text-gray-300 text-sm mb-4">
            There was an issue with your Web3 connection. Please check your wallet and try again.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={resetError}
              size="sm" 
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Retry Connection
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              size="sm"
              className="border-white/20 text-white hover:bg-white/5"
            >
              Refresh
            </Button>
          </div>
        </div>
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
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Data Loading Error</span>
          </div>
          
          <p className="text-gray-300 text-sm mb-3">
            Failed to load data. This might be a temporary issue.
          </p>
          
          <Button 
            onClick={resetError}
            size="sm" 
            variant="outline"
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
          >
            Try Again
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}