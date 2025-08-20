// Performance optimization utilities and monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Monitor Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry.name, entry.duration || entry.value);
      }
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    this.observers.push(observer);
  }

  // Record custom metrics
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 entries
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get performance statistics
  getMetrics(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: values.length,
      p95: sorted[p95Index],
    };
  }

  // Monitor component render time
  measureComponent<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          const end = performance.now();
          this.recordMetric(`component.${name}`, end - start);
        }) as T;
      } else {
        const end = performance.now();
        this.recordMetric(`component.${name}`, end - start);
        return result;
      }
    } catch (error) {
      const end = performance.now();
      this.recordMetric(`component.${name}.error`, end - start);
      throw error;
    }
  }

  // Monitor Web3 operations
  measureWeb3<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn()
      .then((result) => {
        const end = performance.now();
        this.recordMetric(`web3.${operation}`, end - start);
        return result;
      })
      .catch((error) => {
        const end = performance.now();
        this.recordMetric(`web3.${operation}.error`, end - start);
        throw error;
      });
  }

  // Get current performance report
  getPerformanceReport(): {
    webVitals: any;
    components: any;
    web3: any;
    memory: any;
  } {
    const report = {
      webVitals: {},
      components: {},
      web3: {},
      memory: this.getMemoryInfo(),
    };

    // Group metrics by category
    for (const [name, _] of this.metrics) {
      const metrics = this.getMetrics(name);
      if (!metrics) continue;

      if (name.startsWith('component.')) {
        report.components[name.replace('component.', '')] = metrics;
      } else if (name.startsWith('web3.')) {
        report.web3[name.replace('web3.', '')] = metrics;
      } else {
        report.webVitals[name] = metrics;
      }
    }

    return report;
  }

  private getMemoryInfo(): any {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }

  // Clean up observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Web3 Connection Pool for better performance
export class Web3ConnectionPool {
  private static instance: Web3ConnectionPool;
  private providers: Map<number, any> = new Map();
  private contractCache: Map<string, any> = new Map();
  private batchQueue: Array<{ call: any; resolve: Function; reject: Function }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  static getInstance(): Web3ConnectionPool {
    if (!Web3ConnectionPool.instance) {
      Web3ConnectionPool.instance = new Web3ConnectionPool();
    }
    return Web3ConnectionPool.instance;
  }

  // Get cached provider
  getProvider(chainId: number): any {
    if (!this.providers.has(chainId)) {
      // Create new provider
      const provider = this.createProvider(chainId);
      this.providers.set(chainId, provider);
    }
    return this.providers.get(chainId);
  }

  private createProvider(chainId: number): any {
    // Implementation would depend on the specific provider
    return null; // Mock for now
  }

  // Get cached contract instance
  getContract(address: string, abi: any, chainId: number): any {
    const key = `${chainId}-${address}`;
    if (!this.contractCache.has(key)) {
      const provider = this.getProvider(chainId);
      const contract = new (global as any).ethers.Contract(address, abi, provider);
      this.contractCache.set(key, contract);
    }
    return this.contractCache.get(key);
  }

  // Batch multiple contract calls
  async batchCall(calls: Array<{ contract: any; method: string; args: any[] }>): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ call: calls, resolve, reject });
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, 50); // Batch calls within 50ms
    });
  }

  private async executeBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    try {
      // Execute all calls in parallel
      const results = await Promise.all(
        batch.flatMap(({ call }) => 
          call.map(({ contract, method, args }) => 
            contract[method](...args)
          )
        )
      );
      
      // Resolve each batch
      let resultIndex = 0;
      for (const { call, resolve } of batch) {
        const batchResults = results.slice(resultIndex, resultIndex + call.length);
        resultIndex += call.length;
        resolve(batchResults);
      }
    } catch (error) {
      // Reject all batches if any fail
      batch.forEach(({ reject }) => reject(error));
    }
  }

  // Clear cache
  clearCache(): void {
    this.contractCache.clear();
    this.providers.clear();
  }
}

// React Query optimizations
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

// Optimized image loading
export class ImageOptimizer {
  private static cache: Map<string, string> = new Map();
  
  static async optimizeImage(
    src: string, 
    options: { width?: number; height?: number; quality?: number } = {}
  ): Promise<string> {
    const cacheKey = `${src}-${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // For now, return original src
      // In production, implement actual image optimization
      this.cache.set(cacheKey, src);
      return src;
    } catch (error) {
      console.warn('Image optimization failed:', error);
      return src;
    }
  }

  static preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// Bundle size analyzer (development only)
export class BundleAnalyzer {
  static analyzeBundle(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const modules = new Map<string, number>();
    
    // Analyze loaded modules
    if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
      const webpack = (window as any).__webpack_require__;
      
      Object.keys(webpack.cache).forEach(key => {
        const module = webpack.cache[key];
        if (module && module.size) {
          modules.set(key, module.size);
        }
      });
    }

    // Sort by size
    const sorted = Array.from(modules.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.group('📦 Bundle Analysis - Top 10 Modules');
    sorted.forEach(([name, size]) => {
      console.log(`${name}: ${(size / 1024).toFixed(2)}KB`);
    });
    console.groupEnd();
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const connectionPool = Web3ConnectionPool.getInstance();