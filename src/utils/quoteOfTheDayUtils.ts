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

// Kwize "Quote of the Day" -- Kwize has no JSON API, only an HTML embed
// widget (see https://kwize.com/quote-widget/). We fetch the same page the
// widget is embedded from and parse the markup it renders, which looks like:
//
// <div id="kwize_embed"><div id="kwize_embed_quote">
//   <a href="..."><span><b>&ldquo;</b> The quote text <b>&rdquo;</b></span>
//   <span><img ...><span style="font-size:0.5em;">Author Name</span>
//   <span style="font-size:0.5em;">,&nbsp;<i>Work Title</i></span>
//   <span style="font-size:0.5em;">(Year)</span></span></a>
// </div></div>
export async function fetchKwizeQuote(): Promise<QuoteOfTheDay | null> {
  console.log('[Kwize] Fetching quote...');
  try {
    const html = await fetchTextViaCors('https://kwize.com/quote-of-the-day/', {}, QUOTE_FETCH_TIMEOUT_MS);

    const anchorMatch = html.match(/<div id="kwize_embed_quote">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!anchorMatch) throw new Error('Kwize: embed block not found');
    const rawLink = anchorMatch[1];
    const inner = anchorMatch[2];

    // The quote itself is the first *bare* <span> (no attributes) -- the
    // author/work/year spans that follow it all carry a style attribute,
    // so this pattern only ever matches the quote.
    const quoteMatch = inner.match(/<span>([\s\S]*?)<\/span>/);
    if (!quoteMatch) throw new Error('Kwize: quote span not found');
    const quote = decodeHtmlEntities(
      quoteMatch[1]
        .replace(/<b>[\s\S]*?<\/b>/g, '') // strip the decorative curly-quote marks
        .replace(/<[^>]*>/g, '')
        .trim()
    );
    if (!quote) throw new Error('Kwize: empty quote text');

    // The author is the first of the small (font-size:0.5em) spans; the
    // ones after it hold the work title and year.
    const smallSpans = [...inner.matchAll(/<span style="font-size:0\.5em;">([\s\S]*?)<\/span>/g)];
    if (!smallSpans.length) throw new Error('Kwize: author span not found');
    const author = decodeHtmlEntities(smallSpans[0][1].replace(/<[^>]*>/g, '').trim());
    if (!author) throw new Error('Kwize: empty author');

    const link = rawLink.startsWith('http') ? rawLink : `https://kwize.com${rawLink}`;

    console.log('[Kwize] Successfully parsed quote');
    return { quote, author, link, source: 'kwize' };
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
