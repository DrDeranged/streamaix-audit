import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Widget {
  id: string;
  label: string;
  category: string;
  visible: boolean;
  order: number;
}

export interface WidgetCategory {
  id: string;
  label: string;
  widgets: Widget[];
}

const DEFAULT_WIDGETS: Widget[] = [
  // Market Overview
  { id: 'market-indices', label: 'Market Indices (S&P, Nasdaq, VIX, DXY)', category: 'market-overview', visible: true, order: 0 },
  { id: 'crypto-ticker', label: 'Crypto Ticker Strip', category: 'market-overview', visible: true, order: 1 },
  { id: 'total-market-cap', label: 'Total Market Cap', category: 'market-overview', visible: true, order: 2 },
  { id: '24h-volume', label: '24h Volume', category: 'market-overview', visible: true, order: 3 },
  { id: 'btc-dominance', label: 'BTC Dominance', category: 'market-overview', visible: true, order: 4 },
  { id: 'eth-dominance', label: 'ETH Dominance', category: 'market-overview', visible: true, order: 5 },

  // Market Intelligence
  { id: 'ai-predictions', label: 'AI Price Predictions', category: 'market-intelligence', visible: true, order: 0 },
  { id: 'sector-performance', label: 'Sector Performance', category: 'market-intelligence', visible: true, order: 1 },
  { id: 'fear-greed', label: 'Fear & Greed Index', category: 'market-intelligence', visible: true, order: 2 },
  { id: 'market-dominance', label: 'Market Dominance', category: 'market-intelligence', visible: true, order: 3 },
  { id: 'eth-gas', label: 'ETH Gas Tracker', category: 'market-intelligence', visible: true, order: 4 },
  { id: 'funding-rates', label: 'Funding Rates', category: 'market-intelligence', visible: true, order: 5 },

  // Crypto Movers
  { id: 'top-gainers', label: 'Top Gainers (24h)', category: 'crypto-movers', visible: true, order: 0 },
  { id: 'top-losers', label: 'Top Losers (24h)', category: 'crypto-movers', visible: true, order: 1 },
  { id: 'trending-tokens', label: 'Trending Tokens', category: 'crypto-movers', visible: true, order: 2 },
  { id: 'defi-tvl', label: 'DeFi TVL', category: 'crypto-movers', visible: true, order: 3 },

  // On-Chain & Derivatives
  { id: 'whale-alerts', label: 'Whale Alerts', category: 'on-chain', visible: true, order: 0 },
  { id: 'exchange-reserves', label: 'Exchange Reserves', category: 'on-chain', visible: true, order: 1 },
  { id: 'stablecoin-flows', label: 'Stablecoin Flows', category: 'on-chain', visible: true, order: 2 },
  { id: 'altcoin-season', label: 'Altcoin Season Index', category: 'on-chain', visible: true, order: 3 },
  { id: 'options-ratio', label: 'Options Put/Call Ratio', category: 'on-chain', visible: true, order: 4 },
  { id: 'liquidations', label: 'BTC Liquidations', category: 'on-chain', visible: true, order: 5 },

  // Macro & TradFi
  { id: 'treasury-yields', label: 'Treasury Yields', category: 'macro', visible: true, order: 0 },
  { id: 'precious-metals', label: 'Precious Metals', category: 'macro', visible: true, order: 1 },
  { id: 'fed-watch', label: 'Fed Watch', category: 'macro', visible: true, order: 2 },
  { id: 'global-m2', label: 'Global M2 Liquidity', category: 'macro', visible: true, order: 3 },
  { id: 'economic-calendar', label: 'Economic Calendar', category: 'macro', visible: true, order: 4 },
  { id: 'crypto-etf', label: 'Crypto ETF Dashboard', category: 'macro', visible: true, order: 5 },

  // Alpha & Intelligence
  { id: 'smart-money', label: 'Smart Money Tracker', category: 'alpha', visible: true, order: 0 },
  { id: 'narrative-momentum', label: 'Narrative Momentum', category: 'alpha', visible: true, order: 1 },
  { id: 'ct-alpha', label: 'CT Alpha Feed', category: 'alpha', visible: true, order: 2 },
  { id: 'token-unlocks', label: 'Token Unlocks', category: 'alpha', visible: true, order: 3 },
  { id: 'airdrop-radar', label: 'Airdrop Radar', category: 'alpha', visible: true, order: 4 },
  { id: 'governance-pulse', label: 'Governance Pulse', category: 'alpha', visible: true, order: 5 },
  { id: 'vc-wallet', label: 'VC Wallet Tracker', category: 'alpha', visible: true, order: 6 },
  { id: 'exchange-flows', label: 'Exchange Flows', category: 'alpha', visible: true, order: 7 },
  { id: 'dex-cex-volume', label: 'DEX vs CEX Volume', category: 'alpha', visible: true, order: 8 },

  // AI-Powered
  { id: 'ai-trade-ideas', label: 'AI Trade Ideas', category: 'ai-powered', visible: true, order: 0 },
  { id: 'event-predictor', label: 'Event Impact Predictor', category: 'ai-powered', visible: true, order: 1 },
  { id: 'anomaly-detector', label: 'Anomaly Detector', category: 'ai-powered', visible: true, order: 2 },
  { id: 'correlation-matrix', label: 'Asset Correlation Matrix', category: 'ai-powered', visible: true, order: 3 },

  // Events & Content
  { id: 'crypto-conferences', label: 'Crypto Conferences', category: 'events', visible: true, order: 0 },
  { id: 'news-macro', label: 'Macro News', category: 'events', visible: true, order: 1 },
  { id: 'news-markets', label: 'Market News', category: 'events', visible: true, order: 2 },

  // Stocks & TradFi
  { id: 'trending-tech', label: 'Trending Tech/AI Stocks', category: 'stocks', visible: true, order: 0 },
  { id: 'stock-gainers', label: 'Stock Gainers', category: 'stocks', visible: true, order: 1 },
  { id: 'stock-losers', label: 'Stock Losers', category: 'stocks', visible: true, order: 2 },

  // Derivatives & Advanced
  { id: 'derivatives-oi', label: 'Derivatives Open Interest', category: 'derivatives', visible: true, order: 0 },
  { id: 'volatility-index', label: 'Crypto Volatility Index', category: 'derivatives', visible: true, order: 1 },
];

export const WIDGET_CATEGORIES: { id: string; label: string }[] = [
  { id: 'market-overview', label: 'Market Overview' },
  { id: 'market-intelligence', label: 'Market Intelligence' },
  { id: 'crypto-movers', label: 'Crypto Movers' },
  { id: 'on-chain', label: 'On-Chain & Derivatives' },
  { id: 'macro', label: 'Macro & TradFi' },
  { id: 'alpha', label: 'Alpha & Intelligence' },
  { id: 'ai-powered', label: 'AI-Powered' },
  { id: 'events', label: 'Events & Content' },
  { id: 'stocks', label: 'Stocks & TradFi' },
  { id: 'derivatives', label: 'Derivatives & Advanced' },
];

const STORAGE_KEY = 'streamaix-widget-settings';

interface WidgetSettingsContextType {
  widgets: Widget[];
  isVisible: (widgetId: string) => boolean;
  toggleVisibility: (widgetId: string) => void;
  moveUp: (widgetId: string) => void;
  moveDown: (widgetId: string) => void;
  resetToDefaults: () => void;
  getWidgetsByCategory: (categoryId: string) => Widget[];
  toggleCategory: (categoryId: string, visible: boolean) => void;
}

const WidgetSettingsContext = createContext<WidgetSettingsContextType | null>(null);

export function WidgetSettingsProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGETS;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedIds = new Set(parsed.map((w: Widget) => w.id));
        const defaultIds = new Set(DEFAULT_WIDGETS.map(w => w.id));
        
        const merged = parsed.filter((w: Widget) => defaultIds.has(w.id));
        DEFAULT_WIDGETS.forEach(dw => {
          if (!savedIds.has(dw.id)) {
            merged.push(dw);
          }
        });
        
        return merged;
      }
    } catch (e) {
      console.error('Failed to load widget settings:', e);
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error('Failed to save widget settings:', e);
    }
  }, [widgets]);

  const isVisible = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget?.visible ?? true;
  }, [widgets]);

  const toggleVisibility = useCallback((widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  }, []);

  const moveUp = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.id === widgetId);
      if (!widget || widget.order === 0) return prev;
      
      const categoryWidgets = prev.filter(w => w.category === widget.category);
      const swapWith = categoryWidgets.find(w => w.order === widget.order - 1);
      
      if (!swapWith) return prev;
      
      return prev.map(w => {
        if (w.id === widgetId) return { ...w, order: w.order - 1 };
        if (w.id === swapWith.id) return { ...w, order: w.order + 1 };
        return w;
      });
    });
  }, []);

  const moveDown = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.id === widgetId);
      if (!widget) return prev;
      
      const categoryWidgets = prev.filter(w => w.category === widget.category);
      const maxOrder = Math.max(...categoryWidgets.map(w => w.order));
      
      if (widget.order >= maxOrder) return prev;
      
      const swapWith = categoryWidgets.find(w => w.order === widget.order + 1);
      if (!swapWith) return prev;
      
      return prev.map(w => {
        if (w.id === widgetId) return { ...w, order: w.order + 1 };
        if (w.id === swapWith.id) return { ...w, order: w.order - 1 };
        return w;
      });
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  const getWidgetsByCategory = useCallback((categoryId: string) => {
    return widgets
      .filter(w => w.category === categoryId)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  const toggleCategory = useCallback((categoryId: string, visible: boolean) => {
    setWidgets(prev => prev.map(w => 
      w.category === categoryId ? { ...w, visible } : w
    ));
  }, []);

  return (
    <WidgetSettingsContext.Provider value={{
      widgets,
      isVisible,
      toggleVisibility,
      moveUp,
      moveDown,
      resetToDefaults,
      getWidgetsByCategory,
      toggleCategory,
    }}>
      {children}
    </WidgetSettingsContext.Provider>
  );
}

export function useWidgetSettings() {
  const context = useContext(WidgetSettingsContext);
  if (!context) {
    throw new Error('useWidgetSettings must be used within a WidgetSettingsProvider');
  }
  return context;
}
