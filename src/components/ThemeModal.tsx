import React from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import { ThemeKey, colorVars, themeColors } from '../theme';

interface ThemeModalProps {
  showThemeModal: boolean;
  setShowThemeModal: (show: boolean) => void;
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  handleThemeChange: (key: string, type: 'normal' | 'extreme') => void;
  effectiveMode: 'light' | 'dark';
  colors: any;
}

const ThemeModal: React.FC<ThemeModalProps> = ({
  showThemeModal,
  setShowThemeModal,
  theme,
  themeType,
  themeMode,
  setThemeMode,
  handleThemeChange,
  effectiveMode,
  colors
}) => {
  if (!showThemeModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className={`rounded-xl p-8 shadow-2xl border-2 ${colors.container} ${colors.border} w-full max-w-xs mx-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Choose Theme</h3>
          <button 
            onClick={() => setShowThemeModal(false)} 
            className={`${effectiveMode === 'light' ? 'text-black' : 'text-white'} opacity-60 hover:opacity-100`}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Theme Mode Toggle */}
        <div className="mb-6 flex flex-row items-center justify-center">
          <div className={`relative flex ${effectiveMode === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-full w-44 h-12 px-3 gap-x-2 py-2 transition-colors duration-200`}>
            {/* Toggle thumb */}
            <div
              className={`absolute top-2 left-3 h-8 w-12 rounded-full transition-all duration-200 shadow-md ${themeMode === 'light' ? 'translate-x-0 bg-white' : themeMode === 'dark' ? 'translate-x-28 bg-gray-900' : 'translate-x-14 bg-gray-300 dark:bg-gray-800'}`}
              style={{ zIndex: 1 }}
            />
            {/* Light */}
            <button
              className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'light' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
              style={{ height: '40px' }}
              onClick={() => setThemeMode('light')}
            >
              <Sun size={20} />
              <span className="text-xs font-medium">Light</span>
            </button>
            {/* System */}
            <button
              className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'system' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
              style={{ height: '40px' }}
              onClick={() => setThemeMode('system')}
            >
              <Monitor size={20} />
              <span className="text-xs font-medium">System</span>
            </button>
            {/* Dark */}
            <button
              className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'dark' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
              style={{ height: '40px' }}
              onClick={() => setThemeMode('dark')}
            >
              <Moon size={20} />
              <span className="text-xs font-medium">Dark</span>
            </button>
          </div>
        </div>
        
        {/* Normal Colour */}
        <div className={`mb-2 text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Normal Colour</div>
        <div className="flex flex-row flex-wrap gap-4 mb-6">
          {(Object.entries(colorVars) as [ThemeKey, typeof colorVars[ThemeKey]][]).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center">
              <button
                className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'normal') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].normal.swatch}`}
                onClick={() => handleThemeChange(key, 'normal')}
                title={themeColors(effectiveMode)[key].label}
              />
              <span className={`text-sm mt-1 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
                {themeColors(effectiveMode)[key].label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Extreme Colour */}
        <div className={`mb-2 text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Extreme Colour</div>
        <div className="flex flex-row flex-wrap gap-4">
          {(Object.entries(colorVars) as [ThemeKey, typeof colorVars[ThemeKey]][]).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center">
              <button
                className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'extreme') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].extreme.swatch}`}
                onClick={() => handleThemeChange(key, 'extreme')}
                title={themeColors(effectiveMode)[key].label + ' (Extreme)'}
              />
              <span className={`text-sm mt-1 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
                {themeColors(effectiveMode)[key].label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeModal; 