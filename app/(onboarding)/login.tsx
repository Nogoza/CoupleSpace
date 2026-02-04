// ============================================
// CoupleSpace - Login Screen
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

export default function LoginScreen() {
  const { login } = useApp();
  const themeColors = ThemeColors.softPink;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = 'E-posta gerekli';
    }
    if (!password) {
      newErrors.password = 'Şifre gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) {
        if (error.includes('Invalid login credentials')) {
          setErrors({ email: 'E-posta veya şifre hatalı' });
        } else {
          setErrors({ email: error });
        }
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ email: 'Giriş yapılırken bir hata oluştu' });
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
            <Text style={styles.emoji}>👋</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Tekrar Hoşgeldin!
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Seni özledik 💕
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: themeColors.surface }]}>
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
              placeholder="Şifreni gir"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={[styles.forgotText, { color: themeColors.primary }]}>
                Şifremi unuttum
              </Text>
            </TouchableOpacity>

            <Button
              title="Giriş Yap 💕"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="large"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
              Hesabın yok mu?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/register' as any)}>
              <Text style={[styles.footerLink, { color: themeColors.primary }]}>
                Kayıt Ol
              </Text>
            </TouchableOpacity>
          </View>
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
  },
  forgotText: {
    fontSize: FontSizes.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: FontSizes.md,
  },
  footerLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
