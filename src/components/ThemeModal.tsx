import React from 'react';
import { X } from 'lucide-react';
import { ThemeKey, colorVars, themeColors } from '../utils/themeUtils';

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

export const ThemeModal: React.FC<ThemeModalProps> = ({
  showThemeModal,
  setShowThemeModal,
  theme,
  themeType,
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
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Choose Theme</h3>
          <button 
            onClick={() => setShowThemeModal(false)} 
            className={`${effectiveMode === 'light' ? 'text-black' : 'text-white'} opacity-60 hover:opacity-100`}
          >
            <X size={20} />
          </button>
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