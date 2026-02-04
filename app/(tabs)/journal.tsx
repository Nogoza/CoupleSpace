// ============================================
// CoupleSpace - Journal Screen (Ana Günlük Ekranı)
// ============================================

import { MoodSelector } from '@/components/journal/MoodSelector';
import { StreakDisplay } from '@/components/journal/StreakDisplay';
import { TagSelector } from '@/components/journal/TagSelector';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SuccessAnimation } from '@/components/ui/SuccessAnimation';
import { BorderRadius, FontSizes, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { JournalEntry, JournalPrivacy, JournalPrompts, MoodEmojis, MoodType } from '@/types';
import { eachDayOfInterval, endOfWeek, format, isSameDay, parseISO, startOfWeek, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import React, { useMemo, useState } from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown
} from 'react-native-reanimated';

type ViewMode = 'today' | 'calendar' | 'list' | 'weekly';

export default function JournalScreen() {
  const {
    user,
    partner,
    themeColors,
    journalEntries,
    createJournalEntry,
    updateJournalPrivacy,
    streak,
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Write modal state
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<JournalPrivacy>('private');
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Filter entries for current user
  const myEntries = useMemo(() => 
    journalEntries.filter(e => e.userId === user?.id),
    [journalEntries, user]
  );

  // Filter partner's shared entries
  const partnerSharedEntries = useMemo(() =>
    journalEntries.filter(e => 
      e.userId !== user?.id && 
      (e.privacy === 'shared' || e.privacy === 'common')
    ),
    [journalEntries, user]
  );

  const todayEntry = myEntries.find(e => e.date === todayStr);

  const handleSaveEntry = async () => {
    if (!content.trim() || !selectedMood) return;

    setIsSubmitting(true);
    try {
      await createJournalEntry(
        selectedDateStr,
        content.trim(),
        selectedMood,
        selectedTags,
        privacy
      );
      
      setShowWriteModal(false);
      setShowSuccess(true);
      
      // Reset form
      setContent('');
      setSelectedMood(null);
      setSelectedTags([]);
      setPrivacy('private');
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rotatePrompt = () => {
    setCurrentPrompt((prev) => (prev + 1) % JournalPrompts.length);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Success Animation */}
      <SuccessAnimation
        message="Bugün de kaydettik ✨"
        emoji="📝"
        visible={showSuccess}
      />

      {/* View Mode Tabs */}
      <View style={[styles.tabs, { backgroundColor: themeColors.surface }]}>
        {(['today', 'calendar', 'list', 'weekly'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => setViewMode(mode)}
            style={[
              styles.tab,
              viewMode === mode && { backgroundColor: themeColors.primaryLight },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: viewMode === mode ? themeColors.primaryDark : themeColors.textSecondary },
              ]}
            >
              {mode === 'today' && '📝 Bugün'}
              {mode === 'calendar' && '📅 Takvim'}
              {mode === 'list' && '📋 Liste'}
              {mode === 'weekly' && '📊 Haftalık'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Display */}
        <StreakDisplay
          currentStreak={streak.current}
          longestStreak={streak.longest}
          showAnimation={showSuccess}
        />

        {/* TODAY VIEW */}
        {viewMode === 'today' && (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {format(new Date(), 'd MMMM yyyy, EEEE', { locale: tr })}
            </Text>

            {todayEntry ? (
              <TodayEntryCard
                entry={todayEntry}
                themeColors={themeColors}
                onUpdatePrivacy={(privacy) => updateJournalPrivacy(todayEntry.id, privacy)}
              />
            ) : (
              <Card style={styles.emptyTodayCard}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  Bugün nasıldı?
                </Text>
                <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                  Günlüğünü yaz ve anılarını kaydet
                </Text>
                <Button
                  title="Günlük Yaz 💕"
                  onPress={() => setShowWriteModal(true)}
                  fullWidth
                />
              </Card>
            )}

            {/* Partner's Shared Entry Today */}
            {partnerSharedEntries.filter(e => e.date === todayStr).map((entry) => (
              <PartnerEntryCard
                key={entry.id}
                entry={entry}
                partnerName={partner?.displayName || 'Sevgilin'}
                themeColors={themeColors}
              />
            ))}

            {/* Memory from 30 days ago */}
            <MemoryFromPast
              entries={myEntries}
              daysAgo={30}
              themeColors={themeColors}
            />
          </Animated.View>
        )}

        {/* CALENDAR VIEW */}
        {viewMode === 'calendar' && (
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            entries={myEntries}
            themeColors={themeColors}
          />
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <ListView
            entries={myEntries}
            themeColors={themeColors}
            onUpdatePrivacy={updateJournalPrivacy}
          />
        )}

        {/* WEEKLY SUMMARY */}
        {viewMode === 'weekly' && (
          <WeeklySummaryView
            entries={myEntries}
            themeColors={themeColors}
          />
        )}
      </ScrollView>

      {/* Floating Write Button */}
      {viewMode !== 'today' && (
        <TouchableOpacity
          onPress={() => setShowWriteModal(true)}
          style={[styles.fab, { backgroundColor: themeColors.primary }]}
        >
          <Text style={styles.fabText}>✏️</Text>
        </TouchableOpacity>
      )}

      {/* Write Journal Modal */}
      <Modal
        visible={showWriteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWriteModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowWriteModal(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>
                İptal
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              📝 Günlük Yaz
            </Text>
            <TouchableOpacity
              onPress={handleSaveEntry}
              disabled={!content.trim() || !selectedMood || isSubmitting}
            >
              <Text
                style={[
                  styles.modalSave,
                  {
                    color: content.trim() && selectedMood
                      ? themeColors.primary
                      : themeColors.textSecondary,
                  },
                ]}
              >
                Kaydet
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Date */}
            <Text style={[styles.modalDate, { color: themeColors.textSecondary }]}>
              {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })}
            </Text>

            {/* Mood Selector */}
            <MoodSelector
              selectedMood={selectedMood}
              onSelect={setSelectedMood}
            />

            {/* Prompt */}
            <TouchableOpacity
              onPress={rotatePrompt}
              style={[styles.promptCard, { backgroundColor: themeColors.primaryLight }]}
            >
              <Text style={[styles.promptText, { color: themeColors.primaryDark }]}>
                💭 {JournalPrompts[currentPrompt]}
              </Text>
              <Text style={[styles.promptHint, { color: themeColors.textSecondary }]}>
                (dokun değiştir)
              </Text>
            </TouchableOpacity>

            {/* Content Input */}
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Bugün neler oldu..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              style={[
                styles.contentInput,
                {
                  backgroundColor: themeColors.surface,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
            />

            {/* Tag Selector */}
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />

            {/* Privacy Selector */}
            <Text style={[styles.privacyTitle, { color: themeColors.text }]}>
              🔒 Gizlilik
            </Text>
            <View style={styles.privacyOptions}>
              {(['private', 'shared', 'common'] as JournalPrivacy[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPrivacy(p)}
                  style={[
                    styles.privacyOption,
                    {
                      backgroundColor: privacy === p
                        ? themeColors.primary
                        : themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.privacyText,
                      { color: privacy === p ? '#FFFFFF' : themeColors.text },
                    ]}
                  >
                    {p === 'private' && '🔐 Özel'}
                    {p === 'shared' && '👀 Paylaşıldı'}
                    {p === 'common' && '💕 Ortak'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.privacyHint, { color: themeColors.textSecondary }]}>
              {privacy === 'private' && 'Sadece sen görebilirsin'}
              {privacy === 'shared' && 'Partnerin de görebilir'}
              {privacy === 'common' && 'Ortak günlüğe eklenir'}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// SUB COMPONENTS
// ============================================

function TodayEntryCard({
  entry,
  themeColors,
  onUpdatePrivacy,
}: {
  entry: JournalEntry;
  themeColors: any;
  onUpdatePrivacy: (privacy: JournalPrivacy) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Card style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryMood}>{MoodEmojis[entry.mood]}</Text>
          <View style={styles.entryMeta}>
            <Text style={[styles.entryTime, { color: themeColors.textSecondary }]}>
              {format(new Date(entry.createdAt), 'HH:mm')}
            </Text>
            <PrivacyBadge privacy={entry.privacy} themeColors={themeColors} />
          </View>
        </View>
        <Text style={[styles.entryContent, { color: themeColors.text }]}>
          {entry.content}
        </Text>
        {entry.tags.length > 0 && (
          <View style={styles.entryTags}>
            {entry.tags.map((tag) => (
              <Text
                key={tag}
                style={[styles.entryTag, { backgroundColor: themeColors.primaryLight, color: themeColors.primaryDark }]}
              >
                {tag}
              </Text>
            ))}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

function PartnerEntryCard({
  entry,
  partnerName,
  themeColors,
}: {
  entry: JournalEntry;
  partnerName: string;
  themeColors: any;
}) {
  return (
    <Card style={{ ...styles.partnerCard, backgroundColor: themeColors.primaryLight + '50' }}>
      <Text style={[styles.partnerCardTitle, { color: themeColors.primaryDark }]}>
        💕 {partnerName}'nin Günlüğü
      </Text>
      <View style={styles.entryHeader}>
        <Text style={styles.entryMood}>{MoodEmojis[entry.mood]}</Text>
      </View>
      <Text style={[styles.entryContent, { color: themeColors.text }]}>
        {entry.content}
      </Text>
    </Card>
  );
}

function PrivacyBadge({ privacy, themeColors }: { privacy: JournalPrivacy; themeColors: any }) {
  const getLabel = () => {
    switch (privacy) {
      case 'private': return '🔐';
      case 'shared': return '👀';
      case 'common': return '💕';
    }
  };

  return (
    <View style={[styles.privacyBadge, { backgroundColor: themeColors.primaryLight }]}>
      <Text style={styles.privacyBadgeText}>{getLabel()}</Text>
    </View>
  );
}

function MemoryFromPast({
  entries,
  daysAgo,
  themeColors,
}: {
  entries: JournalEntry[];
  daysAgo: number;
  themeColors: any;
}) {
  const pastDate = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
  const pastEntry = entries.find(e => e.date === pastDate);

  if (!pastEntry) return null;

  return (
    <Card style={{ ...styles.memoryCard, backgroundColor: themeColors.primaryLight + '30' }}>
      <Text style={[styles.memoryTitle, { color: themeColors.primaryDark }]}>
        ✨ {daysAgo} Gün Önce
      </Text>
      <Text style={[styles.memoryDate, { color: themeColors.textSecondary }]}>
        {format(parseISO(pastEntry.date), 'd MMMM yyyy', { locale: tr })}
      </Text>
      <Text style={styles.memoryMood}>{MoodEmojis[pastEntry.mood]}</Text>
      <Text style={[styles.memoryContent, { color: themeColors.text }]} numberOfLines={3}>
        {pastEntry.content}
      </Text>
    </Card>
  );
}

function CalendarView({
  selectedDate,
  onSelectDate,
  entries,
  themeColors,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  entries: JournalEntry[];
  themeColors: any;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const entryDates = new Set(entries.map(e => e.date));

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        {format(selectedDate, 'MMMM yyyy', { locale: tr })}
      </Text>
      
      <View style={styles.calendarWeek}>
        {daysInWeek.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasEntry = entryDates.has(dateStr);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onSelectDate(day)}
              style={[
                styles.calendarDay,
                isSelected && { backgroundColor: themeColors.primary },
                isToday && !isSelected && { borderColor: themeColors.primary, borderWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.calendarDayName,
                  { color: isSelected ? '#FFF' : themeColors.textSecondary },
                ]}
              >
                {format(day, 'EEE', { locale: tr })}
              </Text>
              <Text
                style={[
                  styles.calendarDayNumber,
                  { color: isSelected ? '#FFF' : themeColors.text },
                ]}
              >
                {format(day, 'd')}
              </Text>
              {hasEntry && (
                <View
                  style={[
                    styles.calendarDot,
                    { backgroundColor: isSelected ? '#FFF' : themeColors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Entries for selected date */}
      <Text style={[styles.subTitle, { color: themeColors.text }]}>
        {format(selectedDate, 'd MMMM', { locale: tr })} Günlükleri
      </Text>
      {entries
        .filter(e => e.date === format(selectedDate, 'yyyy-MM-dd'))
        .map((entry) => (
          <TodayEntryCard
            key={entry.id}
            entry={entry}
            themeColors={themeColors}
            onUpdatePrivacy={() => {}}
          />
        ))}
    </View>
  );
}

function ListView({
  entries,
  themeColors,
  onUpdatePrivacy,
}: {
  entries: JournalEntry[];
  themeColors: any;
  onUpdatePrivacy: (id: string, privacy: JournalPrivacy) => void;
}) {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        Tüm Günlükler ({entries.length})
      </Text>
      {sortedEntries.map((entry) => (
        <TodayEntryCard
          key={entry.id}
          entry={entry}
          themeColors={themeColors}
          onUpdatePrivacy={(p) => onUpdatePrivacy(entry.id, p)}
        />
      ))}
      {entries.length === 0 && (
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          Henüz günlük yazmadın 📝
        </Text>
      )}
    </View>
  );
}

function WeeklySummaryView({
  entries,
  themeColors,
}: {
  entries: JournalEntry[];
  themeColors: any;
}) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const weekEntries = entries.filter((e) => {
    const date = parseISO(e.date);
    return date >= weekStart && date <= weekEnd;
  });

  // Mood distribution
  const moodCounts: Record<string, number> = {};
  weekEntries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  // Tag counts
  const tagCounts: Record<string, number> = {};
  weekEntries.forEach((e) => {
    e.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        Bu Haftanın Özeti 📊
      </Text>
      <Text style={[styles.weekRange, { color: themeColors.textSecondary }]}>
        {format(weekStart, 'd MMM', { locale: tr })} - {format(weekEnd, 'd MMM', { locale: tr })}
      </Text>

      <Card style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
          📝 {weekEntries.length} günlük yazıldı
        </Text>

        {/* Mood Distribution */}
        <Text style={[styles.summarySubtitle, { color: themeColors.text }]}>
          Ruh Hali Dağılımı
        </Text>
        <View style={styles.moodDistribution}>
          {Object.entries(moodCounts).map(([mood, count]) => (
            <View key={mood} style={styles.moodItem}>
              <Text style={styles.moodEmoji}>{MoodEmojis[mood as MoodType]}</Text>
              <Text style={[styles.moodCount, { color: themeColors.text }]}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <>
            <Text style={[styles.summarySubtitle, { color: themeColors.text }]}>
              En Çok Kullanılan Etiketler
            </Text>
            <View style={styles.topTags}>
              {topTags.map(([tag, count]) => (
                <View
                  key={tag}
                  style={[styles.topTag, { backgroundColor: themeColors.primaryLight }]}
                >
                  <Text style={[styles.topTagText, { color: themeColors.primaryDark }]}>
                    {tag} ({count})
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  subTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyTodayCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  entryCard: {
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  entryMood: {
    fontSize: 32,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryTime: {
    fontSize: FontSizes.sm,
    marginRight: Spacing.sm,
  },
  entryContent: {
    fontSize: FontSizes.md,
    lineHeight: 24,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  entryTag: {
    fontSize: FontSizes.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  privacyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  privacyBadgeText: {
    fontSize: 12,
  },
  partnerCard: {
    marginBottom: Spacing.md,
  },
  partnerCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  memoryCard: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  memoryTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  memoryDate: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  memoryMood: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  memoryContent: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },
  fabText: {
    fontSize: 24,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: FontSizes.md,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.md,
  },
  modalDate: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  promptCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
    alignItems: 'center',
  },
  promptText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    textAlign: 'center',
  },
  promptHint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  contentInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 150,
    fontSize: FontSizes.md,
    textAlignVertical: 'top',
  },
  privacyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  privacyText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  privacyHint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  // Calendar styles
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  calendarDay: {
    width: 45,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  calendarDayName: {
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },
  calendarDayNumber: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  // Weekly summary styles
  weekRange: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    paddingVertical: Spacing.lg,
  },
  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  moodDistribution: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  moodItem: {
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodCount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  topTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  topTag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  topTagText: {
    fontSize: FontSizes.sm,
  },
});