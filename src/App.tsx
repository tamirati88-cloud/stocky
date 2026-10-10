import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MonitoredStock, TriggeredAlertLog } from './types';
import { INITIAL_MONITORED_STOCKS } from './data/stockCatalog';
import { playAlertChime } from './utils/audio';
import { sendBrowserNotification } from './utils/notifications';
import { Navbar } from './components/Navbar';
import { MarketStatusBar } from './components/MarketStatusBar';
import { HeroAddButton } from './components/HeroAddButton';
import { FilterToolbar, FilterCategory, SortOption } from './components/FilterToolbar';
import { StockCard } from './components/StockCard';
import { AddStockModal } from './components/AddStockModal';
import { EditStockModal } from './components/EditStockModal';
import { AlertBanner } from './components/AlertBanner';
import { AlertHistoryDrawer } from './components/AlertHistoryDrawer';
import { Plus, Bell, RefreshCw, Layers } from 'lucide-react';

const STORAGE_KEY_STOCKS = 'stockpulse_monitored_stocks_v2';
const STORAGE_KEY_LOGS = 'stockpulse_alert_logs_v2';
const STORAGE_KEY_SOUND = 'stockpulse_sound_enabled';

export default function App() {
  // --- Persistent State ---
  const [stocks, setStocks] = useState<MonitoredStock[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STOCKS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MONITORED_STOCKS;
  });

  const [alertLogs, setAlertLogs] = useState<TriggeredAlertLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return true;
  });

  // --- UI State ---
  const [isSimulating, setIsSimulating] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');

  // Modals & Banners
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<MonitoredStock | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeBannerAlert, setActiveBannerAlert] = useState<TriggeredAlertLog | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STOCKS, JSON.stringify(stocks));
    } catch {
      // ignore
    }
  }, [stocks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(alertLogs));
    } catch {
      // ignore
    }
  }, [alertLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // --- Trigger Alert Handler ---
  const triggerAlertForStock = useCallback(
    (stock: MonitoredStock, currentTriggerPrice: number) => {
      const newLog: TriggeredAlertLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stockId: stock.id,
        symbol: stock.symbol,
        nameHe: stock.nameHe,
        market: stock.market,
        condition: stock.condition,
        targetPrice: stock.targetPrice,
        triggerPrice: currentTriggerPrice,
        currency: stock.currency,
        timestamp: new Date().toISOString(),
      };

      setAlertLogs((prev) => [newLog, ...prev]);
      setActiveBannerAlert(newLog);

      if (soundEnabled) {
        playAlertChime();
      }

      const marketName = stock.market === 'TASE' ? 'בורסת ת״א' : 'וול סטריט';
      sendBrowserNotification(
        `🚨 התראת מחיר: ${stock.symbol} (${stock.nameHe})`,
        `המניה הגיעה למחיר ${currentTriggerPrice} ב-${marketName}! יעד: ${stock.targetPrice}`
      );
    },
    [soundEnabled]
  );

  // --- Live Price Tick Simulation Engine ---
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setStocks((prevStocks) => {
        if (prevStocks.length === 0) return prevStocks;

        // Pick 1 to 2 random stocks to fluctuate
        const indicesToTick: number[] = [];
        const countToUpdate = Math.min(prevStocks.length, Math.random() > 0.4 ? 2 : 1);
        while (indicesToTick.length < countToUpdate) {
          const randIdx = Math.floor(Math.random() * prevStocks.length);
          if (!indicesToTick.includes(randIdx)) {
            indicesToTick.push(randIdx);
          }
        }

        return prevStocks.map((stock, idx) => {
          if (!indicesToTick.includes(idx)) {
            return stock.lastTickDirection !== 'none'
              ? { ...stock, lastTickDirection: 'none' }
              : stock;
          }

          // Random percentage fluctuation between -0.4% and +0.4%
          const pctDelta = (Math.random() * 0.8 - 0.38) / 100;
          let newPrice: number;
          if (stock.market === 'TASE') {
            newPrice = Math.max(10, Math.round(stock.currentPrice * (1 + pctDelta)));
          } else {
            newPrice = Math.max(0.1, Number((stock.currentPrice * (1 + pctDelta)).toFixed(2)));
          }

          const priceDiff = newPrice - stock.previousClose;
          const changePercent = Number(((priceDiff / stock.previousClose) * 100).toFixed(2));
          const direction: 'up' | 'down' = newPrice >= stock.currentPrice ? 'up' : 'down';

          const newHistory = [...stock.history.slice(-14), newPrice];

          let isTriggered = stock.isTriggered;
          let triggeredAt = stock.triggeredAt;
          let triggeredPrice = stock.triggeredPrice;

          // Check alert trigger condition if enabled and not already triggered
          if (stock.isEnabled && !stock.isTriggered) {
            let hit = false;
            if (stock.condition === 'ABOVE' && newPrice >= stock.targetPrice) {
              hit = true;
            } else if (stock.condition === 'BELOW' && newPrice <= stock.targetPrice) {
              hit = true;
            }

            if (hit) {
              isTriggered = true;
              triggeredAt = new Date().toISOString();
              triggeredPrice = newPrice;
              // Trigger outside react render cycle
              setTimeout(() => {
                triggerAlertForStock(stock, newPrice);
              }, 50);
            }
          }

          return {
            ...stock,
            currentPrice: newPrice,
            change: Number(priceDiff.toFixed(2)),
            changePercent,
            dayHigh: Math.max(stock.dayHigh, newPrice),
            dayLow: Math.min(stock.dayLow, newPrice),
            history: newHistory,
            lastTickDirection: direction,
            isTriggered,
            triggeredAt,
            triggeredPrice,
          };
        });
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isSimulating, triggerAlertForStock]);

  // --- Handlers ---
  const handleAddStock = (newStock: MonitoredStock) => {
    setStocks((prev) => [newStock, ...prev]);
  };

  const handleEditStock = (updatedStock: MonitoredStock) => {
    setStocks((prev) => prev.map((s) => (s.id === updatedStock.id ? updatedStock : s)));
  };

  const handleDeleteStock = (id: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleEnabled = (id: string) => {
    setStocks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  const handleResetTrigger = (id: string) => {
    setStocks((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              isTriggered: false,
              triggeredAt: undefined,
              triggeredPrice: undefined,
            }
          : s
      )
    );
  };

  const handleTestTrigger = (stock: MonitoredStock) => {
    // Manually force trigger for testing
    setStocks((prev) =>
      prev.map((s) =>
        s.id === stock.id
          ? {
              ...s,
              isTriggered: true,
              triggeredAt: new Date().toISOString(),
              triggeredPrice: stock.currentPrice,
            }
          : s
      )
    );
    triggerAlertForStock(stock, stock.currentPrice);
  };

  const handleSimulateTick = (id: string, deltaPercent: number) => {
    setStocks((prev) =>
      prev.map((stock) => {
        if (stock.id !== id) return stock;
        const newPrice =
          stock.market === 'TASE'
            ? Math.round(stock.currentPrice * (1 + deltaPercent / 100))
            : Number((stock.currentPrice * (1 + deltaPercent / 100)).toFixed(2));
        const priceDiff = newPrice - stock.previousClose;
        const changePercent = Number(((priceDiff / stock.previousClose) * 100).toFixed(2));
        const direction: 'up' | 'down' = deltaPercent >= 0 ? 'up' : 'down';

        let isTriggered = stock.isTriggered;
        let triggeredAt = stock.triggeredAt;
        let triggeredPrice = stock.triggeredPrice;

        if (stock.isEnabled) {
          if (
            (stock.condition === 'ABOVE' && newPrice >= stock.targetPrice) ||
            (stock.condition === 'BELOW' && newPrice <= stock.targetPrice)
          ) {
            isTriggered = true;
            triggeredAt = new Date().toISOString();
            triggeredPrice = newPrice;
            setTimeout(() => {
              triggerAlertForStock(stock, newPrice);
            }, 50);
          }
        }

        return {
          ...stock,
          currentPrice: newPrice,
          change: Number(priceDiff.toFixed(2)),
          changePercent,
          dayHigh: Math.max(stock.dayHigh, newPrice),
          dayLow: Math.min(stock.dayLow, newPrice),
          history: [...stock.history, newPrice],
          lastTickDirection: direction,
          isTriggered,
          triggeredAt,
          triggeredPrice,
        };
      })
    );
  };

  const handleResetToDefaults = () => {
    setStocks(INITIAL_MONITORED_STOCKS);
    setAlertLogs([]);
  };

  // --- Filtering & Sorting ---
  const filteredAndSortedStocks = useMemo(() => {
    let result = stocks.filter((stock) => {
      // Category filter
      if (currentFilter === 'TASE' && stock.market !== 'TASE') return false;
      if (currentFilter === 'US' && stock.market !== 'US') return false;
      if (currentFilter === 'TRIGGERED' && !stock.isTriggered) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          stock.symbol.toLowerCase().includes(q) ||
          stock.nameHe.includes(q) ||
          stock.nameEn.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'CHANGE_DESC':
        result.sort((a, b) => b.changePercent - a.changePercent);
        break;
      case 'CHANGE_ASC':
        result.sort((a, b) => a.changePercent - b.changePercent);
        break;
      case 'NAME':
        result.sort((a, b) => a.nameHe.localeCompare(b.nameHe));
        break;
      case 'DISTANCE':
        result.sort((a, b) => {
          const distA = Math.abs(a.targetPrice - a.currentPrice) / a.currentPrice;
          const distB = Math.abs(b.targetPrice - b.currentPrice) / b.currentPrice;
          return distA - distB;
        });
        break;
      default:
        // default: triggered first, then by creation
        result.sort((a, b) => (b.isTriggered ? 1 : 0) - (a.isTriggered ? 1 : 0));
        break;
    }

    return result;
  }, [stocks, currentFilter, searchQuery, sortBy]);

  // Counts
  const counts = useMemo(
    () => ({
      all: stocks.length,
      tase: stocks.filter((s) => s.market === 'TASE').length,
      us: stocks.filter((s) => s.market === 'US').length,
      triggered: stocks.filter((s) => s.isTriggered).length,
      active: stocks.filter((s) => s.isEnabled).length,
    }),
    [stocks]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Floating Alert Banner */}
      <AlertBanner
        activeAlert={activeBannerAlert}
        onDismiss={() => setActiveBannerAlert(null)}
        onResetStockAlert={handleResetTrigger}
      />

      {/* Main Navbar */}
      <Navbar
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        unreadAlertsCount={alertLogs.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulating={() => setIsSimulating(!isSimulating)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Real-time Market Status Bar */}
        <MarketStatusBar />

        {/* HERO SECTION WITH LARGE ADD BUTTON AS REQUESTED */}
        <HeroAddButton
          onOpenAddModal={() => setIsAddModalOpen(true)}
          totalStocksCount={counts.all}
          activeAlertsCount={counts.active}
          triggeredCount={counts.triggered}
        />

        {/* Filter and Search Bar */}
        <FilterToolbar
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCounts={{
            all: counts.all,
            tase: counts.tase,
            us: counts.us,
            triggered: counts.triggered,
          }}
        />

        {/* Stock Cards Grid */}
        {filteredAndSortedStocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredAndSortedStocks.map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onEdit={(s) => setEditingStock(s)}
                onDelete={handleDeleteStock}
                onToggleEnabled={handleToggleEnabled}
                onTestTrigger={handleTestTrigger}
                onSimulateTick={handleSimulateTick}
                onResetTrigger={handleResetTrigger}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">לא נמצאו מניות בתצוגה זו</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? 'לא נמצאו מניות המתאימות לחיפוש הנוכחי.'
                : currentFilter === 'TRIGGERED'
                ? 'אין כרגע מניות שהופעלה עליהן התראה.'
                : 'רשימת המעקב שלך ריקה. לחץ על הכפתור כדי להוסיף מניות מבורסת ת״א או ארה״ב.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>הוסף מניה ראשונה</span>
              </button>
              {stocks.length === 0 && (
                <button
                  onClick={handleResetToDefaults}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  שחזר רשימת מניות לדוגמה
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">StockPulse</span>
            <span>·</span>
            <span>התראות מניות בזמן אמת לבורסת ת״א (TASE) ווול סטריט (ארה״ב)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={handleResetToDefaults}
              className="hover:text-slate-300 transition underline text-xs"
            >
              איפוס למניות ברירת מחדל
            </button>
            <span>·</span>
            <span>צליל מובנה בטכנולוגיית Web Audio</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStock={handleAddStock}
        existingSymbols={stocks.map((s) => s.symbol)}
      />

      <EditStockModal
        stock={editingStock}
        isOpen={!!editingStock}
        onClose={() => setEditingStock(null)}
        onSave={handleEditStock}
      />

      <AlertHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={alertLogs}
        onClearLogs={() => setAlertLogs([])}
      />
    </div>
  );
}
