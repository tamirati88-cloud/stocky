import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BellRing, 
  BellOff, 
  Edit3, 
  Trash2, 
  Play, 
  Pause, 
  Zap, 
  ChevronRight,
  Target,
  Clock,
  Sparkles
} from 'lucide-react';
import { MonitoredStock } from '../types';
import { formatPrice, formatChangePercent, formatChangeValue, getConditionLabel, formatTimestamp } from '../utils/formatters';
import { Sparkline } from './Sparkline';

interface StockCardProps {
  stock: MonitoredStock;
  onEdit: (stock: MonitoredStock) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onTestTrigger: (stock: MonitoredStock) => void;
  onSimulateTick: (id: string, deltaPercent: number) => void;
  onResetTrigger: (id: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  onEdit,
  onDelete,
  onToggleEnabled,
  onTestTrigger,
  onSimulateTick,
  onResetTrigger,
}) => {
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  const isPositive = stock.change >= 0;
  const currentPriceFormatted = formatPrice(stock.currentPrice, stock.market, stock.currency);
  const targetPriceFormatted = formatPrice(stock.targetPrice, stock.market, stock.currency);

  // Calculate distance to target price
  let distancePercent = 0;
  let distanceAbs = Math.abs(stock.targetPrice - stock.currentPrice);
  if (stock.currentPrice > 0) {
    distancePercent = ((stock.targetPrice - stock.currentPrice) / stock.currentPrice) * 100;
  }

  // Progress towards target
  let progressPercent = 0;
  if (stock.condition === 'ABOVE') {
    if (stock.currentPrice >= stock.targetPrice) {
      progressPercent = 100;
    } else {
      const diff = stock.targetPrice - stock.previousClose;
      const progress = stock.currentPrice - stock.previousClose;
      progressPercent = diff > 0 ? Math.min(100, Math.max(0, (progress / diff) * 100)) : 50;
    }
  } else if (stock.condition === 'BELOW') {
    if (stock.currentPrice <= stock.targetPrice) {
      progressPercent = 100;
    } else {
      const diff = stock.previousClose - stock.targetPrice;
      const progress = stock.previousClose - stock.currentPrice;
      progressPercent = diff > 0 ? Math.min(100, Math.max(0, (progress / diff) * 100)) : 50;
    }
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col ${
        stock.isTriggered
          ? 'bg-slate-900/95 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
          : !stock.isEnabled
          ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80 shadow-md'
      }`}
    >
      {/* Top Banner if Triggered */}
      {stock.isTriggered && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <BellRing className="w-4 h-4 animate-bounce text-amber-400" />
            <span>התראה הופעלה! מחיר היעד נחצה ({formatTimestamp(stock.triggeredAt || '')})</span>
          </div>
          <button
            onClick={() => onResetTrigger(stock.id)}
            className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded font-medium transition"
          >
            אפס התראה
          </button>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Flag icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                {stock.market === 'TASE' ? '🇮🇱' : '🇺🇸'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white tracking-tight">{stock.symbol}</h3>
                  <span className="text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/70 border border-slate-700/60 font-mono-numbers">
                    {stock.market === 'TASE' ? 'ת״א TASE' : 'Wall St'}
                  </span>
                  {stock.dataSource === 'yahoo' && (
                    <span 
                      title={stock.lastSyncedAt ? `מחיר עדכני מ-Yahoo Finance (${new Date(stock.lastSyncedAt).toLocaleTimeString('he-IL')})` : 'מחיר עדכני מ-Yahoo Finance'}
                      className="text-[10px] bg-purple-950/70 border border-purple-500/40 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono-numbers"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      <span>Yahoo Live</span>
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-300 truncate max-w-[180px] sm:max-w-[220px]">
                  {stock.nameHe}
                </div>
              </div>
            </div>

            {/* Quick Action Menu */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleEnabled(stock.id)}
                title={stock.isEnabled ? 'השהה התראה' : 'הפעל התראה'}
                className={`p-1.5 rounded-lg border transition ${
                  stock.isEnabled
                    ? 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                    : 'text-slate-500 hover:bg-slate-800 border-slate-800'
                }`}
              >
                {stock.isEnabled ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => onEdit(stock)}
                title="עריכת התראה ומחיר יעד"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDelete(stock.id)}
                title="מחק מניה מהרשימה"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Price & Sparkline row */}
          <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-black font-mono-numbers tracking-tight transition-all rounded px-1 -mx-1 ${
                    stock.lastTickDirection === 'up'
                      ? 'flash-up text-emerald-400'
                      : stock.lastTickDirection === 'down'
                      ? 'flash-down text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {currentPriceFormatted.primary}
                </span>
                {currentPriceFormatted.secondary && (
                  <span className="text-xs text-slate-400 font-mono-numbers">
                    ({currentPriceFormatted.secondary})
                  </span>
                )}
              </div>

              {/* Change indicator */}
              <div className="flex items-center gap-1.5 mt-1 font-mono-numbers text-xs">
                <span
                  className={`flex items-center font-bold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                  {formatChangePercent(stock.changePercent)}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{formatChangeValue(stock.change, stock.currency)}</span>
              </div>
            </div>

            {/* Sparkline trend */}
            <div className="hidden sm:block">
              <Sparkline data={stock.history} isPositive={isPositive} width={110} height={34} />
            </div>
          </div>

          {/* Alert Configuration Container */}
          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-semibold">תנאי התראה:</span>
                <span className="text-emerald-400 font-medium">
                  {getConditionLabel(stock.condition)} {targetPriceFormatted.primary}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    stock.isTriggered
                      ? 'bg-amber-400 animate-ping'
                      : stock.isEnabled
                      ? 'bg-emerald-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium ${
                    stock.isTriggered
                      ? 'text-amber-400 font-bold'
                      : stock.isEnabled
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  {stock.isTriggered ? 'הופעלה' : stock.isEnabled ? 'פעילה' : 'מושהית'}
                </span>
              </div>
            </div>

            {/* Distance Progress */}
            {!stock.isTriggered && stock.isEnabled && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-numbers">
                  <span>
                    מרחק ליעד:{' '}
                    <span className="text-slate-200 font-semibold">
                      {Math.abs(distancePercent).toFixed(2)}%
                    </span>
                  </span>
                  <span>
                    {stock.condition === 'ABOVE'
                      ? stock.currentPrice >= stock.targetPrice
                        ? 'נחצה!'
                        : 'חסר עוד ' + (stock.currency === 'USD' ? `$${distanceAbs.toFixed(2)}` : `${Math.round(distanceAbs)} אג׳`)
                      : stock.currentPrice <= stock.targetPrice
                      ? 'נחצה!'
                      : 'חסר עוד ' + (stock.currency === 'USD' ? `$${distanceAbs.toFixed(2)}` : `${Math.round(distanceAbs)} אג׳`)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                  />
                </div>
              </div>
            )}

            {/* User Personal Note */}
            {stock.userNotes && (
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60 truncate">
                📝 {stock.userNotes}
              </p>
            )}
          </div>
        </div>

        {/* Card Footer: Simulation & Test controls */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Test Trigger Button */}
          <button
            onClick={() => onTestTrigger(stock)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
            title="בדוק איך ההתראה תישמע ותיראה ברגע זה"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>בדיקת התראה 🔔</span>
          </button>

          {/* Quick Simulate Price Move Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSimulateMenu(!showSimulateMenu)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-teal-950/40 hover:bg-teal-900/40 text-teal-300 border border-teal-500/30 transition"
              title="הדמה תנודת מחיר כדי לבדוק הפעלת התראה טבעית"
            >
              <Zap className="w-3 h-3 text-teal-400" />
              <span>הדמיית מחיר</span>
            </button>

            {showSimulateMenu && (
              <div className="absolute left-0 bottom-full mb-1 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-xl z-20 flex flex-col gap-1 w-36">
                <span className="text-[10px] text-slate-400 px-1 font-semibold">שנה מחיר לצורך בדיקה:</span>
                <button
                  onClick={() => {
                    onSimulateTick(stock.id, 2.0);
                    setShowSimulateMenu(false);
                  }}
                  className="text-xs px-2 py-1 rounded bg-slate-750 hover:bg-emerald-500/20 text-emerald-300 text-right flex items-center justify-between"
                >
                  <span>זינוק +2%</span>
                  <span>📈</span>
                </button>
                <button
                  onClick={() => {
                    onSimulateTick(stock.id, 5.0);
                    setShowSimulateMenu(false);
                  }}
                  className="text-xs px-2 py-1 rounded bg-slate-750 hover:bg-emerald-500/20 text-emerald-300 text-right flex items-center justify-between"
                >
                  <span>קפיצה +5%</span>
                  <span>🚀</span>
                </button>
                <button
                  onClick={() => {
                    onSimulateTick(stock.id, -2.0);
                    setShowSimulateMenu(false);
                  }}
                  className="text-xs px-2 py-1 rounded bg-slate-750 hover:bg-rose-500/20 text-rose-300 text-right flex items-center justify-between"
                >
                  <span>ירידה -2%</span>
                  <span>📉</span>
                </button>
                <button
                  onClick={() => {
                    onSimulateTick(stock.id, -5.0);
                    setShowSimulateMenu(false);
                  }}
                  className="text-xs px-2 py-1 rounded bg-slate-750 hover:bg-rose-500/20 text-rose-300 text-right flex items-center justify-between"
                >
                  <span>נפילה -5%</span>
                  <span>🔻</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
