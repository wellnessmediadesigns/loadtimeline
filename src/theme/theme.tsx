/** Resolves the active color theme from the user's preference + system scheme. */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/settings';
import { darkColors, lightColors, ThemeColors } from './colors';
import { radius, shadow, spacing, touch, typography } from './tokens';

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  touch: typeof touch;
  shadow: (level?: 1 | 2 | 3) => ReturnType<typeof shadow>;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode } = useSettings();
  const systemScheme = useColorScheme();
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const value = useMemo<Theme>(() => {
    const colors = isDark ? darkColors : lightColors;
    return {
      colors,
      isDark,
      spacing,
      radius,
      typography,
      touch,
      shadow: (level: 1 | 2 | 3 = 1) => shadow(colors.shadow, level),
    };
  }, [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
