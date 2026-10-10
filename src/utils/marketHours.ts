export interface MarketStatusInfo {
  isOpen: boolean;
  statusText: string;
  nextEventText: string;
  tradingHours: string;
}

export function getMarketStatus(market: 'TASE' | 'US'): MarketStatusInfo {
  const now = new Date();
  
  if (market === 'TASE') {
    // Israeli time is typically UTC+2 or UTC+3
    // Use Intl to get Israel hours
    const ilParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jerusalem',
      hour12: false,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(now);

    const weekday = ilParts.find(p => p.type === 'weekday')?.value || '';
    const hour = parseInt(ilParts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(ilParts.find(p => p.type === 'minute')?.value || '0', 10);
    const currentMins = hour * 60 + minute;

    // TASE trades Sun (Sun), Mon (Mon), Tue (Tue), Wed (Wed), Thu (Thu)
    const isTaseDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(weekday);
    const openMins = 9 * 60 + 30; // 09:30
    const closeMins = 17 * 60 + 25; // 17:25

    const isOpen = isTaseDay && currentMins >= openMins && currentMins <= closeMins;

    return {
      isOpen,
      statusText: isOpen ? 'פתוחה למסחר' : 'סגורה כעת',
      nextEventText: isOpen ? 'נעילה ב-17:25' : 'פתיחה הבאה: א׳-ה׳ 09:30',
      tradingHours: 'א׳-ה׳ 09:30 - 17:25',
    };
  } else {
    // US Markets (NYSE / NASDAQ)
    const usParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(now);

    const weekday = usParts.find(p => p.type === 'weekday')?.value || '';
    const hour = parseInt(usParts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(usParts.find(p => p.type === 'minute')?.value || '0', 10);
    const currentMins = hour * 60 + minute;

    // US trades Mon through Fri
    const isUsDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday);
    const openMins = 9 * 60 + 30; // 09:30 EST
    const closeMins = 16 * 60; // 16:00 EST

    const isOpen = isUsDay && currentMins >= openMins && currentMins <= closeMins;

    return {
      isOpen,
      statusText: isOpen ? 'פתוחה למסחר' : 'סגורה כעת',
      nextEventText: isOpen ? 'נעילה ב-16:00 (23:00 בישראל)' : 'פתיחה הבאה: ב׳-ו׳ 16:30 (שעון ישראל)',
      tradingHours: 'ב׳-ו׳ 16:30 - 23:00 (שעון ישראל)',
    };
  }
}
