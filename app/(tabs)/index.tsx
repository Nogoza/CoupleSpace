// ============================================
// CoupleSpace - Home Screen
// ============================================

import { LovePingButton } from '@/components/features/LovePingButton';
import { StreakDisplay } from '@/components/journal/StreakDisplay';
import { Card } from '@/components/ui/Card';
import { BorderRadius, FontSizes, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomeScreen() {
  const {
    user,
    partner,
    themeColors,
    streak,
    journalEntries,
    todos,
    moodCheckIns,
    isPaired,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const today = format(new Date(), 'EEEE, d MMMM', { locale: tr });
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  
  const todayEntry = journalEntries.find(e => e.date === todayDate && e.userId === user?.id);
  const pendingTodos = todos.filter(t => !t.isCompleted);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!isPaired) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.unpaired}>
          <Text style={styles.unpairedEmoji}>💔</Text>
          <Text style={[styles.unpairedTitle, { color: themeColors.text }]}>
            Henüz Bağlanmadın
          </Text>
          <Text style={[styles.unpairedText, { color: themeColors.textSecondary }]}>
            Sevgilinle bağlanmak için ayarlara git
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: themeColors.text }]}>
            Merhaba, {user?.displayName} 💕
          </Text>
          <Text style={[styles.date, { color: themeColors.textSecondary }]}>
            {today}
          </Text>
        </View>

        {/* Partner Card */}
        <Card style={{ ...styles.partnerCard, backgroundColor: themeColors.primaryLight }}>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerEmoji}>👩‍❤️‍👨</Text>
            <View>
              <Text style={[styles.partnerLabel, { color: themeColors.textSecondary }]}>
                Sevgilin
              </Text>
              <Text style={[styles.partnerName, { color: themeColors.primaryDark }]}>
                {partner?.displayName || 'Sevgilim'}
              </Text>
            </View>
          </View>
          <LovePingButton partnerName={partner?.displayName || 'Sevgilin'} />
        </Card>

        {/* Streak */}
        <StreakDisplay
          currentStreak={streak.current}
          longestStreak={streak.longest}
        />

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Hızlı Eylemler ✨
        </Text>
        <View style={styles.quickActions}>
          <QuickActionCard
            emoji="💬"
            title="Mesaj Gönder"
            color={themeColors.primary}
            onPress={() => router.push('/(tabs)/chat' as any)}
          />
          <QuickActionCard
            emoji="📝"
            title={todayEntry ? 'Günlüğü Gör' : 'Günlük Yaz'}
            color={themeColors.accent}
            onPress={() => router.push('/(tabs)/journal' as any)}
          />
        </View>
        <View style={styles.quickActions}>
          <QuickActionCard
            emoji="📅"
            title="Randevu Planla"
            color={themeColors.secondary}
            onPress={() => router.push('/(tabs)/memories' as any)}
          />
          <QuickActionCard
            emoji="✅"
            title={`Yapılacaklar (${pendingTodos.length})`}
            color={themeColors.success}
            onPress={() => router.push('/(tabs)/memories' as any)}
          />
        </View>

        {/* Today's Summary */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Bugünün Özeti 📊
        </Text>
        <Card>
          <View style={styles.summaryRow}>
            <SummaryItem
              emoji="📝"
              label="Günlük"
              value={todayEntry ? 'Yazıldı ✓' : 'Yazılmadı'}
              color={todayEntry ? themeColors.success : themeColors.textSecondary}
            />
            <SummaryItem
              emoji="💕"
              label="Love Ping"
              value="3 kez"
              color={themeColors.heart}
            />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem
              emoji="✅"
              label="Tamamlanan"
              value={`${todos.filter(t => t.isCompleted).length} görev`}
              color={themeColors.success}
            />
            <SummaryItem
              emoji="💬"
              label="Mesajlar"
              value="12 mesaj"
              color={themeColors.primary}
            />
          </View>
        </Card>

        {/* Motivational Quote */}
        <View style={[styles.quoteCard, { backgroundColor: themeColors.primaryLight }]}>
          <Text style={styles.quoteEmoji}>💝</Text>
          <Text style={[styles.quoteText, { color: themeColors.primaryDark }]}>
            "Gerçek aşk, birlikte büyümek ve her gün birbirinizi yeniden seçmektir."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionCard({
  emoji,
  title,
  color,
  onPress,
}: {
  emoji: string;
  title: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.quickActionCard, { backgroundColor: color + '20' }]}
    >
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={[styles.quickActionTitle, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function SummaryItem({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryEmoji}>{emoji}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  date: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  partnerCard: {
    marginBottom: Spacing.md,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  partnerEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  partnerLabel: {
    fontSize: FontSizes.sm,
  },
  partnerName: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  quickActionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: '#666',
  },
  summaryValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  quoteCard: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  quoteEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  quoteText: {
    fontSize: FontSizes.md,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  unpaired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  unpairedEmoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  unpairedTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  unpairedText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
});
