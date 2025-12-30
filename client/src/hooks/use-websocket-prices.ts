import { useState, useEffect, useCallback, useRef } from 'react';

export interface PriceUpdate {
  symbol: string;
  price: number;
  priceChange24h: number;
  timestamp: number;
}

interface UseWebSocketPricesReturn {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  prices: Map<string, PriceUpdate>;
  recentUpdates: Set<string>;
  subscribe: (symbols: string[]) => void;
}

export function useWebSocketPrices(symbols: string[]): UseWebSocketPricesReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [recentUpdates, setRecentUpdates] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<string[]>([]);

  const clearRecentUpdate = useCallback((symbol: string) => {
    setTimeout(() => {
      setRecentUpdates(prev => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    }, 2000);
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'price_update') {
        const update: PriceUpdate = {
          symbol: data.symbol,
          price: data.price,
          priceChange24h: data.priceChange24h,
          timestamp: data.timestamp,
        };
        
        setPrices(prev => {
          const next = new Map(prev);
          next.set(update.symbol, update);
          return next;
        });
        
        setRecentUpdates(prev => {
          const next = new Set(prev);
          next.add(update.symbol);
          return next;
        });
        
        clearRecentUpdate(update.symbol);
      } else if (data.type === 'batch_update') {
        const updates: PriceUpdate[] = data.updates || [];
        
        setPrices(prev => {
          const next = new Map(prev);
          updates.forEach((update: PriceUpdate) => {
            next.set(update.symbol, update);
          });
          return next;
        });
        
        updates.forEach((update: PriceUpdate) => {
          setRecentUpdates(prev => {
            const next = new Set(prev);
            next.add(update.symbol);
            return next;
          });
          clearRecentUpdate(update.symbol);
        });
      }
    } catch (error) {
      console.error('[PriceWS] Error parsing message:', error);
    }
  }, [clearRecentUpdate]);

  const subscribe = useCallback((newSymbols: string[]) => {
    subscribedSymbolsRef.current = newSymbols;
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && newSymbols.length > 0) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        symbols: newSymbols,
      }));
    }
  }, []);

  const connect = useCallback(() => {
    if (symbols.length === 0) return;
    
    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/prices`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[PriceWS] Connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        if (subscribedSymbolsRef.current.length > 0) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            symbols: subscribedSymbolsRef.current,
          }));
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        console.log('[PriceWS] Disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('[PriceWS] Error:', error);
      };
    } catch (error) {
      console.error('[PriceWS] Connection error:', error);
      setConnectionStatus('disconnected');
    }
  }, [symbols.length, handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    subscribedSymbolsRef.current = symbols;
    
    if (symbols.length > 0) {
      connect();
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          symbols,
        }));
      }
    }
    
    return () => {
      disconnect();
    };
  }, [symbols.join(',')]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && symbols.length > 0) {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };

    const handleOnline = () => {
      if (symbols.length > 0) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [symbols.length, connect]);

  return {
    isConnected,
    connectionStatus,
    prices,
    recentUpdates,
    subscribe,
  };
}
