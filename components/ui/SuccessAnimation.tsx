// ============================================
// CoupleSpace - Success Animation Component
// ============================================

import { FontSizes, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface SuccessAnimationProps {
  message: string;
  emoji?: string;
  visible: boolean;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({
  message,
  emoji = '✨',
  visible,
  onComplete,
  duration = 2500,
}: SuccessAnimationProps) {
  const { themeColors } = useApp();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.1),
        withSpring(1)
      );
      translateY.value = withSpring(0);

      // Auto hide
      const timeout = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        translateY.value = withTiming(-20, { duration: 300 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: themeColors.primaryLight },
          animatedStyle,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.message, { color: themeColors.primaryDark }]}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

// Konfeti Animasyonu (To-Do tamamlandığında)
export function ConfettiAnimation({ visible }: { visible: boolean }) {
  const { themeColors } = useApp();
  
  const confettiPieces = Array.from({ length: 20 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 500;
    const duration = 1500 + Math.random() * 1000;
    const rotation = Math.random() * 360;
    
    return {
      id: i,
      left,
      delay,
      duration,
      rotation,
      emoji: ['🎉', '✨', '💕', '🌸', '⭐'][Math.floor(Math.random() * 5)],
    };
  });

  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(2000, withTiming(0, { duration: 500 }))
      );
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.confettiContainer, containerStyle]}>
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </Animated.View>
  );
}

function ConfettiPiece({
  left,
  delay,
  duration,
  emoji,
}: {
  left: number;
  delay: number;
  duration: number;
  emoji: string;
}) {
  const translateY = useSharedValue(-50);
  const rotation = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(800, { duration })
    );
    rotation.value = withDelay(
      delay,
      withTiming(360 * 3, { duration })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.confettiPiece,
        { left: `${left}%` as any },
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 50,
  },
  emoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  message: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    fontSize: 20,
    top: 0,
  },
});
