import React from 'react';
import { BellRing, X, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { TriggeredAlertLog } from '../types';
import { formatPrice, getConditionLabel } from '../utils/formatters';

interface AlertBannerProps {
  activeAlert: TriggeredAlertLog | null;
  onDismiss: () => void;
  onResetStockAlert: (stockId: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  activeAlert,
  onDismiss,
  onResetStockAlert,
}) => {
  if (!activeAlert) return null;

  const priceFmt = formatPrice(activeAlert.triggerPrice, activeAlert.market, activeAlert.currency);
  const targetFmt = formatPrice(activeAlert.targetPrice, activeAlert.market, activeAlert.currency);

  return (
    <div className="fixed top-20 left-4 right-4 max-w-2xl mx-auto z-50 animate-bounce duration-300">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl p-4 shadow-2xl shadow-amber-500/30 border border-amber-300/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-950/20 backdrop-blur flex items-center justify-center text-slate-950 font-black">
            <BellRing className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-950">
                🚨 התראת מחיר הופעלה!
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-bold">
                {activeAlert.symbol} {activeAlert.market === 'TASE' ? '🇮🇱' : '🇺🇸'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-0.5">
              מניית <span className="underline">{activeAlert.nameHe}</span> הגיעה למחיר{' '}
              <span className="font-mono-numbers font-black">{priceFmt.primary}</span> (יעד:{' '}
              {getConditionLabel(activeAlert.condition)} {targetFmt.primary})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onResetStockAlert(activeAlert.stockId);
              onDismiss();
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-950 text-white hover:bg-slate-900 transition whitespace-nowrap shadow-sm"
          >
            אפס התראה
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-950/80 hover:text-slate-950 hover:bg-slate-950/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
