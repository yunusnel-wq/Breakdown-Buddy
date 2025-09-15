import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#e63946',
    secondary: '#f77f00',
    accent: '#fcbf49',
    background: '#e6f3ff',
    surface: '#ffffff',
    text: '#000000',
    disabled: '#757575',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    // Custom colors for South African theme
    orange: '#f77f00',
    yellow: '#fcbf49',
    green: '#06d6a0',
    blue: '#118ab2',
    red: '#e63946',
  },
};

export const colors = {
  primary: '#e63946',
  secondary: '#f77f00',
  accent: '#fcbf49',
  background: '#e6f3ff',
  surface: '#f8f9fa',
  text: '#000000',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  success: '#06d6a0',
  warning: '#fcbf49',
  error: '#e63946',
  info: '#118ab2',
};