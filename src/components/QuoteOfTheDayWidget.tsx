import * as React from 'react';
import { LoaderCircle } from 'lucide-react';
import { ThemeKey, getColors } from '../utils/themeUtils';
import { getQuoteOfTheDayUrl } from '../utils/quoteUtils';

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
  const url = getQuoteOfTheDayUrl(theme, themeType, effectiveMode);
  const colors = getColors(theme, themeType, effectiveMode);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const mountTimeRef = React.useRef(Date.now());
  const MIN_SPIN_MS = 800; // Increased minimum spinner time for better visibility

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

  // Effect to handle iframe loading state
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Reset loading state when url changes
    setLoading(true);
    mountTimeRef.current = Date.now();

    const handleLoad = () => {
      stopSpinner();
    };

    const handleError = () => {
      setError(true);
      stopSpinner();
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [url]); // Re-run when url changes

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 mb-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="font-semibold text-lg" style={{ color: colors.text }}>Quote of the Day</div>
      </div>
      <div className="relative w-full h-[120px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center">
            <LoaderCircle className={`animate-spin ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`} size={32} />
          </div>
        )}
        {error && (
          <div className="text-center" style={{ color: colors.text }}>
            Could not load quote.
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Quote of the Day"
          src={url}
          width="100%"
          height="120"
          style={{
            border: 'none',
            borderRadius: '8px',
            opacity: loading || error ? 0 : 1,
            transition: 'opacity 0.5s',
          }}
        ></iframe>
      </div>
    </div>
  );
}
