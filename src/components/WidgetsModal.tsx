import * as React from 'react';
import { X, Quote, BookOpen, Link as LinkIcon, Timer } from 'lucide-react';

interface WidgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectiveMode: 'light' | 'dark';
  colors: any;
  showCountdownInTimeline: boolean;
}

export default function WidgetsModal({
  isOpen,
  onClose,
  effectiveMode,
  colors,
  showCountdownInTimeline,
}: WidgetsModalProps): React.ReactElement | null {
  const [widgetSettings, setWidgetSettings] = React.useState({
    showLinks: localStorage.getItem('showLinksWidget') !== 'false',
    showQuote: localStorage.getItem('showQuoteWidget') !== 'false',
    showWord: localStorage.getItem('showWordWidget') !== 'false',
    showCountdown: localStorage.getItem('showCountdownWidget') !== 'false',
  });

  const handleToggle = (widget: keyof typeof widgetSettings) => {
    const newValue = !widgetSettings[widget];
    setWidgetSettings(prev => ({ ...prev, [widget]: newValue }));
    
    // Save to localStorage
    const storageKeys = {
      showLinks: 'showLinksWidget',
      showQuote: 'showQuoteWidget',
      showWord: 'showWordWidget',
      showCountdown: 'showCountdownWidget',
    };
    localStorage.setItem(storageKeys[widget], String(newValue));
    
    // Trigger a storage event to update the main app
    window.dispatchEvent(new Event('storage'));
  };

  if (!isOpen) return null;

  const isCountdownDisabled = showCountdownInTimeline;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 w-full max-w-md max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${colors.text}`}>Manage Widgets</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-10 ${effectiveMode === 'light' ? 'hover:bg-gray-300' : 'hover:bg-gray-600'} transition-colors`}
          >
            <X size={20} style={{ color: colors.text }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Links Widget */}
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-3">
              <LinkIcon size={20} style={{ color: colors.text }} />
              <div>
                <p className={`font-medium ${colors.text}`}>Links Widget</p>
                <p className={`text-sm ${colors.containerText} opacity-70`}>Quick access to your favorite links</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={widgetSettings.showLinks}
                onChange={() => handleToggle('showLinks')}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors ${widgetSettings.showLinks ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>

          {/* Quote Widget */}
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-3">
              <Quote size={20} style={{ color: colors.text }} />
              <div>
                <p className={`font-medium ${colors.text}`}>Quote of the Day</p>
                <p className={`text-sm ${colors.containerText} opacity-70`}>Daily inspirational quotes</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={widgetSettings.showQuote}
                onChange={() => handleToggle('showQuote')}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors ${widgetSettings.showQuote ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>

          {/* Word Widget */}
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-3">
              <BookOpen size={20} style={{ color: colors.text }} />
              <div>
                <p className={`font-medium ${colors.text}`}>Word of the Day</p>
                <p className={`text-sm ${colors.containerText} opacity-70`}>Expand your vocabulary daily</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={widgetSettings.showWord}
                onChange={() => handleToggle('showWord')}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors ${widgetSettings.showWord ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>

          {/* Countdown Widget */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${isCountdownDisabled ? 'opacity-50' : ''}`} style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-3">
              <Timer size={20} style={{ color: colors.text }} />
              <div>
                <p className={`font-medium ${colors.text}`}>Countdown Widget</p>
                <p className={`text-sm ${colors.containerText} opacity-70`}>Standalone countdown timer</p>
              </div>
            </div>
            <label className={`relative inline-flex items-center ${isCountdownDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={!isCountdownDisabled && widgetSettings.showCountdown}
                onChange={() => !isCountdownDisabled && handleToggle('showCountdown')}
                disabled={isCountdownDisabled}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full relative transition-colors ${!isCountdownDisabled && widgetSettings.showCountdown ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>

          {/* Info message for countdown */}
          {isCountdownDisabled && (
            <div className={`text-xs ${colors.containerText} opacity-70 px-4 py-2 rounded-lg`} style={{ backgroundColor: effectiveMode === 'light' ? '#f3f4f6' : '#374151' }}>
              The countdown widget is automatically disabled when countdown is enabled in today's schedule and you have classes today.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-6 py-2 rounded-lg font-medium transition-colors`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
