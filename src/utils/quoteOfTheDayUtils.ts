// Utility to fetch Quote of the Day from BrainyQuote

export interface QuoteOfTheDay {
  quote: string;
  author: string;
  link: string;
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

// Fetch Quote of the Day data using CORS proxy with fallback
export async function fetchQuoteOfTheDay(type: QuoteType = 'normal'): Promise<QuoteOfTheDay | null> {
  console.log('[QuoteOfTheDay] Starting fetch with type:', type);
  
  // Try multiple CORS proxies in order
  const proxies = [
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
  ];
  
  for (let i = 0; i < proxies.length; i++) {
    try {
      const proxyUrl = proxies[i];
      const targetUrl = encodeURIComponent('https://www.brainyquote.com/quote_of_the_day');
      const fetchUrl = proxyUrl + targetUrl;
      console.log(`[QuoteOfTheDay] Attempt ${i + 1}/${proxies.length} - Fetching from proxy:`, proxyUrl);
      
      const response = await fetch(fetchUrl);
      console.log('[QuoteOfTheDay] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Different proxies return different formats
      let html: string;
      if (proxyUrl.includes('allorigins')) {
        const data = await response.json();
        html = data.contents;
      } else if (proxyUrl.includes('codetabs')) {
        html = await response.text();
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

// Cache management
export function getCachedQuote(quoteType: QuoteType = 'normal'): QuoteOfTheDay | null {
  try {
    const CACHE_KEY = `quoteOfTheDayCache_${quoteType}`;
    const CACHE_DATE_KEY = `quoteOfTheDayCacheDate_${quoteType}`;
    
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
    const today = new Date().toDateString();
    
    console.log(`[QuoteOfTheDay] Cache check for ${quoteType} - Cached date:`, cachedDate, 'Today:', today);
    
    if (cachedDate === today) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        console.log(`[QuoteOfTheDay] Using cached ${quoteType} quote from today`);
        return JSON.parse(cached);
      }
    } else {
      console.log(`[QuoteOfTheDay] Cache expired or not found for ${quoteType}, will fetch new quote`);
    }
  } catch (error) {
    console.error('[QuoteOfTheDay] Error reading cached quote:', error);
  }
  return null;
}

export function cacheQuote(quote: QuoteOfTheDay, quoteType: QuoteType = 'normal'): void {
  try {
    const CACHE_KEY = `quoteOfTheDayCache_${quoteType}`;
    const CACHE_DATE_KEY = `quoteOfTheDayCacheDate_${quoteType}`;
    
    const today = new Date().toDateString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(quote));
    localStorage.setItem(CACHE_DATE_KEY, today);
    console.log(`[QuoteOfTheDay] Cached ${quoteType} quote for date:`, today);
  } catch (error) {
    console.error('[QuoteOfTheDay] Error caching quote:', error);
  }
}
