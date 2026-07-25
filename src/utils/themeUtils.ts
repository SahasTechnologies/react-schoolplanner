export type ThemeKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'grey' | 'custom';

export interface CustomThemeColors {
  accent: string;
  background: string;
  container: string;
  border: string;
}

export const defaultCustomThemeColors: CustomThemeColors = {
  accent: '#3b82f6',
  background: '#0f172a',
  container: '#1e293b',
  border: '#334155',
};

export const SIDEBAR_HOVER_STYLE_ID = 'sidebar-hover-accent-style';

function hexToRgbaLocal(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Tints the sidebar's hover state with the active theme's own accent colour
// (at low opacity) instead of a flat grey, and adapts automatically whether
// that accent comes from one of the built-in themes or a custom one -- same
// non-Tailwind-stylesheet technique as injectCustomThemeStyles, since this
// also needs to reflect a colour that isn't known until runtime.
export function injectSidebarHoverStyle(accentHex: string) {
  if (typeof document === 'undefined') return;
  const css = `
    .sidebar-hover-accent:hover { background-color: ${hexToRgbaLocal(accentHex, 0.14)} !important; }
    .sidebar-hover-accent:active { background-color: ${hexToRgbaLocal(accentHex, 0.22)} !important; }
  `;
  let styleEl = document.getElementById(SIDEBAR_HOVER_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = SIDEBAR_HOVER_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

export const CUSTOM_THEME_STYLE_ID = 'custom-theme-style';

// Simple relative-luminance check so text placed on the user's chosen
// accent colour stays readable no matter which hue they pick.
export function getReadableTextColor(hex: string): '#000000' | '#ffffff' {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Darken (negative percent) or lighten (positive percent) a hex colour, used
// for the custom accent's hover state.
function shade(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  let b = (num & 0x0000ff) + Math.round(255 * percent);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function loadCustomThemeColors(): CustomThemeColors {
  if (typeof window === 'undefined') return defaultCustomThemeColors;
  try {
    const saved = localStorage.getItem('customThemeColors');
    if (saved) {
      return { ...defaultCustomThemeColors, ...JSON.parse(saved) };
    }
  } catch {
    // ignore, fall back to defaults
  }
  return defaultCustomThemeColors;
}

// Every other theme works by handing components a Tailwind class-name
// string (colors.background, colors.buttonAccent, etc) which they drop
// straight into className -- and Tailwind's JIT compiler can only generate
// CSS for classes it can see at build time, so it can never generate a class
// for a hex value someone picks at runtime. Writing a small plain (non-
// Tailwind) stylesheet with fixed class names sidesteps that: every existing
// component keeps working completely unchanged, it just receives
// 'custom-theme-bg' instead of 'bg-blue-950' when a custom theme is active.
export function injectCustomThemeStyles(customColors: CustomThemeColors) {
  if (typeof document === 'undefined') return;
  const hoverAccent = shade(customColors.accent, -0.12);
  const css = `
    .custom-theme-bg { background-color: ${customColors.background} !important; }
    .custom-theme-container { background-color: ${customColors.container} !important; }
    .custom-theme-border { border-color: ${customColors.border} !important; }
    .custom-theme-accent { background-color: ${customColors.accent} !important; color: ${getReadableTextColor(customColors.accent)} !important; }
    .custom-theme-accent-hover:hover { background-color: ${hoverAccent} !important; }
    .custom-theme-accent-text { color: ${customColors.accent} !important; }
  `;
  let styleEl = document.getElementById(CUSTOM_THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = CUSTOM_THEME_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

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

// Helper function to get actual color hex values for inline styles
export const getColorValues = (theme: ThemeKey, themeType: 'normal' | 'extreme', effectiveMode: 'light' | 'dark') => {
  if (theme === 'custom') {
    const custom = loadCustomThemeColors();
    return {
      background: custom.background,
      container: custom.container,
      border: custom.border,
      accent: custom.accent,
      text: effectiveMode === 'light' ? '#000000' : '#ffffff',
      textSecondary: effectiveMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
      buttonText: getReadableTextColor(custom.accent),
      buttonAccent: custom.accent,
    };
  }
  // Map of actual color values
  const colorValues = {
    red: {
      dark: {
        normal: { background: '#1a1313', container: '#231616', border: '#3a2323' },
        extreme: { background: '#450a0a', container: '#7f1d1d', border: '#991b1b' },
      },
      light: {
        normal: { background: '#fff5f5', container: '#ffeaea', border: '#ffd6d6' },
        extreme: { background: '#fee2e2', container: '#fecaca', border: '#fca5a5' },
      },
    },
    orange: {
      dark: {
        normal: { background: '#1e1812', container: '#2a1f13', border: '#3a291a' },
        extreme: { background: '#431407', container: '#7c2d12', border: '#9a3412' },
      },
      light: {
        normal: { background: '#fff8f0', container: '#fff0d9', border: '#ffe0b3' },
        extreme: { background: '#ffedd5', container: '#fed7aa', border: '#fdba74' },
      },
    },
    yellow: {
      dark: {
        normal: { background: '#1a1a13', container: '#232312', border: '#39391a' },
        extreme: { background: '#422006', container: '#713f12', border: '#854d0e' },
      },
      light: {
        normal: { background: '#fffae5', container: '#fffbe6', border: '#fff3b3' },
        extreme: { background: '#fef9c3', container: '#fef08a', border: '#fde047' },
      },
    },
    green: {
      dark: {
        normal: { background: '#142017', container: '#1b2b15', border: '#233a23' },
        extreme: { background: '#052e16', container: '#14532d', border: '#166534' },
      },
      light: {
        normal: { background: '#f5fff5', container: '#eaffea', border: '#d6ffd6' },
        extreme: { background: '#dcfce7', container: '#bbf7d0', border: '#86efac' },
      },
    },
    blue: {
      dark: {
        normal: { background: '#151a20', container: '#18202b', border: '#1a233a' },
        extreme: { background: '#172554', container: '#1e3a8a', border: '#1e40af' },
      },
      light: {
        normal: { background: '#f5f8ff', container: '#eaf0ff', border: '#d6e0ff' },
        extreme: { background: '#dbeafe', container: '#bfdbfe', border: '#93c5fd' },
      },
    },
    purple: {
      dark: {
        normal: { background: '#1a1620', container: '#23182b', border: '#2f1a3a' },
        extreme: { background: '#3b0764', container: '#581c87', border: '#6b21a8' },
      },
      light: {
        normal: { background: '#faf5ff', container: '#f3eaff', border: '#e0d6ff' },
        extreme: { background: '#f3e8ff', container: '#e9d5ff', border: '#d8b4fe' },
      },
    },
    pink: {
      dark: {
        normal: { background: '#20151a', container: '#2b1820', border: '#3a1a23' },
        extreme: { background: '#500724', container: '#831843', border: '#9f1239' },
      },
      light: {
        normal: { background: '#fff5f8', container: '#ffeaf0', border: '#ffd6e0' },
        extreme: { background: '#fce7f3', container: '#fbcfe8', border: '#f9a8d4' },
      },
    },
    grey: {
      dark: {
        normal: { background: '#1a1a1a', container: '#232323', border: '#3a3a3a' },
        extreme: { background: '#0a0a0a', container: '#171717', border: '#262626' },
      },
      light: {
        normal: { background: '#f8f8f8', container: '#f0f0f0', border: '#e0e0e0' },
        extreme: { background: '#f5f5f5', container: '#e5e5e5', border: '#d4d4d4' },
      },
    },
  };

  const colors = colorValues[theme][effectiveMode][themeType];
  
  // Accent colors
  const accentColors = {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
    grey: '#6b7280',
  };

  return {
    background: colors.background,
    container: colors.container,
    border: colors.border,
    accent: accentColors[theme],
    text: effectiveMode === 'light' ? '#000000' : '#ffffff',
    textSecondary: effectiveMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
    buttonText: '#ffffff',
    buttonAccent: accentColors[theme],
  };
};

// Helper function to get colors for a specific theme and type
export const getColors = (theme: ThemeKey, themeType: 'normal' | 'extreme', effectiveMode: 'light' | 'dark') => {
  if (theme === 'custom') {
    const custom = loadCustomThemeColors();
    const buttonTextIsDark = getReadableTextColor(custom.accent) === '#000000';
    const isBackgroundDark = getReadableTextColor(custom.background) === '#ffffff';
    const isContainerDark = getReadableTextColor(custom.container) === '#ffffff';
    return {
      background: 'custom-theme-bg',
      container: 'custom-theme-container',
      border: 'custom-theme-border',
      swatch: 'custom-theme-container',
      spin: isBackgroundDark ? 'border-gray-400' : 'border-gray-600',
      button: isBackgroundDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-900 hover:bg-gray-800',
      buttonText: buttonTextIsDark ? 'text-black' : 'text-white',
      buttonAccent: 'custom-theme-accent',
      buttonAccentHover: 'custom-theme-accent-hover',
      text: isBackgroundDark ? 'text-white' : 'text-black',
      containerText: isContainerDark ? 'text-white' : 'text-black',
      accentText: 'custom-theme-accent-text',
      sidebarHover: isContainerDark ? 'bg-white/10' : 'bg-gray-200',
      input: isContainerDark ? 'bg-white/10 text-white' : 'bg-white/30 backdrop-blur-sm text-black',
      inputBorder: isContainerDark ? 'border border-white/20' : 'border border-black/10',
      placeholder: isContainerDark ? 'placeholder-white/60' : 'placeholder-black/50',
      textSecondary: isContainerDark ? 'text-white/70' : 'text-black/60',
      buttonSecondary: isContainerDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black',
      buttonSecondaryHover: isContainerDark ? 'hover:bg-white/20' : 'hover:bg-black/10',
      softBorder: isContainerDark ? 'border-white/15' : 'border-black/10',
      containerOverlay: isContainerDark ? 'bg-white/5' : 'bg-black/5',
      accent: 'custom-theme-accent-text',
    };
  }
  const colors = colorVars[theme][effectiveMode][themeType];
  // Button and buttonText colors for theme-aware buttons
  let button, buttonText, buttonAccent, buttonAccentHover, text, containerText, accentText, sidebarHover;
  // Additional tokens used by components
  let input, inputBorder, placeholder, textSecondary, buttonSecondary, buttonSecondaryHover, softBorder, containerOverlay, accent;
  // Accent ring color mapping for focus states
  const accentRingMap: Record<Exclude<ThemeKey, 'custom'>, string> = {
    red: 'ring-red-500',
    orange: 'ring-orange-500',
    yellow: 'ring-yellow-500',
    green: 'ring-green-500',
    blue: 'ring-blue-500',
    purple: 'ring-purple-500',
    pink: 'ring-pink-500',
    grey: 'ring-gray-500',
  };
  if (effectiveMode === 'light') {
    button = 'bg-gray-900 hover:bg-gray-800'; // fallback dark button for light mode
    buttonText = 'text-white';
    text = 'text-black';
    containerText = 'text-black';
    // Inputs / secondary buttons / subtle borders in light mode
    input = 'bg-white/30 backdrop-blur-sm text-black';
    inputBorder = 'border border-black/10';
    placeholder = 'placeholder-black/50';
    textSecondary = 'text-black/60';
    buttonSecondary = 'bg-black/5 text-black';
    buttonSecondaryHover = 'hover:bg-black/10';
    softBorder = 'border-black/10';
    containerOverlay = 'bg-black/5'; // make elevated surfaces slightly darker to stand out
    accent = accentRingMap[theme];
    // Theme-accented button backgrounds for light mode
    const accentMap: Record<Exclude<ThemeKey, 'custom'>, [string, string, string]> = {
      red:    ['bg-red-600', 'hover:bg-red-700', 'text-red-600'],
      orange: ['bg-orange-500', 'hover:bg-orange-600', 'text-orange-600'],
      yellow: ['bg-yellow-500', 'hover:bg-yellow-600', 'text-yellow-600'],
      green:  ['bg-green-600', 'hover:bg-green-700', 'text-green-600'],
      blue:   ['bg-blue-600', 'hover:bg-blue-700', 'text-blue-600'],
      purple: ['bg-purple-600', 'hover:bg-purple-700', 'text-purple-600'],
      pink:   ['bg-pink-600', 'hover:bg-pink-700', 'text-pink-600'],
      grey:   ['bg-gray-600', 'hover:bg-gray-700', 'text-gray-600'],
    };
    [buttonAccent, buttonAccentHover, accentText] = accentMap[theme];
    sidebarHover = 'bg-gray-200'; // Subtle hover for sidebar in light mode
  } else {
    button = 'bg-white/10 hover:bg-white/20'; // fallback light button for dark mode
    buttonText = 'text-white';
    text = 'text-white';
    containerText = 'text-white';
    // Inputs / secondary buttons / subtle borders in dark mode
    input = 'bg-white/10 text-white';
    inputBorder = 'border border-white/20';
    placeholder = 'placeholder-white/60';
    textSecondary = 'text-white/70';
    buttonSecondary = 'bg-white/10 text-white';
    buttonSecondaryHover = 'hover:bg-white/20';
    softBorder = 'border-white/15';
    containerOverlay = 'bg-white/5'; // make elevated surfaces slightly lighter to stand out
    accent = accentRingMap[theme];
    // Theme-accented button backgrounds for dark mode
    const accentMap: Record<Exclude<ThemeKey, 'custom'>, [string, string, string]> = {
      red:    ['bg-red-500', 'hover:bg-red-600', 'text-red-400'],
      orange: ['bg-orange-400', 'hover:bg-orange-500', 'text-orange-300'],
      yellow: ['bg-yellow-400', 'hover:bg-yellow-500', 'text-yellow-300'],
      green:  ['bg-green-500', 'hover:bg-green-600', 'text-green-300'],
      blue:   ['bg-blue-500', 'hover:bg-blue-600', 'text-blue-300'],
      purple: ['bg-purple-500', 'hover:bg-purple-600', 'text-purple-300'],
      pink:   ['bg-pink-500', 'hover:bg-pink-600', 'text-pink-300'],
      grey:   ['bg-gray-500', 'hover:bg-gray-600', 'text-gray-300'],
    };
    [buttonAccent, buttonAccentHover, accentText] = accentMap[theme];
    sidebarHover = 'bg-white/10'; // Subtle light overlay for sidebar in dark mode
  }
  return {
    background: colors.background,
    container: colors.container,
    border: colors.border,
    swatch: colors.swatch,
    spin: effectiveMode === 'light' ? 'border-gray-600' : 'border-gray-400',
    button,
    buttonText,
    buttonAccent,
    buttonAccentHover,
    text,
    containerText,
    accentText,
    sidebarHover,
    // New tokens
    input,
    inputBorder,
    placeholder,
    textSecondary,
    buttonSecondary,
    buttonSecondaryHover,
    softBorder,
    containerOverlay,
    accent,
  };
};

// themeColors now references colorVars for both normal (muted) and extreme (bright) for both dark and light
export const themeColors = (mode: 'dark' | 'light') => ({
  red: {
    ...colorVars.red[mode].normal,
    ...colorVars.red[mode].extreme,
    label: 'Red',
    borderAccent: mode === 'dark' ? 'border-red-400' : 'border-red-600',
    buttonText: 'text-white',
  },
  orange: {
    ...colorVars.orange[mode].normal,
    ...colorVars.orange[mode].extreme,
    label: 'Orange',
    borderAccent: mode === 'dark' ? 'border-orange-400' : 'border-orange-600',
    buttonText: 'text-white',
  },
  yellow: {
    ...colorVars.yellow[mode].normal,
    ...colorVars.yellow[mode].extreme,
    label: 'Yellow',
    borderAccent: mode === 'dark' ? 'border-yellow-400' : 'border-yellow-600',
    buttonText: 'text-white',
  },
  green: {
    ...colorVars.green[mode].normal,
    ...colorVars.green[mode].extreme,
    label: 'Green',
    borderAccent: mode === 'dark' ? 'border-green-400' : 'border-green-600',
    buttonText: 'text-white',
  },
  blue: {
    ...colorVars.blue[mode].normal,
    ...colorVars.blue[mode].extreme,
    label: 'Blue',
    borderAccent: mode === 'dark' ? 'border-blue-400' : 'border-blue-600',
    buttonText: 'text-white',
  },
  purple: {
    ...colorVars.purple[mode].normal,
    ...colorVars.purple[mode].extreme,
    label: 'Purple',
    borderAccent: mode === 'dark' ? 'border-purple-400' : 'border-purple-600',
    buttonText: 'text-white',
  },
  pink: {
    ...colorVars.pink[mode].normal,
    ...colorVars.pink[mode].extreme,
    label: 'Pink',
    borderAccent: mode === 'dark' ? 'border-pink-400' : 'border-pink-600',
    buttonText: 'text-white',
  },
  grey: {
    ...colorVars.grey[mode].normal,
    ...colorVars.grey[mode].extreme,
    label: 'Grey',
    borderAccent: mode === 'dark' ? 'border-gray-400' : 'border-gray-600',
    buttonText: 'text-white',
  },
});