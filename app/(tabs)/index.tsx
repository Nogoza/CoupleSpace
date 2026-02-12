// ============================================
// CoupleSpace - Modern Home Screen
// ============================================

import { LovePingButton } from '@/components/features/LovePingButton';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { BorderRadius, FontSizes, FontWeights, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { Memory } from '@/types';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - Spacing.md * 2;
const CAROUSEL_ITEM_HEIGHT = 180;

const LOVE_QUOTES = [
  'Seni sevmek, her gün yeniden doğmak gibi.',
  'Aşk, iki ruhun tek bir bedende yaşamasıdır.',
  'Seninle her an, bir ömre bedel.',
  'Gözlerin benim için dünyanın en güzel manzarası.',
  'Seni düşününce yüzümdeki gülümsemeyi kimse silemez.',
  'Aşk, mesafeleri anlamsız kılan tek güçtür.',
  'Senin varlığın, benim huzurum.',
  'Kalbim seninle attıkça, hayat güzel.',
  'Aşk bir kelimedir, ama sen ona anlam verdin.',
  'Seninle geçen her saniye, hazinedir.',
  'Seni sevmek, nefes almak kadar doğal.',
  'Dünya döndükçe, kalbim hep seni arayacak.',
  'Sen benim en güzel tesadüfümsün.',
  'Aşk, seninle başlayan her cümlemin sonudur.',
  'Seninle olmak, evde olmak demek.',
  'Kalbimin tek sahibi sensin.',
  'Seni her gördüğümde ilk günkü gibi heyecanlanıyorum.',
  'Aşk, seni düşünürken geçen zamandır.',
  'Seninle her mevsim bahar.',
  'Sen olmadan eksik kalır her şey.',
  'Seni sevmek, hayatımın en kolay kararıydı.',
  'Gözlerinde kaybolmak, en güzel yolculuk.',
  'Aşk, iki kalbin aynı anda atmasıdır.',
  'Seninle her gün bir macera.',
  'Sen benim sabah güneşim, gece yıldızımsın.',
  'Seni seviyorum, bugün de, yarın da, her zaman.',
  'Kalbim seninle bir bütün.',
  'Aşk, seninle paylaşılan sessizliktir.',
  'Her anımız bir hatıra, her hatıramız bir hazine.',
  'Seninle büyüyen bir aşk, sonsuzluğa uzanır.',
];

export default function HomeScreen() {
  const {
    user,
    partner,
    themeColors,
    memories,
    messages,
    lovePings,
    journalEntries,
    isPaired,
  } = useApp();

  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // --- Today's Summary: stats for today ---
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const todayStats = useMemo(() => {
    const todayLovePings = lovePings.filter(
      (p) => format(new Date(p.createdAt), 'yyyy-MM-dd') === todayDate
    ).length;

    const todayMyMessages = messages.filter(
      (m) => format(new Date(m.createdAt), 'yyyy-MM-dd') === todayDate && m.senderId === user?.id
    ).length;

    const todayPartnerMessages = messages.filter(
      (m) => format(new Date(m.createdAt), 'yyyy-MM-dd') === todayDate && m.senderId !== user?.id
    ).length;

    const myJournalToday = journalEntries.some(
      (e) => e.date === todayDate && e.userId === user?.id
    );

    const partnerJournalToday = journalEntries.some(
      (e) => e.date === todayDate && e.userId !== user?.id
    );

    return {
      lovePings: todayLovePings,
      myMessages: todayMyMessages,
      partnerMessages: todayPartnerMessages,
      myJournal: myJournalToday,
      partnerJournal: partnerJournalToday,
    };
  }, [lovePings, messages, journalEntries, todayDate, user?.id]);

  // --- Anılar (Memories): Latest memories ---
  const recentMemories = useMemo(() => {
    return [...memories]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [memories]);

  if (!isPaired) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.background]}
          style={styles.unpaired}
        >
          <View style={styles.unpairedContent}>
            <Text style={styles.unpairedEmoji}>💝</Text>
            <Text style={[styles.unpairedTitle, { color: themeColors.text }]}>
              Henüz Bağlanmadın
            </Text>
            <Text style={[styles.unpairedText, { color: themeColors.textSecondary }]}>
              Sevgilinle bağlanmak için ayarlara git
            </Text>
            <TouchableOpacity
              style={[styles.unpairedButton, { backgroundColor: themeColors.primary }]}
              onPress={() => router.push('/(tabs)/settings' as any)}
            >
              <Text style={styles.unpairedButtonText}>Bağlan 💕</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
          />
        }
      >
        {/* ===== Top Profile Section ===== */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileSection}>
          <View style={styles.avatarWithLabel}>
            <ProfileAvatar
              user={user}
              size={56}
              showRing
              ringColor={themeColors.primary}
            />
            <Text style={[styles.avatarName, { color: themeColors.text }]}>
              {user?.displayName?.split(' ')[0] || 'Sen'}
            </Text>
          </View>

          <View style={styles.avatarWithLabel}>
            <ProfileAvatar
              user={partner}
              size={56}
              showRing
              ringColor={themeColors.primary}
            />
            <Text style={[styles.avatarName, { color: themeColors.text }]}>
              {partner?.displayName?.split(' ')[0] || 'Sevgilin'}
            </Text>
          </View>
        </Animated.View>

        {/* ===== Love Ping Button ===== */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LovePingButton partnerName={partner?.displayName || 'Sevgilin'} />
        </Animated.View>

        {/* ===== Bugünün Özeti ===== */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Bugünün Özeti</Text>
          <View style={[styles.summaryCard, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight }]}>
            <SummaryRow
              emoji="💕"
              text={`Bugün ${todayStats.lovePings} Love Ping yolladın`}
              color={themeColors.heart}
              textColor={themeColors.text}
            />
            <SummaryRow
              emoji="💬"
              text={`${todayStats.myMessages} kere sen mesaj yazdın`}
              color={themeColors.primary}
              textColor={themeColors.text}
            />
            <SummaryRow
              emoji="💌"
              text={`${todayStats.partnerMessages} kere ${partner?.displayName?.split(' ')[0] || 'Sevgilin'} mesaj yazdı`}
              color={themeColors.accent}
              textColor={themeColors.text}
            />
            <SummaryRow
              emoji="📝"
              text={todayStats.myJournal ? 'Bugün günlüğe yazdın ✓' : 'Bugün günlüğe yazmadın'}
              color={todayStats.myJournal ? themeColors.success : themeColors.textTertiary}
              textColor={themeColors.text}
            />
            <SummaryRow
              emoji="📖"
              text={todayStats.partnerJournal
                ? `${partner?.displayName?.split(' ')[0] || 'Sevgilin'} günlüğe yazdı ✓`
                : `${partner?.displayName?.split(' ')[0] || 'Sevgilin'} günlüğe yazmadı`
              }
              color={todayStats.partnerJournal ? themeColors.success : themeColors.textTertiary}
              textColor={themeColors.text}
              isLast
            />
          </View>
        </Animated.View>

        {/* ===== Anılar ===== */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Anılar</Text>
          {recentMemories.length > 0 ? (
            <ImageCarousel
              items={recentMemories}
              themeColors={themeColors}
            />
          ) : (
            <View style={[styles.emptyCarousel, { backgroundColor: themeColors.borderLight }]}>
              <Text style={[styles.emptyText, { color: themeColors.textTertiary }]}>
                Henüz anı eklenmedi 📸
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ===== Günün Sözü ===== */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Günün Sözü</Text>
          <View style={[styles.quoteCard, { backgroundColor: themeColors.primaryLight, borderColor: themeColors.borderLight }]}>
            <Text style={styles.quoteEmoji}>💕</Text>
            <Text style={[styles.quoteText, { color: themeColors.primaryDark }]}>
              {LOVE_QUOTES[Math.floor((new Date().getTime() / 86400000)) % LOVE_QUOTES.length]}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ===== Summary Row Component =====
function SummaryRow({
  emoji,
  text,
  color,
  textColor,
  isLast = false,
}: {
  emoji: string;
  text: string;
  color: string;
  textColor: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !isLast && styles.summaryRowBorder]}>
      <View style={[styles.summaryEmojiBg, { backgroundColor: color + '15' }]}>
        <Text style={styles.summaryEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.summaryText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

// ===== Image Carousel Component =====
function ImageCarousel({
  items,
  themeColors,
}: {
  items: Memory[];
  themeColors: any;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const getImageUrl = (memory: Memory): string | null => {
    if (memory.imageUrls && memory.imageUrls.length > 0) {
      return memory.imageUrls[0];
    }
    return memory.imageUrl || null;
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useMemo(
    () => ({
      viewAreaCoveragePercentThreshold: 50,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Memory }) => {
      const imageUrl = getImageUrl(item);
      return (
        <View style={styles.carouselItem}>
          {imageUrl ? (
            <ExpoImage
              source={{ uri: imageUrl }}
              style={styles.carouselImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.carouselPlaceholder, { backgroundColor: themeColors.borderLight }]}>
              <Text style={{ fontSize: 40 }}>📸</Text>
              <Text style={[styles.placeholderText, { color: themeColors.textTertiary }]}>
                {item.title}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [themeColors]
  );

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CAROUSEL_ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselList}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: CAROUSEL_ITEM_WIDTH,
          offset: CAROUSEL_ITEM_WIDTH * index,
          index,
        })}
      />
      {/* Dot Indicators */}
      {items.length > 1 && (
        <View style={styles.dotsContainer}>
          {items.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex
                      ? themeColors.textSecondary
                      : themeColors.border,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },

  // ===== Profile Section =====
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  avatarWithLabel: {
    alignItems: 'center',
  },
  avatarName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginTop: Spacing.xs,
  },

  // ===== Section =====
  sectionContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },

  // ===== Quote Card =====
  quoteCard: {
    height: CAROUSEL_ITEM_HEIGHT / 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quoteEmoji: {
    fontSize: 28,
  },
  quoteText: {
    flex: 1,
    fontSize: FontSizes.md,
    fontStyle: 'italic',
    fontWeight: FontWeights.medium,
    lineHeight: 22,
  },

  // ===== Summary Card =====
  summaryCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  summaryRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  summaryEmojiBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryEmoji: {
    fontSize: 16,
  },
  summaryText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },

  // ===== Carousel =====
  carouselList: {},
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  placeholderText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // ===== Empty State =====
  emptyCarousel: {
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },

  // ===== Unpaired =====
  unpaired: {
    flex: 1,
  },
  unpairedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  unpairedEmoji: {
    fontSize: 72,
    marginBottom: Spacing.lg,
  },
  unpairedTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  unpairedText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  unpairedButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  unpairedButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
});
