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
        background: 'bg-[#fff5fa]',
        container: 'bg-[#ffeaf3]',
        border: 'border-[#ffd6e0]',
        swatch: 'bg-[#ffeaf3]',
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
        background: 'bg-[#18191a]',
        container: 'bg-[#232425]',
        border: 'border-[#393a3b]',
        swatch: 'bg-[#232425]',
      },
      extreme: {
        background: 'bg-gray-900',
        container: 'bg-gray-800',
        border: 'border-gray-700',
        swatch: 'bg-gray-800',
      },
    },
    light: {
      normal: {
        background: 'bg-[#f7f7f8]',
        container: 'bg-[#ededed]',
        border: 'border-[#d1d5db]',
        swatch: 'bg-[#ededed]',
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
    icon: mode === 'dark' ? 'text-white' : 'text-red-700',
    button: mode === 'dark' ? 'bg-red-500 hover:bg-red-600' : 'bg-red-400 hover:bg-red-500',
    accent: mode === 'dark' ? 'text-red-400' : 'text-red-600',
    ring: mode === 'dark' ? 'focus:ring-red-400' : 'focus:ring-red-300',
    borderAccent: mode === 'dark' ? 'border-red-400' : 'border-red-300',
    spin: mode === 'dark' ? 'border-red-400' : 'border-red-300',
    settingsContainer: colorVars.red[mode].normal.container,
    swatchExtreme: colorVars.red[mode].extreme.swatch,
    label: 'Red',
  },
  orange: {
    ...colorVars.orange[mode].normal,
    icon: mode === 'dark' ? 'text-white' : 'text-orange-700',
    button: mode === 'dark' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-400 hover:bg-orange-500',
    accent: mode === 'dark' ? 'text-orange-400' : 'text-orange-600',
    ring: mode === 'dark' ? 'focus:ring-orange-400' : 'focus:ring-orange-300',
    borderAccent: mode === 'dark' ? 'border-orange-400' : 'border-orange-300',
    spin: mode === 'dark' ? 'border-orange-400' : 'border-orange-300',
    settingsContainer: colorVars.orange[mode].normal.container,
    swatchExtreme: colorVars.orange[mode].extreme.swatch,
    label: 'Orange',
  },
  yellow: {
    ...colorVars.yellow[mode].normal,
    icon: mode === 'dark' ? 'text-white' : 'text-yellow-700',
    button: mode === 'dark' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-yellow-400 hover:bg-yellow-500',
    accent: mode === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
    ring: mode === 'dark' ? 'focus:ring-yellow-400' : 'focus:ring-yellow-300',
    borderAccent: mode === 'dark' ? 'border-yellow-400' : 'border-yellow-300',
    spin: mode === 'dark' ? 'border-yellow-400' : 'border-yellow-300',
    settingsContainer: colorVars.yellow[mode].normal.container,
    swatchExtreme: colorVars.yellow[mode].extreme.swatch,
    label: 'Yellow',
  },
  green: {
    ...colorVars.green[mode].normal,
    icon: mode === 'dark' ? 'text-white' : 'text-green-700',
    button: mode === 'dark' ? 'bg-green-500 hover:bg-green-600' : 'bg-green-400 hover:bg-green-500',
    accent: mode === 'dark' ? 'text-green-400' : 'text-green-600',
    ring: mode === 'dark' ? 'focus:ring-green-400' : 'focus:ring-green-300',
    borderAccent: mode === 'dark' ? 'border-green-400' : 'border-green-300',
    spin: mode === 'dark' ? 'border-green-400' : 'border-green-300',
    settingsContainer: colorVars.green[mode].normal.container,
    swatchExtreme: colorVars.green[mode].extreme.swatch,
    label: 'Green',
  },
  blue: {
    ...colorVars.blue[mode].normal,
    icon: mode === 'dark' ? 'text-white' : 'text-blue-700',
    button: mode === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-400 hover:bg-blue-500',
    accent: mode === 'dark' ? 'text-blue-400' : 'text-blue-600',
    ring: mode === 'dark' ? 'focus:ring-blue-400' : 'focus:ring-blue-300',
    borderAccent: mode === 'dark' ? 'border-blue-400' : 'border-blue-300',
    spin: mode === 'dark' ? 'border-blue-400' : 'border-blue-300',
    settingsContainer: colorVars.blue[mode].normal.container,
    swatchExtreme: colorVars.blue[mode].extreme.swatch,
    label: 'Blue',
  },
  purple: {
    ...colorVars.purple[mode].normal,
    icon: mode === 'dark' ? 'text-white' : 'text-purple-700',
    button: mode === 'dark' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-400 hover:bg-purple-500',
    accent: mode === 'dark' ? 'text-purple-400' : 'text-purple-600',
    ring: mode === 'dark' ? 'focus:ring-purple-400' : 'focus:ring-purple-300',
    borderAccent: mode === 'dark' ? 'border-purple-400' : 'border-purple-300',
    spin: mode === 'dark' ? 'border-purple-400' : 'border-purple-300',
    settingsContainer: colorVars.purple[mode].normal.container,
    swatchExtreme: colorVars.purple[mode].extreme.swatch,
    label: 'Purple',
  },
  pink: {
    ...colorVars.pink[mode].normal,
    icon: mode === 'dark' ? 'text-white' : 'text-pink-700',
    button: mode === 'dark' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-pink-400 hover:bg-pink-500',
    accent: mode === 'dark' ? 'text-pink-400' : 'text-pink-600',
    ring: mode === 'dark' ? 'focus:ring-pink-400' : 'focus:ring-pink-300',
    borderAccent: mode === 'dark' ? 'border-pink-400' : 'border-pink-300',
    spin: mode === 'dark' ? 'border-pink-400' : 'border-pink-300',
    settingsContainer: colorVars.pink[mode].normal.container,
    swatchExtreme: colorVars.pink[mode].extreme.swatch,
    label: 'Pink',
  },
  grey: {
    ...colorVars.grey[mode].normal,
    icon: mode === 'dark' ? 'text-white' : 'text-gray-700',
    button: mode === 'dark' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400',
    accent: mode === 'dark' ? 'text-gray-400' : 'text-gray-600',
    ring: mode === 'dark' ? 'focus:ring-gray-400' : 'focus:ring-gray-300',
    borderAccent: mode === 'dark' ? 'border-gray-400' : 'border-gray-300',
    spin: mode === 'dark' ? 'border-gray-400' : 'border-gray-300',
    settingsContainer: colorVars.grey[mode].normal.container,
    swatchExtreme: colorVars.grey[mode].extreme.swatch,
    label: 'Grey',
  },
});

// Helper function to get the correct color set for the current theme and type
export const getColors = (theme: ThemeKey, themeType: 'normal' | 'extreme', effectiveMode: 'light' | 'dark') => {
  return themeType === 'normal'
    ? themeColors(effectiveMode)[theme]
    : {
        ...themeColors(effectiveMode)[theme],
        background: colorVars[theme][effectiveMode].extreme.background,
        container: colorVars[theme][effectiveMode].extreme.container,
        border: colorVars[theme][effectiveMode].extreme.border,
        swatch: colorVars[theme][effectiveMode].extreme.swatch,
        settingsContainer: colorVars[theme][effectiveMode].extreme.container,
      };
}; 