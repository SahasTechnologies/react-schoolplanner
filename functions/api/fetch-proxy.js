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

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return jsonError('Invalid url parameter', 400);
  }

  if (targetUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(targetUrl.hostname)) {
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
  try {
    upstream = await fetch(targetUrl.toString(), {
      headers: {
        // A normal browser-like UA; some of these sites block obvious
        // server/bot user agents.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
      },
      cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true },
    });
  } catch (err) {
    return jsonError(`Upstream fetch failed: ${err.message}`, 502);
  }

  if (!upstream.ok) {
    return jsonError(`Upstream responded with ${upstream.status}`, 502);
  }

  let body = await upstream.text();
  let contentType = upstream.headers.get('Content-Type') || 'text/plain; charset=utf-8';

  // For sources where we only ever want a couple of fields out of a much
  // bigger HTML page (e.g. Kwize's embed widget also ships fonts/CSS/JS
  // and a Cloudflare beacon script alongside the one paragraph we care
  // about), extract just that data server-side. This keeps both the
  // response sent to the browser and what's stored in the edge cache
  // small, instead of round-tripping the whole page every time. If
  // extraction fails for any reason we fall back to handing back the full
  // body, so the client's own HTML-parsing fallback still has something to
  // work with.
  const extracted = extractImportantData(targetUrl, body);
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

    const smallSpans = [...inner.matchAll(/<span style="font-size:0\.5em;">([\s\S]*?)<\/span>/g)];
    if (!smallSpans.length) return null;
    const author = decodeHtmlEntities(smallSpans[0][1].replace(/<[^>]*>/g, '').trim());
    if (!author) return null;

    const link = rawLink.startsWith('http') ? rawLink : `https://kwize.com${rawLink}`;

    return { quote, author, link, source: 'kwize' };
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
