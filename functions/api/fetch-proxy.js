// Cloudflare Pages Function: server-side fetch + edge cache for the word-
// of-the-day and quote-of-the-day sources.
//
// These sources don't send CORS headers, so the browser can't fetch them
// directly. This used to be worked around with a long, sequential list of
// public CORS proxies (see src/utils/corsProxy.ts) -- those are free but
// unreliable (rate limited, sometimes down entirely), which is why the
// word/quote widgets sometimes failed to load or took a long time cycling
// through dead proxies.
//
// Since this function runs on Cloudflare's edge rather than in the
// browser, there's no CORS problem at all: it fetches the target server-
// side and just returns the result with permissive CORS headers. It also
// uses the Cache API (available on Cloudflare's free plan for both Pages
// and Workers) to cache each target URL at the edge, so repeat requests
// -- from this person or anyone else hitting the same edge location --
// are served instantly without re-fetching the source at all.
//
// Endpoint: GET /api/fetch-proxy?url=<encoded target URL>

const ALLOWED_HOSTS = new Set([
  'www.merriam-webster.com',
  'www.dictionary.com',
  'www.vocabulary.com',
  'worddaily.com',
  'www.britannica.com',
  'wordsmith.org',
  'favqs.com',
  'zenquotes.io',
  'www.nswschoolholiday.com.au',
  'kwize.com',
  'gist.githubusercontent.com',
]);

// Only proxy plain GETs to a small known allowlist of sources -- this is
// not a general-purpose open proxy.
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB ceiling
const FETCH_TIMEOUT_MS = 8000;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { request } = context;
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get('url');

  if (!target) {
    return jsonError('Missing url parameter', 400);
  }

  let currentTargetUrl;
  try {
    currentTargetUrl = new URL(target);
  } catch {
    return jsonError('Invalid url parameter', 400);
  }

  if (currentTargetUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(currentTargetUrl.hostname)) {
    return jsonError('Host not allowed', 403);
  }

  // Cache key: our own function URL with the target baked into the query
  // string, so each distinct source URL gets its own cache entry.
  const cache = caches.default;
  const cacheKey = new Request(requestUrl.toString(), request);

  const cached = await cache.match(cacheKey);
  if (cached) {
    return withCors(cached);
  }

  let upstream;
  let redirectsFollowed = 0;

  try {
    while (redirectsFollowed <= MAX_REDIRECTS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        upstream = await fetch(currentTargetUrl.toString(), {
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
          },
          cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Check for redirect status codes
      if ([301, 302, 303, 307, 308].includes(upstream.status)) {
        redirectsFollowed++;
        if (redirectsFollowed > MAX_REDIRECTS) {
          return jsonError('Too many redirects', 502);
        }

        const locationHeader = upstream.headers.get('Location');
        if (!locationHeader) {
          return jsonError('Redirect without Location header', 502);
        }

        let nextUrl;
        try {
          nextUrl = new URL(locationHeader, currentTargetUrl.toString());
        } catch {
          return jsonError('Invalid redirect destination', 502);
        }

        // Re-validate redirect destination strictly against HTTPS & allowlist
        if (nextUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(nextUrl.hostname)) {
          return jsonError('Redirect destination not allowed', 403);
        }

        currentTargetUrl = nextUrl;
        continue;
      }

      break;
    }
  } catch (err) {
    const isTimeout = err?.name === 'AbortError';
    return jsonError(isTimeout ? 'Upstream request timed out' : 'Upstream fetch failed', 502);
  }

  if (!upstream || !upstream.ok) {
    return jsonError(`Upstream responded with ${upstream ? upstream.status : 'error'}`, 502);
  }

  // Response size guard
  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
    return jsonError('Upstream response exceeded size limit', 502);
  }

  let body = await upstream.text();
  if (body.length > MAX_RESPONSE_BYTES) {
    return jsonError('Upstream response exceeded size limit', 502);
  }

  let contentType = upstream.headers.get('Content-Type') || 'text/plain; charset=utf-8';

  // For sources where we only ever want a couple of fields out of a much
  // bigger HTML page, extract just that data server-side.
  const extracted = extractImportantData(currentTargetUrl, body);
  if (extracted) {
    body = JSON.stringify(extracted);
    contentType = 'application/json; charset=utf-8';
  }

  const response = new Response(body, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  });

  // Store in the edge cache without delaying the response back to the client.
  context.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}

// Per-host extraction of "just the important bits" out of an otherwise
// large upstream page. Returns a plain object to be sent as JSON, or null
// to fall back to returning the raw body untouched (e.g. hosts with no
// extractor, or a page whose markup didn't match what we expected).
function extractImportantData(targetUrl, body) {
  if (targetUrl.hostname === 'kwize.com') return extractKwizeQuote(body);
  if (targetUrl.hostname === 'worddaily.com') return extractWordDaily(body);
  return null;
}

// Mirrors the parsing logic in src/utils/quoteOfTheDayUtils.ts
// (fetchKwizeQuote) -- kept in sync intentionally, since this is just a
// server-side fast path for the same extraction the client already knows
// how to do from raw HTML.
function extractKwizeQuote(html) {
  try {
    const anchorMatch = html.match(/<div id="kwize_embed_quote">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!anchorMatch) return null;
    const rawLink = anchorMatch[1];
    const inner = anchorMatch[2];

    const quoteMatch = inner.match(/<span>([\s\S]*?)<\/span>/);
    if (!quoteMatch) return null;
    const quote = decodeHtmlEntities(
      quoteMatch[1]
        .replace(/<b>[\s\S]*?<\/b>/g, '')
        .replace(/<[^>]*>/g, '')
        .trim()
    );
    if (!quote) return null;

    // Author is first small span; remaining small spans hold work title + year
    const smallSpans = [...inner.matchAll(/<span style="font-size:0\.5em;">([\s\S]*?)<\/span>/g)];
    if (!smallSpans.length) return null;
    const author = decodeHtmlEntities(smallSpans[0][1].replace(/<[^>]*>/g, '').trim());
    if (!author) return null;

    // Annotation: work title and year from subsequent small spans
    let annotation = '';
    if (smallSpans.length > 1) {
      annotation = smallSpans
        .slice(1)
        .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()))
        .filter(Boolean)
        .join(' ')
        .replace(/^,\s*/, '')
        .trim();
    }

    // Author image (relative path on kwize.com)
    let image = undefined;
    const imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
      const src = imgMatch[1];
      image = src.startsWith('http') ? src : `https://kwize.com${src.startsWith('/') ? '' : '/'}${src}`;
    }

    const link = rawLink.startsWith('http') ? rawLink : `https://kwize.com${rawLink}`;

    return { quote, author, link, source: 'kwize', image, annotation };
  } catch {
    return null;
  }
}

// Extract the key fields from a WordDaily word-of-the-day page so the
// browser only receives a tiny JSON payload instead of the full ad-heavy
// HTML document.
function extractWordDaily(html) {
  try {
    // Word
    let word = '';
    let m = html.match(/<h2\s+class=["']words-single-title["'][^>]*>([^<]+)<\/h2>/i);
    if (m) word = m[1].trim();
    if (!word) {
      m = html.match(/<title>([^-|<]+?)\s*[-|]\s*(?:Word Daily|WordDaily)/i);
      if (m) word = m[1].trim();
    }
    if (!word) return null;

    // Pronunciation
    let pronunciation = word;
    m = html.match(/<div\s+class=["']phonetic["'][^>]*>\s*<span[^>]*>([^<]+)<\/span>/i);
    if (m) pronunciation = m[1].trim();

    // Audio (prefer the element with id="audio")
    let audioUrl = undefined;
    m =
      html.match(/<audio[^>]+id=["']audio["'][^>]+src=["']([^"']+\.mp3)["']/i) ||
      html.match(/src=["'](https?:\/\/[^"']*-WD\.mp3)["']/i) ||
      html.match(/src=["'](https?:\/\/inbox-media-offload\.worddaily\.com\/[^"']+\.mp3)["']/i);
    if (m) audioUrl = m[1];

    // Part of speech
    let type = 'word';
    m =
      html.match(/<div\s+class=["']words-single-noun-title["'][^>]*>\s*<h3>([^<]+)<\/h3>/i) ||
      html.match(/<h3>(noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection)<\/h3>/i);
    if (m) type = m[1].trim().toLowerCase();

    // Definition – target the specific description list, never the footer
    let definition = '';
    m =
      html.match(/<div\s+class=["']words-single-noun-description["'][^>]*>\s*<ul>\s*<li>([^<]+)<\/li>/i) ||
      html.match(/<div\s+class=["']words-single-noun-description["'][^>]*>[\s\S]*?<li>([^<]+)<\/li>/i);
    if (m) definition = decodeHtmlEntities(m[1].trim());
    if (!definition || /©|all rights reserved|word daily/i.test(definition)) {
      const allLis = [...html.matchAll(/<li>([^<]{5,120})<\/li>/gi)];
      for (const li of allLis) {
        const t = decodeHtmlEntities(li[1].trim());
        if (t && !/©|all rights reserved|word daily|privacy|terms/i.test(t) && t.length < 200) {
          definition = t;
          break;
        }
      }
    }
    if (!definition) definition = 'Visit WordDaily.com to see the full definition.';

    return {
      word,
      pronunciation,
      type,
      definition,
      source: 'worddaily',
      audioUrl,
    };
  } catch {
    return null;
  }
}

function decodeHtmlEntities(str) {
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

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
