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

  const body = await upstream.text();
  const contentType = upstream.headers.get('Content-Type') || 'text/plain; charset=utf-8';

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
