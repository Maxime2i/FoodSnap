import { useTheme } from '@/app/context/ThemeContext';

export function useColorScheme() {
  const { theme } = useTheme();
  return theme;
}
