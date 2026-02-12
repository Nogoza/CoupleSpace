// ============================================
// CoupleSpace - Modern Card Component
// ============================================

import { BorderRadius, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'soft';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}: CardProps) {
  const { themeColors } = useApp();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return Spacing.sm;
      case 'large':
        return Spacing.lg;
      default:
        return Spacing.md;
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...Shadows.medium,
          borderWidth: 1,
          borderColor: themeColors.borderLight,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case 'soft':
        return {
          backgroundColor: themeColors.primaryLight,
          borderWidth: 0,
        };
      default:
        return {
          ...Shadows.small,
          borderWidth: 1,
          borderColor: themeColors.borderLight,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.surface, padding: getPadding() },
        getVariantStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
});
