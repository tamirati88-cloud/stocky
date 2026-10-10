import React from 'react';
import { PlusCircle, BellRing, Sparkles } from 'lucide-react';

interface HeroAddButtonProps {
  onOpenAddModal: () => void;
  totalStocksCount: number;
  activeAlertsCount: number;
  triggeredCount: number;
}

export const HeroAddButton: React.FC<HeroAddButtonProps> = ({
  onOpenAddModal,
  totalStocksCount,
  activeAlertsCount,
  triggeredCount,
}) => {
  return (
    <div className="mb-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background glowing accents */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
        {/* Left / Heading info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              מעקב והתראות מחיר חיים
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            המניות במעקב והתראות
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            קבל התראה מידית וצליל כאשר מניות בורסת תל אביב (TASE) או וול סטריט (ארה״ב) חוצות את מחיר היעד שקבעת.
          </p>

          {/* Quick Counter chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono-numbers">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1 text-slate-300 flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">מניות במעקב:</span>
              <span className="font-bold text-white">{totalStocksCount}</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-1 text-emerald-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-sans">התראות פעילות:</span>
              <span className="font-bold">{activeAlertsCount}</span>
            </div>
            {triggeredCount > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg px-3 py-1 text-amber-300 flex items-center gap-1.5">
                <BellRing className="w-3 h-3 text-amber-400 animate-bounce" />
                <span className="text-amber-400 font-sans">הופעלו:</span>
                <span className="font-bold">{triggeredCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* The BIG Prominent Button as requested */}
        <div className="flex-shrink-0 flex items-center">
          <button
            onClick={onOpenAddModal}
            className="w-full md:w-auto group relative inline-flex items-center justify-center gap-3.5 px-6 sm:px-8 py-4 text-base sm:text-lg font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_auto] hover:bg-[position:right_center] rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 border border-emerald-300/40 cursor-pointer"
          >
            <PlusCircle className="w-6 h-6 text-slate-950 transition-transform group-hover:rotate-90 duration-300" />
            <span className="tracking-tight">הוספת מניה חדשה להתראה</span>
            <Sparkles className="w-4 h-4 text-slate-900/70" />
          </button>
        </div>
      </div>
    </div>
  );
};
