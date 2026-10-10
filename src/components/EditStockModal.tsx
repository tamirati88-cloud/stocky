import React, { useState, useEffect } from 'react';
import { X, Target, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import { MonitoredStock, AlertCondition } from '../types';
import { formatPrice } from '../utils/formatters';

interface EditStockModalProps {
  stock: MonitoredStock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStock: MonitoredStock) => void;
}

export const EditStockModal: React.FC<EditStockModalProps> = ({
  stock,
  isOpen,
  onClose,
  onSave,
}) => {
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [condition, setCondition] = useState<AlertCondition>('ABOVE');
  const [notes, setNotes] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (stock) {
      setTargetPrice(stock.targetPrice);
      setCondition(stock.condition);
      setNotes(stock.userNotes || '');
      setIsEnabled(stock.isEnabled);
    }
  }, [stock]);

  if (!isOpen || !stock) return null;

  const currentPriceFormatted = formatPrice(stock.currentPrice, stock.market, stock.currency);

  const handleQuickPercent = (pct: number) => {
    const newPrice = stock.currentPrice * (1 + pct / 100);
    if (stock.market === 'TASE') {
      setTargetPrice(Math.round(newPrice));
    } else {
      setTargetPrice(Number(newPrice.toFixed(2)));
    }
    if (pct > 0) setCondition('ABOVE');
    else setCondition('BELOW');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...stock,
      targetPrice: Number(targetPrice),
      condition,
      userNotes: notes.trim(),
      isEnabled,
      // reset triggered status when user updates targets
      isTriggered: false,
      triggeredAt: undefined,
      triggeredPrice: undefined,
    });
    onClose();
  };

  const distanceDiff = targetPrice - stock.currentPrice;
  const distancePct = stock.currentPrice > 0 ? (distanceDiff / stock.currentPrice) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">עריכת התראה: {stock.symbol}</h2>
              <p className="text-xs text-slate-400">{stock.nameHe} ({stock.market === 'TASE' ? 'בורסת ת״א 🇮🇱' : 'ארה״ב 🇺🇸'})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Price display */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400">מחיר נוכחי כעת:</span>
            <span className="text-lg font-bold font-mono-numbers text-white">
              {currentPriceFormatted.primary}
            </span>
          </div>

          {/* Condition toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">תנאי התראה</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>עולה מעל</span>
              </button>
              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  condition === 'BELOW'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                <span>יורד מתחת ל</span>
              </button>
            </div>
          </div>

          {/* Target Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              מחיר יעד להתראה ({stock.currency === 'USD' ? 'בדולר $' : 'באגורות ₪'})
            </label>
            <input
              type="number"
              step="any"
              required
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500 font-mono-numbers"
            />

            <div className="flex items-center justify-between text-xs font-mono-numbers text-slate-400 mt-1">
              <span>מרחק מהמחיר הנוכחי:</span>
              <span className={distancePct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {distancePct >= 0 ? `+${distancePct.toFixed(2)}%` : `${distancePct.toFixed(2)}%`}
              </span>
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500">קיצורים:</span>
              <button
                type="button"
                onClick={() => handleQuickPercent(2)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 text-xs border border-slate-700"
              >
                +2%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(5)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 text-xs border border-slate-700"
              >
                +5%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(-2)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs border border-slate-700"
              >
                -2%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(-5)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs border border-slate-700"
              >
                -5%
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">הערה אישית</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערה לגבי הפוזיציה..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Alert Enabled toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isEnabledCheck"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-800 border-slate-700 cursor-pointer"
            />
            <label htmlFor="isEnabledCheck" className="text-xs text-slate-300 cursor-pointer">
              התראה פעילה (השמע צליל והצג התראות בעת הגעה ליעד)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
