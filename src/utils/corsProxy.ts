// Centralized CORS proxy utilities with health-check and TTL cache
// Provides a curated list of proxies, URL builders, and helper fetchers.

export type ProxyMode = 'param' | 'path' | 'json';
export interface ProxyEntry {
  name: string;
  prefix: string;
  mode: ProxyMode;
}

// Default TTL for remembering last-good proxy per hostname (in ms)
const LAST_GOOD_TTL = 24 * 60 * 60 * 1000; // 24h
const LAST_GOOD_KEY = 'cors_last_good_proxy_v1';

// Timeout helper
function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
}

// Curated proxies. Order matters: earlier means preferred.
export const PROXIES: ProxyEntry[] = [
  // JSON/param style (very reliable)
  { name: 'corsproxy.io', prefix: 'https://corsproxy.io/?', mode: 'param' },
  { name: 'allorigins raw', prefix: 'https://api.allorigins.win/raw?url=', mode: 'param' },
  { name: 'allorigins json', prefix: 'https://api.allorigins.win/get?url=', mode: 'json' },
  { name: 'codetabs', prefix: 'https://api.codetabs.com/v1/proxy?quest=', mode: 'param' },
  { name: 'allorigins workers raw', prefix: 'https://api.allorigins.workers.dev/raw?url=', mode: 'param' },
  { name: 'allorigins workers json', prefix: 'https://api.allorigins.workers.dev/get?url=', mode: 'json' },
  { name: 'allorigins deno raw', prefix: 'https://allorigins.deno.dev/raw?url=', mode: 'param' },
  { name: 'allorigins deno json', prefix: 'https://allorigins.deno.dev/get?url=', mode: 'json' },
  { name: 'jina reader (http shim)', prefix: 'https://r.jina.ai/http://', mode: 'path' },
  { name: 'bird ioliu', prefix: 'https://bird.ioliu.cn/v1?url=', mode: 'param' },
  { name: 'techzbots1 worker', prefix: 'https://proxy.techzbots1.workers.dev/?u=', mode: 'param' },
  { name: 'corsproxy.org', prefix: 'https://corsproxy.org/?', mode: 'param' },
  { name: 'htmlDriven', prefix: 'https://cors-proxy.htmldriven.com/?url=', mode: 'param' },
  { name: 'proxy.cors.sh', prefix: 'https://proxy.cors.sh/', mode: 'path' },

  // Path-style
  { name: 'isomorphic-git', prefix: 'https://cors.isomorphic-git.org/', mode: 'path' },
  { name: 'cors-anywhere', prefix: 'https://cors-anywhere.herokuapp.com/', mode: 'path' },
  { name: 'cors.eu.org', prefix: 'https://cors.eu.org/', mode: 'path' },
  { name: 'thingproxy', prefix: 'https://thingproxy.freeboard.io/fetch/', mode: 'path' },
  { name: 'bridged.cc', prefix: 'https://cors.bridged.cc/', mode: 'path' },
  { name: 'yacdn', prefix: 'https://yacdn.org/proxy/', mode: 'path' },
  { name: 'zimjs', prefix: 'https://cors.zimjs.com/', mode: 'path' },
  { name: 'fringe', prefix: 'https://cors-proxy.fringe.zone/', mode: 'path' },
  { name: 'consumet', prefix: 'https://cors.proxy.consumet.org/', mode: 'path' },
];

function getHost(u: string): string {
  try {
    const url = new URL(u);
    return url.host;
  } catch {
    return 'unknown';
  }
}

function loadLastGood(): Record<string, { name: string; ts: number }> {
  try {
    const raw = localStorage.getItem(LAST_GOOD_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLastGood(map: Record<string, { name: string; ts: number }>) {
  try {
    localStorage.setItem(LAST_GOOD_KEY, JSON.stringify(map));
  } catch {}
}

function reorderByLastGood(list: ProxyEntry[], hostname: string): ProxyEntry[] {
  const map = loadLastGood();
  const rec = map[hostname];
  if (!rec) return list;
  if (Date.now() - rec.ts > LAST_GOOD_TTL) return list;
  const idx = list.findIndex(p => p.name === rec.name);
  if (idx <= 0) return list;
  const copy = list.slice();
  const [hit] = copy.splice(idx, 1);
  copy.unshift(hit);
  return copy;
}

export function buildProxyUrl(proxy: ProxyEntry, targetUrl: string): string {
  if (proxy.name === 'jina reader (http shim)') {
    // Jina requires http:// scheme; convert https:// to http://
    const httpTarget = targetUrl.replace(/^https:\/\//i, 'http://');
    return proxy.prefix + httpTarget.replace(/^http:\/\//i, '');
  }
  if (proxy.mode === 'path') return proxy.prefix + targetUrl;
  return proxy.prefix + encodeURIComponent(targetUrl);
}

// How many proxies to race concurrently per batch. Racing beats trying them
// one-by-one: a single flaky/slow proxy no longer blocks the whole chain for
// its full timeout before the next one even starts.
const BATCH_SIZE = 4;
// Per-request timeout. Kept short since we race several at once, so a slow
// proxy only costs this long before its batch's fastest response wins.
const DEFAULT_TIMEOUT_MS = 5000;
// Hard ceiling on the whole function, regardless of how many proxies exist.
// Previously this had no cap: 22 proxies x 8s sequential timeouts meant a
// single call could legitimately take ~3 minutes if proxies were down. That
// cascaded further in fetchWordOfTheDay, which tries several sources each
// calling this function, compounding the delay to minutes.
const OVERALL_BUDGET_MS = 15000;

export async function fetchTextViaCors(targetUrl: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  const hostname = getHost(targetUrl);
  const proxies = reorderByLastGood(PROXIES, hostname);
  const deadline = Date.now() + OVERALL_BUDGET_MS;

  const tryProxy = async (p: ProxyEntry): Promise<{ text: string; proxyName: string }> => {
    const url = buildProxyUrl(p, targetUrl);
    const res = await fetchWithTimeout(url, init, timeoutMs);
    if (!res.ok) throw new Error(String(res.status));
    let text: string;
    if (p.mode === 'json') {
      // allorigins style response
      const data: any = await res.json();
      text = String(data?.contents ?? data?.body ?? data?.result ?? '');
      if (!text) throw new Error('empty json contents');
    } else {
      text = await res.text();
    }
    return { text, proxyName: p.name };
  };

  for (let i = 0; i < proxies.length; i += BATCH_SIZE) {
    if (Date.now() >= deadline) break;
    const batch = proxies.slice(i, i + BATCH_SIZE);
    try {
      const result = await Promise.any(batch.map(tryProxy));
      const map = loadLastGood();
      map[hostname] = { name: result.proxyName, ts: Date.now() };
      saveLastGood(map);
      return result.text;
    } catch {
      // Whole batch failed (or all rejected) - move on to the next batch,
      // as long as we're still within budget.
    }
  }
  throw new Error('All CORS proxies failed');
}

export async function fetchJsonViaCors<T = any>(targetUrl: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const raw = await fetchTextViaCors(targetUrl, init, timeoutMs);
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Best effort: sometimes proxies double-encode JSON under a `contents` string
    return raw as unknown as T;
  }
}

// Convenience: URL builders for UI components that need to iterate candidates
export function makeProxyUrlCandidates(): ((u: string) => string)[] {
  return PROXIES.map(p => (u: string) => buildProxyUrl(p, u));
}
