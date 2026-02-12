// ============================================
// CoupleSpace - Modern Theme Constants
// ============================================

import { ThemeType } from '@/types';

// Modern Tema Renk Paletleri
export const ThemeColors: Record<ThemeType, {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  success: string;
  error: string;
  heart: string;
  gradientStart: string;
  gradientEnd: string;
  overlay: string;
}> = {
  softPink: {
    primary: '#F472B6',
    primaryLight: '#FDF2F8',
    primaryDark: '#DB2777',
    secondary: '#FBCFE8',
    accent: '#FB7185',
    background: '#FEFCFB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#8E8E9A',
    textTertiary: '#B8B8C4',
    border: '#F3F0EE',
    borderLight: '#FAF5F3',
    success: '#34D399',
    error: '#EF4444',
    heart: '#E11D48',
    gradientStart: '#FDF2F8',
    gradientEnd: '#FEFCFB',
    overlay: 'rgba(26,26,46,0.4)',
  },
  lavender: {
    primary: '#A78BFA',
    primaryLight: '#F5F3FF',
    primaryDark: '#7C3AED',
    secondary: '#DDD6FE',
    accent: '#8B5CF6',
    background: '#FAFAFE',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#8E8E9A',
    textTertiary: '#B8B8C4',
    border: '#F0EEF5',
    borderLight: '#F7F5FA',
    success: '#34D399',
    error: '#EF4444',
    heart: '#E11D48',
    gradientStart: '#F5F3FF',
    gradientEnd: '#FAFAFE',
    overlay: 'rgba(26,26,46,0.4)',
  },
  nightBlue: {
    primary: '#60A5FA',
    primaryLight: '#EFF6FF',
    primaryDark: '#2563EB',
    secondary: '#BFDBFE',
    accent: '#818CF8',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#8E8E9A',
    textTertiary: '#B8B8C4',
    border: '#EEF0F5',
    borderLight: '#F5F7FA',
    success: '#34D399',
    error: '#EF4444',
    heart: '#E11D48',
    gradientStart: '#EFF6FF',
    gradientEnd: '#F8FAFC',
    overlay: 'rgba(26,26,46,0.4)',
  },
  mintGreen: {
    primary: '#34D399',
    primaryLight: '#ECFDF5',
    primaryDark: '#059669',
    secondary: '#A7F3D0',
    accent: '#6EE7B7',
    background: '#F8FDFB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#8E8E9A',
    textTertiary: '#B8B8C4',
    border: '#EEF5F0',
    borderLight: '#F5FAF7',
    success: '#34D399',
    error: '#EF4444',
    heart: '#E11D48',
    gradientStart: '#ECFDF5',
    gradientEnd: '#F8FDFB',
    overlay: 'rgba(26,26,46,0.4)',
  },
  peach: {
    primary: '#FB923C',
    primaryLight: '#FFF7ED',
    primaryDark: '#EA580C',
    secondary: '#FED7AA',
    accent: '#F97316',
    background: '#FFFCFA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#8E8E9A',
    textTertiary: '#B8B8C4',
    border: '#F5F0EE',
    borderLight: '#FAF7F5',
    success: '#34D399',
    error: '#EF4444',
    heart: '#E11D48',
    gradientStart: '#FFF7ED',
    gradientEnd: '#FFFCFA',
    overlay: 'rgba(26,26,46,0.4)',
  },
};

// Themes alias for backward compatibility
export const Themes = ThemeColors;

// Default tema
export const DEFAULT_THEME: ThemeType = 'softPink';

// Spacing — generous & modern
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius — softer corners
export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Font Sizes — better hierarchy
export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 36,
  hero: 44,
};

// Font Weights
export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Modern Shadows — subtle and layered
export const Shadows = {
  small: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  large: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  }),
};

// Animation Durations
export const AnimationDurations = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150 },
};
