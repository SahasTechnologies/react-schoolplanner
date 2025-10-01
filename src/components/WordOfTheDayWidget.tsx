import * as React from 'react';
import { LoaderCircle, BookOpen } from 'lucide-react';
import { ThemeKey, getColors } from '../utils/themeUtils';
import { fetchWordOfTheDay, getCachedWord, cacheWord, WordOfTheDay } from '../utils/wordOfTheDayUtils';

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

  // Fetch word data on mount
  React.useEffect(() => {
    const loadWord = async () => {
      console.log('[WordWidget] Component mounted, starting load...');
      setLoading(true);
      mountTimeRef.current = Date.now();

      // Check cache first
      const cached = getCachedWord();
      if (cached) {
        console.log('[WordWidget] Using cached word');
        setWordData(cached);
        stopSpinner();
        return;
      }

      // Fetch new data
      console.log('[WordWidget] No cache, fetching new word...');
      const data = await fetchWordOfTheDay();
      if (data) {
        console.log('[WordWidget] Successfully fetched word');
        setWordData(data);
        cacheWord(data);
        stopSpinner();
      } else {
        console.error('[WordWidget] Failed to fetch word');
        setError(true);
        stopSpinner();
      }
    };

    loadWord();
  }, []);

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-3">
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
          <div className="text-center text-base" style={{ color: colors.text }}>
            Could not load word of the day.
          </div>
        )}
        {wordData && !loading && (
          <div className="w-full text-center space-y-2 py-2">
            {/* Word */}
            <div className="font-bold text-2xl" style={{ color: colors.text }}>
              {wordData.word}
            </div>
            {/* Type and Pronunciation */}
            <div className="text-base opacity-70" style={{ color: colors.text }}>
              {wordData.type} | {wordData.pronunciation}
            </div>
            {/* Definition */}
            <div className="text-base leading-relaxed px-2" style={{ color: colors.text }}>
              {wordData.definition}
            </div>
          </div>
        )}
      </div>
      {/* Link to Merriam-Webster */}
      {!loading && !error && (
        <a
          href="https://www.merriam-webster.com/word-of-the-day"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: colors.text }}
        >
          View on Merriam-Webster →
        </a>
      )}
    </div>
  );
}
