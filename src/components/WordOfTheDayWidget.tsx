import * as React from 'react';
import { LoaderCircle, BookOpen, CloudOff, ArrowRight, Volume2 } from 'lucide-react';
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
          if (newData) {
            const changed = (
              newData.word !== cached.word ||
              newData.pronunciation !== cached.pronunciation ||
              newData.definition !== cached.definition ||
              newData.source !== cached.source ||
              newData.type !== cached.type ||
              newData.audioUrl !== cached.audioUrl
            );
            if (changed) {
              console.log('[WordWidget] Found updated data, applying...');
              setWordData(newData);
              cacheWord(newData);
              const preferredBg = localStorage.getItem('wordOfTheDaySource') || 'worddaily';
              setBlockedNote(newData.source !== preferredBg ? `${preferredBg} is being blocked` : null);
            } else {
              console.log('[WordWidget] Data is up to date');
            }
          }
        }
        return;
      }
    } else {
      clearWordCache();
    }

    // Fetch new data
    console.log('[WordWidget] No cache, fetching new word...');
    const preferred = localStorage.getItem('wordOfTheDaySource') || 'worddaily';
    const data = await fetchWordOfTheDay();
    if (data) {
      console.log('[WordWidget] Got word data');
      setWordData(data);
      cacheWord(data);
      // If utils fell back, show small blocked note
      if (data.source !== preferred) {
        setBlockedNote(`${preferred} is being blocked`);
      } else {
        setBlockedNote(null);
      }
    } else {
      console.error('[WordWidget] Failed to fetch word');
      if (!silent) setError(true);
      setBlockedNote(null);
    }
    if (silent) {
      setLoading(false);
    } else {
      stopSpinner();
    }
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

  // Refresh at the start of each new day, entirely client-side -- no
  // physical page reload required. Mirrors the same scheduling used by
  // QuoteOfTheDayWidget: a timer fires right at the day boundary for tabs
  // left open overnight, and a visibility/focus check catches the day
  // change for tabs that were backgrounded or asleep over midnight.
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
      console.log(`[WordWidget] Date changed (${reason}), fetching a fresh word for the new day...`);
      dayKey = today;
      hasCheckedForUpdate.current = false;
      loadWord(true, false);
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
  }, [loadWord]);

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-3 w-full">
        <BookOpen size={20} className={colors.text} />
        <div className={`font-semibold text-lg ${colors.text}`}>Word of the Day</div>
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
        {wordData && !loading && (
          <div className="w-full text-center space-y-2 py-2">
            {/* Word */}
            <div className={`font-bold text-2xl ${colors.containerText}`}>
              {wordData.word}
            </div>
            {/* Type and Pronunciation + optional audio play button */}
            {(() => {
              const hasType = wordData.type && wordData.type.toLowerCase() !== 'word';
              const hasPronunciation = wordData.pronunciation && wordData.pronunciation !== wordData.word;
              const hasAudio = Boolean(wordData.audioUrl);

              if (hasType || hasPronunciation || hasAudio) {
                return (
                  <div className={`text-base opacity-70 ${colors.containerText} flex items-center justify-center gap-2 flex-wrap`}>
                    {hasType && <span>{wordData.type}</span>}
                    {hasType && hasPronunciation && <span>|</span>}
                    {hasPronunciation && <span>{wordData.pronunciation}</span>}
                    {hasAudio && (
                      <button
                        type="button"
                        aria-label={`Play pronunciation of ${wordData.word}`}
                        title="Play pronunciation"
                        className={`inline-flex items-center justify-center rounded-full p-1.5 hover:opacity-100 opacity-80 transition-opacity ${colors.containerText}`}
                        onClick={() => {
                          try {
                            const audio = new Audio(wordData.audioUrl!);
                            audio.play().catch((err) => {
                              console.warn('[WordWidget] Audio play failed:', err);
                            });
                          } catch (err) {
                            console.warn('[WordWidget] Audio creation failed:', err);
                          }
                        }}
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            {/* Definition */}
            <div className={`text-base leading-relaxed px-2 ${colors.containerText}`}>
              {wordData.definition}
            </div>
            {/* Blocked note when fallback used */}
            {blockedNote && (
              <div className={`text-xs opacity-60 ${colors.containerText}`}>{blockedNote}</div>
            )}
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
          wordsmith: { url: 'https://wordsmith.org/awad/', name: 'Wordsmith (A.Word.A.Day)' },
        };
        const source = sourceLinks[wordData.source] || sourceLinks.vocabulary;
        return (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity inline-flex items-center gap-1 ${colors.text}`}
          >
            <span>View on {source.name}</span>
            <ArrowRight size={12} />
          </a>
        );
      })()}
    </div>
  );
}
