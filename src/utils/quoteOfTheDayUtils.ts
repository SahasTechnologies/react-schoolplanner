// Utility to fetch Quote of the Day from Favqs, ZenQuotes, or Baulko Bell Times
import { fetchJsonViaCors } from './corsProxy';

export interface QuoteOfTheDay {
  quote: string;
  author: string;
  link: string;
  source?: 'favqs' | 'zenquotes' | 'baulko-bell-times';
}


const quoteTypes = {
  normal: 0,
  love: 1,
  art: 2,
  nature: 3,
  funny: 4,
};

export type QuoteType = keyof typeof quoteTypes;

// Timeout-enabled fetch to avoid long hangs per proxy
const QUOTE_FETCH_TIMEOUT_MS = 10000; // Increased to 10s for better reliability



// Favqs QOTD
export async function fetchFavqsQuote(): Promise<QuoteOfTheDay | null> {
  console.log('[Favqs] Fetching quote...');
  try {
    const data = await fetchJsonViaCors<{ quote?: { body?: string; author?: string; url?: string } }>('https://favqs.com/api/qotd', {}, QUOTE_FETCH_TIMEOUT_MS);
    console.log('[Favqs] Raw response:', data);
    const q = data?.quote;
    if (!q?.body || !q?.author) {
      console.error('[Favqs] Invalid response structure:', data);
      return null;
    }
    console.log('[Favqs] Successfully parsed quote');
    return {
      quote: String(q.body),
      author: String(q.author),
      link: typeof q.url === 'string' ? q.url : 'https://favqs.com/',
      source: 'favqs',
    };
  } catch (e) {
    console.error('[Favqs] Failed:', e);
    return null;
  }
}

// ZenQuotes Today
export async function fetchZenQuotesToday(): Promise<QuoteOfTheDay | null> {
  console.log('[ZenQuotes] Fetching quote...');
  try {
    const arr = await fetchJsonViaCors<Array<{ q?: string; a?: string }>>('https://zenquotes.io/api/today', {}, QUOTE_FETCH_TIMEOUT_MS);
    console.log('[ZenQuotes] Raw response:', arr);
    const first = Array.isArray(arr) ? arr[0] : null;
    if (!first?.q || !first?.a) {
      console.error('[ZenQuotes] Invalid response structure:', arr);
      return null;
    }
    console.log('[ZenQuotes] Successfully parsed quote');
    return {
      quote: String(first.q),
      author: String(first.a),
      link: 'https://zenquotes.io/',
      source: 'zenquotes',
    };
  } catch (e) {
    console.error('[ZenQuotes] Failed:', e);
    return null;
  }
}

// Fetch from Baulko Bell Times JSON
export async function fetchBaulkoQuote(): Promise<QuoteOfTheDay | null> {
  console.log('[BaulkoQuote] Fetching quote list...');
  try {
    const response = await fetch('https://baulkobelltimes.github.io/quotes.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as { quote: string; author: string }[];
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid or empty quote list');
    }

    // Select a random quote from the list
    const randomIndex = Math.floor(Math.random() * data.length);
    const selected = data[randomIndex];

    if (!selected?.quote || !selected?.author) {
      throw new Error('Quote entry missing fields');
    }

    const result: QuoteOfTheDay = {
      quote: selected.quote,
      author: selected.author,
      link: 'https://baulkobelltimes.github.io/',
      source: 'baulko-bell-times',
    };

    console.log('[BaulkoQuote] Successfully selected quote');
    return result;
  } catch (error) {
    console.error('[BaulkoQuote] Failed to fetch:', error);
    return null;
  }
}

// Cache management for Baulko quotes
export function getCachedBaulkoQuote(): QuoteOfTheDay | null {
  try {
    const refreshMode = localStorage.getItem('baulkoQuoteRefreshMode') || 'daily';

    if (refreshMode === 'reload') {
      console.log('[BaulkoQuote] Refresh mode is "reload", skipping cache');
      return null;
    }

    const cached = localStorage.getItem('baulkoQuoteCache');
    const cachedDate = localStorage.getItem('baulkoQuoteCacheDate');
    const today = new Date().toDateString();

    if (cached && cachedDate === today) {
      console.log('[BaulkoQuote] Using cached quote from today');
      return JSON.parse(cached);
    }

    console.log('[BaulkoQuote] No valid cache found');
    return null;
  } catch (error) {
    console.error('[BaulkoQuote] Error reading cache:', error);
    return null;
  }
}

export function cacheBaulkoQuote(quote: QuoteOfTheDay): void {
  try {
    const today = new Date().toDateString();
    localStorage.setItem('baulkoQuoteCache', JSON.stringify(quote));
    localStorage.setItem('baulkoQuoteCacheDate', today);
    console.log('[BaulkoQuote] Cached quote for date:', today);
  } catch (error) {
    console.error('[BaulkoQuote] Error caching quote:', error);
  }
}
