import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isSystemTheme: boolean;
  setIsSystemTheme: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useDeviceColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  useEffect(() => {
    // Charger les préférences de thème sauvegardées
    AsyncStorage.getItem('theme-preferences').then((preferences) => {
      if (preferences) {
        const { theme: savedTheme, isSystemTheme: savedIsSystemTheme } = JSON.parse(preferences);
        setTheme(savedTheme);
        setIsSystemTheme(savedIsSystemTheme);
      }
    });
  }, []);

  useEffect(() => {
    if (isSystemTheme) {
      setTheme(deviceTheme ?? 'light');
    }
  }, [deviceTheme, isSystemTheme]);

  const updateTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    AsyncStorage.setItem(
      'theme-preferences',
      JSON.stringify({ theme: newTheme, isSystemTheme: false })
    );
  };

  const updateIsSystemTheme = (value: boolean) => {
    setIsSystemTheme(value);
    if (value) {
      setTheme(deviceTheme ?? 'light');
    }
    AsyncStorage.setItem(
      'theme-preferences',
      JSON.stringify({ theme: deviceTheme ?? 'light', isSystemTheme: value })
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: updateTheme,
        isSystemTheme,
        setIsSystemTheme: updateIsSystemTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 