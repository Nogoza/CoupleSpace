// ============================================
// CoupleSpace - Pairing Screen
// ============================================

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BorderRadius, FontSizes, Spacing, ThemeColors } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
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
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
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

  // Pulse animation for the code
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Check if already paired
  React.useEffect(() => {
    if (isPaired) {
      router.replace('/(tabs)');
    }
  }, [isPaired]);

  const handleCreateCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Creating couple... User:', user?.id);
      const code = await createCouple();
      console.log('Couple created with code:', code);
      setMyCode(code);
      setMode('create');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error creating code:', error);
      setError(error.message || 'Kod oluşturulamadı. Lütfen tekrar deneyin.');
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

  // Simüle: Kodunuzu test etmek için kendi kodunuza katılın
  const handleTestPairing = async () => {
    if (myCode) {
      const success = await joinCouple(myCode);
      if (success) {
        router.replace('/(tabs)');
      }
    }
  };

  // Choose Mode
  if (mode === 'choose') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.emoji}>💑</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Çift Bağlantısı
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Sevgilinle bağlan ve özel alanınızı oluşturun
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: themeColors.primary }]}>
                İşlem yapılıyor...
              </Text>
            </View>
          )}

          <View style={styles.options}>
            <TouchableOpacity
              onPress={handleCreateCode}
              disabled={isLoading}
              style={[
                styles.optionCard,
                { backgroundColor: themeColors.surface },
                isLoading && styles.optionDisabled,
              ]}
            >
              <Text style={styles.optionEmoji}>🔑</Text>
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Kod Oluştur
              </Text>
              <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                Yeni bir çift kodu oluştur ve sevgiline gönder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('join')}
              disabled={isLoading}
              style={[
                styles.optionCard,
                { backgroundColor: themeColors.surface },
                isLoading && styles.optionDisabled,
              ]}
            >
              <Text style={styles.optionEmoji}>💕</Text>
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Koda Katıl
              </Text>
              <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                Sevgilinin paylaştığı kodu gir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Create Code Mode
  if (mode === 'create') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => setMode('choose')}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: themeColors.primary }]}>
              ← Geri
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Çift Kodun Hazır!
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Bu kodu sevgilinle paylaş
            </Text>
          </View>

          <Animated.View style={pulseStyle}>
            <Card style={styles.codeCard} variant="elevated">
              <Text style={[styles.codeText, { color: themeColors.primary }]}>
                {myCode}
              </Text>
            </Card>
          </Animated.View>

          <View style={styles.codeActions}>
            <Button
              title={codeCopied ? '✓ Kopyalandı!' : 'Kodu Kopyala'}
              onPress={handleCopyCode}
              variant="secondary"
              fullWidth
            />
            <Button
              title="Paylaş 💕"
              onPress={handleShareCode}
              fullWidth
            />
          </View>

          <View style={[styles.waitingBox, { backgroundColor: themeColors.primaryLight }]}>
            <Text style={[styles.waitingText, { color: themeColors.primaryDark }]}>
              ⏳ Sevgilinin katılmasını bekliyoruz...
            </Text>
            <Text style={[styles.waitingHint, { color: themeColors.textSecondary }]}>
              Kodu girdikten sonra otomatik bağlanacaksınız
            </Text>
          </View>

          {/* Test için - gerçek uygulamada kaldırılmalı */}
          <Button
            title="🧪 Test: Kendi koduna katıl"
            onPress={handleTestPairing}
            variant="ghost"
            size="small"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Join Code Mode
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => setMode('choose')}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: themeColors.primary }]}>
            ← Geri
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>💕</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Sevgiline Katıl
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Paylaşılan 6 haneli kodu gir
          </Text>
        </View>

        <Card style={styles.joinCard} variant="elevated">
          <Input
            label="Çift Kodu"
            placeholder="ABC123"
            value={joinCode}
            onChangeText={(text) => {
              setJoinCode(text.toUpperCase());
              setError('');
            }}
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

        <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
          Kod sevgilinin uygulamasında görünüyor 📱
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
  backText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  options: {
    gap: Spacing.md,
  },
  optionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  optionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  optionDesc: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  codeCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  codeText: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  codeActions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  waitingBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  waitingText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  waitingHint: {
    fontSize: FontSizes.sm,
  },
  joinCard: {
    marginBottom: Spacing.lg,
  },
  hint: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
