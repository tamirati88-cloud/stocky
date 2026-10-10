import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Cache in memory for 10 seconds to avoid hitting Yahoo too frequently
interface CachedQuote {
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
  cachedAt: number;
  yahooUrl?: string;
  investingUrl?: string;
}

const quoteCache = new Map<string, CachedQuote>();
const CACHE_TTL_MS = 10_000; // 10 seconds cache

/**
 * Generate external research links for Yahoo Finance and Investing.com
 */
function getExternalLinks(symbol: string) {
  const clean = symbol.trim().toUpperCase();
  const isIsraeli = clean.endsWith('.TA');
  const baseSymbol = clean.replace('.TA', '');

  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(clean)}`;
  const investingUrl = isIsraeli
    ? `https://il.investing.com/search/?q=${encodeURIComponent(baseSymbol)}`
    : `https://www.investing.com/search/?q=${encodeURIComponent(baseSymbol)}`;

  return { yahooUrl, investingUrl };
}

/**
 * Fetch quote and intraday history from Yahoo Finance, with Israeli .TA fallback
 */
async function fetchYahooQuote(symbol: string): Promise<CachedQuote | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  const cached = quoteCache.get(cleanSymbol);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  // Try direct symbol first
  let quote = await tryFetchSingleSymbol(cleanSymbol);

  // If not found and doesn't have a dot, try appending .TA (for Israeli stocks)
  if (!quote && !cleanSymbol.includes('.')) {
    quote = await tryFetchSingleSymbol(`${cleanSymbol}.TA`);
  }

  if (quote) {
    quoteCache.set(cleanSymbol, quote);
    // Also cache under the symbol with .TA or without
    if (cleanSymbol.endsWith('.TA')) {
      quoteCache.set(cleanSymbol.replace('.TA', ''), quote);
    }
  }

  return quote;
}

async function tryFetchSingleSymbol(sym: string): Promise<CachedQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=15m&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // If 1d range fails, fallback to 5d
      const fallbackUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!fallbackRes.ok) return null;
      const fbData = await fallbackRes.json();
      return parseYahooResponse(sym, fbData);
    }

    const data = await response.json();
    return parseYahooResponse(sym, data);
  } catch (err) {
    console.error(`Error fetching quote for ${sym}:`, err);
    return null;
  }
}

function parseYahooResponse(symbol: string, data: any): CachedQuote | null {
  try {
    const result = data?.chart?.result?.[0];
    if (!result || !result.meta) return null;

    const meta = result.meta;
    const price = Number(meta.regularMarketPrice ?? 0);
    const prevClose = Number(meta.chartPreviousClose ?? meta.previousClose ?? price);
    const change = Number((price - prevClose).toFixed(2));
    const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
    const dayHigh = Number(meta.regularMarketDayHigh ?? price);
    const dayLow = Number(meta.regularMarketDayLow ?? price);
    const currency = meta.currency || 'USD';

    // Parse intraday quotes for sparkline
    const rawQuotes = result.indicators?.quote?.[0]?.close || [];
    const history: number[] = rawQuotes
      .filter((v: any) => typeof v === 'number' && !isNaN(v) && v > 0)
      .slice(-14)
      .map((v: number) => Number(v.toFixed(2)));

    // Ensure at least 2 points in history
    if (history.length === 0) {
      history.push(prevClose, price);
    } else if (history.length === 1) {
      history.unshift(prevClose);
    }

    const { yahooUrl, investingUrl } = getExternalLinks(symbol);

    return {
      symbol,
      price,
      previousClose: prevClose,
      change,
      changePercent,
      dayHigh,
      dayLow,
      currency,
      history,
      timestamp: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
      cachedAt: Date.now(),
      yahooUrl,
      investingUrl,
    };
  } catch (err) {
    console.error(`Failed to parse Yahoo Finance response for ${symbol}:`, err);
    return null;
  }
}

// --- API Endpoints ---

// Single quote
app.get('/api/yahoo/quote/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol' });
  }

  const quote = await fetchYahooQuote(symbol);
  if (!quote) {
    return res.status(404).json({ error: `Could not fetch quote for ${symbol}` });
  }

  res.json({ success: true, quote });
});

// Multi quotes batch endpoint (e.g. /api/yahoo/quotes?symbols=AAPL,NVDA,TSLA,MSFT)
app.get('/api/yahoo/quotes', async (req: Request, res: Response) => {
  const symbolsQuery = req.query.symbols as string;
  if (!symbolsQuery) {
    return res.status(400).json({ error: 'Missing symbols query param' });
  }

  const symbols = symbolsQuery
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const results = await Promise.all(
    symbols.map(async (sym) => {
      const q = await fetchYahooQuote(sym);
      return { symbol: sym, quote: q };
    })
  );

  const quotesMap: Record<string, CachedQuote> = {};
  for (const item of results) {
    if (item.quote) {
      quotesMap[item.symbol] = item.quote;
    }
  }

  res.json({
    success: true,
    count: Object.keys(quotesMap).length,
    quotes: quotesMap,
    updatedAt: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'StockPulse Yahoo Finance Proxy' });
});

// Setup Vite or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
