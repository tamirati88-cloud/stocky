export interface YahooQuoteData {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  currency: string;
  history: number[];
  timestamp: number;
}

export interface YahooBatchResponse {
  success: boolean;
  count: number;
  quotes: Record<string, YahooQuoteData>;
  updatedAt: string;
}

/**
 * Fetch quotes for multiple symbols from our Yahoo Finance backend proxy
 */
export async function fetchYahooQuotes(symbols: string[]): Promise<Record<string, YahooQuoteData>> {
  if (symbols.length === 0) return {};

  try {
    const encodedSymbols = encodeURIComponent(symbols.join(','));
    const response = await fetch(`/api/yahoo/quotes?symbols=${encodedSymbols}`);
    
    if (!response.ok) {
      console.warn(`Yahoo quotes fetch failed with status ${response.status}`);
      return {};
    }

    const data: YahooBatchResponse = await response.json();
    return data.quotes || {};
  } catch (err) {
    console.error('Failed to fetch Yahoo Finance quotes:', err);
    return {};
  }
}

/**
 * Fetch single quote from Yahoo Finance backend proxy
 */
export async function fetchSingleYahooQuote(symbol: string): Promise<YahooQuoteData | null> {
  try {
    const response = await fetch(`/api/yahoo/quote/${encodeURIComponent(symbol)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.quote || null;
  } catch (err) {
    console.error(`Failed to fetch Yahoo Finance quote for ${symbol}:`, err);
    return null;
  }
}
