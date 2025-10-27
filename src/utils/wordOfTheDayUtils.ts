// Utility to fetch Word of the Day from Vocabulary.com using centralized CORS helper
// Fallback sources: Merriam-Webster and Dictionary.com
// Based on parsing logic from Normal-Tangerine8609/Scriptable-Widgets
import { fetchTextViaCors } from './corsProxy';
import { XMLParser } from 'fast-xml-parser';

export interface WordOfTheDay {
  word: string;
  pronunciation: string;
  type: string;
  definition: string;
  source: 'vocabulary' | 'dictionary' | 'worddaily' | 'merriam-webster' | 'britannica' | 'wordsmith';
}

// HTML fallback for Merriam-Webster
async function fetchFromMerriamWebster(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Trying Merriam-Webster (HTML)...');
  try {
    const html = await fetchHtmlWithProxies('https://www.merriam-webster.com/word-of-the-day');
    // Word
    const wordMatch = html.match(/<title>Word of the Day: (.+?) \| Merriam-Webster<\/title>/);
    if (!wordMatch) throw new Error('MW HTML: word not found');
    const word = wordMatch[1];
    // Pronunciation
    let pronunciation = word;
    const mPron = html.match(/<span class="word-syllables">([\s\S]*?)<\/span>/);
    if (mPron) {
      const raw = mPron[1].replace(/<[^>]*>/g, '').trim();
      pronunciation = sanitizePronunciation(raw, word);
    }
    // Type
    let type = 'word';
    const typeMatch = html.match(/<span class="main-attr">(.+?)<\/span>/);
    if (typeMatch) type = typeMatch[1];
    // Definition
    let definition = 'Visit Merriam-Webster to see the full definition.';
    const defMatch = html.match(/<h2>What It Means<\/h2>\s+?<p>([\s\S]+?)<\/p>/);
    if (defMatch) definition = parseHtmlEntities(defMatch[1].replace(/<[^>]*>/g, ''));
    return { word, pronunciation, type, definition, source: 'merriam-webster' };
  } catch (e) {
    console.error('[WordOfTheDay] Merriam-Webster HTML failed:', e);
    return null;
  }
}

// Dictionary.com
async function fetchFromDictionaryCom(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Trying Dictionary.com...');
  try {
    const html = await fetchHtmlWithProxies('https://www.dictionary.com/e/word-of-the-day/');
    // Word
    const titleMatch = html.match(/<title>Word of the Day - ([^|]+) \| Dictionary\.com<\/title>/);
    if (!titleMatch) throw new Error('Dict.com: word not found');
    const word = titleMatch[1].trim();
    // Pronunciation
    let pronunciation = word;
    const pronMatch = html.match(/<span class="otd-item-headword__pronunciation__text">\s*\[\s*([^\]]+)\]\s*<\/span>/);
    if (pronMatch) pronunciation = sanitizePronunciation(pronMatch[1].replace(/<[^>]*>/g, '').trim(), word);
    // Type
    let type = 'word';
    const tMatch = html.match(/<span class="italic">\s*([^<]+?)\s*<\/span>\s*<\/p>\s*<p>/);
    if (tMatch) type = tMatch[1].trim();
    // Definition
    let definition = 'Visit Dictionary.com to see the full definition.';
    const dMatch = html.match(/<span class="italic">\s*[^<]+?\s*<\/span>\s*<\/p>\s*<p>([^<]+)<\/p>/);
    if (dMatch) definition = parseHtmlEntities(dMatch[1].trim());
    return { word, pronunciation, type, definition, source: 'dictionary' };
  } catch (e) {
    console.error('[WordOfTheDay] Dictionary.com failed:', e);
    return null;
  }
}
// Multi-proxy HTML fetch using centralized helper with timeout
const WORD_FETCH_TIMEOUT_MS = 8000;
async function fetchHtmlWithProxies(targetUrl: string): Promise<string> {
  // The centralized helper cycles proxies and remembers last-good per host
  const text = await fetchTextViaCors(targetUrl, {}, WORD_FETCH_TIMEOUT_MS);
  if (text.includes('Just a moment') || text.includes('cf-browser-verification')) {
    throw new Error('Cloudflare challenge detected');
  }
  return text;
}

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

// Guard against Cloudflare/report JSON leaking into pronunciation
function sanitizePronunciation(pron: string, word: string): string {
  const p = (pron || '').trim();
  if (!p) return word;
  // Reject long or suspicious content
  if (p.length > 40) return word;
  if (/https?:\/\//i.test(p)) return word;
  if (/[{}"<>\n]/.test(p)) return word;
  return p;
}

// Fetch from Vocabulary.com (PRIMARY SOURCE)
async function fetchFromVocabularyCom(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Trying Vocabulary.com...');
  try {
    const html = await fetchHtmlWithProxies('https://www.vocabulary.com/word-of-the-day/');
    console.log('[WordOfTheDay] Vocab.com HTML length:', html?.length);

    // Extract word from title or link
    let word = '';
    const titleMatch = html.match(/<title>Word of the day: ([^|]+) \| Vocabulary\.com<\/title>/);
    if (titleMatch) {
      word = titleMatch[1].trim();
    } else {
      const linkMatch = html.match(/<a[^>]*class="word-of-the-day"[^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        word = linkMatch[1].trim();
      } else {
        throw new Error('Could not parse word from Vocabulary.com');
      }
    }
    console.log('[WordOfTheDay] Parsed word:', word);

    // Pronunciation - Vocabulary.com doesn't show it in HTML, use word as fallback
    const pronunciation = word;
    console.log('[WordOfTheDay] Using word as pronunciation');

    // Type - extract from usage or default to "word"
    const type = 'word';
    console.log('[WordOfTheDay] Type:', type);

    // Extract definition from short usage paragraph
    let definition = '';
    const usageMatch = html.match(/<p class="txt-wod-usage">\s*([\s\S]+?)\s*<\/p>/);
    if (usageMatch) {
      // Remove HTML tags and clean up
      definition = parseHtmlEntities(usageMatch[1].replace(/<[^>]*>/g, '').trim());
    } else {
      // Try the longer description if short usage not found
      const descMatch = html.match(/<p class="txt-wod-desc">\s*([\s\S]+?)\s*<\/p>/);
      if (descMatch) {
        definition = parseHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim());
        // Limit to first sentence if too long
        const firstSentence = definition.match(/^[^.!?]+[.!?]/);
        if (firstSentence) {
          definition = firstSentence[0];
        }
      } else {
        definition = 'Visit Vocabulary.com to see the full definition.';
      }
    }
    console.log('[WordOfTheDay] Parsed definition:', definition.substring(0, 50) + '...');

    return {
      word,
      pronunciation,
      type,
      definition,
      source: 'vocabulary',
    };
  } catch (error) {
    console.error('[WordOfTheDay] Vocabulary.com failed:', error);
    return null;
  }
}

// Fetch from WordDaily.com
async function fetchFromWordDaily(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Trying WordDaily.com...');
  try {
    const html = await fetchHtmlWithProxies('https://worddaily.com/todays-word/');
    console.log('[WordOfTheDay] WordDaily.com HTML length:', html?.length);

    // Extract word - try multiple patterns
    let word = '';
    // Pattern 1: title tag (most reliable) - "Word - Word Daily" format
    let wordMatch = html.match(/<title>([^-|<]+?)\s*[-|]\s*(?:Word Daily|WordDaily)/i);
    if (wordMatch) {
      word = wordMatch[1].trim();
    } else {
      // Pattern 2: h1 or h2 with word-related class
      wordMatch = html.match(/<h[12][^>]*class=["']?[^"']*(?:word|title)[^"']*["']?[^>]*>([^<]+)<\/h[12]>/i);
      if (wordMatch) {
        word = wordMatch[1].trim();
      } else {
        // Pattern 3: any h1 or h2 (first one found)
        wordMatch = html.match(/<h[12][^>]*>([^<]{2,30})<\/h[12]>/);
        if (wordMatch) {
          word = wordMatch[1].trim();
        } else {
          console.error('[WordOfTheDay] WordDaily HTML snippet:', html.substring(0, 1000));
          throw new Error('Could not parse word from WordDaily.com');
        }
      }
    }
    console.log('[WordOfTheDay] Parsed word:', word);

    // Extract pronunciation - try multiple patterns
    let pronunciation = '';
    let pronMatch = html.match(/<[^>]*class=["']?[^"']*phonetic[^"']*["']?[^>]*>\s*<[^>]*>([^<]+)<\//);
    if (pronMatch) {
      pronunciation = sanitizePronunciation(pronMatch[1].trim(), word);
    } else {
      // Try simpler pattern
      pronMatch = html.match(/\[([^\]]+)\]/);
      if (pronMatch) {
        pronunciation = sanitizePronunciation(pronMatch[1].trim(), word);
      } else {
        pronunciation = word;
      }
    }
    console.log('[WordOfTheDay] Parsed pronunciation:', pronunciation);

    // Extract type - try multiple patterns
    let type = 'word';
    const typeMatch = html.match(/<[^>]*>\s*(noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection)\s*<\/[^>]*>/i);
    if (typeMatch) {
      type = typeMatch[1].toLowerCase();
    }
    console.log('[WordOfTheDay] Type:', type);

    // Extract definition - try multiple patterns
    let definition = '';
    let defMatch = html.match(/<li>([^<]{20,})<\/li>/);
    if (defMatch) {
      definition = parseHtmlEntities(defMatch[1].trim());
    } else {
      // Try paragraph
      defMatch = html.match(/<p[^>]*>([^<]{30,})<\/p>/);
      if (defMatch) {
        definition = parseHtmlEntities(defMatch[1].trim());
      } else {
        definition = 'Visit WordDaily.com to see the full definition.';
      }
    }
    console.log('[WordOfTheDay] Parsed definition:', definition.substring(0, 50) + '...');

    return {
      word,
      pronunciation,
      type,
      definition,
      source: 'worddaily',
    };
  } catch (error) {
    console.error('[WordOfTheDay] WordDaily.com failed:', error);
    return null;
  }
}

// Fetch from Britannica
async function fetchFromBritannica(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Trying Britannica...');
  try {
    const html = await fetchHtmlWithProxies('https://www.britannica.com/dictionary/eb/word-of-the-day');
    console.log('[WordOfTheDay] Britannica HTML length:', html?.length);

    // Extract word from hw_txt span (exact pattern from actual HTML)
    let word = '';
    let wordMatch = html.match(/<span\s+class\s*=\s*["']hw_txt[^"']*["'][^>]*>([^<]+)<\/span>/i);
    if (wordMatch) {
      word = wordMatch[1].trim();
    } else {
      // Fallback: title tag "Word Of The Day: {word} | Britannica Dictionary"
      wordMatch = html.match(/<title>Word Of The Day:\s*([^|]+?)\s*\|\s*Britannica/i);
      if (wordMatch) {
        word = wordMatch[1].trim();
      } else {
        console.error('[WordOfTheDay] Britannica HTML snippet:', html.substring(0, 1000));
        throw new Error('Could not parse word from Britannica');
      }
    }
    console.log('[WordOfTheDay] Parsed word:', word);

    // Extract pronunciation from hpron_word span (contains slashes and inner spans)
    let pronunciation = '';
    const pronMatch = html.match(/<span\s+class\s*=\s*["']hpron_word[^"']*["'][^>]*>(.*?)<\/span>/i);
    if (pronMatch) {
      // Remove HTML tags and slashes, keep IPA content
      pronunciation = sanitizePronunciation(
        pronMatch[1]
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
        .trim(),
        word
      );
    } else {
      pronunciation = word;
    }
    console.log('[WordOfTheDay] Parsed pronunciation:', pronunciation);

    // Extract type from fl span
    let type = 'word';
    const typeMatch = html.match(/<span\s+class\s*=\s*["']fl["'][^>]*>([^<]+)<\/span>/i);
    if (typeMatch) {
      type = typeMatch[1].trim();
    }
    console.log('[WordOfTheDay] Type:', type);

    // Extract first definition from midbt div (pattern: <strong>1 :</strong> definition text)
    let definition = '';
    let defMatch = html.match(/<div\s+class\s*=\s*["']midbt["'][^>]*><p><strong>1\s*:\s*<\/strong>\s*([^<]+)/i);
    if (defMatch) {
      definition = parseHtmlEntities(defMatch[1].trim());
    } else {
      // Fallback: any strong tag with "1 :" pattern
      defMatch = html.match(/<strong>1\s*:\s*<\/strong>\s*([^<]{20,}?)(?:<|\.)/);
      if (defMatch) {
        definition = parseHtmlEntities(defMatch[1].trim());
      } else {
        definition = 'Visit Britannica Dictionary to see the full definition.';
      }
    }
    console.log('[WordOfTheDay] Parsed definition:', definition.substring(0, 50) + '...');

    return {
      word,
      pronunciation,
      type,
      definition,
      source: 'britannica',
    };
  } catch (error) {
    console.error('[WordOfTheDay] Britannica failed:', error);
    return null;
  }
}

// Prefer RSS for Merriam-Webster
async function fetchFromMerriamWebsterRSS(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Trying Merriam-Webster RSS...');
  try {
    const xml = await fetchHtmlWithProxies('https://www.merriam-webster.com/wotd/feed/rss2');
    const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata' });
    const rss = parser.parse(xml);
    const item = rss?.rss?.channel?.item || rss?.channel?.item;
    if (!item) throw new Error('No RSS items');
    const desc = String(item.description || item.__cdata || '');
    // description is HTML inside CDATA
    // Word is bolded early
    let word = '';
    const mWord = desc.match(/<strong>([^<]+)<\/strong>/i);
    if (mWord) word = mWord[1].trim();
    if (!word) throw new Error('MW RSS: no word');
    // Type
    let type = 'word';
    const mType = desc.match(/<em>([^<]+)<\/em>/i);
    if (mType) type = mType[1].trim();
    // Pronunciation appears like \pron\ in the CDATA
    let pronunciation = word;
    const pronMatch = desc.match(/\\([^<\\]+)\\/);
    if (pronMatch) pronunciation = sanitizePronunciation(pronMatch[1], word);
    // Find a paragraph that looks like the primary definition (skip headers/examples)
    let definition = '';
    const pMatches = desc.match(/<p>([\s\S]+?)<\/p>/g) || [];
    for (const pTag of pMatches) {
      const t = pTag.replace(/<[^>]*>/g, '').trim();
      if (!t || t.length < 20) continue;
      if (/Merriam-Webster's Word of the Day/i.test(t)) continue;
      if (/^Examples:/i.test(t)) continue;
      if (/^Did you know\?/i.test(t)) continue;
      definition = parseHtmlEntities(t);
      break;
    }
    if (!definition) definition = 'Visit Merriam-Webster to see the full definition.';
    return { word, pronunciation, type, definition, source: 'merriam-webster' };
  } catch (e) {
    console.error('[WordOfTheDay] Merriam-Webster RSS failed:', e);
    return null;
  }
}

// Wordsmith (A.Word.A.Day) via RSS1.0
async function fetchFromWordsmith(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Trying Wordsmith AWAD RSS...');
  try {
    const xml = await fetchHtmlWithProxies('https://wordsmith.org/awad/rss1.xml');
    const parser = new XMLParser({ ignoreAttributes: false });
    const rss = parser.parse(xml);
    const item = rss?.['rdf:RDF']?.item || rss?.item;
    if (!item) throw new Error('No AWAD item');
    const title = String(item.title || '').trim();
    const desc = String(item.description || '').trim();
    const word = title || '';
    if (!word) throw new Error('AWAD: no title');
    // Attempt to parse "part: definition" format; otherwise use description as definition
    let type = 'word';
    let definition = '';
    const m = desc.match(/^\s*([A-Za-z]+)\s*:\s*(.+)$/);
    if (m) {
      type = m[1].toLowerCase();
      definition = m[2].trim();
    } else {
      definition = desc.replace(/\s+/g, ' ').trim();
    }
    const pronunciation = word; // Not provided in RSS
    return { word, pronunciation, type, definition, source: 'wordsmith' };
  } catch (e) {
    console.error('[WordOfTheDay] Wordsmith AWAD failed:', e);
    return null;
  }
}

// (duplicate Wordsmith AWAD function removed)

// Main function to fetch Word of the Day
// Respects user preference, falls back to other sources if needed
export async function fetchWordOfTheDay(): Promise<WordOfTheDay | null> {
  console.log('[WordOfTheDay] Starting fetch...');
  
  // Get user preference from localStorage (default to 'worddaily')
  const preferredSource = localStorage.getItem('wordOfTheDaySource') || 'worddaily';
  console.log('[WordOfTheDay] Preferred source:', preferredSource);
  
  // Try preferred source first
  let result: WordOfTheDay | null = null;
  
  if (preferredSource === 'vocabulary') {
    result = await fetchFromVocabularyCom();
    if (result) return result;
  } else if (preferredSource === 'dictionary') {
    result = await fetchFromDictionaryCom();
    if (result) return result;
  } else if (preferredSource === 'worddaily') {
    result = await fetchFromWordDaily();
    if (result) return result;
  } else if (preferredSource === 'merriam-webster') {
    // Prefer RSS first
    result = await fetchFromMerriamWebsterRSS();
    if (result) return result;
    result = await fetchFromMerriamWebster();
    if (result) return result;
  } else if (preferredSource === 'britannica') {
    result = await fetchFromBritannica();
    if (result) return result;
  } else if (preferredSource === 'wordsmith') {
    result = await fetchFromWordsmith();
    if (result) return result;
  }
  
  // Fallback to other sources
  console.log('[WordOfTheDay] Preferred source failed, trying fallbacks...');
  
  // Try other non-vocabulary sources first to avoid jumping to Vocabulary.com immediately
  if (preferredSource !== 'britannica') {
    result = await fetchFromBritannica();
    if (result) return result;
  }
  
  if (preferredSource !== 'worddaily') {
    result = await fetchFromWordDaily();
    if (result) return result;
  }
  
  if (preferredSource !== 'dictionary') {
    result = await fetchFromDictionaryCom();
    if (result) return result;
  }
  
  // Try Merriam-Webster RSS as a robust general fallback
  console.log('[WordOfTheDay] Trying Merriam-Webster RSS as fallback...');
  result = await fetchFromMerriamWebsterRSS();
  if (result) return result;
  // Then HTML fallback
  result = await fetchFromMerriamWebster();
  if (result) return result;
  
  console.error('[WordOfTheDay] All sources failed');
  return null;
}

// ... (rest of the code remains the same)
const CACHE_KEY = 'wordOfTheDayCache';

export function getCachedWord(): WordOfTheDay | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as WordOfTheDay;
      parsed.pronunciation = sanitizePronunciation(parsed.pronunciation, parsed.word);
      const preferredSource = localStorage.getItem('wordOfTheDaySource') || 'worddaily';
      if (parsed?.source === preferredSource) {
        console.log('[WordOfTheDay] Using cached word for source:', preferredSource, '(no expiration)');
        return parsed;
      } else {
        console.log('[WordOfTheDay] Cache source mismatch (cached:', parsed?.source, 'preferred:', preferredSource, ') - ignoring cache');
      }
    }
    
    console.log('[WordOfTheDay] No cached word found');
  } catch (error) {
    console.error('[WordOfTheDay] Error reading cached word:', error);
  }
  return null;
}

export function cacheWord(word: WordOfTheDay): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(word));
    console.log('[WordOfTheDay] Cached word (permanent):', word.word);
  } catch (error) {
    console.error('[WordOfTheDay] Error caching word:', error);
  }
}

// Clear the cache to force a fresh fetch
export function clearWordCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[WordOfTheDay] Cache cleared');
  } catch (error) {
    console.error('[WordOfTheDay] Error clearing cache:', error);
  }
}