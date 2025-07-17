// Utility to get the correct Quote of the Day iframe URL based on theme
import { ThemeKey, colorVars } from './theme';

// Helper to extract hex from a Tailwind class or hex string
function extractHex(str: string, fallback: string): string {
  const hexMatch = str.match(/#([0-9a-fA-F]{6,8})/);
  if (hexMatch) return hexMatch[1];
  // fallback for known tailwind classes
  const tailwindToHex: Record<string, string> = {
    'bg-red-950': '450a0a', 'bg-red-900': '7f1d1d', 'bg-red-200': 'fecaca', 'bg-red-100': 'fee2e2',
    'bg-orange-950': '431407', 'bg-orange-900': '7c2d12', 'bg-orange-200': 'fed7aa', 'bg-orange-100': 'ffedd5',
    'bg-yellow-950': '422006', 'bg-yellow-900': '713f12', 'bg-yellow-200': 'fef08a', 'bg-yellow-100': 'fef9c3',
    'bg-green-950': '052e16', 'bg-green-900': '166534', 'bg-green-200': 'bbf7d0', 'bg-green-100': 'dcfce7',
    'bg-blue-950': '172554', 'bg-blue-900': '1e3a8a', 'bg-blue-200': 'bfdbfe', 'bg-blue-100': 'dbeafe',
    'bg-purple-950': '2e1065', 'bg-purple-900': '581c87', 'bg-purple-200': 'ddd6fe', 'bg-purple-100': 'ede9fe',
    'bg-pink-950': '500724', 'bg-pink-900': '831843', 'bg-pink-200': 'fbcfe8', 'bg-pink-100': 'fce7f3',
    'bg-gray-950': '0a0a0a', 'bg-gray-900': '171717', 'bg-gray-200': 'e5e7eb', 'bg-gray-100': 'f3f4f6',
  };
  return tailwindToHex[str] || fallback;
}

export function getQuoteOfTheDayUrl(theme: ThemeKey, themeType: 'normal' | 'extreme', effectiveMode: 'light' | 'dark') {
  const colorObj = colorVars[theme][effectiveMode][themeType];
  const bg = extractHex(colorObj.container, effectiveMode === 'light' ? 'ffffff' : '181e29');
  const text = effectiveMode === 'light' ? '000000' : 'ffffff';
  return `https://kwize.com/quote-of-the-day/embed/&txt=0&font=&color=${text}&background=${bg}`;
} 