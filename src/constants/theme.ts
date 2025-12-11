import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export const Colors = {
  light: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    shadow: 'rgba(0, 0, 0, 0.1)',
    // Specific to resident app
    security: '#FF3B30',
    visitor: '#007AFF',
    access: '#34C759',
    notification: '#FF9500',
    maintenance: '#AF52DE',
  },
  dark: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    shadow: 'rgba(0, 0, 0, 0.3)',
    // Specific to resident app
    security: '#FF453A',
    visitor: '#007AFF',
    access: '#32D74B',
    notification: '#FF9F0A',
    maintenance: '#BF5AF2',
  },
};

export const NavigationTheme = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.primary,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.primary,
      background: Colors.dark.background,
      card: Colors.dark.card,
      text: Colors.dark.text,
      border: Colors.dark.border,
    },
  },
};