// Utility to fetch Word of the Day from Merriam-Webster using CORS proxy

export interface WordOfTheDay {
  word: string;
  pronunciation: string;
  type: string;
  definition: string;
}

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

// Fetch Word of the Day data using CORS proxy
export async function fetchWordOfTheDay(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Starting fetch...');
  try {
    // Use CORS proxy to fetch the page
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const targetUrl = encodeURIComponent('https://www.merriam-webster.com/word-of-the-day/');
    console.log('[WordOfTheDay] Fetching from proxy:', proxyUrl + targetUrl);
    
    const response = await fetch(proxyUrl + targetUrl);
    console.log('[WordOfTheDay] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[WordOfTheDay] Got JSON response');
    const html = data.contents;
    console.log('[WordOfTheDay] HTML length:', html?.length);

    // Extract word
    const wordMatch = html.match(/<title>Word of the Day: (.+?) \| Merriam-Webster<\/title>/);
    if (!wordMatch) {
      console.error('[WordOfTheDay] Could not parse word from HTML');
      throw new Error('Could not parse word');
    }
    const word = wordMatch[1];
    console.log('[WordOfTheDay] Parsed word:', word);

    // Extract pronunciation
    const pronunciationParts = html.split('<span class="word-syllables">');
    if (pronunciationParts.length < 3) {
      console.error('[WordOfTheDay] Could not parse pronunciation');
      throw new Error('Could not parse pronunciation');
    }
    const pronunciation = pronunciationParts[2].split('</span>')[0];
    console.log('[WordOfTheDay] Parsed pronunciation:', pronunciation);

    // Extract type (noun, verb, etc.)
    const typeMatch = html.match(/<span class="main-attr">(.+?)<\/span>/);
    if (!typeMatch) {
      console.error('[WordOfTheDay] Could not parse type');
      throw new Error('Could not parse type');
    }
    const type = typeMatch[1];
    console.log('[WordOfTheDay] Parsed type:', type);

    // Extract definition
    const defMatch = html.match(/<h2>What It Means<\/h2>\s+?<p>([\s\S]+?)<\/p>/);
    if (!defMatch) {
      console.error('[WordOfTheDay] Could not parse definition');
      throw new Error('Could not parse definition');
    }
    const definition = parseHtmlEntities(defMatch[1].replace(/<[^>]*>/g, ''));
    console.log('[WordOfTheDay] Parsed definition:', definition.substring(0, 50) + '...');

    const result = {
      word,
      pronunciation,
      type,
      definition,
    };
    console.log('[WordOfTheDay] Successfully parsed all data');
    return result;
  } catch (error) {
    console.error('[WordOfTheDay] Error fetching Word of the Day:', error);
    return null;
  }
}

// Cache management
const CACHE_KEY = 'wordOfTheDayCache';
const CACHE_DATE_KEY = 'wordOfTheDayCacheDate';

export function getCachedWord(): WordOfTheDay | null {
  try {
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
    const today = new Date().toDateString();
    
    console.log('[WordOfTheDay] Cache check - Cached date:', cachedDate, 'Today:', today);
    
    if (cachedDate === today) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        console.log('[WordOfTheDay] Using cached word from today');
        return JSON.parse(cached);
      }
    } else {
      console.log('[WordOfTheDay] Cache expired or not found, will fetch new word');
    }
  } catch (error) {
    console.error('[WordOfTheDay] Error reading cached word:', error);
  }
  return null;
}

export function cacheWord(word: WordOfTheDay): void {
  try {
    const today = new Date().toDateString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(word));
    localStorage.setItem(CACHE_DATE_KEY, today);
    console.log('[WordOfTheDay] Cached word for date:', today);
  } catch (error) {
    console.error('[WordOfTheDay] Error caching word:', error);
  }
}
