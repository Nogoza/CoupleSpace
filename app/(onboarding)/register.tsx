// ============================================
// CoupleSpace - Register Screen
// ============================================

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BorderRadius, FontSizes, Spacing, ThemeColors } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RegisterScreen() {
  const { signUp } = useApp();
  const themeColors = ThemeColors.softPink;
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!displayName.trim()) {
      newErrors.name = 'İsim gerekli';
    }
    if (!email.trim()) {
      newErrors.email = 'E-posta gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta girin';
    }
    if (!password) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        if (error.includes('already registered')) {
          setErrors({ email: 'Bu e-posta zaten kayıtlı' });
        } else {
          setErrors({ email: error });
        }
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrors({ email: 'Kayıt olurken bir hata oluştu' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: themeColors.primary }]}>
              ← Geri
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>💕</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Hesap Oluştur
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              CoupleSpace'e hoş geldin!
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: themeColors.surface }]}>
            <Input
              label="Adın"
              placeholder="Sevgilin seni nasıl görsün?"
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.name}
              autoCapitalize="words"
            />

            <Input
              label="E-posta"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Şifre"
              placeholder="En az 6 karakter"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
            />

            <Button
              title="Kayıt Ol 💕"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="large"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
              Zaten hesabın var mı?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/login' as any)}>
              <Text style={[styles.footerLink, { color: themeColors.primary }]}>
                Giriş Yap
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <Text style={[styles.privacy, { color: themeColors.textSecondary }]}>
            Kayıt olarak gizlilik politikamızı kabul etmiş olursunuz. 🔒
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  },
  form: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  footerText: {
    fontSize: FontSizes.md,
  },
  footerLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  privacy: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
});
