import React from 'react';
import { X } from 'lucide-react';
import { ThemeKey, colorVars, themeColors, CustomThemeColors, getReadableTextColor } from '../utils/themeUtils';

interface ThemeModalProps {
  showThemeModal: boolean;
  setShowThemeModal: (show: boolean) => void;
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  handleThemeChange: (key: string, type: 'normal' | 'extreme') => void;
  customThemeColors: CustomThemeColors;
  setCustomThemeColors: (colors: CustomThemeColors) => void;
  effectiveMode: 'light' | 'dark';
  colors: any;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  showThemeModal,
  setShowThemeModal,
  theme,
  themeType,
  handleThemeChange,
  customThemeColors,
  setCustomThemeColors,
  effectiveMode,
  colors
}) => {
  if (!showThemeModal) {
    return null;
  }

  const isCustomActive = theme === 'custom';
  const customSwatchTextColor = getReadableTextColor(customThemeColors.accent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className={`rounded-xl p-8 shadow-2xl border-2 ${colors.container} ${colors.border} w-full max-w-xs mx-4`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${colors.containerText}`}>Choose Theme</h3>
          <button 
            onClick={() => setShowThemeModal(false)} 
            className={`${colors.containerText} opacity-60 hover:opacity-100`}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Normal Colour */}
        <div className={`mb-2 text-lg font-semibold ${colors.containerText}`}>Normal Colour</div>
        <div className="flex flex-row flex-wrap gap-4 mb-6">
          {(Object.entries(colorVars) as [Exclude<ThemeKey, 'custom'>, typeof colorVars[Exclude<ThemeKey, 'custom'>]][]).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center">
              <button
                className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'normal') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].normal.swatch}`}
                onClick={() => handleThemeChange(key, 'normal')}
                title={themeColors(effectiveMode)[key].label}
              />
              <span className={`text-sm mt-1 ${colors.containerText}`}>
                {themeColors(effectiveMode)[key].label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Extreme Colour */}
        <div className={`mb-2 text-lg font-semibold ${colors.containerText}`}>Extreme Colour</div>
        <div className="flex flex-row flex-wrap gap-4">
          {(Object.entries(colorVars) as [Exclude<ThemeKey, 'custom'>, typeof colorVars[Exclude<ThemeKey, 'custom'>]][]).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center">
              <button
                className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'extreme') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].extreme.swatch}`}
                onClick={() => handleThemeChange(key, 'extreme')}
                title={themeColors(effectiveMode)[key].label + ' (Extreme)'}
              />
              <span className={`text-sm mt-1 ${colors.containerText}`}>
                {themeColors(effectiveMode)[key].label}
              </span>
            </div>
          ))}
        </div>

        {/* Custom Colours */}
        <div className={`mt-6 pt-6 border-t ${colors.border}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-lg font-semibold ${colors.containerText}`}>Custom</div>
            <button
              className={`w-10 h-10 rounded-full transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-90 ${isCustomActive ? 'scale-105' : 'border-2 border-gray-600'}`}
              style={{
                background: `conic-gradient(from 180deg, ${customThemeColors.accent}, ${customThemeColors.container}, ${customThemeColors.background}, ${customThemeColors.accent})`,
                boxShadow: isCustomActive ? `0 0 0 3px ${customThemeColors.accent}66` : undefined,
              }}
              onClick={() => handleThemeChange('custom', themeType)}
              title="Use custom colours"
            />
          </div>
          <p className={`text-sm mb-4 opacity-70 ${colors.containerText}`}>
            Pick your own accent, background, container and border colours.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['accent', 'Accent'],
              ['background', 'Background'],
              ['container', 'Container'],
              ['border', 'Border'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-2 cursor-pointer">
                <span className={`text-sm ${colors.containerText}`}>{label}</span>
                <input
                  type="color"
                  value={customThemeColors[key]}
                  onChange={(e) => {
                    const next = { ...customThemeColors, [key]: e.target.value };
                    setCustomThemeColors(next);
                    if (!isCustomActive) handleThemeChange('custom', themeType);
                  }}
                  className="w-9 h-9 rounded cursor-pointer border border-gray-500 bg-transparent p-0 transition-transform duration-150 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-90"
                />
              </label>
            ))}
          </div>
          {isCustomActive && (
            <div
              className="mt-4 rounded-lg px-3 py-2 text-sm font-medium text-center transition-transform duration-150 hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: customThemeColors.accent, color: customSwatchTextColor }}
            >
              Accent preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 