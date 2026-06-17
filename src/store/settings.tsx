/**
 * App-wide preferences persisted to AsyncStorage:
 * theme mode, onboarding completion, and the (locally-stored) Pro flag.
 *
 * NOTE: `isPro` is a local unlock for V1. Real StoreKit / expo-in-app-purchases
 * is wired later once an Apple Developer account + EAS build exist.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const KEYS = {
  themeMode: 'lt.themeMode',
  onboardingDone: 'lt.onboardingDone',
  isPro: 'lt.isPro',
  reportsGenerated: 'lt.reportsGenerated',
} as const;

interface SettingsState {
  ready: boolean;
  themeMode: ThemeMode;
  onboardingDone: boolean;
  isPro: boolean;
  reportsGenerated: number;
  setThemeMode: (mode: ThemeMode) => void;
  completeOnboarding: () => void;
  setPro: (value: boolean) => void;
  incrementReports: () => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [reportsGenerated, setReportsGenerated] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          KEYS.themeMode,
          KEYS.onboardingDone,
          KEYS.isPro,
          KEYS.reportsGenerated,
        ]);
        const map = Object.fromEntries(entries);
        if (map[KEYS.themeMode]) setThemeModeState(map[KEYS.themeMode] as ThemeMode);
        setOnboardingDone(map[KEYS.onboardingDone] === '1');
        setIsPro(map[KEYS.isPro] === '1');
        setReportsGenerated(Number(map[KEYS.reportsGenerated]) || 0);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(KEYS.themeMode, mode).catch(() => {});
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingDone(true);
    AsyncStorage.setItem(KEYS.onboardingDone, '1').catch(() => {});
  }, []);

  const setPro = useCallback((value: boolean) => {
    setIsPro(value);
    AsyncStorage.setItem(KEYS.isPro, value ? '1' : '0').catch(() => {});
  }, []);

  const incrementReports = useCallback(() => {
    setReportsGenerated((prev) => {
      const next = prev + 1;
      AsyncStorage.setItem(KEYS.reportsGenerated, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      themeMode,
      onboardingDone,
      isPro,
      reportsGenerated,
      setThemeMode,
      completeOnboarding,
      setPro,
      incrementReports,
    }),
    [
      ready,
      themeMode,
      onboardingDone,
      isPro,
      reportsGenerated,
      setThemeMode,
      completeOnboarding,
      setPro,
      incrementReports,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
