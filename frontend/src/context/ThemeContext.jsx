import React, { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const THEMES = {
  'minimal-red': {
    id: 'minimal-red',
    name: 'Minimal Crimson',
    description: 'Clean white background, sharp crimson red buttons and accents',
    bg: 'bg-[#fafafa]',
    headerBg: 'bg-white/95 border-slate-200',
    cardBg: 'bg-white border-slate-200 shadow-sm',
    cardHover: 'hover:border-red-300 hover:shadow-md',
    subCardBg: 'bg-slate-50 border-slate-200',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-500',
    accentColor: 'text-red-600',
    accentBg: 'bg-red-600 hover:bg-red-700 text-white',
    accentLightBg: 'bg-red-50 text-red-700 border-red-200',
    pillActive: 'bg-white text-red-600 shadow-sm',
    pillInactive: 'text-slate-600 hover:text-slate-900',
    accentBorder: 'border-red-500',
    isDark: false
  },
  'national-navy': {
    id: 'national-navy',
    name: 'National GovTech (Tricolor)',
    description: 'Deep navy header, Ashoka blue & saffron highlights (IndiaStack / DigiLocker style)',
    bg: 'bg-[#f0f4f9]',
    headerBg: 'bg-[#0a2540] text-white border-slate-700 shadow-md',
    cardBg: 'bg-white border-slate-200 shadow-sm',
    cardHover: 'hover:border-blue-400 hover:shadow-md',
    subCardBg: 'bg-blue-50/50 border-blue-100',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    accentColor: 'text-blue-700',
    accentBg: 'bg-[#0066cc] hover:bg-[#0052a3] text-white',
    accentLightBg: 'bg-amber-50 text-amber-900 border-amber-200',
    pillActive: 'bg-[#0066cc] text-white shadow-sm',
    pillInactive: 'text-slate-300 hover:text-white',
    accentBorder: 'border-blue-600',
    isDark: false
  },
  'command-dark': {
    id: 'command-dark',
    name: 'Command Cyber Dark',
    description: 'High-tech dark space slate with neon cyan & emerald data streams',
    bg: 'bg-[#070d19]',
    headerBg: 'bg-slate-900/90 text-white border-slate-800 shadow-xl',
    cardBg: 'bg-slate-900/90 border-slate-800 text-white shadow-lg',
    cardHover: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
    subCardBg: 'bg-slate-950 border-slate-800',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
    accentColor: 'text-cyan-400',
    accentBg: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white',
    accentLightBg: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    pillActive: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30',
    pillInactive: 'text-slate-400 hover:text-white',
    accentBorder: 'border-cyan-400',
    isDark: true
  },
  'swiss-clean': {
    id: 'swiss-clean',
    name: 'Modern Swiss Tech',
    description: 'High contrast monochrome with vivid ruby red focal points',
    bg: 'bg-[#f4f4f5]',
    headerBg: 'bg-black text-white border-zinc-800 shadow-md',
    cardBg: 'bg-white border-zinc-300 text-zinc-900 shadow-sm',
    cardHover: 'hover:border-zinc-900 hover:shadow-md',
    subCardBg: 'bg-zinc-100 border-zinc-200',
    textPrimary: 'text-zinc-950',
    textSecondary: 'text-zinc-500',
    accentColor: 'text-red-600',
    accentBg: 'bg-black hover:bg-zinc-800 text-white',
    accentLightBg: 'bg-red-50 text-red-900 border-red-200',
    pillActive: 'bg-zinc-800 text-white shadow-sm',
    pillInactive: 'text-zinc-400 hover:text-white',
    accentBorder: 'border-zinc-900',
    isDark: false
  }
};

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState('minimal-red');

  const theme = THEMES[currentThemeId] || THEMES['minimal-red'];

  const setTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentThemeId(themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, currentThemeId, setTheme, allThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
