// ============================================
// CoupleSpace - Welcome Screen (Onboarding)
// ============================================

import { Button } from '@/components/ui/Button';
import { BorderRadius, FontSizes, Spacing, ThemeColors } from '@/constants/couple-theme';
import { router } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const themeColors = ThemeColors.softPink;
  
  // Floating hearts animation
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  React.useEffect(() => {
    float1.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    float2.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    float3.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: float1.value }],
  }));
  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: float2.value }],
  }));
  const floatStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: float3.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Floating Hearts Background */}
      <View style={styles.heartsContainer}>
        <Animated.Text style={[styles.floatingHeart, styles.heart1, floatStyle1]}>
          💕
        </Animated.Text>
        <Animated.Text style={[styles.floatingHeart, styles.heart2, floatStyle2]}>
          💗
        </Animated.Text>
        <Animated.Text style={[styles.floatingHeart, styles.heart3, floatStyle3]}>
          💖
        </Animated.Text>
      </View>

      <View style={styles.content}>
        {/* Logo & Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>💑</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>
            CoupleSpace
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Sadece sen ve sevgilin için{'\n'}özel bir alan ✨
          </Text>
        </View>

        {/* Features Preview */}
        <View style={[styles.featuresCard, { backgroundColor: themeColors.surface }]}>
          <FeatureItem emoji="💬" text="Özel mesajlaşma" color={themeColors.primary} />
          <FeatureItem emoji="📔" text="Birlikte günlük tutma" color={themeColors.primary} />
          <FeatureItem emoji="💕" text="Love ping gönderme" color={themeColors.primary} />
          <FeatureItem emoji="📸" text="Anı kutusu" color={themeColors.primary} />
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttons}>
          <Button
            title="Başlayalım 💕"
            onPress={() => router.push('/(onboarding)/register' as any)}
            fullWidth
            size="large"
          />
          <Button
            title="Zaten hesabım var"
            onPress={() => router.push('/(onboarding)/login' as any)}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>

      {/* Footer */}
      <Text style={[styles.footer, { color: themeColors.textSecondary }]}>
        Sadece çiftler için 🔒
      </Text>
    </SafeAreaView>
  );
}

function FeatureItem({ emoji, text, color }: { emoji: string; text: string; color: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={[styles.featureText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heartsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 40,
    opacity: 0.3,
  },
  heart1: {
    top: '15%',
    left: '10%',
  },
  heart2: {
    top: '25%',
    right: '15%',
  },
  heart3: {
    top: '45%',
    left: '20%',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  featureText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  buttons: {
    gap: Spacing.md,
  },
  footer: {
    textAlign: 'center',
    paddingBottom: Spacing.lg,
    fontSize: FontSizes.sm,
  },
});
