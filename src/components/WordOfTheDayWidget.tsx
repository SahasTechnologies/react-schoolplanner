import * as React from 'react';
import { LoaderCircle, BookOpen } from 'lucide-react';
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

  // Fetch word data
  const loadWord = React.useCallback(async (forceRefresh = false, silent = false) => {
    console.log('[WordWidget] Starting load...', forceRefresh ? '(forced refresh)' : '', silent ? '(silent)' : '');
    if (!silent) {
      setLoading(true);
      setError(false);
      mountTimeRef.current = Date.now();
    }

    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
      const cached = getCachedWord();
      if (cached) {
        console.log('[WordWidget] Using cached word');
        setWordData(cached);
        // Always stop loading when we have cache
        setLoading(false);
        // If this is a silent check, also fetch in background to see if there's an update
        if (silent && !hasCheckedForUpdate.current) {
          hasCheckedForUpdate.current = true;
          console.log('[WordWidget] Checking for updates in background...');
          const newData = await fetchWordOfTheDay();
          if (newData && newData.word !== cached.word) {
            console.log('[WordWidget] Found new word, updating...');
            setWordData(newData);
            cacheWord(newData);
          } else {
            console.log('[WordWidget] Word is up to date');
          }
        }
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
      if (!silent) setError(true);
    }
    if (!silent) stopSpinner();
  }, []);

  // Fetch word data on mount (silent check if cache exists)
  React.useEffect(() => {
    loadWord(false, true);
  }, [loadWord]);

  // Listen for source changes from Settings
  React.useEffect(() => {
    const handleSourceChange = () => {
      console.log('[WordWidget] Source changed, refreshing...');
      hasCheckedForUpdate.current = false; // Reset check flag
      loadWord(true, false); // Force refresh, not silent
    };
    
    window.addEventListener('wordSourceChanged', handleSourceChange);
    return () => window.removeEventListener('wordSourceChanged', handleSourceChange);
  }, [loadWord]);

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-3 w-full">
        <BookOpen size={20} style={{ color: colors.text }} />
        <div className="font-semibold text-lg" style={{ color: colors.text }}>Word of the Day</div>
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
          </div>
        )}
        {wordData && !loading && (
          <div className="w-full text-center space-y-2 py-2">
            {/* Word */}
            <div className="font-bold text-2xl" style={{ color: colors.text }}>
              {wordData.word}
            </div>
            {/* Type and Pronunciation - only show if meaningful data exists */}
            {(() => {
              const hasType = wordData.type && wordData.type.toLowerCase() !== 'word';
              const hasPronunciation = wordData.pronunciation && wordData.pronunciation !== wordData.word;
              
              if (hasType || hasPronunciation) {
                return (
                  <div className="text-base opacity-70" style={{ color: colors.text }}>
                    {hasType && wordData.type}
                    {hasType && hasPronunciation && ' | '}
                    {hasPronunciation && wordData.pronunciation}
                  </div>
                );
              }
              return null;
            })()}
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
