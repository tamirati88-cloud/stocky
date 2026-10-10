import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { playAlertChime } from '../utils/audio';
import { requestNotificationPermission, getNotificationPermission, sendBrowserNotification } from '../utils/notifications';

interface NavbarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  unreadAlertsCount: number;
  onOpenHistory: () => void;
  isSimulating: boolean;
  onToggleSimulating: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  soundEnabled,
  onToggleSound,
  unreadAlertsCount,
  onOpenHistory,
  isSimulating,
  onToggleSimulating,
}) => {
  const [timeJerusalem, setTimeJerusalem] = useState('');
  const [timeNewYork, setTimeNewYork] = useState('');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());

    const updateClocks = () => {
      const now = new Date();
      setTimeJerusalem(
        new Intl.DateTimeFormat('he-IL', {
          timeZone: 'Asia/Jerusalem',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(now)
      );
      setTimeNewYork(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now)
      );
    };

    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      sendBrowserNotification('התראות מניות הופעלו בהצלחה', 'תקבל התראות במחשב כאשר מניה תגיע למחיר היעד שלך 📈');
    }
  };

  const handleTestSound = () => {
    playAlertChime();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold text-xl">
            📈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">StockPulse</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                Live Alerts
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              התראות מחירי מניות בזמן אמת · תל אביב וארה״ב
            </p>
          </div>
        </div>

        {/* Global Market Clocks */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono-numbers bg-slate-950/70 border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">🇮🇱 ירושלים:</span>
            <span className="text-emerald-400 font-semibold">{timeJerusalem || '--:--:--'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">🇺🇸 ניו-יורק:</span>
            <span className="text-cyan-400 font-semibold">{timeNewYork || '--:--'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Ticker simulation toggle */}
          <button
            onClick={onToggleSimulating}
            title={isSimulating ? 'עצור דגימת מחירים חיה' : 'הפעל דגימת מחירים חיה'}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              isSimulating
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">{isSimulating ? 'דגימה חיה' : 'השהה דגימה'}</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'צליל התראה פעיל (לחץ להשתקה)' : 'צליל התראה מושתק (לחץ להפעלה)'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-750'
                : 'bg-slate-800/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Test Chime Sound */}
          {soundEnabled && (
            <button
              onClick={handleTestSound}
              title="בדיקת צליל התראה"
              className="text-xs hidden lg:inline-flex items-center px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 transition"
            >
              בדוק צליל 🔔
            </button>
          )}

          {/* Notification Permission Request */}
          {notifPermission !== 'granted' && (
            <button
              onClick={handleRequestNotif}
              title="הפעל התראות קופצות בדפדפן"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">הפעל התראות דפדפן</span>
            </button>
          )}

          {/* Alert History Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline font-medium">יומן התראות</span>
            {unreadAlertsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
