import * as React from 'react';
import { LoaderCircle, Quote, CloudOff, ArrowRight } from 'lucide-react';
import { ThemeKey, getColors } from '../utils/themeUtils';
import {
  QuoteOfTheDay,
  fetchFavqsQuote,
  fetchZenQuotesToday,
  fetchKwizeQuote,
  fetchJakubPetriskaQuote,
  getCachedJakubPetriskaQuote,
  cacheJakubPetriskaQuote
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

    let quoteProvider = localStorage.getItem('quoteProvider') || 'kwize';
    // Migrate old/deprecated providers. BrainyQuote never actually worked
    // (no browser-usable API), so it's replaced outright by Kwize; Baulko
    // Bell Times is replaced by the JakubPetriska quotes CSV.
    if (quoteProvider === 'notion-quote' || quoteProvider === 'random-quotes-api') {
      quoteProvider = 'favqs';
      localStorage.setItem('quoteProvider', 'favqs');
    } else if (quoteProvider === 'brainyquote') {
      quoteProvider = 'kwize';
      localStorage.setItem('quoteProvider', 'kwize');
    } else if (quoteProvider === 'baulko-bell-times') {
      quoteProvider = 'jakub-petriska';
      localStorage.setItem('quoteProvider', 'jakub-petriska');
    }
    console.log('[QuoteWidget] Using quote provider:', quoteProvider);

    const originalProvider = quoteProvider;
    const label = (p: string) => p === 'favqs' ? 'Favqs' : p === 'zenquotes' ? 'ZenQuotes' : p === 'kwize' ? 'Kwize' : 'JakubPetriska Quotes';

    const tryFavqs = async () => {
      console.log('[QuoteWidget] Trying Favqs...');
      return await fetchFavqsQuote();
    };
    const tryZen = async () => {
      console.log('[QuoteWidget] Trying ZenQuotes...');
      return await fetchZenQuotesToday();
    };
    const tryKwize = async () => {
      console.log('[QuoteWidget] Trying Kwize...');
      return await fetchKwizeQuote();
    };
    const tryJakubPetriska = async () => {
      console.log('[QuoteWidget] Trying JakubPetriska Quotes...');
      return await fetchJakubPetriskaQuote();
    };

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
      if (data) {
        setQuoteData(data);
        setBlockedNote(null);
        if (silent) setLoading(false); else stopSpinner();
        return;
      }
      // fallback order
      console.log('[QuoteWidget] Favqs failed, trying fallbacks...');
      const alt = await tryZen() || await tryKwize();
      return finish(!!alt, alt);
    } else if (quoteProvider === 'zenquotes') {
      const data = await tryZen();
      if (data) {
        setQuoteData(data);
        setBlockedNote(null);
        if (silent) setLoading(false); else stopSpinner();
        return;
      }
      console.log('[QuoteWidget] ZenQuotes failed, trying fallbacks...');
      const alt = await tryFavqs() || await tryKwize();
      return finish(!!alt, alt);
    } else if (quoteProvider === 'kwize') {
      const data = await tryKwize();
      if (data) {
        setQuoteData(data);
        setBlockedNote(null);
        if (silent) setLoading(false); else stopSpinner();
        return;
      }
      console.log('[QuoteWidget] Kwize failed, trying fallbacks...');
      const alt = await tryFavqs() || await tryZen();
      return finish(!!alt, alt);
    } else if (quoteProvider === 'jakub-petriska') {
      if (forceRefresh) {
        localStorage.removeItem('jakubPetriskaQuoteCache');
        localStorage.removeItem('jakubPetriskaQuoteCacheDate');
      } else {
        const cached = getCachedJakubPetriskaQuote();
        if (cached) {
          console.log('[QuoteWidget] Using cached JakubPetriska quote');
          setQuoteData(cached);
          setLoading(false);
          return;
        }
      }

      console.log('[QuoteWidget] Fetching JakubPetriska quote...');
      const data = await tryJakubPetriska();
      if (data) {
        console.log('[QuoteWidget] Successfully fetched JakubPetriska quote');
        setQuoteData(data);
        cacheJakubPetriskaQuote(data);
        setBlockedNote(null);
        if (silent) setLoading(false); else stopSpinner();
        return;
      }
      console.error('[QuoteWidget] Failed to fetch JakubPetriska quote, trying fallbacks');
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

  // Refresh at the start of each new day, entirely client-side -- no
  // physical page reload required. This covers two cases: (1) the tab is
  // left open across midnight, in which case a timer fires right at the
  // day boundary, and (2) the tab was backgrounded/asleep over midnight and
  // only becomes visible again later, in which case a visibility check
  // catches the missed day change as soon as the user comes back.
  React.useEffect(() => {
    let dayKey = new Date().toDateString();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const msUntilNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5); // 5s of slack past midnight
      return nextMidnight.getTime() - now.getTime();
    };

    const refreshForNewDay = (reason: string) => {
      const today = new Date().toDateString();
      if (today === dayKey) return;
      console.log(`[QuoteWidget] Date changed (${reason}), fetching a fresh quote for the new day...`);
      dayKey = today;
      loadQuote(true, false);
    };

    const scheduleMidnightRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshForNewDay('midnight timer');
        scheduleMidnightRefresh(); // reschedule for the following day
      }, msUntilNextMidnight());
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshForNewDay('tab became visible');
    };

    scheduleMidnightRefresh();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
    };
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
            <LoaderCircle className={`animate-spin ${colors.containerText}`} size={32} />
          </div>
        )}
        {error && !loading && (
          <div className={`text-center space-y-3 ${colors.text}`}>
            <div className="flex items-center justify-center gap-2">
              <CloudOff size={18} className={colors.text} />
              <div className="text-base">Your network might be blocking this from loading</div>
            </div>
          </div>
        )}
        {quoteData && !loading && (
          <div className="w-full text-center space-y-3 py-2">
            {/* Quote */}
            <div className={`text-base leading-relaxed px-2 ${colors.containerText}`}>
              "{quoteData.quote}"
            </div>
            {/* Author + optional portrait + annotation */}
            <div className={`text-base px-2 opacity-70 ${colors.containerText} flex flex-col items-end gap-1`}>
              <div className="flex items-center gap-2 justify-end">
                {quoteData.image && (
                  <img
                    src={quoteData.image}
                    alt={quoteData.author}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      // Hide broken image
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span>- {quoteData.author}</span>
              </div>
              {quoteData.annotation && (
                <div className="text-xs italic opacity-80 text-right">
                  {quoteData.annotation}
                </div>
              )}
            </div>
            {blockedNote && (
              <div className={`text-xs text-center opacity-60 ${colors.containerText}`}>{blockedNote}</div>
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
          className={`text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity inline-flex items-center gap-1 ${colors.text}`}
        >
          <span>
            {quoteData.source === 'favqs'
              ? 'View on Favqs'
              : quoteData.source === 'zenquotes'
                ? 'View on ZenQuotes'
                : quoteData.source === 'kwize'
                  ? 'View on Kwize'
                  : quoteData.source === 'jakub-petriska'
                    ? 'View on JakubPetriska Quotes'
                    : 'View Source'}
          </span>
          <ArrowRight size={12} />
        </a>
      )}
    </div>
  );
}
