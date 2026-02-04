// ============================================
// CoupleSpace - Theme Constants
// ============================================

import { ThemeType } from '@/types';

// Tema Renk Paletleri
export const ThemeColors: Record<ThemeType, {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  heart: string;
}> = {
  softPink: {
    primary: '#FF8FAB',
    primaryLight: '#FFDEE6',
    primaryDark: '#E75480',
    secondary: '#FFB6C1',
    accent: '#FF69B4',
    background: '#FFF5F7',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textSecondary: '#6B6B6B',
    border: '#FFE4E9',
    success: '#7ED6A3',
    error: '#FF6B6B',
    heart: '#FF1744',
  },
  lavender: {
    primary: '#B19CD9',
    primaryLight: '#E6E0F3',
    primaryDark: '#8B7BB5',
    secondary: '#D8BFD8',
    accent: '#9370DB',
    background: '#FAF8FF',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textSecondary: '#6B6B6B',
    border: '#E8E0F0',
    success: '#7ED6A3',
    error: '#FF6B6B',
    heart: '#FF1744',
  },
  nightBlue: {
    primary: '#6B8CC7',
    primaryLight: '#B8C9E8',
    primaryDark: '#4A6FA5',
    secondary: '#87CEEB',
    accent: '#5F9EA0',
    background: '#F5F8FC',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textSecondary: '#6B6B6B',
    border: '#E0E8F0',
    success: '#7ED6A3',
    error: '#FF6B6B',
    heart: '#FF1744',
  },
  mintGreen: {
    primary: '#98D8AA',
    primaryLight: '#D4F0DC',
    primaryDark: '#6BBF8A',
    secondary: '#B8E6C1',
    accent: '#66CDAA',
    background: '#F5FFF8',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textSecondary: '#6B6B6B',
    border: '#E0F5E6',
    success: '#7ED6A3',
    error: '#FF6B6B',
    heart: '#FF1744',
  },
  peach: {
    primary: '#FFAB91',
    primaryLight: '#FFDDD1',
    primaryDark: '#E57A5A',
    secondary: '#FFCCBC',
    accent: '#FF7043',
    background: '#FFF8F5',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textSecondary: '#6B6B6B',
    border: '#FFE8E0',
    success: '#7ED6A3',
    error: '#FF6B6B',
    heart: '#FF1744',
  },
};

// Themes alias for backward compatibility
export const Themes = ThemeColors;

// Default tema
export const DEFAULT_THEME: ThemeType = 'softPink';

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Font Sizes
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 40,
};

// Font Weights
export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Animation Durations
export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
};
