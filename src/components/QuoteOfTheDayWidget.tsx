import * as React from 'react';
import { LoaderCircle, Quote, RefreshCw } from 'lucide-react';
import { ThemeKey, getColors } from '../utils/themeUtils';
import { fetchQuoteOfTheDay, getCachedQuote, cacheQuote, QuoteOfTheDay, clearQuoteCache } from '../utils/quoteOfTheDayUtils';

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
  const [showRefresh, setShowRefresh] = React.useState(false);
  const colors = getColors(theme, themeType, effectiveMode);
  const mountTimeRef = React.useRef(Date.now());
  const MIN_SPIN_MS = 800; // Minimum spinner time for better visibility

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

  const loadQuote = React.useCallback(async (forceRefresh = false) => {
    console.log('[QuoteWidget] Starting load...', forceRefresh ? '(forced refresh)' : '');
    setLoading(true);
    setError(false);
    mountTimeRef.current = Date.now();

    const quoteType = (localStorage.getItem('quoteType') || 'normal') as 'normal' | 'love' | 'art' | 'nature' | 'funny';
    console.log('[QuoteWidget] Using quote type:', quoteType);

    if (forceRefresh) {
      clearQuoteCache(quoteType);
    } else {
      const cached = getCachedQuote(quoteType);
      if (cached) {
        console.log('[QuoteWidget] Using cached quote');
        setQuoteData(cached);
        stopSpinner();
        if (!showRefresh) setShowRefresh(true);
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
      setError(true);
    }
    stopSpinner();
    if (!showRefresh) setShowRefresh(true);
  }, [showRefresh]);

  // Fetch quote data on mount
  React.useEffect(() => {
    loadQuote(false);
  }, [loadQuote]);

  // Listen for quote type changes from Settings
  React.useEffect(() => {
    const onTypeChanged = () => {
      console.log('[QuoteWidget] Quote type changed, refreshing...');
      loadQuote(true);
    };
    window.addEventListener('quoteTypeChanged', onTypeChanged);
    return () => window.removeEventListener('quoteTypeChanged', onTypeChanged);
  }, [loadQuote]);

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-3 w-full justify-between">
        <div className="flex items-center gap-2">
          <Quote size={20} style={{ color: colors.text }} />
          <div className="font-semibold text-lg" style={{ color: colors.text }}>Quote of the Day</div>
        </div>
        {showRefresh && (
          <button
            onClick={() => loadQuote(true)}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh quote"
          >
            <RefreshCw
              size={16}
              style={{ color: colors.text }}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        )}
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
            <button
              onClick={() => loadQuote(true)}
              className={`px-4 py-2 rounded-lg ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} text-sm font-medium transition-colors`}
            >
              Try Again
            </button>
          </div>
        )}
        {quoteData && !loading && (
          <div className="w-full text-center space-y-3 py-2">
            {/* Quote */}
            <div className="text-base leading-relaxed px-2" style={{ color: colors.text }}>
              "{quoteData.quote}"
            </div>
            {/* Author */}
            <div className="text-base text-right px-2 opacity-70" style={{ color: colors.text }}>
              - {quoteData.author}
            </div>
          </div>
        )}
      </div>
      {/* Link to BrainyQuote */}
      {!loading && !error && quoteData && (
        <a
          href={quoteData.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: colors.text }}
        >
          View on BrainyQuote →
        </a>
      )}
    </div>
  );
}
