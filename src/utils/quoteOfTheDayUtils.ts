// Utility to fetch Quote of the Day from Favqs, ZenQuotes, Kwize, or the
// JakubPetriska motivational-quotes CSV.
import { fetchJsonViaCors, fetchTextViaCors } from './corsProxy';

export interface QuoteOfTheDay {
  quote: string;
  author: string;
  link: string;
  source?: 'favqs' | 'zenquotes' | 'kwize' | 'jakub-petriska';
}

// Timeout-enabled fetch to avoid long hangs per proxy
const QUOTE_FETCH_TIMEOUT_MS = 10000; // Increased to 10s for better reliability

// Cache key for daily quotes (non-JakubPetriska sources)
const DAILY_QUOTE_CACHE_KEY = 'dailyQuoteCache';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_match, numStr) => String.fromCharCode(parseInt(numStr, 10)))
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Cache management for daily quotes (Favqs, ZenQuotes, Kwize)
export function getCachedDailyQuote(): QuoteOfTheDay | null {
  try {
    const cached = localStorage.getItem(DAILY_QUOTE_CACHE_KEY);
    const cachedDate = localStorage.getItem(DAILY_QUOTE_CACHE_KEY + 'Date');
    const today = new Date().toDateString();

    if (cached && cachedDate === today) {
      console.log('[QuoteCache] Using cached quote from today');
      return JSON.parse(cached);
    } else if (cached && cachedDate !== today) {
      console.log('[QuoteCache] Cached quote is from previous day (' + cachedDate + '), fetching new one');
      clearDailyQuoteCache();
    }

    console.log('[QuoteCache] No valid cache found');
    return null;
  } catch (error) {
    console.error('[QuoteCache] Error reading cache:', error);
    return null;
  }
}

export function cacheDailyQuote(quote: QuoteOfTheDay): void {
  try {
    const today = new Date().toDateString();
    localStorage.setItem(DAILY_QUOTE_CACHE_KEY, JSON.stringify(quote));
    localStorage.setItem(DAILY_QUOTE_CACHE_KEY + 'Date', today);
    console.log('[QuoteCache] Cached quote for date:', today);
  } catch (error) {
    console.error('[QuoteCache] Error caching quote:', error);
  }
}

export function clearDailyQuoteCache(): void {
  try {
    localStorage.removeItem(DAILY_QUOTE_CACHE_KEY);
    localStorage.removeItem(DAILY_QUOTE_CACHE_KEY + 'Date');
    console.log('[QuoteCache] Cache cleared');
  } catch (error) {
    console.error('[QuoteCache] Error clearing cache:', error);
  }
}

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

// Kwize "Quote of the Day" -- Use the embed endpoint which returns clean HTML with quote text
// https://kwize.com/quote-of-the-day/embed/&txt=0 provides the quote in a parseable format
export async function fetchKwizeQuote(): Promise<QuoteOfTheDay | null> {
  console.log('[Kwize] Fetching quote from embed endpoint...');
  try {
    const html = await fetchTextViaCors('https://kwize.com/quote-of-the-day/embed/&txt=0', {}, QUOTE_FETCH_TIMEOUT_MS);

    // Parse the HTML to extract quote text
    // The embed format has: <div id="kwize_embed_quote"><a ...><span><b>&ldquo;</b> QUOTE TEXT <b>&rdquo;</b></span>...
    const quoteElementMatch = html.match(/<div id="kwize_embed_quote">([\s\S]*?)<\/div>/);
    
    if (!quoteElementMatch) {
      throw new Error('Kwize: could not find quote element');
    }
    
    const innerHtml = quoteElementMatch[1];
    
    // Extract the quote text - it's wrapped in <span> with ldquo and rdquo in <b> tags
    const quoteSpanMatch = innerHtml.match(/<span>([\s\S]*?)<\/span>/);
    if (!quoteSpanMatch) {
      throw new Error('Kwize: could not find quote span');
    }
    
    // Remove the <b> tags with ldquo/rdquo and get the text content
    let quote = quoteSpanMatch[1]
      .replace(/<b>[\s\S]*?<\/b>/g, '') // Remove the decorative curly quotes
      .trim();
    
    quote = decodeHtmlEntities(quote);
    
    if (!quote) {
      throw new Error('Kwize: empty quote text');
    }
    
    // Extract author and work info from the small spans (font-size:0.5em)
    const smallSpans = [...innerHtml.matchAll(/<span style="font-size:0\.5em;">([\s\S]*?)<\/span>/g)];
    
    let author = 'Unknown';
    let work = '';
    
    if (smallSpans.length >= 2) {
      // First small span contains the author name
      author = decodeHtmlEntities(smallSpans[0][1].trim());
      
      // Second small span contains the work title (starts with comma)
      const workText = smallSpans[1][1].trim();
      if (workText.startsWith(',')) {
        work = workText.substring(1).replace(/^\s*\i\s*/, '').replace(/\i\s*$/, '').trim();
      }
      
      // Third span might contain the year in parentheses
      if (smallSpans.length >= 3) {
        const yearText = smallSpans[2][1].trim();
        if (yearText.match(/^\(\d{4}\)$/)) {
          work = work ? `${work} (${yearText.replace(/[()]/g, '')})` : yearText.replace(/[()]/g, '');
        }
      }
    }
    
    // Build the link to the quote page
    const linkMatch = innerHtml.match(/href="([^"]+)"/);
    const link = linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://kwize.com${linkMatch[1]}`) : 'https://kwize.com/quote-of-the-day/';
    
    console.log('[Kwize] Successfully parsed quote from embed endpoint');
    return { 
      quote, 
      author, 
      link, 
      source: 'kwize',
    };
  } catch (e) {
    console.error('[Kwize] Failed:', e);
    return null;
  }
}

// JakubPetriska motivational-quotes CSV
// https://gist.github.com/JakubPetriska/060958fd744ca34f099e947cd080b540
const JAKUB_PETRISKA_CSV_URL =
  'https://gist.githubusercontent.com/JakubPetriska/060958fd744ca34f099e947cd080b540/raw/963b5a9355f04741239407320ac973a6096cd7b6/quotes.csv';

// Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas,
// escaped ("") quotes inside quoted fields, and both \n and \r\n line
// endings. Good enough for this specific well-formed dataset without
// pulling in a CSV parsing dependency.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r => r.some(c => c.trim() !== ''));
}

export async function fetchJakubPetriskaQuote(): Promise<QuoteOfTheDay | null> {
  console.log('[JakubPetriska] Fetching quote list...');
  try {
    let text: string;
    try {
      // gist.githubusercontent.com sends permissive CORS headers, so a
      // direct fetch normally works without needing a proxy at all.
      const response = await fetch(JAKUB_PETRISKA_CSV_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      text = await response.text();
    } catch (directError) {
      console.warn('[JakubPetriska] Direct fetch failed, falling back to CORS proxy chain:', directError);
      text = await fetchTextViaCors(JAKUB_PETRISKA_CSV_URL, {}, QUOTE_FETCH_TIMEOUT_MS);
    }

    const rows = parseCsv(text);
    if (!rows.length) throw new Error('Invalid or empty quote list');

    // First row is the header ("quote,author,category"); locate the
    // columns by name rather than assuming position, but fall back to
    // "first two columns" if the header ever looks different.
    const header = rows[0].map(h => h.trim().toLowerCase());
    const quoteIdx = header.indexOf('quote');
    const authorIdx = header.indexOf('author');
    const hasHeader = quoteIdx !== -1 && authorIdx !== -1;
    const qIdx = hasHeader ? quoteIdx : 0;
    const aIdx = hasHeader ? authorIdx : 1;
    const dataRows = hasHeader ? rows.slice(1) : rows;

    const candidates = dataRows.filter(r => r[qIdx]?.trim() && r[aIdx]?.trim());
    if (!candidates.length) throw new Error('No usable quotes found in CSV');

    // Select a random quote from the list
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selected = candidates[randomIndex];

    const result: QuoteOfTheDay = {
      quote: selected[qIdx].trim(),
      author: selected[aIdx].trim(),
      link: 'https://gist.github.com/JakubPetriska/060958fd744ca34f099e947cd080b540',
      source: 'jakub-petriska',
    };

    console.log('[JakubPetriska] Successfully selected quote');
    return result;
  } catch (error) {
    console.error('[JakubPetriska] Failed to fetch:', error);
    return null;
  }
}

// Cache management for JakubPetriska quotes (the CSV has thousands of
// entries and is picked client-side at random, so -- like the Baulko Bell
// Times source it replaces -- we cache the day's pick locally so the same
// quote is shown all day rather than a new random one on every reload).
export function getCachedJakubPetriskaQuote(): QuoteOfTheDay | null {
  try {
    const refreshMode = localStorage.getItem('jakubPetriskaQuoteRefreshMode') || 'daily';

    if (refreshMode === 'reload') {
      console.log('[JakubPetriska] Refresh mode is "reload", skipping cache');
      return null;
    }

    const cached = localStorage.getItem('jakubPetriskaQuoteCache');
    const cachedDate = localStorage.getItem('jakubPetriskaQuoteCacheDate');
    const today = new Date().toDateString();

    if (cached && cachedDate === today) {
      console.log('[JakubPetriska] Using cached quote from today');
      return JSON.parse(cached);
    }

    console.log('[JakubPetriska] No valid cache found');
    return null;
  } catch (error) {
    console.error('[JakubPetriska] Error reading cache:', error);
    return null;
  }
}

export function cacheJakubPetriskaQuote(quote: QuoteOfTheDay): void {
  try {
    const today = new Date().toDateString();
    localStorage.setItem('jakubPetriskaQuoteCache', JSON.stringify(quote));
    localStorage.setItem('jakubPetriskaQuoteCacheDate', today);
    console.log('[JakubPetriska] Cached quote for date:', today);
  } catch (error) {
    console.error('[JakubPetriska] Error caching quote:', error);
  }
}
