// Utility to get the correct Quote of the Day iframe URL based on theme
import { ThemeKey } from './theme.ts';

// Hardcoded URLs for each theme/mode/type combination
const quoteUrlDark: Record<string, string> = {
  red: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=231616',
  extremered: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=7f1d1d',
  orange: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=2a1f13',
  extremeorange: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=7c2d12',
  yellow: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=232312',
  extremeyellow: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=713f12',
  green: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=1b2b15',
  extremegreen: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=166534',
  blue: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=18202b',
  extremeblue: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=1e3a8a',
  purple: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=23182b',
  extremepurple: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=581c87',
  pink: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=2b1820',
  extremepink: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=831843',
  grey: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=232323',
  extremegrey: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=171717',
};

const quoteUrlLight: Record<string, string> = {
  red: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=ffeaea',
  extremered: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=fecaca',
  orange: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=fff0d9',
  extremeorange: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=fed7aa',
  yellow: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=fffbe6',
  extremeyellow: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=fef08a',
  green: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=eaffea',
  extremegreen: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=bbf7d0',
  blue: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=eaf0ff',
  extremeblue: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=bfdbfe',
  purple: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=f3eaff',
  extremepurple: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=ddd6fe',
  pink: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=ffeaf0',
  extremepink: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=fbcfe8',
  grey: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=f0f0f0',
  extremegrey: 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=e5e7eb',
};

export function getQuoteOfTheDayUrl(theme: ThemeKey, themeType: 'normal' | 'extreme', effectiveMode: 'light' | 'dark') {
  const key = themeType === 'extreme' ? `extreme${theme}` : theme;
  return effectiveMode === 'dark' ? quoteUrlDark[key] : quoteUrlLight[key];
} 