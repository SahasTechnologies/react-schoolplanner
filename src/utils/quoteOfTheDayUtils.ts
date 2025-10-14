// Utility to fetch Quote of the Day from BrainyQuote, RandomQuotes API, or Baulko Bell Times

export interface QuoteOfTheDay {
  quote: string;
  author: string;
  link: string;
  source?: 'brainyquote' | 'random-quotes-api' | 'baulko-bell-times';
}

// Quote types mapping
// Note: BrainyQuote shows quotes in this order:
// Index 0: Yesterday's "Quote of the Day" 
// Index 1: Today's main quote (what we want)
// Index 2+: Other category quotes (love, art, nature, funny)
const quoteTypes = {
  normal: 0,  // Today's main quote (first in the list after yesterday's)
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
async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = QUOTE_FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Fetch Quote of the Day data using CORS proxy with fallback
export async function fetchQuoteOfTheDay(type: QuoteType = 'normal'): Promise<QuoteOfTheDay | null> {
  console.log('[QuoteOfTheDay] Starting fetch with type:', type);
  
  // Try multiple CORS proxies in order (most reliable first). Support both param- and path-style proxies.
  const proxies: { prefix: string; mode: 'param' | 'path' | 'json' }[] = [
    // Param-style (prefer raw passthroughs first)
    { prefix: 'https://corsproxy.io/?', mode: 'param' },
    { prefix: 'https://api.codetabs.com/v1/proxy?quest=', mode: 'param' },
    { prefix: 'https://api.allorigins.win/raw?url=', mode: 'param' },
    { prefix: 'https://api.allorigins.win/get?url=', mode: 'json' },
    { prefix: 'https://api.allorigins.workers.dev/raw?url=', mode: 'param' },
    { prefix: 'https://api.allorigins.workers.dev/get?url=', mode: 'json' },
    { prefix: 'https://allorigins.deno.dev/raw?url=', mode: 'param' },
    { prefix: 'https://allorigins.deno.dev/get?url=', mode: 'json' },
    { prefix: 'https://bird.ioliu.cn/v1?url=', mode: 'param' },
    { prefix: 'https://proxy.techzbots1.workers.dev/?u=', mode: 'param' },

    // Path-style
    { prefix: 'https://cors.isomorphic-git.org/', mode: 'path' },
    { prefix: 'https://cors-anywhere.herokuapp.com/', mode: 'path' },
    { prefix: 'https://cors.eu.org/', mode: 'path' },
    { prefix: 'https://thingproxy.freeboard.io/fetch/', mode: 'path' },
  ];
  
  for (let i = 0; i < proxies.length; i++) {
    try {
      const { prefix, mode } = proxies[i];
      const targetUrlRaw = 'https://www.brainyquote.com/quote_of_the_day';
      const targetUrlEnc = encodeURIComponent(targetUrlRaw);
      const fetchUrl = mode === 'path' ? (prefix + targetUrlRaw) : (prefix + targetUrlEnc);
      console.log(`[QuoteOfTheDay] Attempt ${i + 1}/${proxies.length} - Fetching from proxy:`, prefix, '(' + mode + ')');

      const response = await fetchWithTimeout(fetchUrl);
      console.log('[QuoteOfTheDay] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Different proxies return different formats
      let html: string;
      if (mode === 'json') {
        // AllOrigins GET returns a JSON object with a `contents` field
        try {
          const data = await response.json();
          html = (data && data.contents) ? String(data.contents) : '';
        } catch (_e) {
          // Fallback to text if JSON parse fails
          html = await response.text();
        }
      } else {
        html = await response.text();
      }
      
      console.log('[QuoteOfTheDay] Got response, HTML length:', html?.length);
      
      // Check if we got a Cloudflare challenge page
      if (html.includes('Just a moment') || html.includes('cf-browser-verification')) {
        console.warn('[QuoteOfTheDay] Got Cloudflare challenge page, trying next proxy');
        throw new Error('Cloudflare challenge detected');
      }

    // Extract all quotes
    const quotesMatch = html.match(/<h2 class="qotd-h2">[\s\S]+?<\/a>\n<\/div>/g);
    if (!quotesMatch || quotesMatch.length === 0) {
      console.error('[QuoteOfTheDay] Could not parse quotes from HTML');
      console.log('[QuoteOfTheDay] HTML sample:', html.substring(0, 500));
      throw new Error('Could not parse quotes');
    }
    console.log('[QuoteOfTheDay] Found', quotesMatch.length, 'quotes');
    
    // Log all quotes to see which is which
    quotesMatch.forEach((q, idx) => {
      const previewMatch = q.match(/>([\s\S]{0,50})/);
      console.log(`[QuoteOfTheDay] Quote ${idx}:`, previewMatch ? previewMatch[1].substring(0, 50) : 'N/A');
    });

    // BrainyQuote structure: First quote in HTML is usually today's featured quote
    // We want index 0 for 'normal' type (today's main quote)
    let qNumber = quoteTypes[type] || 0;
    if (qNumber >= quotesMatch.length) {
      console.error('[QuoteOfTheDay] Quote index out of bounds, using index 0');
      qNumber = 0;
      console.log('[QuoteOfTheDay] Using fallback quote at index 0');
    }
    const selectedQuoteHtml = quotesMatch[qNumber];
    console.log('[QuoteOfTheDay] Selected quote index:', qNumber);
    console.log('[QuoteOfTheDay] Selected quote HTML sample:', selectedQuoteHtml.substring(0, 200));

    // Extract link
    const linkMatch = selectedQuoteHtml.match(/href="(.+?)"/);
    if (!linkMatch) {
      console.error('[QuoteOfTheDay] Could not parse link');
      throw new Error('Could not parse link');
    }
    const link = 'https://www.brainyquote.com' + linkMatch[1];
    console.log('[QuoteOfTheDay] Parsed link:', link);

    // Extract quote text
    const quoteMatch = selectedQuoteHtml.match(/space-between">\n([\s\S]+?)\n<img/);
    if (!quoteMatch) {
      console.error('[QuoteOfTheDay] Could not parse quote text');
      throw new Error('Could not parse quote text');
    }
    const quote = parseHtmlEntities(quoteMatch[1]);
    console.log('[QuoteOfTheDay] Parsed quote:', quote.substring(0, 50) + '...');

    // Extract author
    const authorMatch = selectedQuoteHtml.match(/title="view author">(.+?)<\/a>/);
    if (!authorMatch) {
      console.error('[QuoteOfTheDay] Could not parse author');
      throw new Error('Could not parse author');
    }
    const author = parseHtmlEntities(authorMatch[1]);
    console.log('[QuoteOfTheDay] Parsed author:', author);

      const result = {
        quote,
        author,
        link,
        source: 'brainyquote' as const,
      };
      console.log('[QuoteOfTheDay] Successfully parsed all data with proxy', i + 1);
      return result;
    } catch (error) {
      console.error(`[QuoteOfTheDay] Proxy ${i + 1} failed:`, error);
      if (i === proxies.length - 1) {
        console.error('[QuoteOfTheDay] All proxies failed');
        return null;
      }
      // Continue to next proxy
      console.log('[QuoteOfTheDay] Trying next proxy...');
    }
  }
  
  return null;
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

// Fetch from RandomQuotes API
export async function fetchRandomQuotesApiQuote(): Promise<QuoteOfTheDay | null> {
  console.log('[RandomQuotesAPI] Fetching random quote...');
  try {
    const response = await fetch('https://random-quotes-freeapi.vercel.app/api/random');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[RandomQuotesAPI] Received data:', data);

    if (!data.quote || !data.author) {
      throw new Error('Invalid response format');
    }

    const result: QuoteOfTheDay = {
      quote: data.quote,
      author: data.author,
      link: 'https://random-quotes-freeapi.vercel.app/',
      source: 'random-quotes-api',
    };

    console.log('[RandomQuotesAPI] Successfully fetched quote');
    return result;
  } catch (error) {
    console.error('[RandomQuotesAPI] Failed to fetch:', error);
    return null;
  }
}

// Cache management for RandomQuotes API
export function getCachedRandomQuotesQuote(): QuoteOfTheDay | null {
  try {
    const refreshMode = localStorage.getItem('randomQuotesRefreshMode') || 'daily';

    if (refreshMode === 'reload') {
      // Always return null to force refresh on every reload
      console.log('[RandomQuotesAPI] Refresh mode is "reload", skipping cache');
      return null;
    }

    // Daily mode: check if cache is from today
    const cached = localStorage.getItem('randomQuoteCache');
    const cachedDate = localStorage.getItem('randomQuoteCacheDate');
    const today = new Date().toDateString();

    if (cached && cachedDate === today) {
      console.log('[RandomQuotesAPI] Using cached quote from today');
      return JSON.parse(cached);
    }

    console.log('[RandomQuotesAPI] No valid cache found');
    return null;
  } catch (error) {
    console.error('[RandomQuotesAPI] Error reading cache:', error);
    return null;
  }
}

export function cacheRandomQuotesQuote(quote: QuoteOfTheDay): void {
  try {
    const today = new Date().toDateString();
    localStorage.setItem('randomQuoteCache', JSON.stringify(quote));
    localStorage.setItem('randomQuoteCacheDate', today);
    console.log('[RandomQuotesAPI] Cached quote for date:', today);
  } catch (error) {
    console.error('[RandomQuotesAPI] Error caching quote:', error);
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
