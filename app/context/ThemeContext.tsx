import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Appearance,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DarkTheme,
  DefaultTheme,
  Theme as NavigationTheme,
} from '@react-navigation/native';
import { darkColors, lightColors, AppColors } from '../theme/colors';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  isDarkMode: boolean;
  colors: AppColors;
  navigationTheme: NavigationTheme;
  isThemeReady: boolean;
  toggleTheme: () => Promise<void>;
  setThemePreference: (value: ThemePreference) => Promise<void>;
};

const STORAGE_KEY = '@client_mapper_theme_preference';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          setPreference(value);
        }
      })
      .catch((error) => console.error('Error loading theme:', error))
      .finally(() => setIsThemeReady(true));
  }, []);

  const isDarkMode = preference === 'dark'
    || (preference === 'system' && systemScheme === 'dark');
  const colors = isDarkMode ? darkColors : lightColors;

  const setThemePreference = useCallback(async (value: ThemePreference) => {
    setPreference(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    await setThemePreference(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode, setThemePreference]);

  useEffect(() => {
    Appearance.setColorScheme(
      preference === 'system' ? null : preference,
    );
  }, [preference]);

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const baseTheme = isDarkMode ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDarkMode]);

  const value = useMemo(() => ({
    preference,
    isDarkMode,
    colors,
    navigationTheme,
    isThemeReady,
    toggleTheme,
    setThemePreference,
  }), [
    preference,
    isDarkMode,
    colors,
    navigationTheme,
    isThemeReady,
    toggleTheme,
    setThemePreference,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};
