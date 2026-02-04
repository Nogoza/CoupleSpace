// ============================================
// CoupleSpace - Mood Selector Component
// ============================================

import { BorderRadius, FontSizes, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { MoodColors, MoodEmojis, MoodType } from '@/types';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

const moods: MoodType[] = [
  'mutlu',
  'sakin',
  'ozledim',
  'romantik',
  'heyecanli',
  'minnettar',
  'stresli',
  'yorgun',
  'uzgun',
  'kizgin',
];

const moodLabels: Record<MoodType, string> = {
  mutlu: 'Mutlu',
  sakin: 'Sakin',
  ozledim: 'Özledim',
  stresli: 'Stresli',
  romantik: 'Romantik',
  heyecanli: 'Heyecanlı',
  yorgun: 'Yorgun',
  minnettar: 'Minnettar',
  kizgin: 'Kızgın',
  uzgun: 'Üzgün',
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function MoodItem({
  mood,
  isSelected,
  onSelect,
}: {
  mood: MoodType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { themeColors } = useApp();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.moodItem,
        {
          backgroundColor: isSelected ? MoodColors[mood] + '30' : themeColors.surface,
          borderColor: isSelected ? MoodColors[mood] : themeColors.border,
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.moodEmoji}>{MoodEmojis[mood]}</Text>
      <Text
        style={[
          styles.moodLabel,
          { color: isSelected ? MoodColors[mood] : themeColors.textSecondary },
        ]}
      >
        {moodLabels[mood]}
      </Text>
    </AnimatedTouchable>
  );
}

export function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  const { themeColors } = useApp();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Bugün nasıl hissediyorsun? 💭
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {moods.map((mood) => (
          <MoodItem
            key={mood}
            mood={mood}
            isSelected={selectedMood === mood}
            onSelect={() => onSelect(mood)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingRight: Spacing.md,
  },
  moodItem: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
});
