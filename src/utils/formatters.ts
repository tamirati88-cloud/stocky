import { Market, AlertCondition } from '../types';

export function formatPrice(price: number, market: Market, currency: 'ILS' | 'USD'): { primary: string; secondary?: string } {
  if (currency === 'USD') {
    return {
      primary: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }

  // TASE (ILS / Agorot)
  // In Israeli market, equities are traded in Agorot (1 ILS = 100 Agorot)
  // e.g. 4,120 אג' = 41.20 ₪
  if (price >= 1000) {
    const agorotStr = `${Math.round(price).toLocaleString('he-IL')} אג׳`;
    const ilsStr = `${(price / 100).toFixed(2)} ₪`;
    return {
      primary: agorotStr,
      secondary: ilsStr,
    };
  } else {
    // Already in shekels or index points
    return {
      primary: `${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`,
    };
  }
}

export function formatChangePercent(percent: number): string {
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

export function formatChangeValue(change: number, currency: 'ILS' | 'USD'): string {
  const sign = change > 0 ? '+' : '';
  if (currency === 'USD') {
    return `${sign}$${Math.abs(change).toFixed(2)}`;
  }
  return `${sign}${change.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getConditionLabel(condition: AlertCondition): string {
  switch (condition) {
    case 'ABOVE':
      return 'עולה מעל';
    case 'BELOW':
      return 'יורד מתחת ל';
    case 'PERCENT_UP':
      return 'עלייה יומית מעל';
    case 'PERCENT_DOWN':
      return 'ירידה יומית מעל';
  }
}

export function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return dateStr;
  }
}
