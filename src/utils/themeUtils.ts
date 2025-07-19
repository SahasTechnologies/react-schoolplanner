import React from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';

export type ThemeKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'grey';

// Define color variables for both normal (muted) and extreme (bright) for each theme, for both dark and light modes
export const colorVars = {
  red: {
    dark: {
      normal: {
        background: 'bg-[#1a1313]',
        container: 'bg-[#231616]',
        border: 'border-[#3a2323]',
        swatch: 'bg-[#231616]',
      },
      extreme: {
        background: 'bg-red-950',
        container: 'bg-red-900',
        border: 'border-red-800',
        swatch: 'bg-red-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#fff5f5]',
        container: 'bg-[#ffeaea]',
        border: 'border-[#ffd6d6]',
        swatch: 'bg-[#ffeaea]',
      },
      extreme: {
        background: 'bg-red-100',
        container: 'bg-red-200',
        border: 'border-red-300',
        swatch: 'bg-red-200',
      },
    },
  },
  orange: {
    dark: {
      normal: {
        background: 'bg-[#1e1812]',
        container: 'bg-[#2a1f13]',
        border: 'border-[#3a291a]',
        swatch: 'bg-[#2a1f13]',
      },
      extreme: {
        background: 'bg-orange-950',
        container: 'bg-orange-900',
        border: 'border-orange-800',
        swatch: 'bg-orange-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#fff8f0]',
        container: 'bg-[#fff0d9]',
        border: 'border-[#ffe0b3]',
        swatch: 'bg-[#fff0d9]',
      },
      extreme: {
        background: 'bg-orange-100',
        container: 'bg-orange-200',
        border: 'border-orange-300',
        swatch: 'bg-orange-200',
      },
    },
  },
  yellow: {
    dark: {
      normal: {
        background: 'bg-[#1a1a13]',
        container: 'bg-[#232312]',
        border: 'border-[#39391a]',
        swatch: 'bg-[#232312]',
      },
      extreme: {
        background: 'bg-yellow-950',
        container: 'bg-yellow-900',
        border: 'border-yellow-800',
        swatch: 'bg-yellow-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#fffae5]',
        container: 'bg-[#fffbe6]',
        border: 'border-[#fff3b3]',
        swatch: 'bg-[#fffbe6]',
      },
      extreme: {
        background: 'bg-yellow-100',
        container: 'bg-yellow-200',
        border: 'border-yellow-300',
        swatch: 'bg-yellow-200',
      },
    },
  },
  green: {
    dark: {
      normal: {
        background: 'bg-[#142017]',
        container: 'bg-[#1b2b15]',
        border: 'border-[#233a23]',
        swatch: 'bg-[#1b2b15]',
      },
      extreme: {
        background: 'bg-green-950',
        container: 'bg-green-900',
        border: 'border-green-800',
        swatch: 'bg-green-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#f5fff5]',
        container: 'bg-[#eaffea]',
        border: 'border-[#d6ffd6]',
        swatch: 'bg-[#eaffea]',
      },
      extreme: {
        background: 'bg-green-100',
        container: 'bg-green-200',
        border: 'border-green-300',
        swatch: 'bg-green-200',
      },
    },
  },
  blue: {
    dark: {
      normal: {
        background: 'bg-[#151a20]',
        container: 'bg-[#18202b]',
        border: 'border-[#1a233a]',
        swatch: 'bg-[#18202b]',
      },
      extreme: {
        background: 'bg-blue-950',
        container: 'bg-blue-900',
        border: 'border-blue-800',
        swatch: 'bg-blue-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#f5f8ff]',
        container: 'bg-[#eaf0ff]',
        border: 'border-[#d6e0ff]',
        swatch: 'bg-[#eaf0ff]',
      },
      extreme: {
        background: 'bg-blue-100',
        container: 'bg-blue-200',
        border: 'border-blue-300',
        swatch: 'bg-blue-200',
      },
    },
  },
  purple: {
    dark: {
      normal: {
        background: 'bg-[#1a1620]',
        container: 'bg-[#23182b]',
        border: 'border-[#2f1a3a]',
        swatch: 'bg-[#23182b]',
      },
      extreme: {
        background: 'bg-purple-950',
        container: 'bg-purple-900',
        border: 'border-purple-800',
        swatch: 'bg-purple-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#faf5ff]',
        container: 'bg-[#f3eaff]',
        border: 'border-[#e0d6ff]',
        swatch: 'bg-[#f3eaff]',
      },
      extreme: {
        background: 'bg-purple-100',
        container: 'bg-purple-200',
        border: 'border-purple-300',
        swatch: 'bg-purple-200',
      },
    },
  },
  pink: {
    dark: {
      normal: {
        background: 'bg-[#20151a]',
        container: 'bg-[#2b1820]',
        border: 'border-[#3a1a23]',
        swatch: 'bg-[#2b1820]',
      },
      extreme: {
        background: 'bg-pink-950',
        container: 'bg-pink-900',
        border: 'border-pink-800',
        swatch: 'bg-pink-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#fff5f8]',
        container: 'bg-[#ffeaf0]',
        border: 'border-[#ffd6e0]',
        swatch: 'bg-[#ffeaf0]',
      },
      extreme: {
        background: 'bg-pink-100',
        container: 'bg-pink-200',
        border: 'border-pink-300',
        swatch: 'bg-pink-200',
      },
    },
  },
  grey: {
    dark: {
      normal: {
        background: 'bg-[#1a1a1a]',
        container: 'bg-[#232323]',
        border: 'border-[#3a3a3a]',
        swatch: 'bg-[#232323]',
      },
      extreme: {
        background: 'bg-gray-950',
        container: 'bg-gray-900',
        border: 'border-gray-800',
        swatch: 'bg-gray-900',
      },
    },
    light: {
      normal: {
        background: 'bg-[#f8f8f8]',
        container: 'bg-[#f0f0f0]',
        border: 'border-[#e0e0e0]',
        swatch: 'bg-[#f0f0f0]',
      },
      extreme: {
        background: 'bg-gray-100',
        container: 'bg-gray-200',
        border: 'border-gray-300',
        swatch: 'bg-gray-200',
      },
    },
  },
};

// themeColors now references colorVars for both normal (muted) and extreme (bright) for both dark and light
export const themeColors = (mode: 'dark' | 'light') => ({
  red: {
    ...colorVars.red[mode].normal,
    ...colorVars.red[mode].extreme,
    label: 'Red',
    borderAccent: mode === 'dark' ? 'border-red-400' : 'border-red-600',
  },
  orange: {
    ...colorVars.orange[mode].normal,
    ...colorVars.orange[mode].extreme,
    label: 'Orange',
    borderAccent: mode === 'dark' ? 'border-orange-400' : 'border-orange-600',
  },
  yellow: {
    ...colorVars.yellow[mode].normal,
    ...colorVars.yellow[mode].extreme,
    label: 'Yellow',
    borderAccent: mode === 'dark' ? 'border-yellow-400' : 'border-yellow-600',
  },
  green: {
    ...colorVars.green[mode].normal,
    ...colorVars.green[mode].extreme,
    label: 'Green',
    borderAccent: mode === 'dark' ? 'border-green-400' : 'border-green-600',
  },
  blue: {
    ...colorVars.blue[mode].normal,
    ...colorVars.blue[mode].extreme,
    label: 'Blue',
    borderAccent: mode === 'dark' ? 'border-blue-400' : 'border-blue-600',
  },
  purple: {
    ...colorVars.purple[mode].normal,
    ...colorVars.purple[mode].extreme,
    label: 'Purple',
    borderAccent: mode === 'dark' ? 'border-purple-400' : 'border-purple-600',
  },
  pink: {
    ...colorVars.pink[mode].normal,
    ...colorVars.pink[mode].extreme,
    label: 'Pink',
    borderAccent: mode === 'dark' ? 'border-pink-400' : 'border-pink-600',
  },
  grey: {
    ...colorVars.grey[mode].normal,
    ...colorVars.grey[mode].extreme,
    label: 'Grey',
    borderAccent: mode === 'dark' ? 'border-gray-400' : 'border-gray-600',
  },
});

// Helper function to get colors for a specific theme and type
export const getColors = (theme: ThemeKey, themeType: 'normal' | 'extreme', effectiveMode: 'light' | 'dark') => {
  const colors = colorVars[theme][effectiveMode][themeType];
  return {
    background: colors.background,
    container: colors.container,
    border: colors.border,
    swatch: colors.swatch,
  };
};

// ThemeModal Component
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