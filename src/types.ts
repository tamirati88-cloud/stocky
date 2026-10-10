export type Market = 'TASE' | 'US';

export type AlertCondition = 'ABOVE' | 'BELOW' | 'PERCENT_UP' | 'PERCENT_DOWN';

export interface StockCatalogItem {
  symbol: string;
  nameHe: string;
  nameEn: string;
  market: Market;
  currency: 'ILS' | 'USD';
  currentPrice: number;
  change: number;
  changePercent: number;
  sector: string;
}

export interface MonitoredStock {
  id: string;
  symbol: string;
  nameHe: string;
  nameEn: string;
  market: Market;
  currency: 'ILS' | 'USD';
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  history: number[];
  lastTickDirection?: 'up' | 'down' | 'none';
  targetPrice: number;
  condition: AlertCondition;
  percentTarget?: number;
  isEnabled: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
  userNotes?: string;
  dataSource?: 'yahoo' | 'simulated' | 'initial';
  lastSyncedAt?: string;
  yahooUrl?: string;
  investingUrl?: string;
  createdAt: string;
}

export interface TriggeredAlertLog {
  id: string;
  stockId: string;
  symbol: string;
  nameHe: string;
  market: Market;
  condition: AlertCondition;
  targetPrice: number;
  triggerPrice: number;
  currency: 'ILS' | 'USD';
  timestamp: string;
}
