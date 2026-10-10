import React from 'react';
import { X, Trash2, Bell, CheckCircle2 } from 'lucide-react';
import { TriggeredAlertLog } from '../types';
import { formatPrice, getConditionLabel, formatTimestamp } from '../utils/formatters';

interface AlertHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TriggeredAlertLog[];
  onClearLogs: () => void;
}

export const AlertHistoryDrawer: React.FC<AlertHistoryDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">יומן התראות שהופעלו</h2>
              <p className="text-xs text-slate-400">היסטוריית מחירי יעד שנחצו</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                title="נקה היסטוריה"
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>נקה הכל</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-sm">אין עדיין התראות שהופעלו ביומן</p>
              <p className="text-xs text-slate-500">
                כאשר מניה תחצה את מחיר היעד שלך, היא תופיע כאן עם שעה ומחיר מדויקים
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => {
                const triggerFmt = formatPrice(log.triggerPrice, log.market, log.currency);
                const targetFmt = formatPrice(log.targetPrice, log.market, log.currency);

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{log.market === 'TASE' ? '🇮🇱' : '🇺🇸'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{log.symbol}</span>
                          <span className="text-xs text-slate-300 font-medium">{log.nameHe}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          תנאי: {getConditionLabel(log.condition)}{' '}
                          <span className="font-mono-numbers text-slate-300">{targetFmt.primary}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left font-mono-numbers">
                      <div className="text-sm font-bold text-emerald-400">{triggerFmt.primary}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-left">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
