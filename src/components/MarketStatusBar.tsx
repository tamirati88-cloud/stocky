import React from 'react';
import { getMarketStatus } from '../utils/marketHours';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface MarketStatusBarProps {
  isSyncingYahoo?: boolean;
  lastYahooSync?: string | null;
  onRefreshYahoo?: () => void;
}

export const MarketStatusBar: React.FC<MarketStatusBarProps> = ({
  isSyncingYahoo = false,
  lastYahooSync = null,
  onRefreshYahoo,
}) => {
  const taseStatus = getMarketStatus('TASE');
  const usStatus = getMarketStatus('US');

  return (
    <div className="space-y-2.5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-mono-numbers">
                  Yahoo Finance API 🟢
                </span>
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

      {/* Live Yahoo API Sync Banner */}
      <div className="bg-purple-950/20 border border-purple-500/25 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-purple-200">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className="font-bold">Yahoo Finance Live API:</span>
          <span className="text-purple-300">
            מחירי המניות האמריקאיות מתעדכנים ישירות מ-Yahoo Finance
          </span>
          {lastYahooSync && (
            <span className="text-slate-400 text-[11px] font-mono-numbers">
              (סנכרון אחרון: {new Date(lastYahooSync).toLocaleTimeString('he-IL')})
            </span>
          )}
        </div>

        {onRefreshYahoo && (
          <button
            onClick={onRefreshYahoo}
            disabled={isSyncingYahoo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingYahoo ? 'animate-spin text-purple-300' : ''}`} />
            <span>{isSyncingYahoo ? 'מסנכרן מ-Yahoo...' : 'רענן מחירי ארה״ב כעת'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
