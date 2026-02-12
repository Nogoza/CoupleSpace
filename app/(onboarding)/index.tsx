// ============================================
// CoupleSpace - Modern Welcome Screen
// ============================================

import { Button } from '@/components/ui/Button';
import { BorderRadius, FontSizes, FontWeights, Shadows, Spacing, ThemeColors } from '@/constants/couple-theme';
import { LinearGradient } from 'expo-linear-gradient';
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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const themeColors = ThemeColors.softPink;

  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  React.useEffect(() => {
    float1.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    float2.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    float3.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);

  const floatStyle1 = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }] }));
  const floatStyle2 = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }] }));
  const floatStyle3 = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }] }));

  return (
    <LinearGradient
      colors={[themeColors.gradientStart, themeColors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Floating Hearts */}
        <View style={styles.heartsContainer}>
          <Animated.Text style={[styles.floatingHeart, styles.heart1, floatStyle1]}>💕</Animated.Text>
          <Animated.Text style={[styles.floatingHeart, styles.heart2, floatStyle2]}>💗</Animated.Text>
          <Animated.Text style={[styles.floatingHeart, styles.heart3, floatStyle3]}>💖</Animated.Text>
        </View>

        <View style={styles.content}>
          {/* Logo & Title */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
            <Text style={styles.logo}>💑</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>CoupleSpace</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Sadece sen ve sevgilin için{'\n'}özel bir alan ✨
            </Text>
          </Animated.View>

          {/* Features Preview */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={[styles.featuresCard, { backgroundColor: themeColors.surface }]}
          >
            {[
              { emoji: '💬', text: 'Özel mesajlaşma', color: '#818CF8' },
              { emoji: '📔', text: 'Birlikte günlük tutma', color: '#F472B6' },
              { emoji: '💕', text: 'Love ping gönderme', color: '#E11D48' },
              { emoji: '📸', text: 'Anı kutusu', color: '#FB923C' },
            ].map((item, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={[styles.featureIconBg, { backgroundColor: item.color + '15' }]}>
                  <Text style={styles.featureEmoji}>{item.emoji}</Text>
                </View>
                <Text style={[styles.featureText, { color: themeColors.text }]}>{item.text}</Text>
              </View>
            ))}
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.buttons}>
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
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.Text
          entering={FadeInDown.delay(800).duration(600)}
          style={[styles.footer, { color: themeColors.textTertiary }]}
        >
          Sadece çiftler için 🔒
        </Animated.Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  heartsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 36,
    opacity: 0.2,
  },
  heart1: { top: '15%', left: '10%' },
  heart2: { top: '25%', right: '15%' },
  heart3: { top: '45%', left: '20%' },
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
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: FontWeights.regular,
  },
  featuresCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  buttons: {
    gap: Spacing.sm,
  },
  footer: {
    textAlign: 'center',
    paddingBottom: Spacing.lg,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
});
