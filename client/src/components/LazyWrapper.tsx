import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import Surface from '@/components/ds/Surface';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

// Enhanced loading skeleton
function DefaultLoadingSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-ink-page text-body">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-ink-raised rounded-xl w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-ink-surface rounded-xl w-96 animate-pulse"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Surface key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-ink-raised rounded-xl w-3/4 mb-4"></div>
              <div className="h-4 bg-ink-surface rounded-xl w-full mb-2"></div>
              <div className="h-4 bg-ink-surface rounded-xl w-2/3 mb-4"></div>
              <div className="h-10 bg-ink-raised rounded-xl w-full"></div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}

// Page-specific loading skeletons
export function DashboardSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-ink-page text-body">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="h-8 bg-ink-raised rounded-xl w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-ink-surface rounded-xl w-72 animate-pulse"></div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Surface key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-ink-surface rounded-xl w-20 mb-2"></div>
              <div className="h-8 bg-ink-raised rounded-xl w-24"></div>
            </Surface>
          ))}
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Surface className="p-6 animate-pulse">
            <div className="h-6 bg-ink-raised rounded-xl w-40 mb-4"></div>
            <div className="h-64 bg-ink-surface rounded-xl"></div>
          </Surface>
          <Surface className="p-6 animate-pulse">
            <div className="h-6 bg-ink-raised rounded-xl w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-ink-surface rounded-xl"></div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

export function TradingSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-ink-page text-body">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="h-8 bg-ink-raised rounded-xl w-40 mb-2 animate-pulse"></div>
          <div className="h-4 bg-ink-surface rounded-xl w-64 animate-pulse"></div>
        </div>
        
        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-ink-raised rounded-xl w-24 animate-pulse"></div>
          ))}
        </div>
        
        {/* Traders grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Surface key={i} className="p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="h-16 w-16 bg-ink-raised rounded-xl mr-4"></div>
                <div>
                  <div className="h-5 bg-ink-raised rounded-xl w-24 mb-2"></div>
                  <div className="h-3 bg-ink-surface rounded-xl w-32"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="h-6 bg-ink-raised rounded-xl w-16 mb-1"></div>
                  <div className="h-3 bg-ink-surface rounded-xl w-20"></div>
                </div>
                <div>
                  <div className="h-6 bg-ink-raised rounded-xl w-12 mb-1"></div>
                  <div className="h-3 bg-ink-surface rounded-xl w-16"></div>
                </div>
              </div>
              <div className="h-10 bg-ink-raised rounded-xl"></div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main lazy wrapper component
export function LazyWrapper({ 
  children, 
  fallback = <DefaultLoadingSkeleton />,
  errorFallback 
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// HOC for lazy loading with optimized suspense
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  LoadingSkeleton: React.ComponentType = DefaultLoadingSkeleton
) {
  const LazyComponent = (props: T) => (
    <LazyWrapper fallback={<LoadingSkeleton />}>
      <Component {...props} />
    </LazyWrapper>
  );
  
  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return LazyComponent;
}

// Preload component for better UX
export function preloadComponent(componentImport: () => Promise<any>) {
  const component = React.lazy(componentImport);
  
  // Start preloading immediately
  componentImport();
  
  return component;
}

// Intelligent preloader based on user behavior
export class IntelligentPreloader {
  private static preloadedComponents = new Set<string>();
  private static preloadQueue: Array<{ name: string; loader: () => Promise<any> }> = [];
  
  static preload(name: string, loader: () => Promise<any>) {
    if (this.preloadedComponents.has(name)) {
      return;
    }
    
    this.preloadQueue.push({ name, loader });
    this.processQueue();
  }
  
  private static async processQueue() {
    if (this.preloadQueue.length === 0) return;
    
    // Process one at a time to avoid overwhelming the browser
    const { name, loader } = this.preloadQueue.shift()!;
    
    try {
      await loader();
      this.preloadedComponents.add(name);
    } catch (error) {
      console.warn(`Failed to preload component ${name}:`, error);
    }
    
    // Continue processing after a small delay
    setTimeout(() => this.processQueue(), 100);
  }
  
  static preloadOnHover(element: HTMLElement, name: string, loader: () => Promise<any>) {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.preload(name, loader);
      }, 200); // Small delay to avoid preloading on quick hovers
    };
    
    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }
}