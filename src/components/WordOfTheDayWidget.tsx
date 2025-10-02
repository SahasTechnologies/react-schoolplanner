import * as React from 'react';
import { LoaderCircle, BookOpen, RefreshCw } from 'lucide-react';
import { ThemeKey, getColors } from '../utils/themeUtils';
import { fetchWordOfTheDay, getCachedWord, cacheWord, WordOfTheDay, clearWordCache } from '../utils/wordOfTheDayUtils';

interface WordOfTheDayWidgetProps {
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  effectiveMode: 'light' | 'dark';
}

export default function WordOfTheDayWidget({ 
  theme, 
  themeType, 
  effectiveMode 
}: WordOfTheDayWidgetProps): React.ReactElement {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [wordData, setWordData] = React.useState<WordOfTheDay | null>(null);
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

  // Fetch word data
  const loadWord = React.useCallback(async (forceRefresh = false) => {
    console.log('[WordWidget] Starting load...', forceRefresh ? '(forced refresh)' : '');
    setLoading(true);
    setError(false);
    mountTimeRef.current = Date.now();

    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
      const cached = getCachedWord();
      if (cached) {
        console.log('[WordWidget] Using cached word');
        setWordData(cached);
        stopSpinner();
        return;
      }
    } else {
      clearWordCache();
    }

    // Fetch new data
    console.log('[WordWidget] No cache, fetching new word...');
    const data = await fetchWordOfTheDay();
    if (data) {
      console.log('[WordWidget] Got word data');
      setWordData(data);
      cacheWord(data);
    } else {
      console.error('[WordWidget] Failed to fetch word');
      setError(true);
    }
    stopSpinner();
    // After the first load attempt (success or failure), show the refresh button
    if (!showRefresh) setShowRefresh(true);
  }, []);

  // Fetch word data on mount
  React.useEffect(() => {
    loadWord(false);
  }, [loadWord]);

  // Listen for source changes from Settings
  React.useEffect(() => {
    const handleSourceChange = () => {
      console.log('[WordWidget] Source changed, refreshing...');
      loadWord(true);
    };
    
    window.addEventListener('wordSourceChanged', handleSourceChange);
    return () => window.removeEventListener('wordSourceChanged', handleSourceChange);
  }, [loadWord]);

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-3 w-full justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} style={{ color: colors.text }} />
          <div className="font-semibold text-lg" style={{ color: colors.text }}>Word of the Day</div>
        </div>
        {showRefresh && (
          <button
            onClick={() => loadWord(true)}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh word"
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
            <div className="text-base">Could not load word of the day.</div>
            <button
              onClick={() => loadWord(true)}
              className={`px-4 py-2 rounded-lg ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} text-sm font-medium transition-colors`}
            >
              Try Again
            </button>
          </div>
        )}
        {wordData && !loading && (
          <div className="w-full text-center space-y-2 py-2">
            {/* Word */}
            <div className="font-bold text-2xl" style={{ color: colors.text }}>
              {wordData.word}
            </div>
            {/* Type and Pronunciation - only show pronunciation if different from word */}
            <div className="text-base opacity-70" style={{ color: colors.text }}>
              {wordData.type}{wordData.pronunciation !== wordData.word && ` | ${wordData.pronunciation}`}
            </div>
            {/* Definition */}
            <div className="text-base leading-relaxed px-2" style={{ color: colors.text }}>
              {wordData.definition}
            </div>
          </div>
        )}
      </div>
      {/* Dynamic link based on source */}
      {!loading && !error && wordData && (() => {
        const sourceLinks = {
          vocabulary: { url: 'https://www.vocabulary.com/word-of-the-day/', name: 'Vocabulary.com' },
          dictionary: { url: 'https://www.dictionary.com/e/word-of-the-day/', name: 'Dictionary.com' },
          worddaily: { url: 'https://worddaily.com/todays-word/', name: 'WordDaily.com' },
          britannica: { url: 'https://www.britannica.com/dictionary/eb/word-of-the-day', name: 'Britannica Dictionary' },
          'merriam-webster': { url: 'https://www.merriam-webster.com/word-of-the-day', name: 'Merriam-Webster' },
        };
        const source = sourceLinks[wordData.source] || sourceLinks.vocabulary;
        return (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: colors.text }}
          >
            View on {source.name} →
          </a>
        );
      })()}
    </div>
  );
}
