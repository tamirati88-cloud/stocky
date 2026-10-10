import React, { useState } from 'react';
import { X, Search, Plus, Target, Check, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Market, AlertCondition, MonitoredStock } from '../types';
import { STOCK_CATALOG } from '../data/stockCatalog';
import { formatPrice } from '../utils/formatters';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (stock: MonitoredStock) => void;
  existingSymbols: string[];
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onAddStock,
  existingSymbols,
}) => {
  const [selectedMarket, setSelectedMarket] = useState<Market>('TASE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Selected or custom stock state
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('LUMI.TA');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customNameHe, setCustomNameHe] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(100);

  // Alert settings
  const [condition, setCondition] = useState<AlertCondition>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<number>(4300);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Filter catalog by market and search query
  const filteredCatalog = STOCK_CATALOG.filter((item) => {
    const matchesMarket = item.market === selectedMarket;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameHe.includes(searchQuery) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sector.includes(searchQuery);
    return matchesMarket && matchesSearch;
  });

  const handleSelectCatalogItem = (symbol: string) => {
    setSelectedStockSymbol(symbol);
    setIsCustomMode(false);
    const item = STOCK_CATALOG.find((s) => s.symbol === symbol);
    if (item) {
      // Set sensible target price based on current price (+3% default for ABOVE)
      const multiplier = condition === 'ABOVE' ? 1.03 : 0.97;
      const initialTarget = item.market === 'TASE'
        ? Math.round(item.currentPrice * multiplier)
        : Number((item.currentPrice * multiplier).toFixed(2));
      setTargetPrice(initialTarget);
    }
  };

  const currentItem = STOCK_CATALOG.find((s) => s.symbol === selectedStockSymbol);
  const effectiveCurrentPrice = isCustomMode ? customPrice : currentItem?.currentPrice || 100;
  const effectiveCurrency = isCustomMode
    ? selectedMarket === 'TASE' ? 'ILS' : 'USD'
    : currentItem?.currency || 'ILS';

  // Apply quick percentage to target price
  const handleQuickPercent = (percent: number) => {
    if (effectiveCurrentPrice <= 0) return;
    const newPrice = effectiveCurrentPrice * (1 + percent / 100);
    if (selectedMarket === 'TASE') {
      setTargetPrice(Math.round(newPrice));
    } else {
      setTargetPrice(Number(newPrice.toFixed(2)));
    }
    if (percent > 0) {
      setCondition('ABOVE');
    } else {
      setCondition('BELOW');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newStock: MonitoredStock;
    const uniqueId = `stock-${Date.now()}`;

    if (isCustomMode) {
      if (!customSymbol.trim()) return;
      newStock = {
        id: uniqueId,
        symbol: customSymbol.trim().toUpperCase(),
        nameHe: customNameHe.trim() || customSymbol.trim().toUpperCase(),
        nameEn: customSymbol.trim().toUpperCase(),
        market: selectedMarket,
        currency: selectedMarket === 'TASE' ? 'ILS' : 'USD',
        currentPrice: customPrice,
        previousClose: customPrice,
        change: 0,
        changePercent: 0,
        dayHigh: customPrice * 1.02,
        dayLow: customPrice * 0.98,
        history: [customPrice * 0.99, customPrice, customPrice],
        targetPrice: Number(targetPrice),
        condition,
        isEnabled: true,
        isTriggered: false,
        userNotes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
    } else if (currentItem) {
      newStock = {
        id: uniqueId,
        symbol: currentItem.symbol,
        nameHe: currentItem.nameHe,
        nameEn: currentItem.nameEn,
        market: currentItem.market,
        currency: currentItem.currency,
        currentPrice: currentItem.currentPrice,
        previousClose: currentItem.currentPrice - currentItem.change,
        change: currentItem.change,
        changePercent: currentItem.changePercent,
        dayHigh: currentItem.currentPrice * 1.015,
        dayLow: currentItem.currentPrice * 0.985,
        history: [
          currentItem.currentPrice * 0.98,
          currentItem.currentPrice * 0.99,
          currentItem.currentPrice,
        ],
        targetPrice: Number(targetPrice),
        condition,
        isEnabled: true,
        isTriggered: false,
        userNotes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
    } else {
      return;
    }

    onAddStock(newStock);
    onClose();
  };

  const distanceDiff = targetPrice - effectiveCurrentPrice;
  const distancePct = effectiveCurrentPrice > 0 ? (distanceDiff / effectiveCurrentPrice) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">הוספת מניה חדשה להתראה</h2>
              <p className="text-xs text-slate-400">בחר מניה והגדר את מחיר היעד הרצוי</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Select Market (TASE vs US) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              שלב 1: בחר בורסה
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedMarket('TASE');
                  // pick first TASE item
                  const firstTase = STOCK_CATALOG.find((s) => s.market === 'TASE');
                  if (firstTase) handleSelectCatalogItem(firstTase.symbol);
                }}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-bold transition ${
                  selectedMarket === 'TASE'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">🇮🇱</span>
                <span>בורסת תל אביב (TASE)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMarket('US');
                  // pick first US item
                  const firstUs = STOCK_CATALOG.find((s) => s.market === 'US');
                  if (firstUs) handleSelectCatalogItem(firstUs.symbol);
                }}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-bold transition ${
                  selectedMarket === 'US'
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">🇺🇸</span>
                <span>בורסות ארה״ב (וול סטריט)</span>
              </button>
            </div>
          </div>

          {/* Step 2: Choose Stock from Catalog or Custom */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                שלב 2: בחר מניה מהרשימה או הזן סימול חופשי
              </label>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs text-emerald-400 hover:underline"
              >
                {isCustomMode ? 'בחר מהרשימה הקיימת' : '+ הזן סימול מותאם אישית'}
              </button>
            </div>

            {isCustomMode ? (
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">סימול מניה (Ticker)</label>
                    <input
                      type="text"
                      required
                      value={customSymbol}
                      onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                      placeholder={selectedMarket === 'TASE' ? 'לדוגמה: ICL.TA' : 'לדוגמה: AMD'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">שם החברה (בעברית או אנגלית)</label>
                    <input
                      type="text"
                      value={customNameHe}
                      onChange={(e) => setCustomNameHe(e.target.value)}
                      placeholder="שם החברה"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    מחיר נוכחי ({selectedMarket === 'TASE' ? 'באגורות, לדוגמה 3500' : 'בדולרים, לדוגמה 150.50'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomPrice(val);
                      setTargetPrice(condition === 'ABOVE' ? Number((val * 1.03).toFixed(2)) : Number((val * 0.97).toFixed(2)));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono-numbers"
                  />
                </div>
              </div>
            ) : (
              <div>
                {/* Search in catalog */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש לפי שם מניה (לאומי, טבע, אפל...) או סימול..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/40">
                  {filteredCatalog.map((item) => {
                    const isSelected = selectedStockSymbol === item.symbol;
                    const priceFmt = formatPrice(item.currentPrice, item.market, item.currency);
                    const isAlreadyAdded = existingSymbols.includes(item.symbol);

                    return (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => handleSelectCatalogItem(item.symbol)}
                        className={`text-right p-2.5 rounded-lg border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-white tracking-wide">
                            {item.symbol}
                          </span>
                          {isAlreadyAdded && (
                            <span className="text-[10px] text-amber-400 font-medium">במעקב</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-300 truncate font-medium mt-0.5">
                          {item.nameHe}
                        </span>
                        <span className="text-[11px] font-mono-numbers text-slate-400 mt-1">
                          {priceFmt.primary}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Alert Configuration */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
            <label className="block text-xs font-semibold text-slate-300">
              שלב 3: הגדרת תנאי ומחיר היעד
            </label>

            {/* Condition selector: Above vs Below */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCondition('ABOVE');
                  if (effectiveCurrentPrice > 0 && targetPrice <= effectiveCurrentPrice) {
                    handleQuickPercent(3);
                  }
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>התראה כשהמחיר יעלה מעל (רווח/פריצה)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCondition('BELOW');
                  if (effectiveCurrentPrice > 0 && targetPrice >= effectiveCurrentPrice) {
                    handleQuickPercent(-3);
                  }
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  condition === 'BELOW'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                <span>התראה כשהמחיר ירד מתחת ל- (Stop Loss)</span>
              </button>
            </div>

            {/* Target Price input & Quick Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 font-medium">
                  מחיר יעד להתראה ({effectiveCurrency === 'USD' ? 'בדולר $' : 'באגורות ₪'}):
                </span>
                <span className="text-xs font-mono-numbers text-slate-400">
                  מחיר נוכחי: {formatPrice(effectiveCurrentPrice, selectedMarket, effectiveCurrency).primary}
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500 font-mono-numbers"
                />
              </div>

              {/* Distance preview */}
              <div className="mt-1.5 flex items-center justify-between text-xs font-mono-numbers">
                <span className="text-slate-400">
                  מרחק מהמחיר הנוכחי:
                </span>
                <span
                  className={`font-semibold ${
                    distancePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {distancePct >= 0 ? `+${distancePct.toFixed(2)}%` : `${distancePct.toFixed(2)}%`}
                </span>
              </div>

              {/* Quick shortcut buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 ml-1">קיצורי דרך:</span>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(2)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono-numbers border border-slate-700 transition"
                >
                  +2%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(5)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono-numbers border border-slate-700 transition"
                >
                  +5%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(10)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono-numbers border border-slate-700 transition"
                >
                  +10%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(-2)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs font-mono-numbers border border-slate-700 transition"
                >
                  -2%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(-5)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs font-mono-numbers border border-slate-700 transition"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(-10)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs font-mono-numbers border border-slate-700 transition"
                >
                  -10%
                </button>
              </div>
            </div>

            {/* Optional Personal Notes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                הערה אישית להתרעה (אופציונלי)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="למשל: למכור 50% מהפוזיציה ברווח, לבדוק הודעת בורסה..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.99] transition"
            >
              הוסף מניה להתראה 🔔
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
