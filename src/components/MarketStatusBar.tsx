import React from 'react';
import { getMarketStatus } from '../utils/marketHours';

export const MarketStatusBar: React.FC = () => {
  const taseStatus = getMarketStatus('TASE');
  const usStatus = getMarketStatus('US');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      {/* TASE Box */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">
            🇮🇱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">בורסת תל אביב (TASE)</span>
              <span className="text-xs text-slate-400">ת״א 35, בנקים, מניות מקומיות</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              שעות מסחר: <span className="text-slate-300 font-mono-numbers">{taseStatus.tradingHours}</span>
            </div>
          </div>
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5 justify-end">
            <span
              className={`w-2 h-2 rounded-full ${
                taseStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                taseStatus.isOpen ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {taseStatus.statusText}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">{taseStatus.nextEventText}</span>
        </div>
      </div>

      {/* US Markets Box */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg">
            🇺🇸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">בורסות ארה״ב (NYSE / NASDAQ)</span>
              <span className="text-xs text-slate-400">וול סטריט, S&P 500, נאסד״ק</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              שעות מסחר: <span className="text-slate-300 font-mono-numbers">{usStatus.tradingHours}</span>
            </div>
          </div>
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5 justify-end">
            <span
              className={`w-2 h-2 rounded-full ${
                usStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                usStatus.isOpen ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {usStatus.statusText}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">{usStatus.nextEventText}</span>
        </div>
      </div>
    </div>
  );
};
