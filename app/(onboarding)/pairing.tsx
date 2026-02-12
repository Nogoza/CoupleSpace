// ============================================
// CoupleSpace - Modern Pairing Screen
// ============================================

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BorderRadius, FontSizes, FontWeights, Shadows, Spacing, ThemeColors } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function PairingScreen() {
  const { user, couple, createCouple, joinCouple, isPaired } = useApp();
  const themeColors = ThemeColors.softPink;

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [pairingCode, setPairingCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ), -1, true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  React.useEffect(() => {
    if (isPaired) router.replace('/(tabs)');
  }, [isPaired]);

  const handleCreateCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      const code = await createCouple();
      setMyCode(code);
      setMode('create');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      setError(error.message || 'Kod oluşturulamadı.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(myCode);
    setCodeCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `CoupleSpace'te seninle bağlanmak istiyorum! 💕\n\nÇift kodum: ${myCode}\n\nUygulamayı indir ve bu kodu gir!`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleJoinCouple = async () => {
    if (joinCode.length !== 6) {
      setError('Kod 6 karakter olmalı');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const success = await joinCouple(joinCode.toUpperCase());
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        setError('Geçersiz kod veya zaten eşleşmiş');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      setError('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPairing = async () => {
    if (myCode) {
      const success = await joinCouple(myCode);
      if (success) router.replace('/(tabs)');
    }
  };

  // Choose Mode
  if (mode === 'choose') {
    return (
      <LinearGradient colors={[themeColors.gradientStart, themeColors.background]} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
              <Text style={styles.emoji}>💑</Text>
              <Text style={[styles.title, { color: themeColors.text }]}>Çift Bağlantısı</Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                Sevgilinle bağlan ve özel alanınızı oluşturun
              </Text>
            </Animated.View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View style={styles.options}>
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <TouchableOpacity
                  onPress={handleCreateCode}
                  disabled={isLoading}
                  style={[styles.optionCard, { backgroundColor: themeColors.surface }, isLoading && styles.optionDisabled]}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: themeColors.primaryLight }]}>
                    <Text style={styles.optionEmoji}>🔑</Text>
                  </View>
                  <Text style={[styles.optionTitle, { color: themeColors.text }]}>Kod Oluştur</Text>
                  <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                    Yeni bir çift kodu oluştur ve sevgiline gönder
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                <TouchableOpacity
                  onPress={() => setMode('join')}
                  disabled={isLoading}
                  style={[styles.optionCard, { backgroundColor: themeColors.surface }, isLoading && styles.optionDisabled]}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: '#FDF2F8' }]}>
                    <Text style={styles.optionEmoji}>💕</Text>
                  </View>
                  <Text style={[styles.optionTitle, { color: themeColors.text }]}>Koda Katıl</Text>
                  <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                    Sevgilinin paylaştığı kodu gir
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Create Code Mode
  if (mode === 'create') {
    return (
      <LinearGradient colors={[themeColors.gradientStart, themeColors.background]} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <TouchableOpacity onPress={() => setMode('choose')} style={styles.backButton}>
              <Text style={[styles.backText, { color: themeColors.primary }]}>← Geri</Text>
            </TouchableOpacity>

            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
              <Text style={styles.emoji}>🔑</Text>
              <Text style={[styles.title, { color: themeColors.text }]}>Çift Kodun Hazır!</Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Bu kodu sevgilinle paylaş</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={pulseStyle}>
              <Card style={styles.codeCard} variant="elevated">
                <Text style={[styles.codeText, { color: themeColors.primary }]}>{myCode}</Text>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.codeActions}>
              <Button
                title={codeCopied ? '✓ Kopyalandı!' : 'Kodu Kopyala'}
                onPress={handleCopyCode}
                variant="soft"
                fullWidth
              />
              <Button title="Paylaş 💕" onPress={handleShareCode} fullWidth />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <View style={[styles.waitingBox, { backgroundColor: themeColors.primaryLight }]}>
                <Text style={[styles.waitingText, { color: themeColors.primaryDark }]}>
                  ⏳ Sevgilinin katılmasını bekliyoruz...
                </Text>
                <Text style={[styles.waitingHint, { color: themeColors.textSecondary }]}>
                  Kodu girdikten sonra otomatik bağlanacaksınız
                </Text>
              </View>
            </Animated.View>

            <Button title="🧪 Test: Kendi koduna katıl" onPress={handleTestPairing} variant="ghost" size="small" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Join Code Mode
  return (
    <LinearGradient colors={[themeColors.gradientStart, themeColors.background]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.backButton}>
            <Text style={[styles.backText, { color: themeColors.primary }]}>← Geri</Text>
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <Text style={styles.emoji}>💕</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>Sevgiline Katıl</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Paylaşılan 6 haneli kodu gir
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Card style={styles.joinCard} variant="elevated">
              <Input
                label="Çift Kodu"
                placeholder="ABC123"
                value={joinCode}
                onChangeText={(text) => { setJoinCode(text.toUpperCase()); setError(''); }}
                error={error}
                maxLength={6}
                autoCapitalize="characters"
              />
              <Button
                title="Bağlan 💕"
                onPress={handleJoinCouple}
                loading={isLoading}
                fullWidth
                size="large"
                disabled={joinCode.length !== 6}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={[styles.hint, { color: themeColors.textTertiary }]}>
              Kod sevgilinin uygulamasında görünüyor 📱
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.lg },
  backButton: { marginBottom: Spacing.md },
  backText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  emoji: { fontSize: 56, marginBottom: Spacing.md },
  title: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, marginBottom: Spacing.xs, letterSpacing: -0.3 },
  subtitle: { fontSize: FontSizes.md, textAlign: 'center', lineHeight: 22 },
  errorContainer: {
    backgroundColor: '#FEF2F2', padding: Spacing.md,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: FontSizes.sm, textAlign: 'center', fontWeight: FontWeights.medium },
  options: { gap: Spacing.md },
  optionCard: {
    padding: Spacing.lg, borderRadius: BorderRadius.xxl, alignItems: 'center',
    ...Shadows.medium,
  },
  optionDisabled: { opacity: 0.6 },
  optionIconBg: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  optionEmoji: { fontSize: 28 },
  optionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, marginBottom: Spacing.xs },
  optionDesc: { fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 20 },
  codeCard: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.lg },
  codeText: { fontSize: 36, fontWeight: FontWeights.extrabold, letterSpacing: 8 },
  codeActions: { gap: Spacing.sm, marginBottom: Spacing.xl },
  waitingBox: {
    padding: Spacing.lg, borderRadius: BorderRadius.xl,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  waitingText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, marginBottom: Spacing.xs },
  waitingHint: { fontSize: FontSizes.sm },
  joinCard: { marginBottom: Spacing.lg },
  hint: { fontSize: FontSizes.sm, textAlign: 'center' },
});
