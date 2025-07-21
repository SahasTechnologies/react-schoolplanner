// Utility to get the correct Quote of the Day iframe URL based on theme
import { ThemeKey } from './themeUtils';

// Remove all theme-based URLs and getQuoteOfTheDayUrl

export const KWIZE_QUOTE_URL = 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=231616';

export function extractQuoteFromHtml(html: string): string | null {
  // Extract the quote and author from the new Kwize HTML structure
  const divMatch = html.match(/<div id="kwize_embed_quote">([\s\S]*?)<\/div>/i);
  if (divMatch) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = divMatch[1];
    // The first <span> inside the <a> contains the quote
    const a = tempDiv.querySelector('a');
    if (a) {
      const spans = a.querySelectorAll('span');
      if (spans.length > 0) {
        // Get the quote text (remove &ldquo; and &rdquo;)
        let quote = spans[0].textContent?.replace(/[“”\"]/g, '').trim() || '';
        // Optionally, get the author
        if (spans.length > 1) {
          const author = spans[1].textContent?.trim() || '';
          quote += author ? ` — ${author}` : '';
        }
        return quote;
      }
    }
  }
  return null;
}

// Quote cache utilities
const QUOTE_CACHE_KEY = 'quoteOfTheDayCache';
const QUOTE_CACHE_EXPIRY_HOURS = 12;

// New cache structure: { [url]: { html, text, url, timestamp } }

type QuoteCacheMap = Record<string, { html: string; text: string; url: string; timestamp: number }>;

export function getCachedQuote(url: string): { html: string; text: string; url: string; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(QUOTE_CACHE_KEY);
    if (raw) {
      const cacheMap: QuoteCacheMap = JSON.parse(raw);
      const cache = cacheMap[url];
      if (cache && isQuoteCacheValid(cache)) {
        return cache;
      }
    }
  } catch {}
  return null;
}

export function setCachedQuote(url: string, html: string, text: string) {
  let cacheMap: QuoteCacheMap = {};
  try {
    const raw = localStorage.getItem(QUOTE_CACHE_KEY);
    if (raw) {
      cacheMap = JSON.parse(raw);
    }
  } catch {}
  cacheMap[url] = { html, text, url, timestamp: Date.now() };
  localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(cacheMap));
}

export function isQuoteCacheValid(cache: { html: string; text: string; url: string; timestamp: number } | null) {
  if (!cache) return false;
  const now = Date.now();
  const expiry = QUOTE_CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
  return now - cache.timestamp < expiry;
} 