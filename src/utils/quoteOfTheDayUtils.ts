// Utility to fetch Quote of the Day from BrainyQuote, Favqs, ZenQuotes, or Baulko Bell Times
import { fetchTextViaCors, fetchJsonViaCors } from './corsProxy';

export interface QuoteOfTheDay {
  quote: string;
  author: string;
  link: string;
  source?: 'brainyquote' | 'favqs' | 'zenquotes' | 'baulko-bell-times';
}


const quoteTypes = {
  normal: 0,
  love: 1,
  art: 2,
  nature: 3,
  funny: 4,
};

export type QuoteType = keyof typeof quoteTypes;

// Parse HTML entities
function parseHtmlEntities(str: string): string {
  return str
    .replace(/&#([0-9]{1,4});/g, (_match, numStr) => {
      const num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Timeout-enabled fetch to avoid long hangs per proxy
const QUOTE_FETCH_TIMEOUT_MS = 6000;

// Fetch Quote of the Day data using CORS proxy with fallback
export async function fetchQuoteOfTheDay(type: QuoteType = 'normal'): Promise<QuoteOfTheDay | null> {
  console.log('[QuoteOfTheDay] Starting fetch with type:', type);
  try {
    const html = await fetchTextViaCors('https://www.brainyquote.com/quote_of_the_day', {}, QUOTE_FETCH_TIMEOUT_MS);
    console.log('[QuoteOfTheDay] Got response, HTML length:', html?.length);

    // Check for Cloudflare challenge pages
    if (html.includes('Just a moment') || html.includes('cf-browser-verification')) {
      throw new Error('Cloudflare challenge detected');
    }

    // Extract all quotes
    const quotesMatch = html.match(/<h2 class="qotd-h2">[\s\S]+?<\/a>\n<\/div>/g);
    if (!quotesMatch || quotesMatch.length === 0) {
      console.error('[QuoteOfTheDay] Could not parse quotes from HTML');
      console.log('[QuoteOfTheDay] HTML sample:', html.substring(0, 500));
      return null;
    }
    console.log('[QuoteOfTheDay] Found', quotesMatch.length, 'quotes');

    // Decide which quote to use
    let qNumber = quoteTypes[type] || 0;
    if (qNumber >= quotesMatch.length) qNumber = 0;
    const selectedQuoteHtml = quotesMatch[qNumber];

    // Extract link
    const linkMatch = selectedQuoteHtml.match(/href=\"(.+?)\"/);
    if (!linkMatch) return null;
    const link = 'https://www.brainyquote.com' + linkMatch[1];

    // Extract quote text
    const quoteMatch = selectedQuoteHtml.match(/space-between\">\n([\s\S]+?)\n<img/);
    if (!quoteMatch) return null;
    const quote = parseHtmlEntities(quoteMatch[1]);

    // Extract author
    const authorMatch = selectedQuoteHtml.match(/title=\"view author\">(.+?)<\/a>/);
    if (!authorMatch) return null;
    const author = parseHtmlEntities(authorMatch[1]);

    return { quote, author, link, source: 'brainyquote' };
  } catch (error) {
    console.error('[QuoteOfTheDay] Failed to fetch via CORS helper:', error);
    return null;
  }
}

// Cache management - Cache never expires, always returns cached quote if available
export function getCachedQuote(quoteType: QuoteType = 'normal'): QuoteOfTheDay | null {
  try {
    const CACHE_KEY = `quoteOfTheDayCache_${quoteType}`;
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      console.log(`[QuoteOfTheDay] Using cached ${quoteType} quote (no expiration)`);
      return JSON.parse(cached);
    }
    
    console.log(`[QuoteOfTheDay] No cached quote found for ${quoteType}`);
  } catch (error) {
    console.error('[QuoteOfTheDay] Error reading cached quote:', error);
  }
  return null;
}

export function cacheQuote(quote: QuoteOfTheDay, quoteType: QuoteType = 'normal'): void {
  try {
    const CACHE_KEY = `quoteOfTheDayCache_${quoteType}`;
    localStorage.setItem(CACHE_KEY, JSON.stringify(quote));
    console.log(`[QuoteOfTheDay] Cached ${quoteType} quote (permanent)`);
  } catch (error) {
    console.error('[QuoteOfTheDay] Error caching quote:', error);
  }
}

// Clear quote cache (for a single type or all BrainyQuote types)
export function clearQuoteCache(quoteType?: QuoteType): void {
  try {
    const types: QuoteType[] = quoteType ? [quoteType] : ['normal', 'love', 'art', 'nature', 'funny'];
    types.forEach((t) => {
      localStorage.removeItem(`quoteOfTheDayCache_${t}`);
    });
    console.log('[QuoteOfTheDay] Cleared quote cache for types:', types.join(', '));
  } catch (error) {
    console.error('[QuoteOfTheDay] Error clearing quote cache:', error);
  }
}

// Favqs QOTD
export async function fetchFavqsQuote(): Promise<QuoteOfTheDay | null> {
  try {
    const data = await fetchJsonViaCors<any>('https://favqs.com/api/qotd');
    const q = data?.quote;
    if (!q?.body || !q?.author) return null;
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
  try {
    const arr = await fetchJsonViaCors<any[]>('https://zenquotes.io/api/today');
    const first = Array.isArray(arr) ? arr[0] : null;
    if (!first?.q || !first?.a) return null;
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
