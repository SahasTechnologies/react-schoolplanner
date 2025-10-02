import * as React from 'react';
import { LoaderCircle, Quote } from 'lucide-react';
import { ThemeKey, getColors } from '../utils/themeUtils';
import {
  fetchQuoteOfTheDay,
  getCachedQuote,
  cacheQuote,
  QuoteOfTheDay,
  clearQuoteCache,
  fetchRandomQuotesApiQuote,
  getCachedRandomQuotesQuote,
  cacheRandomQuotesQuote,
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

    const quoteProvider = localStorage.getItem('quoteProvider') || 'brainyquote';
    console.log('[QuoteWidget] Using quote provider:', quoteProvider);

    if (quoteProvider === 'random-quotes-api') {
      if (forceRefresh) {
        localStorage.removeItem('randomQuoteCache');
        localStorage.removeItem('randomQuoteCacheDate');
      } else {
        const cached = getCachedRandomQuotesQuote();
        if (cached) {
          console.log('[QuoteWidget] Using cached RandomQuotes API quote');
          setQuoteData(cached);
          setLoading(false);
          return;
        }
      }

      console.log('[QuoteWidget] Fetching new RandomQuotes API quote...');
      const data = await fetchRandomQuotesApiQuote();
      if (data) {
        console.log('[QuoteWidget] Successfully fetched RandomQuotes API quote');
        setQuoteData(data);
        cacheRandomQuotesQuote(data);
      } else {
        console.error('[QuoteWidget] Failed to fetch RandomQuotes API quote');
        if (!silent) setError(true);
      }
      if (silent) {
        setLoading(false);
      } else {
        stopSpinner();
      }
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
      } else {
        console.error('[QuoteWidget] Failed to fetch Baulko quote');
        if (!silent) setError(true);
      }
      if (silent) {
        setLoading(false);
      } else {
        stopSpinner();
      }
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
      } else {
        console.error('[QuoteWidget] Failed to fetch quote');
        if (!silent) setError(true);
      }
      if (silent) {
        setLoading(false);
      } else {
        stopSpinner();
      }
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
        <Quote size={20} style={{ color: colors.text }} />
        <div className="font-semibold text-lg" style={{ color: colors.text }}>Quote of the Day</div>
      </div>
      <div className="relative w-full min-h-[140px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center">
            <LoaderCircle className={`animate-spin ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`} size={32} />
          </div>
        )}
        {error && !loading && (
          <div className="text-center space-y-3" style={{ color: colors.text }}>
            <div className="text-base">Could not load quote.</div>
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
          </div>
        )}
      </div>
      {/* Link to source */}
      {!loading && !error && quoteData && (
        <a
          href={quoteData.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: colors.text }}
        >
          {quoteData.source === 'random-quotes-api'
            ? 'View on RandomQuotes API →'
            : quoteData.source === 'baulko-bell-times'
              ? 'View on Baulko Bell Times →'
              : 'View on BrainyQuote →'}
        </a>
      )}
    </div>
  );
}
