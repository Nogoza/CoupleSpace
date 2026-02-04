// ============================================
// CoupleSpace - Streak Display Component
// ============================================

import { BorderRadius, FontSizes, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
} from 'react-native-reanimated';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  showAnimation?: boolean;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  showAnimation = false,
}: StreakDisplayProps) {
  const { themeColors } = useApp();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (showAnimation && currentStreak > 0) {
      scale.value = withSequence(
        withSpring(1.2),
        withDelay(200, withSpring(1))
      );
      rotation.value = withSequence(
        withSpring(-5),
        withSpring(5),
        withSpring(0)
      );
    }
  }, [currentStreak, showAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return 'Bugün ilk günlüğünü yaz! ✨';
    } else if (currentStreak < 3) {
      return 'Güzel başlangıç! Devam et 💪';
    } else if (currentStreak < 7) {
      return 'Harika gidiyorsun! 🌟';
    } else if (currentStreak < 14) {
      return 'Bir hafta! Muhteşem! 🎉';
    } else if (currentStreak < 30) {
      return 'Süpersin! Alışkanlık oluşuyor 🔥';
    } else {
      return 'Efsane! Bir ay geçti! 👑';
    }
  };

  const getStreakEmoji = () => {
    if (currentStreak === 0) return '📝';
    if (currentStreak < 3) return '🌱';
    if (currentStreak < 7) return '🌸';
    if (currentStreak < 14) return '🌺';
    if (currentStreak < 30) return '🔥';
    return '👑';
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.primaryLight },
        Shadows.small,
      ]}
    >
      <Animated.View style={[styles.streakBadge, animatedStyle]}>
        <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
        <Text style={[styles.streakNumber, { color: themeColors.primaryDark }]}>
          {currentStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: themeColors.primaryDark }]}>
          gün seri
        </Text>
      </Animated.View>

      <View style={styles.info}>
        <Text style={[styles.message, { color: themeColors.text }]}>
          {getStreakMessage()}
        </Text>
        {longestStreak > 0 && longestStreak !== currentStreak && (
          <Text style={[styles.record, { color: themeColors.textSecondary }]}>
            En uzun seri: {longestStreak} gün 🏆
          </Text>
        )}
      </View>
    </View>
  );
}

// Streak bozulunca gösterilen tatlı mesaj
export function StreakBrokenMessage() {
  const { themeColors } = useApp();

  return (
    <View
      style={[
        styles.brokenContainer,
        { backgroundColor: themeColors.primaryLight + '50' },
      ]}
    >
      <Text style={styles.brokenEmoji}>💕</Text>
      <Text style={[styles.brokenMessage, { color: themeColors.text }]}>
        Sorun değil, devam ederiz ❤️
      </Text>
      <Text style={[styles.brokenSubtext, { color: themeColors.textSecondary }]}>
        Önemli olan birlikte olmak
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.sm,
  },
  streakBadge: {
    alignItems: 'center',
    marginRight: Spacing.md,
    minWidth: 70,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: FontSizes.xs,
  },
  info: {
    flex: 1,
  },
  message: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  record: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  brokenContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.sm,
  },
  brokenEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  brokenMessage: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  brokenSubtext: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
});
