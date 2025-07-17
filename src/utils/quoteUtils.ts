// Utility to get the correct Quote of the Day iframe URL based on theme
import { ThemeKey } from './theme';

export function getQuoteOfTheDayUrl(theme: ThemeKey, themeType: 'normal' | 'extreme', effectiveMode: 'light' | 'dark') {
  // Example: blue, normal, dark
  if (theme === 'blue' && themeType === 'normal' && effectiveMode === 'dark') {
    // Use a specific color scheme for blue/dark
    return 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=ffffff&background=181e29';
  }
  // Add more mappings as needed for other theme combinations

  // Default: black text on white background
  return 'https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=000000&background=ffffff';
} 