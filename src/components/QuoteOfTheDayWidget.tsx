import * as React from 'react';
import { LoaderCircle, Quote, Ban } from 'lucide-react';
import { ThemeKey, getColors } from '../utils/themeUtils';
import {
  fetchQuoteOfTheDay,
  getCachedQuote,
  cacheQuote,
  QuoteOfTheDay,
  clearQuoteCache,
  fetchFavqsQuote,
  fetchZenQuotesToday,
  fetchBaulkoQuote,
  getCachedBaulkoQuote,
  cacheBaulkoQuote
} from '../utils/quoteOfTheDayUtils';

interface QuoteOfTheDayWidgetProps {
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  effectiveMode: 'light' | 'dark';
}

export default function QuoteOfTheDayWidget({ 
  theme, 
  themeType, 
  effectiveMode 
}: QuoteOfTheDayWidgetProps): React.ReactElement {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [quoteData, setQuoteData] = React.useState<QuoteOfTheDay | null>(null);
  const [blockedNote, setBlockedNote] = React.useState<string | null>(null);
  const colors = getColors(theme, themeType, effectiveMode);
  const mountTimeRef = React.useRef(Date.now());
  const MIN_SPIN_MS = 800; // Minimum spinner time for better visibility
  const hasCheckedForUpdate = React.useRef(false);

  // Helper to stop spinner but keep minimum duration
  const stopSpinner = () => {
    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = MIN_SPIN_MS - elapsed;
    if (remaining > 0) {
      setTimeout(() => setLoading(false), remaining);
    } else {
      setLoading(false);
    }
  };

  const loadQuote = React.useCallback(async (forceRefresh = false, silent = false) => {
    console.log('[QuoteWidget] Starting load...', forceRefresh ? '(forced refresh)' : '', silent ? '(silent)' : '');
    if (!silent) {
      setLoading(true);
      setError(false);
      mountTimeRef.current = Date.now();
    }

    let quoteProvider = localStorage.getItem('quoteProvider') || 'brainyquote';
    // Migrate deprecated providers
    if (quoteProvider === 'notion-quote' || quoteProvider === 'random-quotes-api') {
      quoteProvider = 'favqs';
      localStorage.setItem('quoteProvider', 'favqs');
    }
    console.log('[QuoteWidget] Using quote provider:', quoteProvider);

    const originalProvider = quoteProvider;
    const label = (p: string) => p === 'brainyquote' ? 'BrainyQuote' : p === 'favqs' ? 'Favqs' : p === 'zenquotes' ? 'ZenQuotes' : 'Baulko Bell Times';

    const tryFavqs = async () => await fetchFavqsQuote();
    const tryZen = async () => await fetchZenQuotesToday();

    const finish = (ok: boolean, data?: QuoteOfTheDay | null) => {
      if (ok && data) {
        setQuoteData(data);
        if (data.source !== originalProvider) setBlockedNote(`${label(originalProvider)} is being blocked`); else setBlockedNote(null);
      } else {
        if (!silent) setError(true);
        setBlockedNote(null);
      }
      if (silent) setLoading(false); else stopSpinner();
    };

    if (quoteProvider === 'favqs') {
      const data = await tryFavqs();
      if (data) return finish(true, data);
      // fallback order
      const alt = await tryZen() || await fetchQuoteOfTheDay((localStorage.getItem('quoteType') || 'normal') as any);
      return finish(!!alt, alt);
    } else if (quoteProvider === 'zenquotes') {
      const data = await tryZen();
      if (data) return finish(true, data);
      const alt = await tryFavqs() || await fetchQuoteOfTheDay((localStorage.getItem('quoteType') || 'normal') as any);
      return finish(!!alt, alt);
    } else if (quoteProvider === 'baulko-bell-times') {
      if (forceRefresh) {
        localStorage.removeItem('baulkoQuoteCache');
        localStorage.removeItem('baulkoQuoteCacheDate');
      } else {
        const cached = getCachedBaulkoQuote();
        if (cached) {
          console.log('[QuoteWidget] Using cached Baulko Bell Times quote');
          setQuoteData(cached);
          setLoading(false);
          return;
        }
      }

      console.log('[QuoteWidget] Fetching Baulko Bell Times quote...');
      const data = await fetchBaulkoQuote();
      if (data) {
        console.log('[QuoteWidget] Successfully fetched Baulko quote');
        setQuoteData(data);
        cacheBaulkoQuote(data);
        setBlockedNote(null);
        return finish(true, data);
      }
      console.error('[QuoteWidget] Failed to fetch Baulko quote, trying fallbacks');
      const alt = await tryFavqs() || await tryZen() || await fetchQuoteOfTheDay((localStorage.getItem('quoteType') || 'normal') as any);
      return finish(!!alt, alt);
    } else {
      // Handle BrainyQuote
      const quoteType = (localStorage.getItem('quoteType') || 'normal') as 'normal' | 'love' | 'art' | 'nature' | 'funny';
      console.log('[QuoteWidget] Using quote type:', quoteType);

      if (forceRefresh) {
        clearQuoteCache(quoteType);
      } else {
        const cached = getCachedQuote(quoteType);
        if (cached) {
          console.log('[QuoteWidget] Using cached quote');
          setQuoteData(cached);
          setLoading(false);
          // If this is a silent check, also fetch in background to see if there's an update
          if (silent && !hasCheckedForUpdate.current) {
            hasCheckedForUpdate.current = true;
            console.log('[QuoteWidget] Checking for updates in background...');
            const newData = await fetchQuoteOfTheDay(quoteType);
            if (newData && newData.quote !== cached.quote) {
              console.log('[QuoteWidget] Found new quote, updating...');
              setQuoteData(newData);
              cacheQuote(newData, quoteType);
            } else {
              console.log('[QuoteWidget] Quote is up to date');
            }
          }
          return;
        }
      }

      console.log('[QuoteWidget] No cache, fetching new quote...');
      const data = await fetchQuoteOfTheDay(quoteType);
      if (data) {
        console.log('[QuoteWidget] Successfully fetched quote');
        setQuoteData(data);
        cacheQuote(data, quoteType);
        setBlockedNote(null);
        return finish(true, data);
      }
      console.error('[QuoteWidget] BrainyQuote failed, trying fallbacks');
      const alt = await tryFavqs() || await tryZen();
      return finish(!!alt, alt);
    }
  }, []);

  // Fetch quote data on mount (silent check if cache exists)
  React.useEffect(() => {
    loadQuote(false, true);
  }, [loadQuote]);

  // Listen for quote type changes from Settings
  React.useEffect(() => {
    const onTypeChanged = () => {
      console.log('[QuoteWidget] Quote type changed, refreshing...');
      hasCheckedForUpdate.current = false; // Reset check flag
      loadQuote(true, false); // Force refresh, not silent
    };
    window.addEventListener('quoteTypeChanged', onTypeChanged);
    return () => window.removeEventListener('quoteTypeChanged', onTypeChanged);
  }, [loadQuote]);

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-3 w-full">
        <Quote size={20} className={colors.text} />
        <div className={`font-semibold text-lg ${colors.text}`}>Quote of the Day</div>
      </div>
      <div className="relative w-full min-h-[140px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center">
            <LoaderCircle className={`animate-spin ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`} size={32} />
          </div>
        )}
        {error && !loading && (
          <div className={`text-center space-y-3 ${colors.text}`}>
            <div className="flex items-center justify-center gap-2">
              <Ban size={18} className={colors.text} />
              <div className="text-base">Looks like your network is blocking this from loading</div>
            </div>
          </div>
        )}
        {quoteData && !loading && (
          <div className="w-full text-center space-y-3 py-2">
            {/* Quote */}
            <div className={`text-base leading-relaxed px-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
              "{quoteData.quote}"
            </div>
            {/* Author */}
            <div className={`text-base text-right px-2 opacity-70 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
              - {quoteData.author}
            </div>
            {blockedNote && (
              <div className={`text-xs text-center opacity-60 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{blockedNote}</div>
            )}
          </div>
        )}
      </div>
      {/* Link to source */}
      {!loading && !error && quoteData && (
        <a
          href={quoteData.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity ${colors.text}`}
        >
          {quoteData.source === 'favqs'
            ? 'View on Favqs →'
            : quoteData.source === 'zenquotes'
              ? 'View on ZenQuotes →'
              : quoteData.source === 'baulko-bell-times'
                ? 'View on Baulko Bell Times →'
                : 'View on BrainyQuote →'}
        </a>
      )}
    </div>
  );
}
